import React from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import LoaderLogo from './LoaderLogo';

/**
 * A simple loading screen for the initial app load
 * This component doesn't depend on any contexts to avoid circular dependencies
 */
const InitialLoadingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <LoaderLogo />
      </View>
      <ActivityIndicator 
        size="large" 
        color="#6AAA64"
        style={styles.spinner} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    transform: [{ scale: Platform.OS === 'web' ? 1.5 : 1 }],
    opacity: 0.8,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 20,
  }
});

export default InitialLoadingScreen; 