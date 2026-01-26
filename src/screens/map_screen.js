import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Modal, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { executeQuery, executeWrite, initDatabase } from '../db/database';
import MapComponent from '../components/map_component';
import FacilityReportModal from '../components/facility_report_modal';
import InterventionRankingList from '../components/intervention_ranking_list';
import DirectionsPanel from '../components/directions_panel';
import SimulationJoystick from '../components/simulation_joystick';
import { calculateInterventionPoints } from '../utils/intervention_ranking';
import { initializeSampleData, syncFacilities, fixFacilityStatuses } from '../utils/data_sync';
import { validateUserReport, getValidationExplanation } from '../utils/report_validation';
import { addUserPointAdjustment, clearAllUserAdjustments, getUserPointAdjustment } from '../utils/user_point_adjustments';
import { findNearestFacility, formatDistance } from '../utils/distance';
import { generateRoute, getNextInstruction } from '../utils/routing';
import { establishAllConnections, getFacilityConnections } from '../utils/facility_connections';
import { simulateFacilityFailure, getFailedFacilities, getAtRiskFacilities, getFailureSuggestions, loadFailuresFromDatabase, resolveFacilityFailure } from '../utils/failure_simulation';
import FailureSimulationButton from '../components/failure_simulation_button';
import FacilityFailureModal from '../components/facility_failure_modal';
import FailureDisplayPanel from '../components/failure_display_panel';
import FailureSuggestionsModal from '../components/failure_suggestions_modal';
import ResolveFailureModal from '../components/resolve_failure_modal';
import GuideModal from '../components/guide_modal';

// Sudan center coordinates
const SUDAN_CENTER = [15.5, 30.0];
const SUDAN_ZOOM = 6;

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
  const [showSimulationPanel, setShowSimulationPanel] = useState(false);
  const [facilityConnections, setFacilityConnections] = useState([]);
  
  // Failure simulation state
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [currentFailure, setCurrentFailure] = useState(null);
  const [failedFacilitiesList, setFailedFacilitiesList] = useState([]);
  const [atRiskFacilitiesList, setAtRiskFacilitiesList] = useState([]);
  const [showFailureSuggestions, setShowFailureSuggestions] = useState(false);
  const [showResolveFailureModal, setShowResolveFailureModal] = useState(false);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false); // Prevent sync during failure simulation
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    clearAllUserAdjustments();
    
    const init = async () => {
      try {
        await initDatabase();
        await initializeSampleData();
        await loadFailuresFromDatabase();
        
        if (mounted) {
          await loadFacilities();
        }
      } catch (error) {
        console.error('Error initializing:', error);
        if (mounted) {
          try {
            await loadFacilities();
          } catch (loadError) {
            console.error('Error loading facilities:', loadError);
            setFacilities([]);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        setLoading(false);
      }
    }, 2000);
    
    init();
    setupOnlineListener();
    
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (isOnline && !isSimulatingFailure) {
      const syncTimeout = setTimeout(() => {
        if (!isSimulatingFailure) {
          executeQuery('SELECT COUNT(*) as count FROM infrastructure_assets WHERE status = ?', ['failed'])
            .then(result => {
              const failedCount = result[0]?.count || 0;
              if (failedCount === 0 && !isSimulatingFailure) {
                syncFacilitiesLocal();
              }
            })
            .catch(err => {
              console.error('Error checking failed facilities before sync:', err);
            });
        }
      }, 5000);
      
      return () => clearTimeout(syncTimeout);
    }
  }, [isOnline, isSimulatingFailure]);


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

  const setupOnlineListener = () => {
    if (Platform.OS === 'web') {
      window.addEventListener('online', () => setIsOnline(true));
      window.addEventListener('offline', () => setIsOnline(false));
    }
  };

  const loadFacilities = async (skipIfSimulating = true) => {
    if (skipIfSimulating && isSimulatingFailure) {
      return;
    }
    
    try {
      setLoading(true);
      const results = await executeQuery(
        'SELECT * FROM infrastructure_assets ORDER BY intervention_points DESC'
      );
      
      const facilitiesWithPoints = await Promise.all(
        results.map(async (facility) => {
          const needsUpdate = 
            facility.urgency_hours === undefined || facility.urgency_hours === null ||
            facility.effort_penalty === undefined || facility.effort_penalty === null ||
            facility.cascade_prevention_count === undefined || facility.cascade_prevention_count === null;
          
          if (needsUpdate) {
            await executeWrite(
              `UPDATE infrastructure_assets 
               SET urgency_hours = ?, effort_penalty = ?, cascade_prevention_count = ?
               WHERE id = ?`,
              [
                facility.urgency_hours ?? 100,
                facility.effort_penalty ?? 1.0,
                facility.cascade_prevention_count ?? 0,
                facility.id
              ]
            );
            const updated = await executeQuery(
              'SELECT * FROM infrastructure_assets WHERE id = ?',
              [facility.id]
            );
            if (updated[0]) {
              facility = updated[0];
            }
          }
          
          const basePoints = await calculateInterventionPoints(facility);
          const userAdjustment = getUserPointAdjustment(facility.id);
          const totalPoints = basePoints + userAdjustment;
          
          if (isNaN(facility.intervention_points) || Math.abs(totalPoints - facility.intervention_points) > 0.1) {
            await executeWrite(
              'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
              [totalPoints, facility.id]
            );
            return { ...facility, intervention_points: totalPoints };
          }
          return { ...facility, intervention_points: totalPoints };
        })
      );

      if (isSimulatingFailure) {
        const failed = facilitiesWithPoints.filter(f => f.status === 'failed');
        const atRisk = facilitiesWithPoints.filter(f => f.status === 'at_risk');
        setFailedFacilitiesList(failed);
        setAtRiskFacilitiesList(atRisk);
      } else {
        setFacilities(facilitiesWithPoints);
        const failed = facilitiesWithPoints.filter(f => f.status === 'failed');
        const atRisk = facilitiesWithPoints.filter(f => f.status === 'at_risk');
        setFailedFacilitiesList(failed);
        setAtRiskFacilitiesList(atRisk);
      }
      
      try {
        await establishAllConnections(facilitiesWithPoints);
        const connections = await getFacilityConnections(facilitiesWithPoints);
        setFacilityConnections(connections);
      } catch (error) {
        console.error('Error establishing connections:', error);
        setFacilityConnections([]);
      }
    } catch (error) {
      console.error('Error loading facilities:', error);
      setFacilities([]); // Set empty array on error
      setFacilityConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const syncFacilitiesLocal = async () => {
    if (isSimulatingFailure) {
      return;
    }
    
    try {
      const currentFailed = await executeQuery(
        'SELECT COUNT(*) as count FROM infrastructure_assets WHERE status = ?',
        ['failed']
      );
      const failedCount = currentFailed[0]?.count || 0;
      
      const currentAtRisk = await executeQuery(
        'SELECT COUNT(*) as count FROM infrastructure_assets WHERE status = ?',
        ['at_risk']
      );
      const atRiskCount = currentAtRisk[0]?.count || 0;
      
      if (failedCount > 0 || atRiskCount > 0) {
        return;
      }
      
      await syncFacilities();
      if (!isSimulatingFailure) {
        await loadFacilities(false);
      }
    } catch (error) {
      console.error('Error syncing facilities:', error);
    }
  };


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

  const stopNavigation = () => {
    setNavigationRoute(null);
    setCurrentInstruction(null);
  };

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

  const handleJoystickMove = (direction) => {
    if (!isSimulating || !userLocation) return;
    
    setUserLocation((currentLocation) => {
      if (!currentLocation) return currentLocation;
      
      const metersPerUpdate = 0.2;
      const latOffset = (-direction.y * metersPerUpdate) / 111000;
      const lngOffset = (direction.x * metersPerUpdate) / (111000 * Math.cos(currentLocation.lat * Math.PI / 180));

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
  
  const handleJoystickStop = () => {
  };

  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
  };

  const handleReportProblem = () => {
    setShowReportModal(true);
  };

  const handleReportSubmit = async (reportData) => {
    try {
      if (!selectedFacility) {
        console.error('No facility selected for report');
        return;
      }

      // Validate the report using validation algorithm
      const validation = validateUserReport(reportData, selectedFacility);
      
      console.log('Report validation:', {
        facility: selectedFacility.name,
        shouldApply: validation.shouldApply,
        pointAdjustment: validation.pointAdjustment,
        severityScore: validation.severityScore,
        reason: validation.reason,
      });

      // Save user report to database
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

      // If report is validated, apply point adjustment
      if (validation.shouldApply && validation.pointAdjustment > 0) {
        addUserPointAdjustment(selectedFacility.id, validation.pointAdjustment, reportData);
        
        // Recalculate and update facility points
        const updatedFacility = await executeQuery(
          'SELECT * FROM infrastructure_assets WHERE id = ?',
          [selectedFacility.id]
        );
        
        if (updatedFacility[0]) {
          // Recalculate base points
          const basePoints = await calculateInterventionPoints(updatedFacility[0]);
          
          // Get user adjustment
          const userAdjustment = getUserPointAdjustment(selectedFacility.id);
          
          // Total points = base points + user adjustment
          const totalPoints = basePoints + userAdjustment;
          
          // Update facility with new total points
          await executeWrite(
            'UPDATE infrastructure_assets SET intervention_points = ? WHERE id = ?',
            [totalPoints, selectedFacility.id]
          );
          
          // Update selected facility in state to reflect new points
          setSelectedFacility({
            ...selectedFacility,
            intervention_points: totalPoints,
          });
          
          // Reload facilities to show updated ranking
          await loadFacilities();
          
          // Show success message
          const explanation = getValidationExplanation(validation);
          console.log('Report applied:', explanation);
          alert(`Report validated!\n${explanation}\n\nFacility priority updated.`);
        }
      } else {
        // Report received but not applied
        console.log('Report received but not applied:', validation.reason);
        alert('Report received.');
      }

      setShowReportModal(false);
      setSelectedFacility(null);
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleFacilityFailure = async (facility) => {
    try {
      setIsSimulatingFailure(true);
      setShowFailureModal(false);
      
      const result = await simulateFacilityFailure(
        facility.id,
        facilities,
        facilityConnections
      );
      
      setCurrentFailure(result.failedFacility);
      
      const failedFromResult = [result.failedFacility];
      const atRiskFromResult = result.atRiskFacilities || [];
      
      setFailedFacilitiesList(failedFromResult);
      setAtRiskFacilitiesList(atRiskFromResult);
      
      setFacilities(prevFacilities => {
        const updated = prevFacilities.map(f => {
          if (f.id === result.failedFacility.id) {
            return { ...f, status: 'failed', intervention_points: result.failedFacility.intervention_points };
          }
          if (result.atRiskIds && result.atRiskIds.includes(f.id)) {
            const atRiskFacility = result.atRiskFacilities.find(arf => arf.id === f.id);
            if (atRiskFacility) {
              return { ...f, status: 'at_risk', intervention_points: atRiskFacility.intervention_points };
            }
            return { ...f, status: 'at_risk' };
          }
          return f;
        });
        return updated;
      });
      
      setTimeout(async () => {
        try {
          const verifyFailed = await executeQuery(
            'SELECT * FROM infrastructure_assets WHERE id = ?',
            [facility.id]
          );
          
          if (verifyFailed[0]) {
            if (verifyFailed[0].status === 'failed') {
              const freshFacilities = await executeQuery('SELECT * FROM infrastructure_assets');
              const failed = freshFacilities.filter(f => f.status === 'failed');
              const atRisk = freshFacilities.filter(f => f.status === 'at_risk');
              setFailedFacilitiesList(failed);
              setAtRiskFacilitiesList(atRisk);
              
              setFacilities(prevFacilities => {
                const facilityMap = new Map(freshFacilities.map(f => [f.id, f]));
                return prevFacilities.map(f => {
                  const updated = facilityMap.get(f.id);
                  return updated ? { ...f, ...updated } : f;
                });
              });
              
              setTimeout(() => {
                setIsSimulatingFailure(false);
              }, 5000);
            } else {
              await executeWrite(
                `UPDATE infrastructure_assets 
                 SET status = ? 
                 WHERE id = ?`,
                ['failed', facility.id]
              );
              setTimeout(() => {
                setIsSimulatingFailure(false);
              }, 2000);
            }
          } else {
            setIsSimulatingFailure(false);
          }
        } catch (error) {
          console.error('Error updating failure lists:', error);
          setTimeout(() => {
            setIsSimulatingFailure(false);
          }, 2000);
        }
      }, 1500);
    } catch (error) {
      console.error('Error simulating facility failure:', error);
      alert('Error simulating facility failure. Please try again.');
    }
  };

  const handleSendAlert = (facility) => {
    if (!facility) return;
    setCurrentFailure(facility);
    setShowFailureSuggestions(true);
  };

  const handleResolveFailure = async (facility) => {
    try {
      setShowResolveFailureModal(false);
      setIsSimulatingFailure(true);
      
      const resolvedFacility = await resolveFacilityFailure(facility.id, facilities);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const verifyResolved = await executeQuery(
        'SELECT id, name, status FROM infrastructure_assets WHERE id = ?',
        [facility.id]
      );
      
      if (verifyResolved[0]) {
        if (verifyResolved[0].status === 'operational') {
        } else {
          await executeWrite(
            `UPDATE infrastructure_assets 
             SET status = ? 
             WHERE id = ?`,
            ['operational', facility.id]
          );
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      await loadFacilities(false);
      const freshFacilities = await executeQuery('SELECT * FROM infrastructure_assets');
      const failed = freshFacilities.filter(f => f.status === 'failed');
      const atRisk = freshFacilities.filter(f => f.status === 'at_risk');
      
      setFailedFacilitiesList(failed);
      setAtRiskFacilitiesList(atRisk);
      
      setFacilities(prevFacilities => {
        return prevFacilities.map(f => {
          if (f.id === facility.id) {
            const updatedFacility = freshFacilities.find(ff => ff.id === facility.id);
            if (updatedFacility) {
              return updatedFacility;
            }
            return { ...f, status: 'operational' };
          }
          return f;
        });
      });
      
      setTimeout(() => {
        setIsSimulatingFailure(false);
      }, 3000);
    } catch (error) {
      console.error('Error resolving facility failure:', error);
      setIsSimulatingFailure(false);
      alert('Error resolving facility failure. Please try again.');
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

  return (
    <View style={styles.container} testID="map-screen-container">
      <View style={styles.mapWrapper}>
        <MapComponent
          center={SUDAN_CENTER}
          zoom={SUDAN_ZOOM}
          facilities={facilities || []}
          userLocation={userLocation}
          route={navigationRoute}
          onFacilityClick={handleFacilityClick}
          isSimulating={isSimulating}
          connections={Array.isArray(facilityConnections) ? facilityConnections : []}
          topPriorityFacilities={Array.isArray(facilities) ? facilities.slice(0, 3) : []}
        />
      </View>
      
      {facilities.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No facilities loaded</Text>
          <Text style={styles.emptyStateSubtext}>Check console for initialization status</Text>
        </View>
      )}

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

      {/* Simulation Panel Toggle (Admin Panel) */}
      <View style={styles.simulationPanel}>
        {/* Arrow Toggle Button */}
        <Pressable
          style={styles.simulationToggleArrow}
          onPress={() => setShowSimulationPanel(!showSimulationPanel)}
        >
          <Text style={styles.simulationToggleArrowText}>
            {showSimulationPanel ? '◀' : '▶'}
          </Text>
        </Pressable>
        
        {/* Simulation Button (Hidden by default) */}
        {showSimulationPanel && (
          <>
            <Pressable
              style={[styles.simulationButton, isSimulating && styles.simulationButtonActive]}
              onPress={toggleSimulation}
            >
              <Text style={[styles.simulationButtonText, isSimulating && styles.simulationButtonTextActive]}>
                {isSimulating ? 'Stop Simulation' : 'Simulate Walking'}
              </Text>
            </Pressable>
            
            {/* Failure Simulation Button */}
            <FailureSimulationButton
              isVisible={showSimulationPanel}
              onPress={() => setShowFailureModal(true)}
            />
            
            {/* Resolve Failure Button */}
            {failedFacilitiesList.length > 0 && (
              <Pressable
                style={styles.resolveFailureButton}
                onPress={() => setShowResolveFailureModal(true)}
              >
                <Text style={styles.resolveFailureButtonText}>Resolve Failure</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Guide Button */}
      <Pressable
        style={styles.guideButton}
        onPress={() => setShowGuideModal(true)}
      >
        <Text style={styles.guideButtonText}>?</Text>
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

      {/* Facility Failure Modal */}
      <FacilityFailureModal
        visible={showFailureModal}
        facilities={facilities}
        onClose={() => setShowFailureModal(false)}
        onSelectFacility={handleFacilityFailure}
      />

      {/* Failure Display Panel */}
      <FailureDisplayPanel
        failedFacilities={failedFacilitiesList}
        atRiskFacilities={atRiskFacilitiesList}
        onFacilityClick={(facility) => {
          setSelectedFacility(facility);
        }}
        onSendAlert={handleSendAlert}
      />

      {/* Failure Suggestions Modal */}
      {currentFailure && (
        <FailureSuggestionsModal
          visible={showFailureSuggestions}
          facility={currentFailure}
          suggestions={getFailureSuggestions(currentFailure)}
          onClose={() => {
            setShowFailureSuggestions(false);
            setCurrentFailure(null);
          }}
        />
      )}

      {/* Resolve Failure Modal */}
      <ResolveFailureModal
        visible={showResolveFailureModal}
        failedFacilities={failedFacilitiesList}
        onClose={() => setShowResolveFailureModal(false)}
        onResolveFacility={handleResolveFailure}
      />

      {/* Guide Modal */}
      <GuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
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
  simulationPanel: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 1000,
  },
  simulationToggleArrow: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 4,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  simulationToggleArrowText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  simulationButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  resolveFailureButton: {
    backgroundColor: '#00cc00',
    padding: 12,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    minWidth: 120,
  },
  resolveFailureButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
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
  guideButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  guideButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default MapScreen;
