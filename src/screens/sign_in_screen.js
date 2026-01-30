/**
 * Sign-in screen: user chooses role before entering the map.
 * - Control Center: full program (admin panel, all failures, Alert Team / Actions).
 * - Khartoum Response Team: map with Khartoum-only failures, Issue Resolved only, command popups.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ACCENT_BLUE, transitionStyle } from '../theme';
import { setStoredUserRole } from '../utils/auth_storage';

const ROLES = {
  control_center: 'Control Center',
  khartoum_response_team: 'Khartoum Response Team',
};

const SignInScreen = () => {
  const navigation = useNavigation();

  const handleSelectRole = async (userRole) => {
    await setStoredUserRole(userRole);
    navigation.replace('Map', { userRole });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VoltEdge</Text>
        <Text style={styles.subtitle}>Choose your role to continue</Text>
      </View>
      <View style={styles.buttonGroup}>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            transitionStyle,
            pressed && styles.roleButtonPressed,
          ]}
          onPress={() => handleSelectRole('control_center')}
        >
          <Text style={styles.roleButtonText}>{ROLES.control_center}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            transitionStyle,
            pressed && styles.roleButtonPressed,
          ]}
          onPress={() => handleSelectRole('khartoum_response_team')}
        >
          <Text style={styles.roleButtonText}>{ROLES.khartoum_response_team}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 340,
  },
  roleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  roleButtonPressed: {
    opacity: 0.92,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: ACCENT_BLUE,
  },
});

export default SignInScreen;
