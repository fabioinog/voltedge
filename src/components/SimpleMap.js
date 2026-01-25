/**
 * Simple Map Component - Fallback that always renders something
 * This ensures the screen is never blank
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SimpleMap = ({ facilities = [] }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sudan Map</Text>
        <Text style={styles.subtitle}>
          {facilities.length} facilities loaded
        </Text>
        <Text style={styles.hint}>
          Map will appear here once Leaflet is installed
        </Text>
        <Text style={styles.installHint}>
          Run: npm install leaflet react-leaflet
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 8,
  },
  installHint: {
    fontSize: 12,
    color: '#0066cc',
    fontFamily: 'monospace',
    marginTop: 8,
  },
});

export default SimpleMap;
