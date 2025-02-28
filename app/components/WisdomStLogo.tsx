import React from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import useTheme from '../context/ThemeContext';

const WisdomStLogo = () => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <Image 
        source={theme === 'dark' 
          ? require('../../assets/images/ST-LOGO-WHITE.png')
          : require('../../assets/images/ST-LOGO-COLOUR.png')}
        style={styles.stLogo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stLogo: {
    width: Platform.OS !== 'ios' ? 120 : 60,
    height: Platform.OS !== 'ios' ? 120 : 60,
    resizeMode: 'contain',
  }
});

export default WisdomStLogo; 