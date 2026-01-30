/**
 * Sign-in screen: user chooses role before entering the map.
 * - Control Center: full program (admin panel, all failures, Alert Team / Actions).
 * - Khartoum Response Team: map with Khartoum-only failures, Issue Resolved only, command popups.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCENT_BLUE, ACCENT_BLUE_LIGHT, transitionStyle } from '../theme';
import { setStoredUserRole } from '../utils/auth_storage';

const ROLES = {
  control_center: 'Control Center',
  khartoum_response_team: 'Khartoum Response Team',
};

// Gradient inside the rectangle: top light blue → middle blend → bottom white
const CARD_GRADIENT_COLORS = [ACCENT_BLUE_LIGHT, '#e8f4fc', '#f5f9ff', '#ffffff'];

// Use the same family names as loaded in App.js via @expo-google-fonts/onest
const FONT_TITLE = 'Onest_700Bold';
const FONT_BODY = 'Onest_400Regular';
const FONT_BUTTON = 'Onest_600SemiBold';

const SignInScreen = () => {
  const navigation = useNavigation();

  const handleSelectRole = async (userRole) => {
    await setStoredUserRole(userRole);
    navigation.replace('Map', { userRole });
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={CARD_GRADIENT_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.cardGradient}
        >
          <Text style={styles.title}>VoltEdge</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
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
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 20,
  },
  title: {
    fontFamily: FONT_TITLE,
    fontSize: 36,
    color: '#1a1a1a',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FONT_BODY,
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 28,
  },
  buttonGroup: {
    width: '100%',
  },
  roleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  roleButtonPressed: {
    opacity: 0.92,
  },
  roleButtonText: {
    fontFamily: FONT_BUTTON,
    fontSize: 16,
    color: ACCENT_BLUE,
  },
});

export default SignInScreen;
