import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import LoaderLogo from './LoaderLogo';

// Simple loading screen that doesn't depend on theme context
const LoadingScreen = () => {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF', // Use a default light background
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoWrapper: {
      transform: [{ scale: Platform.OS === 'web' ? 1.5 : 1 }],
      opacity: 0.8,
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.logoWrapper}>
        <LoaderLogo />
      </View>
    </View>
  );
};

export default LoadingScreen; 