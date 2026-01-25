/**
 * Directions Panel Component
 * Shows turn-by-turn directions to selected facility
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { formatDistance } from '../utils/distance';

/**
 * Directions Panel Component
 */
const DirectionsPanel = ({ route, currentInstruction, onClose }) => {
  if (!route || !route.instructions) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Directions</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          Total Distance: {formatDistance(route.totalDistance)}
        </Text>
        <Text style={styles.summaryText}>
          Est. Time: {Math.round(route.estimatedTime / 60)} min
        </Text>
      </View>

      <ScrollView style={styles.instructionsList}>
        {route.instructions.map((instruction, index) => {
          const isActive = currentInstruction && currentInstruction.step === instruction.step;
          
          return (
            <View
              key={index}
              style={[styles.instructionItem, isActive && styles.instructionItemActive]}
            >
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{instruction.step}</Text>
              </View>
              <View style={styles.instructionContent}>
                <Text style={[styles.instructionText, isActive && styles.instructionTextActive]}>
                  {instruction.instruction}
                </Text>
                <Text style={styles.instructionDistance}>
                  {formatDistance(instruction.distance)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    backgroundColor: '#f5f5f5',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
  },
  instructionsList: {
    maxHeight: 300,
  },
  instructionItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  instructionItemActive: {
    backgroundColor: '#e3f2fd',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructionContent: {
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  instructionTextActive: {
    fontWeight: '600',
    color: '#0066cc',
  },
  instructionDistance: {
    fontSize: 12,
    color: '#666666',
  },
});

export default DirectionsPanel;
