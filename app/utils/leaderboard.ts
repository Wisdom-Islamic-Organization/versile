import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { GameSession, LeaderboardEntry, User, WeeklyScore } from '../types';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';

// Constants for scoring
const BASE_SCORE = 100;
const MAX_ATTEMPTS = 6;
const ATTEMPT_BONUS = 20; // Points per unused attempt
const STREAK_BONUS_MULTIPLIER = 0.1; // 10% bonus per day in streak

/**
 * Calculate score for a game session
 * @param attempts Number of attempts used
 * @param success Whether the game was successful
 * @param currentStreak Current streak of the user
 * @returns Score for the game
 */
export function calculateGameScore(attempts: number, success: boolean, currentStreak: number): number {
  if (!success) return 0;
  
  // Base score for completing the challenge
  let score = BASE_SCORE;
  
  // Bonus for completing in fewer attempts
  const unusedAttempts = MAX_ATTEMPTS - attempts;
  score += unusedAttempts * ATTEMPT_BONUS;
  
  // Bonus for streak
  const streakBonus = Math.floor(score * (currentStreak * STREAK_BONUS_MULTIPLIER));
  score += streakBonus;
  
  console.log('Score calculation:', { 
    base: BASE_SCORE, 
    attemptBonus: unusedAttempts * ATTEMPT_BONUS, 
    streakBonus, 
    totalScore: score,
    attempts,
    unusedAttempts,
    currentStreak
  });
  
  return score;
}

// Helper function to get date in IST (GMT+5:30) format
export function getFormattedDate(date: Date): string {
  // Convert to IST (GMT+5:30)
  const istTime = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
  return `${istTime.getUTCFullYear()}-${String(istTime.getUTCMonth() + 1).padStart(2, '0')}-${String(istTime.getUTCDate()).padStart(2, '0')}`;
}

/**
 * Get the current week's start and end dates
 * @returns Object with week_start and week_end as ISO date strings
 */
export function getCurrentWeekDates(): { week_start: string, week_end: string } {
  const now = new Date();
  // Convert to IST (GMT+5:30)
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Use getDay() instead of getUTCDay() since we've already adjusted for IST
  const dayOfWeek = istTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Calculate the start of the week (Monday)
  const startOfWeek = new Date(istTime);
  // If today is Sunday (0), go back 6 days to previous Monday
  // Otherwise subtract (dayOfWeek - 1) to get to Monday
  startOfWeek.setDate(istTime.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Calculate the end of the week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    week_start: getFormattedDate(startOfWeek),
    week_end: getFormattedDate(endOfWeek)
  };
}

/**
 * Update a user's weekly score
 * @param userId User ID
 * @param score Score to add
 * @param gameWon Whether the game was won
 * @param currentStreak Current streak of the user
 * @param isGuest Whether the user is a guest
 */
export async function updateWeeklyScore(
  userId: string, 
  score: number, 
  gameWon: boolean, 
  currentStreak: number,
  isGuest: boolean = false
): Promise<void> {
  try {
    console.log('Starting updateWeeklyScore:', { userId, score, gameWon, currentStreak, isGuest });
    
    const { week_start, week_end } = getCurrentWeekDates();
    console.log('Week dates:', { week_start, week_end });
    
    const collectionName = isGuest ? 'guest_weekly_scores' : 'weekly_scores';
    const weeklyScoreId = `${userId}_${week_start}`;
    console.log('Weekly score document ID:', weeklyScoreId);
    
    const weeklyScoreRef = doc(db, collectionName, weeklyScoreId);
    const weeklyScoreDoc = await getDoc(weeklyScoreRef);
    
    if (weeklyScoreDoc.exists()) {
      // Update existing weekly score
      const existingData = weeklyScoreDoc.data() as WeeklyScore;
      console.log('Found existing weekly score:', existingData);
      
      const updatedData: Partial<WeeklyScore> = {
        score: existingData.score + score,
        games_played: existingData.games_played + 1,
        games_won: existingData.games_won + (gameWon ? 1 : 0),
        best_streak: Math.max(existingData.best_streak, currentStreak)
      };
      
      console.log('Updating weekly score with:', updatedData);
      await updateDoc(weeklyScoreRef, updatedData);
      console.log('Weekly score updated successfully');
    } else {
      // Create new weekly score
      const newWeeklyScore: WeeklyScore = {
        user_id: userId,
        week_start,
        week_end,
        score,
        games_played: 1,
        games_won: gameWon ? 1 : 0,
        best_streak: currentStreak
      };
      
      console.log('Creating new weekly score:', newWeeklyScore);
      await setDoc(weeklyScoreRef, newWeeklyScore);
      console.log('New weekly score created successfully');
    }
    
    // Update user's total and weekly scores
    await updateUserScores(userId, score, currentStreak, isGuest);
  } catch (error) {
    console.error('Error updating weekly score:', error);
    throw error; // Re-throw to ensure errors are properly handled
  }
}

/**
 * Update a user's score fields
 * @param userId User ID
 * @param scoreToAdd Score to add to the user's total and weekly scores
 * @param currentStreak Current streak of the user
 * @param isGuest Whether the user is a guest
 */
async function updateUserScores(
  userId: string, 
  scoreToAdd: number, 
  currentStreak: number,
  isGuest: boolean = false
): Promise<void> {
  try {
    console.log('Updating user scores:', { userId, scoreToAdd, currentStreak, isGuest });
    
    const collectionName = isGuest ? 'guests' : 'users';
    const userRef = doc(db, collectionName, userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      console.log('Current user data:', { 
        total_score: userData.total_score, 
        current_week_score: userData.current_week_score,
        longest_streak: userData.longest_streak,
        last_week_start: userData.last_week_start
      });
      
      const updates: Partial<User> = {
        total_score: (userData.total_score || 0) + scoreToAdd,
        current_week_score: (userData.current_week_score || 0) + scoreToAdd,
        longest_streak: Math.max(userData.longest_streak || 0, currentStreak)
      };
      
      // If this is a new week, reset the weekly score
      const { week_start } = getCurrentWeekDates();
      const lastWeekStart = userData.last_week_start;
      
      if (lastWeekStart !== week_start) {
        updates.last_week_start = week_start;
        updates.best_week_score = Math.max(userData.best_week_score || 0, userData.current_week_score || 0);
        updates.current_week_score = scoreToAdd; // Reset to current score
      }
      
      console.log('Updating user with:', updates);
      await updateDoc(userRef, updates);
      console.log('User scores updated successfully');
    } else {
      console.log('User document does not exist');
    }
  } catch (error) {
    console.error('Error updating user scores:', error);
  }
}

/**
 * Get the current week's leaderboard
 * @param limit Maximum number of entries to return
 * @param includeGuests Whether to include guest users
 * @returns Array of leaderboard entries
 */
export async function getWeeklyLeaderboard(
  maxEntries: number = 10,
  includeGuests: boolean = false
): Promise<LeaderboardEntry[]> {
  try {
    const { week_start } = getCurrentWeekDates();
    console.log('Fetching leaderboard for week starting:', week_start);
    let leaderboard: LeaderboardEntry[] = [];
    
    // Get regular users' scores with proper query
    const weeklyScoresRef = collection(db, 'weekly_scores');
    const weeklyScoresQuery = query(
      weeklyScoresRef,
      where('week_start', '==', week_start),
      orderBy('score', 'desc'),
      limit(maxEntries)
    );
    
    const weeklyScoresSnapshot = await getDocs(weeklyScoresQuery);
    console.log('Found regular user scores:', weeklyScoresSnapshot.size);
    
    // Batch get all user documents for efficiency
    const userRefs = weeklyScoresSnapshot.docs.map(scoreDoc => {
      const data = scoreDoc.data() as WeeklyScore;
      return doc(db, 'users', data.user_id);
    });
    
    if (userRefs.length > 0) {
      const userDocs = await Promise.all(userRefs.map(ref => getDoc(ref)));
      
      // Process regular users
      weeklyScoresSnapshot.docs.forEach((scoreDoc, index) => {
        const weeklyScore = scoreDoc.data() as WeeklyScore;
        const userDoc = userDocs[index];
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          leaderboard.push({
            user_id: weeklyScore.user_id,
            username: userData.username || `User ${weeklyScore.user_id.substring(0, 4)}`,
            score: weeklyScore.score,
            rank: index + 1,
            games_played: weeklyScore.games_played,
            games_won: weeklyScore.games_won,
            best_streak: weeklyScore.best_streak
          });
        }
      });
    }
    
    // Include guest users if requested
    if (includeGuests) {
      const guestScoresRef = collection(db, 'guest_weekly_scores');
      const guestScoresQuery = query(
        guestScoresRef,
        where('week_start', '==', week_start),
        orderBy('score', 'desc'),
        limit(maxEntries)
      );
      
      const guestScoresSnapshot = await getDocs(guestScoresQuery);
      console.log('Found guest scores:', guestScoresSnapshot.size);
      
      // Add guest scores directly since we don't need extra user data
      const guestScores = guestScoresSnapshot.docs.map((doc, index) => {
        const weeklyScore = doc.data() as WeeklyScore;
        return {
          user_id: weeklyScore.user_id,
          username: `Guest ${weeklyScore.user_id.substring(0, 4)}`,
          score: weeklyScore.score,
          rank: index + 1,
          games_played: weeklyScore.games_played,
          games_won: weeklyScore.games_won,
          best_streak: weeklyScore.best_streak
        };
      });
      
      // Combine and sort all scores
      leaderboard = [...leaderboard, ...guestScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, maxEntries);
      
      // Reassign ranks after combining
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }
    
    console.log('Final leaderboard entries:', leaderboard.length);
    return leaderboard;
  } catch (error) {
    console.error('Error getting weekly leaderboard:', error);
    throw error;
  }
}

/**
 * Get a user's position on the leaderboard
 * @param userId User ID
 * @param isGuest Whether the user is a guest
 * @returns User's leaderboard entry, or null if not found
 */
export async function getUserLeaderboardPosition(
  userId: string,
  isGuest: boolean = false
): Promise<LeaderboardEntry | null> {
  try {
    const { week_start } = getCurrentWeekDates();
    const collectionName = isGuest ? 'guest_weekly_scores' : 'weekly_scores';
    
    // Get all scores for the current week to determine rank
    const scoresRef = collection(db, collectionName);
    const scoresQuery = query(
      scoresRef,
      where('week_start', '==', week_start),
      orderBy('score', 'desc')
    );
    
    const scoresSnapshot = await getDocs(scoresQuery);
    const userScoreDoc = scoresSnapshot.docs.find(doc => {
      const data = doc.data() as WeeklyScore;
      return data.user_id === userId;
    });
    
    if (!userScoreDoc) {
      return null;
    }
    
    const weeklyScore = userScoreDoc.data() as WeeklyScore;
    const rank = scoresSnapshot.docs.findIndex(doc => doc.id === userScoreDoc.id) + 1;
    
    if (isGuest) {
      return {
        user_id: userId,
        username: `Guest ${userId.substring(0, 4)}`,
        score: weeklyScore.score,
        rank,
        games_played: weeklyScore.games_played,
        games_won: weeklyScore.games_won,
        best_streak: weeklyScore.best_streak
      };
    }
    
    // Get user data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data() as User;
    
    return {
      user_id: userId,
      username: userData.username || `User ${userId.substring(0, 4)}`,
      score: weeklyScore.score,
      rank,
      games_played: weeklyScore.games_played,
      games_won: weeklyScore.games_won,
      best_streak: weeklyScore.best_streak
    };
  } catch (error) {
    console.error('Error getting user leaderboard position:', error);
    return null;
  }
} 