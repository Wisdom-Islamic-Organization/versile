import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useTheme from '../context/ThemeContext';
import useColors from '../hooks/useColors';

interface GameOverProps {
  success: boolean;
  word: string;
  attempts: number;
  score: number;
  onClose: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ success, word, attempts, score, onClose }) => {
  const { theme } = useTheme();
  const colors = useColors();
  const router = useRouter();

  const viewLeaderboard = () => {
    onClose();
    router.push('/leaderboard');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.modal.background[theme] }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>
          {success ? 'Congratulations!' : 'Game Over'}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text[theme]} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {success ? (
          <>
            <Text style={[styles.message, { color: colors.text[theme] }]}>
              You found the word in {attempts} {attempts === 1 ? 'attempt' : 'attempts'}!
            </Text>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreLabel, { color: colors.secondaryText[theme] }]}>
                Your Score
              </Text>
              <Text style={[styles.score, { color: colors.correct }]}>
                {score}
              </Text>
              <Text style={[styles.scoreBreakdown, { color: colors.secondaryText[theme] }]}>
                Base: 100 pts • Attempts Bonus: {(6 - attempts) * 20} pts • Streak Bonus: {score - 100 - (6 - attempts) * 20} pts
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.message, { color: colors.text[theme] }]}>
            The word was <Text style={{ fontWeight: 'bold' }}>{word}</Text>
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {success && (
          <TouchableOpacity 
            style={[styles.leaderboardButton, { backgroundColor: colors.correct }]} 
            onPress={viewLeaderboard}
          >
            <Ionicons name="trophy" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[styles.closeModalButton, { 
            backgroundColor: success ? colors.surface[theme] : colors.correct,
            borderColor: success ? colors.correct : 'transparent'
          }]} 
          onPress={onClose}
        >
          <Text style={[
            styles.closeModalButtonText, 
            { color: success ? colors.correct : '#FFFFFF' }
          ]}>
            {success ? 'Continue' : 'Try Again Tomorrow'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  scoreLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scoreBreakdown: {
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  leaderboardButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },
  closeModalButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameOver; 