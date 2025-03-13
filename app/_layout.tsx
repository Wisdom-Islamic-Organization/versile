import { Stack, router, useRootNavigationState, Redirect, Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { LogBox, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useColors from './hooks/useColors';
import { ThemeProvider } from './context/ThemeContext';
import useTheme from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import InitialLoadingScreen from './components/InitialLoadingScreen';
import ProfileButton from './components/ProfileButton';
import ThemeToggle from './components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Route "./types/index.ts" is missing the required default export',
  'props.pointerEvents is deprecated'
]);

const Tabs = createBottomTabNavigator();

export default function Layout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time or wait for actual resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show splash screen for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <InitialLoadingScreen />;
  }
  
  return (
    <AuthProvider>
      <ThemeProvider>
        <LayoutContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

function LayoutContent() {
  const colors = useColors();
  const { theme } = useTheme();
  const { user, isLoading, isAuthenticated, isGuest } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const [appReady, setAppReady] = useState(false);
  
  // Add console logs to debug the state
  console.log('Auth state:', { isAuthenticated, isGuest, isLoading });
  console.log('Navigation state ready:', !!rootNavigationState?.key);
  
  // Use useEffect for navigation to ensure it happens after render
  useEffect(() => {
    if (rootNavigationState?.key && !isLoading && !isAuthenticated && !isGuest) {
      console.log('Redirecting to login screen');
      // Add a small delay to ensure navigation is ready
      const timer = setTimeout(() => {
        router.replace('/screens/login');
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [rootNavigationState?.key, isAuthenticated, isGuest, isLoading]);
  
  useEffect(() => {
    const initializeApp = async () => {
      setAppReady(true);
    };
    
    initializeApp();
  }, [user, isGuest]);
  
  if (isLoading || !appReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6AAA64" />
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.header.background[theme],
          },
          headerTintColor: colors.header.text[theme],
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          contentStyle: {
            backgroundColor: colors.background[theme],
          },
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ThemeToggle />
              <ProfileButton />
            </View>
          ),
          headerTitle: '',
        }}
      >
        <Stack.Screen
          name="previous-week"
          options={{
            headerTitle: "Previous Week's Top 3",
            headerShown: true,
          }}
        />
        
        <Tabs.Screen
          name="game"
          options={{
            title: 'Game',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="game-controller" size={size} color={color} />
            ),
          }}
        >
          {() => <Slot />}
        </Tabs.Screen>
        
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" size={size} color={color} />
            ),
          }}
        >
          {() => <Slot />}
        </Tabs.Screen>
      </Stack>
    </SafeAreaProvider>
  );
}
