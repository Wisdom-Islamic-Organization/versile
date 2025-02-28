import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';
import { router } from 'expo-router';

const LoginScreen = () => {
  const { signInWithGoogle, playAsGuest, isLoading, isWeb } = useAuth();
  const colors = useColors();
  const { theme } = useTheme();

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    router.replace('/');
  };

  const handlePlayAsGuest = async () => {
    await playAsGuest();
    router.replace('/');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background[theme] }]}>
        <Text style={[styles.loadingText, { color: colors.text[theme] }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background[theme] }]}>
      <View style={styles.bannerContainer}>
        <Image 
          source={require('../../assets/images/banner.png')}
          style={styles.banner}
        />
      </View>
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/headerLogo.png')}
          style={styles.logo}
        />
      </View>
      
      <Text style={[styles.title, { color: colors.text[theme] }]}>Welcome to Versile</Text>
      
      {isWeb ? (
        // Web version - show both Google sign-in and guest options
        <>
          <Text style={[styles.subtitle, { color: colors.secondaryText[theme] }]}>
            Sign in to save your progress and track your stats
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.googleButton, { backgroundColor: '#ffffff' }]}
              onPress={handleGoogleSignIn}
            >
              <Image 
                source={require('../../assets/images/google-logo.png')}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.guestButton, 
                { 
                  backgroundColor: colors.button.background[theme],
                  borderColor: colors.button.text[theme]
                }
              ]}
              onPress={handlePlayAsGuest}
            >
              <Text style={[styles.guestButtonText, { color: colors.button.text[theme] }]}>
                Play as Guest
              </Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // Mobile version - only show guest mode option
        <>
          <Text style={[styles.subtitle, { color: colors.secondaryText[theme] }]}>
            Play without signing in
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.guestButton, 
                { 
                  backgroundColor: colors.button.background[theme],
                  borderColor: colors.button.text[theme],
                  marginBottom: 0
                }
              ]}
              onPress={handlePlayAsGuest}
            >
              <Text style={[styles.guestButtonText, { color: colors.button.text[theme] }]}>
                Play as Guest
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      
      <Text style={[styles.disclaimer, { color: colors.secondaryText[theme] }]}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  banner: {
    width: '100%',
    height: 150,
    resizeMode: 'contain',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logo: {
    width: 200,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 30,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  guestButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 18,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default LoginScreen; 