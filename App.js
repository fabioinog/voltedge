import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Onest_400Regular,
  Onest_600SemiBold,
  Onest_700Bold,
} from '@expo-google-fonts/onest';
import { initDatabase } from './src/db/database';
import { getStoredUserRole } from './src/utils/auth_storage';
import HomeScreen from './src/screens/home_screen';
import MapScreen from './src/screens/map_screen';
import SignInScreen from './src/screens/sign_in_screen';
import ErrorBoundary from './src/components/error_boundary';

const Stack = createNativeStackNavigator();

const App = () => {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [storedRole, setStoredRole] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Onest_400Regular,
    Onest_600SemiBold,
    Onest_700Bold,
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Load Onest font once at app start so sign-in page doesn't flash (no FOUT)
      const existing = document.querySelector('link[href*="Onest"]');
      if (!existing) {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Onest:wght@400;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      document.title = 'VoltEdge';
      
      // Monitor and keep title as "VoltEdge" even if React Navigation changes it
      const observer = new MutationObserver(() => {
        if (document.title !== 'VoltEdge') {
          document.title = 'VoltEdge';
        }
      });
      
      observer.observe(document.querySelector('title') || document.head, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      
      // Also set it periodically as a fallback
      const interval = setInterval(() => {
        if (document.title !== 'VoltEdge') {
          document.title = 'VoltEdge';
        }
      }, 100);
      
      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Database initialization error:', error);
        if (Platform.OS === 'web') {
          setDbInitialized(true);
        } else {
          setInitError(error.message);
          setDbInitialized(true);
        }
      }
    };

    const timeout = setTimeout(() => {
      if (!dbInitialized) {
        setDbInitialized(true);
      }
    }, 1000);

    initializeApp();

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    getStoredUserRole().then((role) => {
      setStoredRole(role);
      setAuthChecked(true);
    });
  }, []);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing VoltEdge...</Text>
        <Text style={styles.loadingSubtext}>Loading fonts...</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing VoltEdge...</Text>
        <Text style={styles.loadingSubtext}>Setting up database...</Text>
      </View>
    );
  }

  if (!authChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Initializing VoltEdge...</Text>
        <Text style={styles.loadingSubtext}>Checking sign-in...</Text>
      </View>
    );
  }

  if (initError && Platform.OS !== 'web') {
    const isWebDatabaseError = initError.includes('constructor') || initError.includes('NativeDatabase');
    const isUnimplementedError = initError.includes('Unimplemented');
    
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
          </>
        ) : isUnimplementedError ? (
          <>
            <Text style={styles.errorHint}>
              Database module did not load correctly on this device.
            </Text>
            <Text style={styles.errorSteps}>
              1. Create a new build: eas build -p android --profile preview{'\n'}
              2. Uninstall the old APK, then install the new one
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
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
        initialRouteName={storedRole ? 'Map' : 'SignIn'}
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
          name="SignIn"
          component={SignInScreen}
          options={{
            headerShown: false,
          }}
        />
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
          initialParams={{ userRole: storedRole || 'control_center' }}
          options={{
            title: 'VoltEdge',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    minHeight: '100vh',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    minHeight: '100vh',
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
