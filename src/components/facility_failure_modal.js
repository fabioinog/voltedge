/**
 * Facility Failure Modal
 * Modal to select a facility to simulate failure
 */

import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, FlatList } from 'react-native';
import { ACCENT_BLUE, transitionStyle } from '../theme';

const FacilityFailureModal = ({ visible, facilities, onClose, onSelectFacility }) => {
  const filteredFacilities = facilities || [];

  const getTypeColor = (type) => {
    switch (type) {
      case 'water':
        return ACCENT_BLUE;
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

  const renderFacility = ({ item }) => (
    <Pressable
      style={({ pressed }) => [
        styles.facilityItem,
        { borderLeftColor: getTypeColor(item.type) },
        transitionStyle,
        { opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => onSelectFacility(item)}
    >
      <View style={styles.facilityHeader}>
        <Text style={styles.facilityIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>{item.name}</Text>
          <Text style={styles.facilityType}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.facilityPoints}>
        {Math.round(item.intervention_points || 0)} pts
      </Text>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Facility to Fail</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, transitionStyle, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          
          <FlatList
            data={filteredFacilities}
            renderItem={renderFacility}
            keyExtractor={(item) => item.id.toString()}
            style={styles.facilityList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No facilities found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'left',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
  },
  facilityList: {
    maxHeight: 400,
  },
  facilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderLeftWidth: 4,
  },
  facilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  facilityIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  facilityInfo: {
    flex: 1,
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
    textAlign: 'left',
  },
  facilityType: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'left',
  },
  facilityPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cc0000',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
});

export default FacilityFailureModal;
