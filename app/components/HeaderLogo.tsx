import React from 'react';
import { TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { router } from 'expo-router';

const HeaderLogo = () => {
  const handleLogoPress = () => {
    // Show the intro screen when logo is clicked
    router.push('/screens/IntroScreen');
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handleLogoPress}>
      <Image 
        source={require('../../assets/images/headerLogo.png')}
        style={styles.image}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: Platform.OS !== 'ios' ? 180 : 90,
    height: Platform.OS !== 'ios' ? 90 : 45,
    resizeMode: 'contain',
  },
});

export default HeaderLogo; 