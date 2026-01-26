/**
 * Resolve Failure Modal
 * Modal to select a failed facility to resolve
 */

import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, FlatList } from 'react-native';

const ResolveFailureModal = ({ visible, failedFacilities, onClose, onResolveFacility }) => {
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

  const renderFacility = ({ item }) => (
    <Pressable
      style={[styles.facilityItem, { borderLeftColor: getTypeColor(item.type) }]}
      onPress={() => onResolveFacility(item)}
    >
      <View style={styles.facilityHeader}>
        <Text style={styles.facilityIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.facilityInfo}>
          <Text style={styles.facilityName}>{item.name}</Text>
          <Text style={styles.facilityType}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.resolveButton}>RESOLVE</Text>
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
            <Text style={styles.modalTitle}>Resolve Facility Failure</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          
          {failedFacilities.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No facilities in failure state</Text>
            </View>
          ) : (
            <FlatList
              data={failedFacilities}
              renderItem={renderFacility}
              keyExtractor={(item) => item.id.toString()}
              style={styles.facilityList}
            />
          )}
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
    backgroundColor: '#ffe6e6',
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
  },
  facilityType: {
    fontSize: 12,
    color: '#666666',
  },
  resolveButton: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00cc00',
    backgroundColor: '#e6ffe6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
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

export default ResolveFailureModal;
