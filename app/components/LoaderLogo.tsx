import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';

const DEVICE_WIDTH = Dimensions.get('window').width;

const LoaderLogo = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/icon.png')}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  image: {
    width: DEVICE_WIDTH < 500 ? DEVICE_WIDTH * 0.3 : 300,
    height: DEVICE_WIDTH < 500 ? DEVICE_WIDTH * 0.3 : 300,
    resizeMode: 'contain'
  }
});

export default LoaderLogo; 