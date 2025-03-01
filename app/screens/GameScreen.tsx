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

const MAX_ATTEMPTS = 6;
const INTRO_SHOWN_KEY = 'quranic_wordle_intro_shown';

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
  const [isPlayedStatusLoaded, setIsPlayedStatusLoaded] = useState(false);

  const colors = useColors();

  useEffect(() => {
    const init = async () => {
      try {
        // Check intro status
        const userId = user?.id || '';
        const introShown = await getUserPreference(userId, STORAGE_KEYS.INTRO_SHOWN, isGuest);
        if (!introShown) {
          setShowIntro(true);
        }
        
        // Get the last played date from storage
        const lastPlayedDate = await getUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, isGuest);
        const today = new Date().toISOString().split('T')[0];
        
        // Clear state if it's a new day
        if (lastPlayedDate !== today) {
          setGuesses([]);
          setLetterStates({});
          setGameOver(false);
          setShowWordDetails(false);
        } else {
          // Only load saved state if it's the same day
          const savedState = await getGameState(userId, isGuest);
          if (savedState) {
            setGuesses(savedState.guesses);
            setLetterStates(savedState.letterStates);
            setGameOver(savedState.gameOver);
            setShowWordDetails(savedState.showWordDetails);
          }
        }
        
        // Fetch daily word
        fetchDailyWord();
      } catch (error) {
        console.error('Error during initialization:', error);
      }
    };
    init();
  }, []);

  const handleIntroClose = async () => {
    setShowIntro(false);
    const userId = user?.id || '';
    await saveUserPreference(userId, STORAGE_KEYS.INTRO_SHOWN, 'true', isGuest);
  };

  const fetchDailyWord = async () => {
    try {
      setLoading(true);
      
      // Check if user has already completed today's game
      const completed = await hasCompletedPlayingToday();
      
      // Get today's word index
      const todayIndex = getTodayWordIndex();
      
      // Query Firestore for word with matching index
      const wordsRef = collection(db, 'words');
      const q = query(wordsRef, where('index', '==', todayIndex));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const wordDoc = querySnapshot.docs[0];
        const word = { id: wordDoc.id, ...wordDoc.data() } as QuranicWord;
        setCurrentWord(word);
        
        if (completed) {
          setGameOver(true);
          setShowWordDetails(true);
          
          // If authenticated user, try to load their previous game state from Firebase
          if (user) {
            const today = new Date().toISOString().split('T')[0];
            const userId = user.id;
            
            // Get game state from Firestore
            const savedState = await getGameState(userId, isGuest);
            if (!savedState) {
              // If no state, create a basic completed state
              const gameState: GameState = {
                guesses: [], // We don't have the actual guesses
                letterStates: {},
                gameOver: true,
                showWordDetails: true
              };
              await saveGameState(userId, gameState, isGuest);
              await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, isGuest);
            }
          }
        }
      } else {
        console.error('No word found for today');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch word');
    } finally {
      setLoading(false);
      setIsPlayedStatusLoaded(true);
    }
  };

  const handleKeyPress = (key: string) => {
    if (gameOver || !currentWord) return;

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
    if (!currentWord) return;
    
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

    // Set last played date for today on first guess
    const today = new Date().toISOString().split('T')[0];
    const userId = user?.id || '';
    await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, isGuest);

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

      // Calculate score
      const currentStreak = user?.streak || 0;
      const score = calculateGameScore(newGuesses.length, success, currentStreak);
      setGameScore(score);
      
      // Update user progress in Firebase
      await updateUserProgress(currentWord.id, newGuesses.length, success);
      
      // Ensure we set the last played date
      await saveUserPreference(userId, STORAGE_KEYS.LAST_PLAYED_DATE, today, isGuest);
      
      if (success) {
        gameState.showWordDetails = true;
        setShowWordDetails(true);
      } else {
        setShowGameOver(true);
      }
    }

    await saveGameState(userId, gameState, isGuest);
  };

  const handleGameOverClose = () => {
    setShowGameOver(false);
    if (currentWord) {
      setShowWordDetails(true);
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

  if (!currentWord || loading || !isPlayedStatusLoaded) {
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
                  onPress={toggleTheme} 
                  style={{ marginRight: 15 }}
                >
                  <Ionicons 
                    name={theme === 'light' ? 'moon' : 'sunny'} 
                    size={24} 
                    color={colors.header.text[theme]} 
                  />
                </TouchableOpacity>
              </>
            ),
          }}
        />
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.correct} />
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
                onPress={toggleTheme} 
                style={{ marginRight: 15 }}
              >
                <Ionicons 
                  name={theme === 'light' ? 'moon' : 'sunny'} 
                  size={24} 
                  color={colors.header.text[theme]} 
                />
              </TouchableOpacity>
            </>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          {gameOver && currentWord ? (
            <ScrollView 
              style={styles.wordDetailsContainer}
              showsVerticalScrollIndicator={false}
            >
              {user && <UserStats user={user} />}
              <View style={styles.headerSection}>
                <Text style={styles.arabicText}>{currentWord.arabic_word}</Text>
                <Text style={styles.transliteration}>{currentWord.transliteration}</Text>
                <Text style={styles.englishText}>{currentWord.id.toUpperCase()}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Meanings</Text>
                <View style={styles.meaningsContainer}>
                  {currentWord.meanings.map((meaning, index) => (
                    <View key={index} style={styles.meaningChip}>
                      <Text style={styles.meaningText}>{meaning}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Grammar</Text>
                <View style={styles.grammarCard}>
                  <Text style={styles.grammarText}>Part of Speech: {currentWord.part_of_speech}</Text>
                  <Text style={styles.grammarText}>{currentWord.morphological_info}</Text>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.frequencyHeader}>
                  <Text style={styles.sectionTitle}>Occurrences in Quran</Text>
                  <View style={styles.frequencyBadge}>
                    <Text style={styles.frequencyText}>{currentWord.frequency} times</Text>
                  </View>
                </View>
                {currentWord.occurrences.map((occurrence, index) => (
                  <View key={index} style={styles.occurrenceCard}>
                    <View style={styles.referenceContainer}>
                      <Text style={styles.referenceText}>
                        Surah {occurrence.surah}:{occurrence.ayah}
                      </Text>
                    </View>
                    <Text style={styles.contextText}>{occurrence.context}</Text>
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
        </View>
      </View>
    </SafeAreaView>
  );
} 