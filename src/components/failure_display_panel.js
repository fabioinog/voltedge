/**
 * Failure Display Panel
 * Shows failed and at-risk facilities on the left side of the screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

const FailureDisplayPanel = ({ failedFacilities, atRiskFacilities, onFacilityClick, onSendAlert, isOnline = true }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'water':
        return '#0066cc';
      case 'power':
        return '#ff9900';
      case 'shelter':
        return '#cc0000';
      case 'food':
        return '#00cc00';
      case 'hospital':
        return '#cc00cc';
      default:
        return '#666666';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      water: '💧',
      power: '⚡',
      shelter: '🏠',
      food: '🍞',
      hospital: '🏥',
    };
    return icons[type] || '📍';
  };

  if (failedFacilities.length === 0 && atRiskFacilities.length === 0) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Failure Status</Text>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {failedFacilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Failed Facilities</Text>
            {failedFacilities.map((facility) => (
              <View
                key={facility.id}
                style={[
                  styles.facilityItem,
                  styles.failedItem,
                  { borderLeftColor: getTypeColor(facility.type) },
                ]}
              >
                <Pressable
                  style={styles.facilityContent}
                  onPress={() => onFacilityClick(facility)}
                >
                  <Text style={styles.facilityIcon}>{getTypeIcon(facility.type)}</Text>
                  <View style={styles.facilityInfo}>
                    <Text style={styles.facilityName}>{facility.name}</Text>
                    <Text style={styles.facilityType}>{facility.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.failedBadge}>FAILED</Text>
                </Pressable>
                {isOnline ? (
                  <Pressable
                    style={styles.alertButton}
                    onPress={() => onSendAlert && onSendAlert(facility)}
                  >
                    <Text style={styles.alertButtonText}>Alert Team</Text>
                  </Pressable>
                ) : (
                  <View style={styles.offlineAlertMessage}>
                    <Text style={styles.offlineAlertText}>You're offline. Go online to send alerts.</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {atRiskFacilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>At Risk Facilities</Text>
            {atRiskFacilities.map((facility) => (
              <Pressable
                key={facility.id}
                style={[
                  styles.facilityItem,
                  styles.atRiskItem,
                  { borderLeftColor: getTypeColor(facility.type) },
                ]}
                onPress={() => onFacilityClick(facility)}
              >
                <Text style={styles.facilityIcon}>{getTypeIcon(facility.type)}</Text>
                <View style={styles.facilityInfo}>
                  <Text style={styles.facilityName}>{facility.name}</Text>
                  <Text style={styles.facilityType}>{facility.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.atRiskBadge}>AT RISK</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 10,
    top: 80,
    width: 280,
    height: '70%',
    maxHeight: 560,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    overflow: 'hidden',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#cc0000',
    paddingBottom: 8,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  facilityItem: {
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  facilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  failedItem: {
    backgroundColor: '#ffe6e6',
  },
  atRiskItem: {
    backgroundColor: '#fff8e6',
  },
  facilityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  facilityType: {
    fontSize: 11,
    color: '#666666',
  },
  failedBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#cc0000',
    backgroundColor: '#ffcccc',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  atRiskBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff9900',
    backgroundColor: '#ffe6cc',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  alertButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  alertButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  offlineAlertMessage: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  offlineAlertText: {
    color: '#666666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default FailureDisplayPanel;
