/**
 * Language Toggle Component
 * Switches between English and Arabic
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLanguage } from '../contexts/language_context';

/**
 * Language Toggle Component
 */
const LanguageToggle = () => {
  let language, toggleLanguage, t;
  try {
    const langHook = useLanguage();
    language = langHook.language;
    toggleLanguage = langHook.toggleLanguage;
    t = langHook.t;
  } catch (error) {
    console.error('LanguageToggle error:', error);
    language = 'en';
    toggleLanguage = () => {};
    t = (key) => key;
  }

  return (
    <Pressable
      style={styles.container}
      onPress={toggleLanguage}
    >
      <View style={[styles.toggle, language === 'ar' && styles.toggleActive]}>
        <Text style={[styles.text, language === 'ar' && styles.textActive]}>
          {language === 'en' ? 'EN' : 'AR'}
        </Text>
      </View>
      <Text style={styles.label}>
        {language === 'en' ? 'English' : 'العربية'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  toggleActive: {
    backgroundColor: '#0066cc',
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  textActive: {
    color: '#ffffff',
  },
  label: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
});

export default LanguageToggle;
