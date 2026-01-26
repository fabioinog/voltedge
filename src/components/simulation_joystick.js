/**
 * Simulation Joystick Component
 * Allows controlling simulated user movement for testing
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';

/**
 * Simulation Joystick Component
 */
const SimulationJoystick = ({ onMove, onStop }) => {
  const [isActive, setIsActive] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsActive(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Limit joystick movement to circle
        const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        const maxDistance = 50; // Joystick radius

        if (distance <= maxDistance) {
          pan.setValue({ x: gestureState.dx, y: gestureState.dy });
        } else {
          // Keep on circle edge
          const angle = Math.atan2(gestureState.dy, gestureState.dx);
          pan.setValue({
            x: Math.cos(angle) * maxDistance,
            y: Math.sin(angle) * maxDistance,
          });
        }

        // Calculate direction and speed
        const normalizedX = gestureState.dx / maxDistance;
        const normalizedY = gestureState.dy / maxDistance;
        
        if (onMove) {
          onMove({
            x: Math.max(-1, Math.min(1, normalizedX)),
            y: Math.max(-1, Math.min(1, normalizedY)),
          });
        }
      },
      onPanResponderRelease: () => {
        setIsActive(false);
        pan.flattenOffset();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
        
        if (onStop) {
          onStop();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <View style={styles.joystickBase} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.joystickStick,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 120,
    height: 120,
  },
  joystickBase: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  joystickStick: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066cc',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});

export default SimulationJoystick;
