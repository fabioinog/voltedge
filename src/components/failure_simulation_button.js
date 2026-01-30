/**
 * Failure Simulation Button
 * Button to trigger facility failure simulation (admin panel)
 */

import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { transitionStyle } from '../theme';

const FailureSimulationButton = ({ onPress, isVisible, compact, containerStyle }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        containerStyle,
        transitionStyle,
        { opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, compact && styles.buttonTextCompact]}>
        {compact ? 'Simulate Failure' : 'Simulate Failure'}
      </Text>
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
  buttonCompact: {
    marginTop: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 0,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
});

export default FailureSimulationButton;
