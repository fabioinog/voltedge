/**
 * Failure Simulation Button
 * Button to trigger facility failure simulation (admin panel)
 */

import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { transitionStyle } from '../theme';

const FailureSimulationButton = ({ onPress, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.button, transitionStyle, { opacity: pressed ? 0.9 : 1 }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>Simulate Failure</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#b71c1c',
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
