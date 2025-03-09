import { doc, getDoc } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { GameSession, User } from '../types';
import {
  createOrUpdateGuestData,
  saveGameSession,
  updateUserData
} from '../utils/firestore';
import { calculateGameScore, getCurrentWeekDates, getFormattedDate, updateWeeklyScore } from '../utils/leaderboard';

export default function useUserProgress() {
  const [loading, setLoading] = useState(true);
  const { user, isGuest } = useAuth();
  
  const initializeGuestUser = async () => {
    try {
      // Get stored guest ID from auth context
      // The guest ID is now managed by the auth context
      if (isGuest) {
        return user?.id || '';
      }
      return '';
    } catch (error) {
      console.error('Error initializing guest user:', error);
      return '';
    }
  };

  const updateUserProgress = async (wordId: string, attempts: number, success: boolean) => {
    try {
      // Get today's date in consistent format
      const today = getFormattedDate(new Date());
      
      // Calculate new streak first
      let newStreak = 0;
      const lastPlayed = user?.last_played;
      if (success && lastPlayed) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = getFormattedDate(yesterday);
        
        if (lastPlayed === yesterdayString) {
          // If last played was yesterday, increment streak
          newStreak = (user?.streak || 0) + 1;
        } else {
          // Check if last played was today
          const todayString = getFormattedDate(new Date());
          
          if (lastPlayed === todayString) {
            // If already played today, maintain current streak
            newStreak = user?.streak || 0;
          } else {
            // If there was a gap, reset streak to 1
            newStreak = 1;
          }
        }
      } else if (success) {
        // First time playing or no last played date
        newStreak = 1;
      } else {
        // Failed challenge
        newStreak = 0;
      }
      
      // Calculate score with new streak
      const score = calculateGameScore(attempts, success, newStreak);
      
      if (user && !isGuest) {
        // Authenticated user - save progress to Firestore
        
        // Create game session
        const sessionData: GameSession = {
          user_id: user.id,
          date: today,
          word: wordId,
          attempts,
          success,
          score
        };
        await saveGameSession(user.id, sessionData, false);

        // Update user progress
        const updates: Partial<User> = {
          last_played: today
        };

        if (success) {
          updates.guessed_words = [...user.guessed_words, wordId];
          updates.streak = newStreak;
          
          // Add score fields to updates
          updates.total_score = (user.total_score || 0) + score;
          updates.current_week_score = (user.current_week_score || 0) + score;
          updates.longest_streak = Math.max(user.longest_streak || 0, newStreak);
          
          // Check if this is a new week
          const { week_start } = getCurrentWeekDates();
          if (user.last_week_start !== week_start) {
            updates.last_week_start = week_start;
            updates.best_week_score = Math.max(user.best_week_score || 0, user.current_week_score || 0);
            updates.current_week_score = score; // Reset to current score
          }
        } else {
          updates.streak = 0;
        }

        await updateUserData(user.id, updates);
        
        // Update weekly leaderboard
        await updateWeeklyScore(user.id, score, success, newStreak, false);
      } else if (isGuest && user) {
        // Guest user - save progress to Firestore's guests collection
        const guestId = user.id;
        
        // Get current guest progress
        const guestRef = doc(db, 'guests', guestId);
        const guestDoc = await getDoc(guestRef);
        
        let progress = {
          last_played: today,
          streak: newStreak, // Use the already calculated streak
          guessed_words: [] as string[],
          total_score: 0,
          current_week_score: 0,
          best_week_score: 0,
          longest_streak: 0,
          last_week_start: ''
        };
        
        if (guestDoc.exists()) {
          const guestData = guestDoc.data();
          progress = {
            ...progress,
            guessed_words: guestData.guessed_words || [],
            total_score: guestData.total_score || 0,
            current_week_score: guestData.current_week_score || 0,
            best_week_score: guestData.best_week_score || 0,
            longest_streak: guestData.longest_streak || 0,
            last_week_start: guestData.last_week_start || ''
          };
        }
        
        if (success) {
          progress.guessed_words = [...progress.guessed_words, wordId];
          progress.total_score += score;
          progress.current_week_score += score;
          progress.longest_streak = Math.max(progress.longest_streak, newStreak);
          
          // Check if this is a new week
          const { week_start } = getCurrentWeekDates();
          if (progress.last_week_start !== week_start) {
            progress.last_week_start = week_start;
            progress.best_week_score = Math.max(progress.best_week_score, progress.current_week_score);
            progress.current_week_score = score; // Reset to current score
          }
        }
        
        // Save game session
        const sessionData: GameSession = {
          user_id: guestId,
          date: today,
          word: wordId,
          attempts,
          success,
          score
        };
        await saveGameSession(guestId, sessionData, true);
        
        await createOrUpdateGuestData(guestId, progress);
        
        // Update weekly leaderboard
        await updateWeeklyScore(guestId, score, success, newStreak, true);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };

  return {
    user,
    loading,
    updateUserProgress,
    isGuest
  };
} 