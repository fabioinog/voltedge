/**
 * Reported Problems Modal
 * Shows a list of reported problems in the same format as a facility report
 * (facility name, type, condition, supply, population, importance, comments).
 */

import React from 'react';
import { View, Text, Modal, StyleSheet, Pressable, ScrollView } from 'react-native';
import { ACCENT_BLUE, transitionStyle } from '../theme';

const formatLabel = (key) => {
  const labels = {
    facilityCondition: 'Facility Condition',
    supplyAmount: 'Supply Amount',
    populationAmount: 'Population Amount',
    facilityImportance: 'Facility Importance',
    comments: 'Comments',
  };
  return labels[key] || key;
};

const formatValue = (value) => {
  if (value == null || value === '') return '—';
  const s = String(value).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const ReportedProblemsModal = ({ visible, reportedProblems, onClose }) => {
  if (!reportedProblems || reportedProblems.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Reported Problems</Text>
            <Text style={styles.emptyText}>No reported problems.</Text>
            <Pressable style={({ pressed }) => [styles.closeButton, transitionStyle, { opacity: pressed ? 0.9 : 1 }]} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Reported Problems</Text>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {reportedProblems.map((report, index) => (
              <View key={index} style={styles.reportCard}>
                <Text style={styles.reportFacilityName}>{report.facilityName}</Text>
                <Text style={styles.reportFacilityType}>{formatValue(report.facilityType)}</Text>
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{formatLabel('facilityCondition')}</Text>
                  <Text style={styles.reportValue}>{formatValue(report.facilityCondition)}</Text>
                </View>
                {report.supplyAmount != null && (
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>{formatLabel('supplyAmount')}</Text>
                    <Text style={styles.reportValue}>{formatValue(report.supplyAmount)}</Text>
                  </View>
                )}
                {report.populationAmount != null && (
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>{formatLabel('populationAmount')}</Text>
                    <Text style={styles.reportValue}>{formatValue(report.populationAmount)}</Text>
                  </View>
                )}
                <View style={styles.reportRow}>
                  <Text style={styles.reportLabel}>{formatLabel('facilityImportance')}</Text>
                  <Text style={styles.reportValue}>{formatValue(report.facilityImportance)}</Text>
                </View>
                {(report.comments != null && report.comments !== '') && (
                  <View style={styles.reportRow}>
                    <Text style={styles.reportLabel}>{formatLabel('comments')}</Text>
                    <Text style={styles.reportValue}>{report.comments}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          <Pressable style={({ pressed }) => [styles.closeButton, transitionStyle, { opacity: pressed ? 0.9 : 1 }]} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'left',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'left',
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  reportCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: ACCENT_BLUE,
  },
  reportFacilityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'left',
  },
  reportFacilityType: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'left',
  },
  reportRow: {
    marginBottom: 8,
  },
  reportLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
    textAlign: 'left',
  },
  reportValue: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'left',
  },
  closeButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: ACCENT_BLUE,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ReportedProblemsModal;
