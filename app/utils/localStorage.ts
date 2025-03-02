import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const LOCAL_STORAGE_KEYS = {
  THEME: 'quranic_wordle_theme',
  INTRO_SHOWN: 'quranic_wordle_intro_shown',
  LAST_PLAYED_DATE: 'quranic_wordle_last_played_date',
  GUEST_MODE: 'quranic_wordle_guest_mode',
  AUTH_IN_PROGRESS: 'quranic_wordle_auth_in_progress'
};

/**
 * Save a value to local storage
 * @param key Storage key
 * @param value Value to store
 */
export const saveToLocalStorage = async (key: string, value: any): Promise<void> => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  } catch (error) {
    console.error(`Error saving to local storage (${key}):`, error);
  }
};

/**
 * Get a value from local storage
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns The stored value or defaultValue if not found
 */
export const getFromLocalStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return defaultValue;
    
    // Try to parse as JSON if it's not a string type
    if (typeof defaultValue !== 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    }
    
    return value as unknown as T;
  } catch (error) {
    console.error(`Error getting from local storage (${key}):`, error);
    return defaultValue;
  }
};

/**
 * Remove a value from local storage
 * @param key Storage key
 */
export const removeFromLocalStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from local storage (${key}):`, error);
  }
};

/**
 * Clear all app-related data from local storage
 * This will only clear keys that start with 'quranic_wordle_'
 */
export const clearAppLocalStorage = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith('quranic_wordle_'));
    await AsyncStorage.multiRemove(appKeys);
  } catch (error) {
    console.error('Error clearing app local storage:', error);
  }
}; 