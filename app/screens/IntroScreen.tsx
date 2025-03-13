import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Image, Dimensions } from 'react-native';
import { Link, router } from 'expo-router';
import LoaderLogo from '../components/LoaderLogo';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';

const IntroScreen = () => {
  const colors = useColors();
  const { theme } = useTheme();
  const DEVICE_WIDTH = Dimensions.get('window').width;
  
  const navigateToGame = () => {
    router.push('/game');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background[theme],
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    logoWrapper: {
      transform: [{ scale: Platform.OS === 'web' ? 1.5 : 1 }],
      marginBottom: 60,
    },
    button: {
      backgroundColor: colors.button.background[theme],
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 30,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonText: {
      color: colors.button.text[theme],
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    title: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.text[theme],
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.secondaryText[theme],
      textAlign: 'center',
      marginBottom: 40,
    },
    bannerContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    banner: {
      width: '100%',
      height: DEVICE_WIDTH < 500 ? 100 : 150,
      resizeMode: 'contain',
    },
    whatsappButton: {
      borderWidth: 1,
      borderColor: colors.button.background[theme],
      paddingVertical: 15,
      paddingHorizontal: 40,
      borderRadius: 30,
    },
    whatsappButtonText: {
      color: colors.button.background[theme === 'dark' ? 'light' : 'dark'],
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.bannerContainer}>
        <Image 
          source={require('../../assets/images/banner.png')}
          style={styles.banner}
        />
      </View>

      <View style={styles.logoWrapper}>
        <LoaderLogo />
      </View>
      
      <Text style={styles.title}>Versile</Text>
      <Text style={styles.subtitle}>Test your word skills in this exciting word game!</Text>

      <Link href="https://wa.me/1234567890" asChild>
        <Text style={styles.whatsappButtonText}>Contact Us Through WhatsApp</Text>
      </Link>
      
      <TouchableOpacity style={styles.button} onPress={navigateToGame}>
        <Text style={styles.buttonText}>Play Game</Text>
      </TouchableOpacity>
    </View>
  );
};

export default IntroScreen; 