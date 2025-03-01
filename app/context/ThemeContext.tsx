import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../types';
import { useAuth } from './AuthContext';
import { getUserPreference, saveUserPreference, STORAGE_KEYS } from '../utils/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'quranic_wordle_theme';
const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const { user, isGuest, isLoading: authLoading } = useAuth();

  // Load theme from AsyncStorage first, then try Firestore when auth is ready
  useEffect(() => {
    const loadThemeFromStorage = async () => {
      try {
        // First try to get theme from AsyncStorage for immediate UI
        const localTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (localTheme) {
          setTheme(localTheme as Theme);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading theme from AsyncStorage:', error);
        setIsLoading(false);
      }
    };
    
    loadThemeFromStorage();
  }, []);

  // When auth is ready, try to load theme from Firestore
  useEffect(() => {
    const loadThemeFromFirestore = async () => {
      if (authLoading) return; // Wait for auth to be ready
      
      try {
        // Only try to load from Firestore if we have a user or we're using anonymous
        const userId = user?.id || 'anonymous';
        const savedTheme = await getUserPreference(userId, STORAGE_KEYS.THEME, isGuest);
        
        if (savedTheme) {
          setTheme(savedTheme as Theme);
          // Also update AsyncStorage for faster loading next time
          await AsyncStorage.setItem(THEME_STORAGE_KEY, savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme from Firestore:', error);
        // If Firestore fails, we already have a theme from AsyncStorage or default
      }
    };
    
    loadThemeFromFirestore();
  }, [user, isGuest, authLoading]);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      // Always save to AsyncStorage for immediate access next time
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      
      // Only try to save to Firestore if auth is ready
      if (!authLoading) {
        const userId = user?.id || 'anonymous';
        await saveUserPreference(userId, STORAGE_KEYS.THEME, newTheme, isGuest);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default function useTheme() {
  return useContext(ThemeContext);
}