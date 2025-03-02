import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme } from '../types';
import { saveToLocalStorage, getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../utils/localStorage';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from local storage
  useEffect(() => {
    const loadThemeFromStorage = async () => {
      try {
        // Get theme from local storage
        const localTheme = await getFromLocalStorage<Theme>(LOCAL_STORAGE_KEYS.THEME, 'light');
        if (localTheme) {
          setTheme(localTheme);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading theme from local storage:', error);
        setIsLoading(false);
      }
    };
    
    loadThemeFromStorage();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      // Save to local storage
      await saveToLocalStorage(LOCAL_STORAGE_KEYS.THEME, newTheme);
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