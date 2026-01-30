/**
 * Sign-in screen: user chooses role before entering the map.
 * - Control Center: full program (admin panel, all failures, Alert Team / Actions).
 * - Khartoum Response Team: map with Khartoum-only failures, Issue Resolved only, command popups.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ACCENT_BLUE, ACCENT_BLUE_HOVER, transitionStyle } from '../theme';
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
      <Text style={styles.title}>VoltEdge</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      <View style={styles.buttonGroup}>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            transitionStyle,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => handleSelectRole('control_center')}
        >
          <Text style={styles.roleButtonText}>{ROLES.control_center}</Text>
          <Text style={styles.roleButtonHint}>Full map, admin panel, all features</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.roleButton,
            transitionStyle,
            { opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => handleSelectRole('khartoum_response_team')}
        >
          <Text style={styles.roleButtonText}>{ROLES.khartoum_response_team}</Text>
          <Text style={styles.roleButtonHint}>Khartoum failures only, issue resolution</Text>
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
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 360,
  },
  roleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: ACCENT_BLUE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  roleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: ACCENT_BLUE,
    marginBottom: 6,
  },
  roleButtonHint: {
    fontSize: 13,
    color: '#666666',
  },
});

export default SignInScreen;
