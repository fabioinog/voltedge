/**
 * Failure Simulation Button
 * Button to trigger facility failure simulation (admin panel)
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

const FailureSimulationButton = ({ onPress, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>Simulate Failure</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#cc0000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FailureSimulationButton;
