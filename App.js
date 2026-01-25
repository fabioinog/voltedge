  /**
 * VoltEdge - Main Application Entry Point
 * Field-ready decision tool for water and electricity disruption response
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { initDatabase } from './src/db/database';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';

const Stack = createNativeStackNavigator();

/**
 * Main App Component
 * Initializes database and sets up navigation
 */
const App = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setInitError(error.message);
        setDbInitialized(true); // Still show app, but with error state
      }
    };

    initializeApp();
  }, []);

  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing VoltEdge...</Text>
      </View>
    );
  }

  if (initError) {
    const isWebDatabaseError = initError.includes('constructor') || initError.includes('NativeDatabase');
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Initialization Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
        {isWebDatabaseError ? (
          <>
            <Text style={styles.errorHint}>
              This is a web database loading issue. Try:
            </Text>
            <Text style={styles.errorSteps}>
              1. Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac){'\n'}
              2. Clear browser cache{'\n'}
              3. Restart server: npx expo start --web --clear
            </Text>
            <Text style={styles.errorHint}>
              See WEB_DATABASE_FIX.md for detailed instructions.
            </Text>
          </>
        ) : (
          <Text style={styles.errorHint}>
            Please restart the app. If the problem persists, clear app data.
          </Text>
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Map"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0066cc',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'VoltEdge',
          }}
        />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{
            title: 'Sudan Map',
            headerShown: false, // Hide header for full-screen map
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cc0000',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
  errorSteps: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'left',
    marginTop: 12,
    marginHorizontal: 24,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'monospace',
  },
});

export default App;
