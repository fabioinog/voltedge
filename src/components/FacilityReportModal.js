/**
 * Facility Report Modal - Form for reporting facility problems
 * Allows users to update facility condition, supply, population, and importance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';

/**
 * Facility Report Modal Component
 */
const FacilityReportModal = ({ visible, facility, onClose, onSubmit }) => {
  const [facilityCondition, setFacilityCondition] = useState(facility?.facility_condition || 'good');
  const [supplyAmount, setSupplyAmount] = useState(facility?.supply_amount || 'medium');
  const [populationAmount, setPopulationAmount] = useState(facility?.population_amount || 'medium');
  const [facilityImportance, setFacilityImportance] = useState(facility?.facility_importance || 'moderate');

  const handleSubmit = () => {
    const reportData = {
      facilityCondition,
      supplyAmount: facility.type === 'shelter' || facility.type === 'food' ? supplyAmount : null,
      populationAmount: facility.type === 'shelter' ? populationAmount : null,
      facilityImportance,
    };

    onSubmit(reportData);
  };

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' },
    { value: 'bad', label: 'Bad' },
  ];

  const amountOptions = [
    { value: 'very_high', label: 'Very High' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
    { value: 'very_low', label: 'Very Low' },
  ];

  const importanceOptions = [
    { value: 'very_important', label: 'Very Important' },
    { value: 'important', label: 'Important' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'not_important', label: 'Not Important' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Report Problem</Text>
          <Text style={styles.subtitle}>{facility?.name}</Text>

          <ScrollView style={styles.scrollView}>
            {/* Facility Condition */}
            <View style={styles.section}>
              <Text style={styles.label}>Facility Condition</Text>
              <View style={styles.optionsContainer}>
                {conditionOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.optionButton,
                      facilityCondition === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFacilityCondition(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        facilityCondition === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Supply Amount (for applicable facilities) */}
            {(facility?.type === 'shelter' || facility?.type === 'food' || facility?.type === 'water') && (
              <View style={styles.section}>
                <Text style={styles.label}>Supply Amount</Text>
                <View style={styles.optionsContainer}>
                  {amountOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.optionButton,
                        supplyAmount === option.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setSupplyAmount(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          supplyAmount === option.value && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Population Amount (only for shelters) */}
            {facility?.type === 'shelter' && (
              <View style={styles.section}>
                <Text style={styles.label}>Population Amount</Text>
                <View style={styles.optionsContainer}>
                  {amountOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.optionButton,
                        populationAmount === option.value && styles.optionButtonSelected,
                      ]}
                      onPress={() => setPopulationAmount(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          populationAmount === option.value && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Facility Importance */}
            <View style={styles.section}>
              <Text style={styles.label}>Facility Importance</Text>
              <View style={styles.optionsContainer}>
                {importanceOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.optionButton,
                      facilityImportance === option.value && styles.optionButtonSelected,
                    ]}
                    onPress={() => setFacilityImportance(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        facilityImportance === option.value && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit Report</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  optionText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#ffffff',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#0066cc',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default FacilityReportModal;
