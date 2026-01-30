/**
 * Sign-in screen: user chooses role before entering the map.
 * - Control Center: full program (admin panel, all failures, Alert Team / Actions).
 * - Khartoum Response Team: map with Khartoum-only failures, Issue Resolved only, command popups.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { ACCENT_BLUE, ACCENT_BLUE_LIGHT, transitionStyle } from '../theme';
import { setStoredUserRole } from '../utils/auth_storage';

const ROLE_OPTIONS = [
  { value: 'control_center', label: 'Control Center' },
  { value: 'khartoum_response_team', label: 'Khartoum Response Team' },
];

// Gradient inside the rectangle: top light blue → middle blend → bottom white
const CARD_GRADIENT_COLORS = [ACCENT_BLUE_LIGHT, '#e8f4fc', '#f5f9ff', '#ffffff'];

// Background gradient: same direction as card, a little darker so the card stands out
const BACKGROUND_GRADIENT_COLORS = ['#d8eaf8', '#e0eefb', '#e8f2fc', '#eef6fd'];

// Gradient for "VoltEdge" title: same family as card, slightly darker so text is visible
const TITLE_GRADIENT_COLORS = ['#6a9ed0', '#7eb4e0', '#8ec4e8'];

// Use the same family names as loaded in App.js via @expo-google-fonts/onest
const FONT_TITLE = 'Onest_700Bold';
const FONT_BODY = 'Onest_400Regular';
const FONT_BUTTON = 'Onest_600SemiBold';

const SignInScreen = () => {
  const navigation = useNavigation();
  const [selectedRole, setSelectedRole] = useState('control_center');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignIn = async () => {
    await setStoredUserRole(selectedRole);
    navigation.replace('Map', { userRole: selectedRole });
  };

  const selectedLabel = ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label ?? ROLE_OPTIONS[0].label;

  return (
    <LinearGradient
      colors={BACKGROUND_GRADIENT_COLORS}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      <View style={styles.cardWrapper}>
        <LinearGradient
          colors={CARD_GRADIENT_COLORS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.cardGradient}
        >
          {Platform.OS === 'web' ? (
            <Text style={[styles.title, styles.titleGradientWeb]}>VoltEdge</Text>
          ) : (
            <MaskedView
              maskElement={<Text style={styles.titleMask}>VoltEdge</Text>}
              style={styles.titleMaskWrapper}
            >
              <LinearGradient
                colors={TITLE_GRADIENT_COLORS}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.titleGradientFill}
              />
            </MaskedView>
          )}
          <Text style={styles.subtitle}>Choose your role to continue</Text>
          <View style={styles.buttonGroup}>
            <View style={styles.dropdownWrapper}>
              <Pressable
                style={({ pressed }) => [
                  styles.dropdownTrigger,
                  transitionStyle,
                  pressed && styles.roleButtonPressed,
                  dropdownOpen && styles.dropdownTriggerOpen,
                ]}
                onPress={() => setDropdownOpen((open) => !open)}
              >
                <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                  {selectedLabel}
                </Text>
                <Text style={styles.dropdownChevron}>{dropdownOpen ? '▲' : '▼'}</Text>
              </Pressable>
              {dropdownOpen && (
                <View style={styles.dropdownList} pointerEvents="box-none">
                  <View style={styles.dropdownListInner}>
                    {ROLE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={({ pressed }) => [
                          styles.dropdownOption,
                          transitionStyle,
                          pressed && styles.roleButtonPressed,
                          selectedRole === opt.value && styles.dropdownOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedRole(opt.value);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            selectedRole === opt.value && styles.dropdownOptionTextSelected,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.signInButton,
                transitionStyle,
                pressed && styles.signInButtonPressed,
              ]}
              onPress={handleSignIn}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'visible',
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
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  titleGradientWeb: {
    backgroundImage: 'linear-gradient(135deg, #6a9ed0 0%, #7eb4e0 50%, #8ec4e8 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  titleMaskWrapper: {
    alignSelf: 'center',
    marginBottom: 6,
  },
  titleMask: {
    fontFamily: FONT_TITLE,
    fontSize: 36,
    letterSpacing: -0.5,
    backgroundColor: 'transparent',
    color: 'white',
  },
  titleGradientFill: {
    width: '100%',
    height: 44,
    minWidth: 180,
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
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
    minHeight: 52,
  },
  dropdownTriggerOpen: {
    borderColor: ACCENT_BLUE,
  },
  dropdownWrapper: {
    position: 'relative',
    width: '100%',
    marginBottom: 12,
    zIndex: 10,
  },
  dropdownTriggerText: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  dropdownChevron: {
    fontFamily: FONT_BODY,
    fontSize: 10,
    color: '#6b7280',
    marginLeft: 8,
  },
  dropdownList: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 0,
    zIndex: 20,
    elevation: 20,
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
      default: {},
    }),
  },
  dropdownListInner: {
    width: '100%',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: ACCENT_BLUE,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  dropdownOptionSelected: {
    backgroundColor: ACCENT_BLUE_LIGHT,
  },
  dropdownOptionText: {
    fontFamily: FONT_BODY,
    fontSize: 16,
    color: '#1a1a1a',
  },
  dropdownOptionTextSelected: {
    fontFamily: FONT_BUTTON,
    color: ACCENT_BLUE,
  },
  roleButtonPressed: {
    opacity: 0.92,
  },
  signInButton: {
    backgroundColor: '#6ea8dc',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  signInButtonPressed: {
    opacity: 0.92,
  },
  signInButtonText: {
    fontFamily: FONT_BUTTON,
    fontSize: 16,
    color: '#ffffff',
  },
});

export default SignInScreen;
