import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HeaderLogo from '../components/HeaderLogo';
import IntroModal from '../components/IntroModal';
import Keyboard from '../components/Keyboard';
import PuzzleGrid from '../components/PuzzleGrid';
import UserStats from '../components/UserStats';
import WisdomStLogo from '../components/WisdomStLogo';
import { db } from '../config/firebase';
import { STORAGE_KEYS } from '../constants/storage';
import useTheme from '../context/ThemeContext';
import useColors from '../hooks/useColors';
import useUserProgress from '../hooks/useUserProgress';
import { GameSession, GuessResult, QuranicWord } from '../types';
import { getTodayWordIndex } from '../utils/wordIndex';
import { 
  saveGameState, 
  getGameState, 
  saveUserPreference, 
  getUserPreference,
  hasCompletedPlayingToday as checkCompletedToday,
} from '../utils/firestore';
import { useAuth } from '../context/AuthContext';
import GameOver from '../components/GameOver';
import { calculateGameScore } from '../utils/leaderboard';
import { saveToLocalStorage, getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../utils/localStorage';
import ProfileModal from '../components/ProfileModal';

const MAX_ATTEMPTS = 6;

const { width, height } = Dimensions.get('window');
const CONTENT_WIDTH = Platform.OS === 'web' 
  ? (Platform.select({
      web: width > 768 ? width * 0.75 : width * 0.95
    }))
  : width * 0.95;

const WORD_LENGTH = 5;

interface GameState {
  guesses: GuessResult[][];
  letterStates: Record<string, GuessResult['status']>;
  gameOver: boolean;
  showWordDetails: boolean;
}

export default GameScreen;

function GameScreen() {
  const { theme, toggleTheme } = useTheme();
  const { user, isGuest } = useAuth();
  const { updateUserProgress } = useUserProgress();
  
  const [currentWord, setCurrentWord] = useState<QuranicWord | null>(null);
  const [guesses, setGuesses] = useState<GuessResult[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [letterStates, setLetterStates] = useState<Record<string, GuessResult['status']>>({});
  const [showWordDetails, setShowWordDetails] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);
  const [detailsUpdateModalVisible, setDetailsUpdateModalVisible] = useState(false);
  const colors = useColors();

  useEffect(() => {
    const init = async () => {
      try {
        // Check intro status from localStorage
        const introShown = await getFromLocalStorage(LOCAL_STORAGE_KEYS.INTRO_SHOWN, false);
        if (!introShown) {
          setShowIntro(true);
        }
        
        // Get the last played date - first try localStorage for speed
        let lastPlayedDate = await getFromLocalStorage(LOCAL_STORAGE_KEYS.LAST_PLAYED_DATE, '');
        const today = new Date().toISOString().split('T')[0];
        
        // For authenticated users, also check Firebase for cross-device sync
        const userId = user?.id || '';
        if (userId && !isGuest) {
          try {
            const firebaseDateStr = await getUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, false);
            if (firebaseDateStr) {
              // If Firebase has a more recent date, use that instead
              if (lastPlayedDate < firebaseDateStr) {
                lastPlayedDate = firebaseDateStr;
                // Update localStorage with the Firebase date
                await saveToLocalStorage(LOCAL_STORAGE_KEYS.LAST_PLAYED_DATE, lastPlayedDate);
              }
            }
          } catch (error) {
            console.error('Error getting last played date from Firebase:', error);
            // Continue with localStorage date if Firebase fails
          }
        }
        
        // Check if user has completed today's game
        let hasCompleted = false;
        try {
          hasCompleted = await hasCompletedPlayingToday();
          setHasCompletedToday(hasCompleted);
        } catch (error) {
          console.error('Error checking completion status during init:', error);
        }

        // If it's a new day, reset the game state
        if (lastPlayedDate !== today) {
          // Reset all game state
          setGuesses([]);
          setLetterStates({});
          setGameOver(false);
          setShowWordDetails(false);
          
          // Reset the saved state
          const resetState: GameState = {
            guesses: [],
            letterStates: {},
            gameOver: false,
            showWordDetails: false
          };
          
          if (userId) {
            await saveGameState(userId, resetState, isGuest);
          }
        } else if (hasCompleted) {
          // If user has completed today's game, load the saved state and prevent new plays
          try {
            const savedState = await getGameState(userId, isGuest);
            
            if (savedState) {
              setGuesses(savedState.guesses || []);
              setLetterStates(savedState.letterStates || {});
              setGameOver(true);
              setShowWordDetails(true);
            }
          } catch (error) {
            console.error('Error loading saved game state:', error);
          }
        } else {
          // Try to load any existing game state
          try {
            const savedState = await getGameState(userId, isGuest);
            if (savedState && savedState.guesses && savedState.guesses.length > 0) {
              // If there's an existing game state with guesses, load it
              setGuesses(savedState.guesses);
              setLetterStates(savedState.letterStates || {});
              setGameOver(savedState.gameOver || false);
              setShowWordDetails(savedState.showWordDetails || false);
            } else {
              // Only reset if there's no existing game state
              setGuesses([]);
              setLetterStates({});
              setGameOver(false);
              setShowWordDetails(false);
              
              // Reset the saved state as well
              const resetState: GameState = {
                guesses: [],
                letterStates: {},
                gameOver: false,
                showWordDetails: false
              };
              
              if (userId) {
                await saveGameState(userId, resetState, isGuest);
              }
            }
          } catch (error) {
            console.error('Error loading existing game state:', error);
            // If there's an error loading the state, reset the game
            setGuesses([]);
            setLetterStates({});
            setGameOver(false);
            setShowWordDetails(false);
          }
        }
        
        // Fetch daily word
        await fetchDailyWord();
        
        // Ensure loading state is set to false
        setLoading(false);
      } catch (error) {
        console.error('Error during initialization:', error);
        // Ensure loading states are set to false even if there's an error
        setLoading(false);
      }
    };
    
    // Start initialization
    init();
  }, [user, isGuest]);

  // Add a new useEffect to prevent game interaction if completed
  useEffect(() => {
    if (hasCompletedToday) {
      console.log('User has completed today\'s game, preventing new plays');
      setGameOver(true);
      setShowWordDetails(true);
    }
  }, [hasCompletedToday]);

  // Add a debug useEffect to log state changes
  useEffect(() => {
    console.log('Game state updated:', { 
      gameOver, 
      showWordDetails, 
      hasCompletedToday, 
      guessesLength: guesses.length,
      hasCurrentWord: !!currentWord
    });
  }, [gameOver, showWordDetails, hasCompletedToday, guesses.length, currentWord]);

  // Separate useEffect for loading timeout
  useEffect(() => {
    // Only set timeout if we're in loading state
    if (!loading) return;
    
    console.log('Setting loading timeout');
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, forcing loading state to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout
    
    return () => {
      clearTimeout(loadingTimeout);
    };
  }, [loading]);

  const handleIntroClose = async () => {
    setShowIntro(false);
    // Save intro shown state to localStorage only
    await saveToLocalStorage(LOCAL_STORAGE_KEYS.INTRO_SHOWN, true);
  };

  const fetchDailyWord = async () => {
    try {
      setLoading(true);
      
      // We already checked completion status in init, no need to check again
      
      // Get today's word index
      const wordIndex = getTodayWordIndex();
      
      // Fetch the word from Firestore
      const wordsRef = collection(db, 'words');
      const q = query(wordsRef, where('index', '==', wordIndex));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const wordDoc = querySnapshot.docs[0];
        const wordData = wordDoc.data() as QuranicWord;
        
        // Validate the word data has required fields
        if (!wordData) {
          console.error('No word data received from Firestore');
          Alert.alert('Error', 'The word data is invalid. Please try again later.');
          return;
        }
        
        // Use document ID as the word ID if not provided in the data
        const wordId = wordData.id || wordDoc.id;
        
        // Check for other required fields
        if (!wordData.arabic_word || !wordData.transliteration || wordData.index === undefined) {
          console.error('Word data missing required fields:', 
            !wordData.arabic_word ? 'arabic_word ' : '',
            !wordData.transliteration ? 'transliteration ' : '',
            wordData.index === undefined ? 'index ' : ''
          );
          Alert.alert('Error', 'The word data is incomplete. Please try again later.');
          return;
        }
        
        // Set the word with ID from document
        setCurrentWord({
          id: wordId,
          arabic_word: wordData.arabic_word || '',
          transliteration: wordData.transliteration || '',
          english_translation: wordData.english_translation || '',
          meanings: wordData.meanings || [],
          part_of_speech: wordData.part_of_speech || 'noun',
          morphological_info: wordData.morphological_info || '',
          frequency: wordData.frequency || 0,
          occurrences: wordData.occurrences || [],
          index: wordData.index || 0
        });
        
        // Save today's date to localStorage
        const today = new Date().toISOString().split('T')[0];
        await saveToLocalStorage(LOCAL_STORAGE_KEYS.LAST_PLAYED_DATE, today);
        
        // For authenticated users, also save to Firebase for cross-device sync
        const userId = user?.id || '';
        if (userId && !isGuest) {
          try {
            await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, false);
          } catch (error) {
            console.error('Error saving last played date to Firebase:', error);
            // Continue even if saving to Firebase fails
          }
        }
      } else {
        console.error('No word found for today');
        // Show an error message to the user
        Alert.alert('Error', 'Could not load today\'s word. Please try again later.');
      }
    } catch (error) {
      console.error('Error fetching daily word:', error);
      // Show an error message to the user
      Alert.alert('Error', 'Could not load the game. Please check your connection and try again.');
    } finally {
      // Always set loading to false, even if there's an error
      setLoading(false);
    }
  };

  const handleKeyPress = (key: string) => {
    if (gameOver || !currentWord || hasCompletedToday) return;

    if (key === '⌫') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      if (currentGuess.length === currentWord.id.length) {
        submitGuess();
      } else {
        Alert.alert('Not enough letters', 'Please complete the word before submitting');
      }
    } else if (currentGuess.length < currentWord.id.length) {
      setCurrentGuess(prev => prev + key.toLowerCase());
    }
  };

  const submitGuess = async () => {
    if (!currentWord || hasCompletedToday) return;
    
    const targetWord = currentWord.id.toLowerCase();
    const guessResult: GuessResult[] = [];
    const newLetterStates = { ...letterStates };

    // Calculate guess results
    for (let i = 0; i < currentGuess.length; i++) {
      const letter = currentGuess[i];
      if (letter === targetWord[i]) {
        guessResult.push({ letter, status: 'correct' });
        newLetterStates[letter.toUpperCase()] = 'correct';
      } else if (targetWord.includes(letter)) {
        guessResult.push({ letter, status: 'present' });
        if (newLetterStates[letter.toUpperCase()] !== 'correct') {
          newLetterStates[letter.toUpperCase()] = 'present';
        }
      } else {
        guessResult.push({ letter, status: 'absent' });
        newLetterStates[letter.toUpperCase()] = 'absent';
      }
    }

    const newGuesses = [...guesses, guessResult];
    setGuesses(newGuesses);
    setLetterStates(newLetterStates);
    setCurrentGuess('');

    // Save today's date to localStorage and Firebase for authenticated users
    const today = new Date().toISOString().split('T')[0];
    await saveToLocalStorage(LOCAL_STORAGE_KEYS.LAST_PLAYED_DATE, today);
    
    // For authenticated users, also save to Firebase for cross-device sync
    const userId = user?.id || '';
    if (userId && !isGuest) {
      await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, false);
    }

    // Check win/lose condition
    const todayIndex = getTodayWordIndex();
    const isCorrectWord = currentWord.index === todayIndex && currentGuess === targetWord;

    let gameState: GameState = {
      guesses: newGuesses,
      letterStates: newLetterStates,
      gameOver: gameOver,
      showWordDetails: showWordDetails
    };

    if (isCorrectWord || newGuesses.length >= MAX_ATTEMPTS) {
      setGameOver(true);
      const success = isCorrectWord;
      gameState.gameOver = true;

      // Update user progress in Firebase first to get the correct score with updated streak
      await updateUserProgress(currentWord.id, newGuesses.length, success);
      
      // Calculate score for display
      const currentStreak = user?.streak || 0;
      const score = calculateGameScore(newGuesses.length, success, currentStreak + (success ? 1 : 0));
      setGameScore(score);
      
      // Ensure we set the last played date
      await saveToLocalStorage(LOCAL_STORAGE_KEYS.LAST_PLAYED_DATE, today);
      if (userId && !isGuest) {
        await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, false);
      }
      
      if (success) {
        gameState.showWordDetails = false;
        setShowGameOver(true);
      } else {
        setShowGameOver(true);
      }
    }

    // Always save game state to Firebase for authenticated users
    if (userId) {
      await saveGameState(userId, gameState, isGuest);
    }
  };

  const handleGameOverClose = async () => {
    setShowGameOver(false);
    
    // Only show word details if the game is actually over
    if (gameOver) {
      setShowWordDetails(true);
      
      // Update the game state to reflect that word details should be shown
      const gameState: GameState = {
        guesses,
        letterStates,
        gameOver: true,
        showWordDetails: true
      };
      
      // Save the updated game state
      const userId = user?.id || '';
      if (userId) {
        await saveGameState(userId, gameState, isGuest);
      }
    }

    // Save today's date to localStorage
    const today = new Date().toISOString().split('T')[0];
    await saveToLocalStorage(LOCAL_STORAGE_KEYS.LAST_PLAYED_DATE, today);
    
    // For authenticated users, also save to Firebase for cross-device sync
    const userId = user?.id || '';
    if (userId && !isGuest) {
      await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, false);
    }
  };

  // Add a function to reset the game
  const resetGame = async () => {
    // Reset all game state
    setGuesses([]);
    setLetterStates({});
    setCurrentGuess('');
    setGameOver(false);
    setShowWordDetails(false);
    setShowGameOver(false);
    
    // Save the reset state
    const gameState: GameState = {
      guesses: [],
      letterStates: {},
      gameOver: false,
      showWordDetails: false
    };
    
    // Save the updated game state
    const userId = user?.id || '';
    if (userId) {
      await saveGameState(userId, gameState, isGuest);
    }
  };

  const hasCompletedPlayingToday = async () => {
    try {
      const userId = user?.id || '';
      if (!userId) return false;
      
      return await checkCompletedToday(userId, isGuest);
    } catch (error) {
      console.error('Error checking completion status:', error);
      return false;
    }
  };

  const styles = StyleSheet.create({
    profile: {
      marginLeft: 10,
    },
    safeArea: {
      flex: 1,
      backgroundColor: colors.background[theme],
    },
    container: {
      flex: 1,
      backgroundColor: colors.background[theme],
      alignItems: 'center',
    },
    contentContainer: {
      width: CONTENT_WIDTH,
      flex: 1,
      paddingVertical: 10,
    },
    gridContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      maxHeight: height * 0.65,
      paddingTop: 10,
    },
    keyboardContainer: {
      width: '100%',
      alignItems: 'center',
      paddingBottom: Platform.OS === 'web' ? 10 : 5,
      marginTop: Platform.OS === 'web' ? 20 : 10,
    },
    modalContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.modal.overlay,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.modal.overlay,
    },
    modalView: {
      width: CONTENT_WIDTH,
      backgroundColor: colors.modal.background[theme],
      borderRadius: 15,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    closeButton: {
      position: 'absolute',
      right: 15,
      top: 10,
    },
    closeButtonText: {
      fontSize: 40,
      color: colors.text[theme],
      lineHeight: 40,
    },
    gameOverTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text[theme],
      marginBottom: 20,
    },
    answerText: {
      fontSize: 16,
      color: colors.text[theme],
      marginBottom: 10,
    },
    wordText: {
      fontWeight: 'bold',
      color: colors.correct,
    },
    arabicWord: {
      fontSize: 32,
      color: colors.text[theme],
      marginBottom: 10,
      textAlign: 'center',
    },
    transliteration: {
      fontSize: 18,
      color: colors.text[theme],
      marginBottom: 20,
    },
    detailsButton: {
      backgroundColor: colors.correct,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 10,
      marginBottom: 20,
    },
    detailsButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    wordDetailsContainer: {
      flex: 1,
      padding: 20,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 30,
      padding: 20,
      backgroundColor: colors.surface[theme],
      borderRadius: 15,
    },
    arabicText: {
      fontSize: 36,
      color: colors.text[theme],
      marginBottom: 10,
    },
    englishText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.correct,
    },
    section: {
      marginBottom: 25,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text[theme],
      marginBottom: 15,
    },
    meaningsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    meaningChip: {
      backgroundColor: colors.present,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      margin: 4,
    },
    meaningText: {
      color: '#FFFFFF',
      fontSize: 16,
    },
    grammarCard: {
      backgroundColor: colors.surface[theme],
      padding: 15,
      borderRadius: 10,
    },
    grammarText: {
      color: colors.text[theme],
      fontSize: 16,
      marginBottom: 5,
    },
    frequencyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 15,
    },
    frequencyBadge: {
      backgroundColor: colors.correct,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    frequencyText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    occurrenceCard: {
      backgroundColor: colors.surface[theme],
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
    },
    referenceContainer: {
      backgroundColor: colors.present,
      padding: 10,
    },
    referenceText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    contextText: {
      color: colors.text[theme],
      fontSize: 14,
      padding: 15,
      fontStyle: 'italic',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    privacyLink: {
      color: colors.present,
      textAlign: 'center',
      fontSize: 14,
      padding: 10,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderLogo />,
            headerStyle: {
              backgroundColor: colors.header.background[theme],
            },
            headerTintColor: colors.header.text[theme],
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <WisdomStLogo />
                <TouchableOpacity 
                  onPress={() => setShowIntro(true)} 
                >
                  <Ionicons 
                    name="information-circle-outline" 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDetailsUpdateModalVisible(true)}
                >
                  <Ionicons 
                    style={styles.profile}
                    name="person-circle-outline" 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={toggleTheme} 
                  style={{ marginLeft: 10, marginRight: 10 }}
                >
                  <Ionicons 
                    name={theme === 'light' ? 'moon-outline' : 'sunny'} 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.correct} />
          <Text style={{ color: colors.text[theme], marginTop: 20 }}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWord) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            headerTitle: () => <HeaderLogo />,
            headerStyle: {
              backgroundColor: colors.header.background[theme],
            },
            headerTintColor: colors.header.text[theme],
            headerRight: () => (
              <>
                <TouchableOpacity 
                  onPress={() => setShowIntro(true)} 
                  style={{ marginRight: 15 }}
                >
                  <Ionicons 
                    name="information-circle-outline" 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDetailsUpdateModalVisible(true)}
                >
                  <Ionicons 
                    style={styles.profile}
                    name="person-circle-outline" 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={toggleTheme} 
                  style={{ marginRight: 15 }}
                >
                  <Ionicons 
                    name={theme === 'light' ? 'moon-outline' : 'sunny'} 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
              </>
            ),
          }}
        />
        <View style={[styles.container, styles.loadingContainer]}>
          <Text style={{ color: colors.text[theme], fontSize: 18, textAlign: 'center', margin: 20 }}>
            Could not load today's word. Please check your connection and try again.
          </Text>
          <TouchableOpacity 
            style={{
              backgroundColor: colors.correct,
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
              marginTop: 20
            }}
            onPress={() => {
              setLoading(true);
              fetchDailyWord();
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background[theme] }]}>
      <Stack.Screen
        options={{
          headerTitle: () => <HeaderLogo />,
          headerStyle: {
            backgroundColor: colors.header.background[theme],
          },
          headerTintColor: colors.header.text[theme],
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <WisdomStLogo />
              <TouchableOpacity 
                onPress={() => setShowIntro(true)} 
              >
                <Ionicons 
                  name="information-circle-outline" 
                  size={24} 
                  color={colors.header.text[theme]} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDetailsUpdateModalVisible(true)}
              >
                <Ionicons 
                  style={styles.profile}
                  name="person-circle-outline" 
                  size={24} 
                  color={colors.header.text[theme]} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={toggleTheme} 
                style={{ marginLeft: 10, marginRight: 10 }}
              >
                <Ionicons 
                  name={theme === 'light' ? 'moon-outline' : 'sunny'} 
                  size={24} 
                  color={colors.header.text[theme]} 
                />
              </TouchableOpacity>

            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {/* Only show word details if gameOver AND showWordDetails are both true */}
          {gameOver && showWordDetails && currentWord ? (
            <ScrollView 
              style={styles.wordDetailsContainer}
              showsVerticalScrollIndicator={false}
            >
              {user && <UserStats user={user} />}
              <View style={styles.headerSection}>
                <Text style={styles.arabicText}>{currentWord.arabic_word || ''}</Text>
                <Text style={styles.transliteration}>{currentWord.transliteration || ''}</Text>
                <Text style={styles.englishText}>{currentWord.id ? currentWord.id.toUpperCase() : ''}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Meanings</Text>
                <View style={styles.meaningsContainer}>
                  {(currentWord.meanings || []).map((meaning, index) => (
                    <View key={index} style={styles.meaningChip}>
                      <Text style={styles.meaningText}>{meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Grammar</Text>
                <View style={styles.grammarCard}>
                  <Text style={styles.grammarText}>Part of Speech: {currentWord.part_of_speech || 'N/A'}</Text>
                  <Text style={styles.grammarText}>{currentWord.morphological_info || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.frequencyHeader}>
                  <Text style={styles.sectionTitle}>Occurrences in Quran</Text>
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>{currentWord.frequency || 0} times</Text>
                  </View>
                </View>
                {(currentWord.occurrences || []).map((occurrence, index) => (
                  <View key={index} style={styles.occurrenceCard}>
                    <View style={styles.referenceContainer}>
                      <Text style={styles.referenceText}>
                        Surah {occurrence.surah || ''}:{occurrence.ayah || ''}
                      </Text>
                    </View>
                    <Text style={styles.contextText}>{occurrence.context || ''}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <>
              <View style={styles.gridContainer}>
                <PuzzleGrid
                  guesses={guesses}
                  maxAttempts={MAX_ATTEMPTS}
                  wordLength={WORD_LENGTH}
                  currentGuess={currentGuess}
                />
              </View>
              
              <View style={styles.keyboardContainer}>
                <Keyboard
                  onKeyPress={handleKeyPress}
                  letterStates={letterStates}
                />
              </View>
            </>
          )}

          <IntroModal
            visible={showIntro}
            onClose={handleIntroClose}
          />

          <Modal
            visible={showGameOver}
            transparent={true}
            animationType="fade"
            onRequestClose={handleGameOverClose}
          >
            <View style={[styles.centeredView, { backgroundColor: colors.modal.overlay }]}>
              <GameOver
                success={guesses.length > 0 && currentWord ? 
                  guesses[guesses.length - 1].every(g => g.status === 'correct') : 
                  false}
                word={currentWord?.id || ''}
                attempts={guesses.length}
                score={gameScore}
                onClose={handleGameOverClose}
              />
            </View>
          </Modal>

          <ProfileModal
            visible={detailsUpdateModalVisible}
            onClose={() => setDetailsUpdateModalVisible(false)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
} 