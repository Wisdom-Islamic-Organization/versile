import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import LoginScreen from './LoginScreen';

export default function Login() {
  console.log('Login route rendered');
  
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: "Login",
          headerShown: false,
        }}
      />
      <LoginScreen />
    </View>
  );
} 