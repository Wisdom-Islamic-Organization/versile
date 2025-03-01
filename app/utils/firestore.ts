import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, GameSession, GameState } from '../types';

// Storage keys (for consistent naming in Firestore)
export const STORAGE_KEYS = {
  GAME_STATE: 'game_state',
  LAST_PLAYED_DATE: 'last_played_date',
  INTRO_SHOWN: 'intro_shown',
  THEME: 'theme'
};

// User-related operations
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

export const updateUserData = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
  } catch (error) {
    console.error('Error updating user data:', error);
  }
};

// Guest user operations
export const getGuestData = async (guestId: string): Promise<any | null> => {
  try {
    const guestRef = doc(db, 'guests', guestId);
    const guestDoc = await getDoc(guestRef);
    
    if (guestDoc.exists()) {
      return { id: guestDoc.id, ...guestDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting guest data:', error);
    return null;
  }
};

export const createOrUpdateGuestData = async (guestId: string, data: any): Promise<void> => {
  try {
    const guestRef = doc(db, 'guests', guestId);
    const guestDoc = await getDoc(guestRef);
    
    if (guestDoc.exists()) {
      await updateDoc(guestRef, data);
    } else {
      await setDoc(guestRef, { id: guestId, ...data });
    }
  } catch (error) {
    console.error('Error creating/updating guest data:', error);
  }
};

// Game state operations
export const saveGameState = async (userId: string, gameState: GameState, isGuest: boolean = false): Promise<void> => {
  try {
    const collectionName = isGuest ? 'guests' : 'users';
    
    // Convert nested arrays to a Firestore-compatible format
    // Firestore doesn't support nested arrays, so we'll flatten the structure
    const firestoreGameState = {
      ...gameState,
      // Convert the nested array to an object with numeric keys
      guesses: gameState.guesses.reduce((acc, guessRow, rowIndex) => {
        return {
          ...acc,
          [rowIndex.toString()]: guessRow.map(guess => ({
            letter: guess.letter,
            status: guess.status
          }))
        };
      }, {})
    };
    
    // Store game state as a subcollection
    const gameStateRef = doc(db, `${collectionName}/${userId}/user_data`, STORAGE_KEYS.GAME_STATE);
    await setDoc(gameStateRef, firestoreGameState);
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

export const getGameState = async (userId: string, isGuest: boolean = false): Promise<GameState | null> => {
  try {
    const collectionName = isGuest ? 'guests' : 'users';
    const gameStateRef = doc(db, `${collectionName}/${userId}/user_data`, STORAGE_KEYS.GAME_STATE);
    const gameStateDoc = await getDoc(gameStateRef);
    
    if (gameStateDoc.exists()) {
      const firestoreData = gameStateDoc.data();
      
      // Convert the Firestore format back to the expected GameState format
      // Convert the object with numeric keys back to a nested array
      const guessesObj = firestoreData.guesses || {};
      const guessesArray: any[][] = [];
      
      // Get the keys (row indices) and sort them numerically
      const rowIndices = Object.keys(guessesObj).sort((a, b) => parseInt(a) - parseInt(b));
      
      // Reconstruct the nested array
      for (const rowIndex of rowIndices) {
        guessesArray.push(guessesObj[rowIndex]);
      }
      
      return {
        ...firestoreData,
        guesses: guessesArray
      } as GameState;
    }
    return null;
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
};

// User preferences operations
export const saveUserPreference = async (
  userId: string, 
  key: string, 
  value: any, 
  isGuest: boolean = false
): Promise<void> => {
  try {
    // Special handling for anonymous users
    if (userId === 'anonymous') {
      const prefsRef = doc(db, 'anonymous/preferences/user_data', 'preferences');
      const prefsDoc = await getDoc(prefsRef);
      
      if (prefsDoc.exists()) {
        await updateDoc(prefsRef, { [key]: value });
      } else {
        await setDoc(prefsRef, { [key]: value });
      }
      return;
    }
    
    // Regular users and guests
    const collectionName = isGuest ? 'guests' : 'users';
    const prefsRef = doc(db, `${collectionName}/${userId}/user_data`, 'preferences');
    const prefsDoc = await getDoc(prefsRef);
    
    if (prefsDoc.exists()) {
      await updateDoc(prefsRef, { [key]: value });
    } else {
      await setDoc(prefsRef, { [key]: value });
    }
  } catch (error) {
    console.error(`Error saving user preference (${key}):`, error);
  }
};

export const getUserPreference = async (
  userId: string, 
  key: string, 
  isGuest: boolean = false
): Promise<any | null> => {
  try {
    // Special handling for anonymous users
    if (userId === 'anonymous') {
      const prefsRef = doc(db, 'anonymous/preferences/user_data', 'preferences');
      const prefsDoc = await getDoc(prefsRef);
      
      if (prefsDoc.exists()) {
        const data = prefsDoc.data();
        return data[key] !== undefined ? data[key] : null;
      }
      return null;
    }
    
    // Regular users and guests
    const collectionName = isGuest ? 'guests' : 'users';
    const prefsRef = doc(db, `${collectionName}/${userId}/user_data`, 'preferences');
    const prefsDoc = await getDoc(prefsRef);
    
    if (prefsDoc.exists()) {
      const data = prefsDoc.data();
      return data[key] !== undefined ? data[key] : null;
    }
    return null;
  } catch (error) {
    console.error(`Error getting user preference (${key}):`, error);
    return null;
  }
};

// Game session operations
export const saveGameSession = async (
  userId: string, 
  sessionData: GameSession, 
  isGuest: boolean = false
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const collectionName = isGuest ? 'guest_sessions' : 'game_sessions';
    const sessionRef = doc(db, collectionName, `${userId}_${today}`);
    await setDoc(sessionRef, sessionData);
  } catch (error) {
    console.error('Error saving game session:', error);
  }
};

export const getGameSession = async (
  userId: string, 
  date: string, 
  isGuest: boolean = false
): Promise<GameSession | null> => {
  try {
    const collectionName = isGuest ? 'guest_sessions' : 'game_sessions';
    const sessionRef = doc(db, collectionName, `${userId}_${date}`);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      return sessionDoc.data() as GameSession;
    }
    return null;
  } catch (error) {
    console.error('Error getting game session:', error);
    return null;
  }
};

// Helper to check if user has played today
export const hasCompletedPlayingToday = async (
  userId: string, 
  isGuest: boolean = false
): Promise<boolean> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check game session first
    const collectionName = isGuest ? 'guest_sessions' : 'game_sessions';
    const sessionRef = doc(db, collectionName, `${userId}_${today}`);
    const sessionDoc = await getDoc(sessionRef);
    
    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data() as GameSession;
      return sessionData.success || false;
    }
    
    // Check user's last_played date
    if (!isGuest) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        return userData.last_played === today;
      }
    } else {
      const guestRef = doc(db, 'guests', userId);
      const guestDoc = await getDoc(guestRef);
      
      if (guestDoc.exists()) {
        const guestData = guestDoc.data();
        return guestData.last_played === today;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking completion status:', error);
    return false;
  }
}; 