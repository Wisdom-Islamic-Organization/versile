import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LeaderboardScreen from './screens/LeaderboardScreen';
import useTheme from './context/ThemeContext';
import useColors from './hooks/useColors';
import HeaderLogo from './components/HeaderLogo';

export default function Leaderboard() {
  const { theme, toggleTheme } = useTheme();
  const colors = useColors();

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: "Leaderboard",
          headerTitle: () => <HeaderLogo />,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.header.background[theme],
          },
          headerTintColor: colors.header.text[theme],
          headerRight: () => (
            <TouchableOpacity onPress={toggleTheme} style={{ marginRight: 10 }}>
              <Ionicons 
                name={theme === 'light' ? 'moon' : 'sunny'} 
                size={24} 
                color={colors.header.text[theme]} 
              />
            </TouchableOpacity>
          ),
        }}
      />
      <LeaderboardScreen />
    </View>
  );
} 