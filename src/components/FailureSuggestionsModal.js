/**
 * Failure Suggestions Modal
 * Shows suggestions for what to do when a facility fails
 */

import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';

const FailureSuggestionsModal = ({ visible, facility, suggestions, onClose }) => {
  if (!visible || !facility || !suggestions) {
    return null;
  }

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
            <Text style={styles.modalIcon}>{getTypeIcon(facility.type)}</Text>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>Recommended Actions</Text>
              <Text style={styles.modalSubtitle}>{facility.name}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
          
          <ScrollView style={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionItem}>
                <Text style={styles.suggestionNumber}>{index + 1}</Text>
                <Text style={styles.suggestionText}>{suggestion}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={styles.closeButtonLarge}
            onPress={onClose}
          >
            <Text style={styles.closeButtonLargeText}>Close</Text>
          </Pressable>
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
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#cc0000',
    paddingBottom: 15,
  },
  modalIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
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
  suggestionsList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    alignItems: 'flex-start',
  },
  suggestionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#cc0000',
    marginRight: 12,
    minWidth: 24,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  closeButtonLarge: {
    backgroundColor: '#cc0000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonLargeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FailureSuggestionsModal;
