import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';
import { Platform } from 'react-native';
import { saveToLocalStorage, getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../utils/localStorage';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  playAsGuest: () => void;
  isGuest: boolean;
  isWeb: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const isWeb = Platform.OS === 'web';

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      console.log('Auth state changed:', fbUser?.uid, fbUser?.isAnonymous);
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        // User is signed in
        try {
          // Check if user exists in Firestore
          const userRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            // User exists, update state
            setUser({ id: userDoc.id, ...userDoc.data() } as User);
            // If this is a real user (not anonymous), they're not a guest
            if (!fbUser.isAnonymous) {
              setIsGuest(false);
              await saveToLocalStorage(LOCAL_STORAGE_KEYS.GUEST_MODE, false);
            }
          } else {
            // Create new user in Firestore
            const newUser: User = {
              id: fbUser.uid,
              username: fbUser.displayName || `player_${fbUser.uid.slice(0, 5)}`,
              email: fbUser.email || '',
              streak: 0,
              last_played: '',
              guessed_words: [],
              total_score: 0,
              current_week_score: 0,
              best_week_score: 0,
              longest_streak: 0,
              last_week_start: new Date().toISOString().split('T')[0]
            };
            
            await setDoc(userRef, newUser);
            setUser(newUser);
            // If this is a real user (not anonymous), they're not a guest
            if (!fbUser.isAnonymous) {
              setIsGuest(false);
              await saveToLocalStorage(LOCAL_STORAGE_KEYS.GUEST_MODE, false);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        // Check local storage for guest mode
        const localGuestMode = await getFromLocalStorage(LOCAL_STORAGE_KEYS.GUEST_MODE, false);
        if (localGuestMode) {
          setIsGuest(true);
          setUser(null);
        } else {
          setUser(null);
          setIsGuest(false);
        }
      }
      
      setIsLoading(false);
    });
    
    return unsubscribe;
  }, []);

  // Handle redirect result when user returns to the app after authentication
  useEffect(() => {
    const handleRedirectResult = async () => {
      if (!isWeb) return;
      
      try {
        // Check if we're in the middle of auth
        const authInProgress = await getFromLocalStorage(LOCAL_STORAGE_KEYS.AUTH_IN_PROGRESS, false);
        if (authInProgress) {
          console.log('AuthContext: Handling redirect result');
          // Clear the flag
          await saveToLocalStorage(LOCAL_STORAGE_KEYS.AUTH_IN_PROGRESS, false);
          
          // Get the redirect result
          // @ts-ignore
          const { getRedirectResult } = await import('firebase/auth');
          // @ts-ignore
          const result = await getRedirectResult(auth);
          
          if (result) {
            console.log('AuthContext: Redirect sign-in successful', result.user.uid);
            // Auth state change listener will handle the rest
          }
        }
      } catch (error) {
        console.error('AuthContext: Error handling redirect result:', error);
        // If redirect fails, fall back to guest mode
        await playAsGuest();
      }
    };
    
    if (!isLoading) {
      handleRedirectResult();
    }
  }, [isLoading, isWeb]);

  const signInWithGoogle = async () => {
    try {
      console.log('AuthContext: signInWithGoogle called');
      // Set loading state to true
      setIsLoading(true);
      
      // Save guest mode preference to localStorage only
      await saveToLocalStorage(LOCAL_STORAGE_KEYS.GUEST_MODE, false);
      setIsGuest(false);
      
      if (isWeb) {
        // For web, use Firebase's built-in Google authentication
        console.log('AuthContext: Web platform detected, setting up Google provider');
        const provider = new GoogleAuthProvider();
        
        try {
          // Use dynamic import to load the signInWithPopup function
          // @ts-ignore
          const { signInWithPopup, signInWithRedirect } = await import('firebase/auth');
          
          // Try popup first (better UX when it works)
          try {
            console.log('AuthContext: Using signInWithPopup');
            // @ts-ignore
            const result = await signInWithPopup(auth, provider);
            console.log('AuthContext: Sign in successful', result?.user?.uid);
            // Loading state will be set to false by the auth state change listener
          } catch (popupError: any) {
            console.warn('AuthContext: Popup failed, trying redirect', popupError);
            
            // If popup was blocked or failed, try redirect method instead
            if (popupError.code === 'auth/popup-blocked' || 
                popupError.code === 'auth/popup-closed-by-user' ||
                popupError.code === 'auth/cancelled-popup-request') {
              // Save that we're in the middle of auth so we can handle the redirect result
              await saveToLocalStorage(LOCAL_STORAGE_KEYS.AUTH_IN_PROGRESS, true);
              // @ts-ignore
              await signInWithRedirect(auth, provider);
              // Note: Loading state will remain true until redirect completes and auth state changes
            } else {
              // For other errors, fall back to guest mode
              console.error('AuthContext: Unhandled Google sign-in error:', popupError);
              await playAsGuest();
              // Loading state will be set to false by the auth state change listener
            }
          }
        } catch (authError) {
          console.error('AuthContext: Error with Google sign-in:', authError);
          // Fallback to guest mode
          await playAsGuest();
          // Loading state will be set to false by the auth state change listener
        }
      } else {
        // For mobile, automatically use guest mode
        console.log('AuthContext: Mobile platform detected, using guest mode');
        await playAsGuest();
        // Loading state will be set to false by the auth state change listener
      }
    } catch (error) {
      console.error('AuthContext: Google sign in error:', error);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Save guest mode preference to localStorage only
      await saveToLocalStorage(LOCAL_STORAGE_KEYS.GUEST_MODE, false);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const playAsGuest = async () => {
    try {
      // Set loading state to true
      setIsLoading(true);
      
      // Save guest mode preference to localStorage only
      await saveToLocalStorage(LOCAL_STORAGE_KEYS.GUEST_MODE, true);
      setIsGuest(true);
      
      // Sign in anonymously to Firebase
      await signInAnonymously(auth);
      // Loading state will be set to false by the auth state change listener
      
    } catch (error) {
      console.error('Play as guest error:', error);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isAuthenticated: !!user && !isGuest,
      isLoading,
      signInWithGoogle,
      signOut,
      playAsGuest,
      isGuest,
      isWeb
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 