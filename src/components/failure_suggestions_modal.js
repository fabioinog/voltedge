/**
 * Failure Suggestions Modal
 * Shows actions the user can take for a failed facility. Clicking an action
 * closes the modal and notifies the parent (onActionStarted); a bottom pop-up
 * in the parent shows progress and result (60% no effect, 40% facility resolved).
 */

import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ACCENT_BLUE, transitionStyle } from '../theme';

const FailureSuggestionsModal = ({ visible, facility, suggestions, onClose, onActionStarted }) => {
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

  const handleActionPress = (suggestion) => {
    if (onActionStarted && facility) {
      onActionStarted(facility, suggestion);
      onClose();
    }
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
              <Text style={styles.modalTitle}>Actions</Text>
              <Text style={styles.modalSubtitle}>{facility.name}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, transitionStyle, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <Pressable
                key={index}
                style={({ pressed }) => [
                  styles.actionItem,
                  transitionStyle,
                  { opacity: pressed ? 0.9 : 1 },
                ]}
                onPress={() => handleActionPress(suggestion)}
              >
                <Text style={styles.actionNumber}>{index + 1}</Text>
                <Text style={styles.actionText}>{suggestion}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [styles.closeButtonLarge, transitionStyle, { opacity: pressed ? 0.9 : 1 }]}
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
    borderBottomColor: ACCENT_BLUE,
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
    textAlign: 'left',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666666',
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
  suggestionsList: {
    maxHeight: 400,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ACCENT_BLUE,
    marginRight: 12,
    minWidth: 24,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    textAlign: 'left',
  },
  closeButtonLarge: {
    backgroundColor: ACCENT_BLUE,
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
