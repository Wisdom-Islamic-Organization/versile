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
import { saveUserPreference, getUserPreference, STORAGE_KEYS } from '../utils/firestore';

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
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        // User is signed out
        // Check if guest mode was previously enabled
        const guestMode = await getUserPreference('anonymous', 'guest_mode', false);
        if (guestMode === 'true') {
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

  const signInWithGoogle = async () => {
    try {
      console.log('AuthContext: signInWithGoogle called');
      await saveUserPreference('anonymous', 'guest_mode', 'false', false);
      setIsGuest(false);
      
      if (isWeb) {
        // For web, use Firebase's built-in Google authentication
        console.log('AuthContext: Web platform detected, setting up Google provider');
        const provider = new GoogleAuthProvider();
        
        try {
          // Use @ts-ignore to bypass TypeScript errors
          // This is a workaround for the type error in Firebase v10
          // @ts-ignore
          const { signInWithPopup } = await import('firebase/auth');
          console.log('AuthContext: Using signInWithPopup');
          // @ts-ignore
          const result = await signInWithPopup(auth, provider);
          console.log('AuthContext: Sign in successful', result?.user?.uid);
        } catch (authError) {
          console.error('AuthContext: Error with Google sign-in:', authError);
          // Fallback to guest mode
          await playAsGuest();
        }
      } else {
        // For mobile, automatically use guest mode
        console.log('AuthContext: Mobile platform detected, using guest mode');
        await playAsGuest();
      }
    } catch (error) {
      console.error('AuthContext: Google sign in error:', error);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await saveUserPreference('anonymous', 'guest_mode', 'false', false);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const playAsGuest = async () => {
    try {
      await saveUserPreference('anonymous', 'guest_mode', 'true', false);
      setIsGuest(true);
      
      // Sign in anonymously to Firebase
      await signInAnonymously(auth);
      
    } catch (error) {
      console.error('Play as guest error:', error);
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