import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform } from 'react-native';
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
  guesses?: any[][]; // Add this prop to receive the guesses pattern
}

const GameOver: React.FC<GameOverProps> = ({ 
  success, 
  word, 
  attempts, 
  score, 
  onClose,
  guesses = [] 
}) => {
  const { theme } = useTheme();
  const colors = useColors();
  const router = useRouter();

  const viewLeaderboard = () => {
    onClose();
    router.push('/leaderboard');
  };

  // Generate share text with emoji squares
  const generateShareText = () => {
    // App name and day's result
    let shareText = `Versile ${success ? attempts : 'X'}/6\n\n`;
    
    // Add emoji grid representation of guesses
    if (guesses && guesses.length > 0) {
      guesses.forEach(row => {
        let rowText = '';
        row.forEach(cell => {
          if (cell.status === 'correct') {
            rowText += '🟩'; // Green square for correct
          } else if (cell.status === 'present') {
            rowText += '🟨'; // Yellow square for present
          } else {
            rowText += '⬛'; // Black square for absent
          }
        });
        shareText += rowText + '\n';
      });
    }
    
    // Add score and link
    shareText += `\nScore: ${score}\n`;
    shareText += `\nPlay Versile: https://versile.keralastudentsconference.com`;
    
    return shareText;
  };

  // Handle share button press
  const handleShare = async () => {
    try {
      const shareText = generateShareText();
      
      if (Platform.OS === 'web') {
        // Web implementation using clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText);
          alert('Results copied to clipboard!');
        } else {
          alert('Clipboard access not available in your browser');
        }
      } else {
        // Native share implementation
        const result = await Share.share({
          message: shareText
        });
        
        if (result.action === Share.sharedAction) {
          console.log('Shared successfully');
        }
      }
    } catch (error) {
      console.error('Error sharing results:', error);
    }
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
        {/* Share button - show for both win and lose cases */}
        <TouchableOpacity 
          style={[styles.shareButton, { 
            backgroundColor: colors.secondaryText[theme] + '20',
            borderColor: colors.secondaryText[theme]
          }]} 
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={20} color={colors.secondaryText[theme]} style={styles.buttonIcon} />
          <Text style={[styles.shareButtonText, { color: colors.secondaryText[theme] }]}>
            Share Results
          </Text>
        </TouchableOpacity>

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
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
  },
  shareButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
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