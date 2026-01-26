/**
 * Failure Notification Component
 * Shows popup notification when a facility fails
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';

const FailureNotification = ({ visible, facility, onClose, onSendAlert }) => {
  const slideAnim = new Animated.Value(-300);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible || !facility) {
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
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.notification}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getTypeIcon(facility.type)}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>FACILITY FAILURE ALERT</Text>
            <Text style={styles.facilityName}>{facility.name}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.message}>
            {facility.type.toUpperCase()} facility has experienced a critical failure.
          </Text>
          
          <Pressable
            style={styles.alertButton}
            onPress={onSendAlert}
          >
            <Text style={styles.alertButtonText}>Send Alert to Local Team</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    zIndex: 10000,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  notification: {
    backgroundColor: '#cc0000',
    borderRadius: 8,
    padding: 15,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 32,
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 2,
  },
  facilityName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    marginTop: 10,
  },
  message: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 15,
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#cc0000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FailureNotification;
