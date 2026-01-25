/**
 * Map Screen - Main map view showing Sudan with facility markers
 * Displays water sources, power sources, shelters, and food sources
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, Modal, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { executeQuery, executeWrite } from '../db/database';
import MapComponent from '../components/MapComponent';
import FacilityReportModal from '../components/FacilityReportModal';
import InterventionRankingList from '../components/InterventionRankingList';
import { calculateInterventionPoints } from '../utils/interventionRanking';
import { initializeSampleData } from '../utils/dataSync';

// Sudan center coordinates
const SUDAN_CENTER = [15.5, 30.0];
const SUDAN_ZOOM = 6;

/**
 * Map Screen Component
 */
const MapScreen = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRankingList, setShowRankingList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine !== false : true
  );

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        console.log('MapScreen: Starting initialization...');
        await initializeSampleData();
        console.log('MapScreen: Sample data initialized');
        if (mounted) {
          await loadFacilities();
          console.log('MapScreen: Facilities loaded');
        }
      } catch (error) {
        console.error('MapScreen: Error initializing:', error);
        // Still try to load facilities even if sample data fails
        if (mounted) {
          try {
            await loadFacilities();
          } catch (loadError) {
            console.error('MapScreen: Error loading facilities:', loadError);
            // Set empty array so screen still renders
            setFacilities([]);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('MapScreen: Initialization complete, loading set to false');
        }
      }
    };
    
    // Set a timeout to ensure loading doesn't stay true forever
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('MapScreen: Loading timeout, forcing loading to false');
        setLoading(false);
      }
    }, 2000); // 2 second timeout - show screen quickly
    
    init();
    setupOnlineListener();
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncFacilities();
    }
  }, [isOnline]);

  /**
   * Setup online/offline listener
   */
  const setupOnlineListener = () => {
    if (Platform.OS === 'web') {
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }
  };

  /**
   * Load facilities from local database
   */
  const loadFacilities = async () => {
    try {
      setLoading(true);
      const results = await executeQuery(
        'SELECT * FROM infrastructure_assets ORDER BY intervention_points DESC'
      );
      
      console.log(`MapScreen: Loaded ${results.length} facilities from database`);
      
      // Calculate intervention points for each facility
      const facilitiesWithPoints = await Promise.all(
        results.map(async (facility) => {
          const points = await calculateInterventionPoints(facility);
          if (points !== facility.intervention_points) {
            await executeWrite(
              'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
              [points, facility.id]
            );
            return { ...facility, intervention_points: points };
          }
          return facility;
        })
      );

      console.log(`MapScreen: Processed ${facilitiesWithPoints.length} facilities with points`);
      setFacilities(facilitiesWithPoints);
    } catch (error) {
      console.error('Error loading facilities:', error);
      setFacilities([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sync facilities with online data (when available)
   */
  const syncFacilities = async () => {
    try {
      // TODO: Implement API sync
      // For now, just mark as synced
      console.log('Syncing facilities with online data...');
    } catch (error) {
      console.error('Error syncing facilities:', error);
    }
  };

  /**
   * Handle facility marker click
   */
  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
  };

  /**
   * Handle report problem button
   */
  const handleReportProblem = () => {
    setShowReportModal(true);
  };

  /**
   * Handle report submission
   */
  const handleReportSubmit = async (reportData) => {
    try {
      // Save user report
      await executeWrite(
        `INSERT INTO user_reports 
         (facility_id, facility_condition, supply_amount, population_amount, facility_importance, reported_by, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          selectedFacility.id,
          reportData.facilityCondition,
          reportData.supplyAmount,
          reportData.populationAmount,
          reportData.facilityImportance,
          'user', // TODO: Get actual user ID
          isOnline ? 1 : 0
        ]
      );

      // Update facility with new data
      const updateFields = [];
      const updateValues = [];

      if (reportData.facilityCondition) {
        updateFields.push('facility_condition = ?');
        updateValues.push(reportData.facilityCondition);
      }
      if (reportData.supplyAmount) {
        updateFields.push('supply_amount = ?');
        updateValues.push(reportData.supplyAmount);
      }
      if (reportData.populationAmount) {
        updateFields.push('population_amount = ?');
        updateValues.push(reportData.populationAmount);
      }
      if (reportData.facilityImportance) {
        updateFields.push('facility_importance = ?');
        updateValues.push(reportData.facilityImportance);
      }

      if (updateFields.length > 0) {
        updateValues.push(selectedFacility.id);
        await executeWrite(
          `UPDATE infrastructure_assets 
           SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          updateValues
        );
      }

      // Recalculate intervention points
      const updatedFacility = await executeQuery(
        'SELECT * FROM infrastructure_assets WHERE id = ?',
        [selectedFacility.id]
      );
      if (updatedFacility[0]) {
        const points = await calculateInterventionPoints(updatedFacility[0]);
        await executeWrite(
          'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
          [points, selectedFacility.id]
        );
      }

      // Reload facilities
      await loadFacilities();
      setShowReportModal(false);
      setSelectedFacility(null);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading map...</Text>
        <Text style={styles.loadingSubtext}>
          Initializing database and loading facilities...
        </Text>
      </View>
    );
  }

  // Always render something - never return blank
  console.log('MapScreen: Rendering, loading:', loading, 'facilities:', facilities.length);
  
  // Ensure we always return a valid React element
  return (
    <View style={styles.container} testID="map-screen-container">
      {/* Always show map wrapper - even if empty */}
      <View style={styles.mapWrapper}>
        <MapComponent
          center={SUDAN_CENTER}
          zoom={SUDAN_ZOOM}
          facilities={facilities || []}
          onFacilityClick={handleFacilityClick}
        />
      </View>
      
      {/* Always show at least a background color to verify rendering */}
      {facilities.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No facilities loaded</Text>
          <Text style={styles.emptyStateSubtext}>Check console for initialization status</Text>
        </View>
      )}

      {/* Debug info - always visible for troubleshooting */}
      {Platform.OS === 'web' && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            VoltEdge Active | Facilities: {facilities.length} | Online: {isOnline ? 'Yes' : 'No'}
          </Text>
        </View>
      )}

      {/* Facility Info Modal */}
      {selectedFacility && (
        <Modal
          visible={!!selectedFacility}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedFacility(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedFacility.name}</Text>
              <Text style={styles.modalSubtitle}>
                Type: {selectedFacility.type.charAt(0).toUpperCase() + selectedFacility.type.slice(1)}
              </Text>
              <Text style={styles.modalSubtitle}>
                Status: {selectedFacility.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <Text style={styles.modalSubtitle}>
                Priority Points: {selectedFacility.intervention_points.toFixed(1)}
              </Text>

              <Pressable
                style={styles.reportButton}
                onPress={handleReportProblem}
              >
                <Text style={styles.reportButtonText}>Report Problem</Text>
              </Pressable>

              <Pressable
                style={styles.closeButton}
                onPress={() => setSelectedFacility(null)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Report Modal */}
      {selectedFacility && (
        <FacilityReportModal
          visible={showReportModal}
          facility={selectedFacility}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}

      {/* Intervention Ranking Toggle */}
      <Pressable
        style={styles.rankingButton}
        onPress={() => setShowRankingList(!showRankingList)}
      >
        <Text style={styles.rankingButtonText}>
          {showRankingList ? 'Hide Priority List' : 'Show Priority List'}
        </Text>
      </Pressable>

      {/* Intervention Ranking List */}
      {showRankingList && facilities.length > 0 && (
        <InterventionRankingList
          facilities={facilities}
          onFacilitySelect={(facility) => {
            setSelectedFacility(facility);
            setShowRankingList(false);
          }}
        />
      )}

      {/* Online/Offline Indicator */}
      <View style={[styles.statusIndicator, isOnline ? styles.online : styles.offline]}>
        <Text style={styles.statusText}>
          {isOnline ? '● Online' : '○ Offline'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
    height: '100%',
    minHeight: 400, // Ensure minimum height
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 400,
    position: 'relative',
    backgroundColor: '#e8f4f8', // Light blue background to verify rendering
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  reportButton: {
    backgroundColor: '#0066cc',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  reportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#333333',
    fontSize: 16,
  },
  rankingButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  rankingButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  online: {
    backgroundColor: '#e8f5e9',
  },
  offline: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  debugInfo: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    fontSize: 12,
    color: '#333333',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  noDataText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  emptyState: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#666666',
  },
});

export default MapScreen;
