/**
 * Map Screen - Main map view showing Sudan with facility markers
 * Displays water sources, power sources, shelters, and food sources
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Modal, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { executeQuery, executeWrite } from '../db/database';
import MapComponent from '../components/MapComponent';
import FacilityReportModal from '../components/FacilityReportModal';
import InterventionRankingList from '../components/InterventionRankingList';
import DirectionsPanel from '../components/DirectionsPanel';
import SimulationJoystick from '../components/SimulationJoystick';
import { calculateInterventionPoints } from '../utils/interventionRanking';
import { initializeSampleData } from '../utils/dataSync';
import { findNearestFacility, formatDistance } from '../utils/distance';
import { generateRoute, getNextInstruction } from '../utils/routing';

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
  
  // GPS and navigation state - always start at Khartoum
  const [userLocation, setUserLocation] = useState({
    lat: 15.5007,
    lng: 32.5599,
    accuracy: 10,
    timestamp: Date.now(),
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [nearestFacility, setNearestFacility] = useState(null);

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


  // Update nearest facility when location changes
  useEffect(() => {
    if (userLocation && facilities.length > 0) {
      const nearest = findNearestFacility(userLocation.lat, userLocation.lng, facilities);
      setNearestFacility(nearest);
    }
  }, [userLocation, facilities]);

  // Update navigation instructions when location changes
  useEffect(() => {
    if (navigationRoute && userLocation) {
      const instruction = getNextInstruction(userLocation.lat, userLocation.lng, navigationRoute);
      setCurrentInstruction(instruction);
    }
  }, [userLocation, navigationRoute]);

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
   * Start navigation to facility
   */
  const startNavigation = (facility) => {
    if (!userLocation) {
      console.warn('Cannot start navigation: user location not available');
      return;
    }

    const route = generateRoute(
      userLocation.lat,
      userLocation.lng,
      facility.location_lat || facility.lat,
      facility.location_lng || facility.lng
    );
    setNavigationRoute(route);
    setSelectedFacility(facility);
  };

  /**
   * Stop navigation
   */
  const stopNavigation = () => {
    setNavigationRoute(null);
    setCurrentInstruction(null);
  };

  /**
   * Toggle simulation mode
   */
  const toggleSimulation = () => {
    if (isSimulating) {
      // Stop simulation - return to fixed Khartoum location
      setIsSimulating(false);
      setUserLocation({
        lat: 15.5007,
        lng: 32.5599,
        accuracy: 10,
        timestamp: Date.now(),
      });
    } else {
      // Start simulation - use current location or spawn at Khartoum
      // Don't reset location if user was already moved - preserve position
      if (!userLocation) {
        setUserLocation({
          lat: 15.5007,
          lng: 32.5599,
          accuracy: 10,
          timestamp: Date.now(),
        });
      }
      setIsSimulating(true);
      console.log('Simulation started, marker at:', userLocation?.lat, userLocation?.lng);
    }
  };

  /**
   * Handle joystick movement in simulation
   * Works like a game character - smooth, persistent movement
   */
  const handleJoystickMove = (direction) => {
    if (!isSimulating || !userLocation) return;
    
    // Use functional update to ensure we're always working with the latest location
    setUserLocation((currentLocation) => {
      if (!currentLocation) return currentLocation;
      
      // Calculate movement at normal walking pace (~1.4 m/s = 5 km/h)
      // Joystick coordinates: up = negative y, down = positive y, left = negative x, right = positive x
      // Map coordinates: north = positive lat, south = negative lat, east = positive lng, west = negative lng
      // Walking speed: ~1.4 meters per second. Using 1 meter per update for slower, more realistic walking pace on map
      const metersPerUpdate = 0.2;
      const latOffset = (-direction.y * metersPerUpdate) / 111000; // Up = north, down = south
      const lngOffset = (direction.x * metersPerUpdate) / (111000 * Math.cos(currentLocation.lat * Math.PI / 180)); // Right = east, left = west

      // Calculate new position - no restrictions, free movement
      const newLat = currentLocation.lat + latOffset;
      const newLng = currentLocation.lng + lngOffset;

      return {
        ...currentLocation,
        lat: newLat,
        lng: newLng,
        timestamp: Date.now(),
      };
    });
  };
  
  /**
   * Handle joystick stop - keep current position, don't reset
   */
  const handleJoystickStop = () => {
    // Position persists - like a game character, it stays where you left it
    // No reset, no snap back to spawn
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
          userLocation={userLocation}
          route={navigationRoute}
          onFacilityClick={handleFacilityClick}
          isSimulating={isSimulating}
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
                style={styles.navigateButton}
                onPress={() => {
                  startNavigation(selectedFacility);
                  setSelectedFacility(null);
                }}
              >
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </Pressable>

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

      {/* Simulation Toggle */}
      <Pressable
        style={[styles.simulationButton, isSimulating && styles.simulationButtonActive]}
        onPress={toggleSimulation}
      >
        <Text style={[styles.simulationButtonText, isSimulating && styles.simulationButtonTextActive]}>
          {isSimulating ? 'Stop Simulation' : 'Simulate Walking'}
        </Text>
      </Pressable>

      {/* Intervention Ranking Toggle */}
      <Pressable
        style={styles.rankingButton}
        onPress={() => setShowRankingList(!showRankingList)}
      >
        <Text style={styles.rankingButtonText}>
          {showRankingList ? 'Hide Priority List' : 'Show Priority List'}
        </Text>
      </Pressable>

      {/* Simulation Joystick */}
      {isSimulating && (
        <SimulationJoystick
          onMove={handleJoystickMove}
          onStop={handleJoystickStop}
        />
      )}

      {/* Directions Panel */}
      {navigationRoute && (
        <DirectionsPanel
          route={navigationRoute}
          currentInstruction={currentInstruction}
          onClose={stopNavigation}
        />
      )}

      {/* Nearest Facility Info */}
      {nearestFacility && !navigationRoute && (
        <View style={styles.nearestFacilityInfo}>
          <Text style={styles.nearestFacilityTitle}>Nearest Facility</Text>
          <Text style={styles.nearestFacilityName}>{nearestFacility.facility.name}</Text>
          <Text style={styles.nearestFacilityDistance}>
            {formatDistance(nearestFacility.distance)} away
          </Text>
          <Pressable
            style={styles.nearestFacilityButton}
            onPress={() => startNavigation(nearestFacility.facility)}
          >
            <Text style={styles.nearestFacilityButtonText}>Navigate</Text>
          </Pressable>
        </View>
      )}

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
  simulationButton: {
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
    zIndex: 1000,
  },
  simulationButtonActive: {
    backgroundColor: '#ff9900',
  },
  simulationButtonText: {
    color: '#0066cc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  simulationButtonTextActive: {
    color: '#ffffff',
  },
  rankingButton: {
    position: 'absolute',
    top: 70,
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
  navigateButton: {
    backgroundColor: '#00cc00',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nearestFacilityInfo: {
    position: 'absolute',
    top: 124,
    left: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 200,
  },
  nearestFacilityTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  nearestFacilityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  nearestFacilityDistance: {
    fontSize: 14,
    color: '#0066cc',
    marginBottom: 8,
  },
  nearestFacilityButton: {
    backgroundColor: '#0066cc',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  nearestFacilityButtonText: {
    color: '#ffffff',
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
