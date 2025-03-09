import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { User } from '../types';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getUserLeaderboardPosition } from '../utils/leaderboard';

interface UserStatsProps {
  user: User;
}

const UserStats: React.FC<UserStatsProps> = ({ user }) => {
  const colors = useColors();
  const { theme } = useTheme();
  const router = useRouter();
  const [weeklyScore, setWeeklyScore] = useState(0);

  useEffect(() => {
    async function fetchWeeklyScore() {
      if (user?.id) {
        const isGuest = user.id.startsWith('guest_');
        const position = await getUserLeaderboardPosition(user.id, isGuest);
        if (position) {
          setWeeklyScore(position.score);
        } else {
          setWeeklyScore(0);
        }
      }
    }
    
    fetchWeeklyScore();
  }, [user]);

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.surface[theme],
      borderRadius: 15,
      marginVertical: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    label: {
      fontSize: 16,
      color: colors.text[theme],
    },
    value: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text[theme],
    },
    streak: {
      color: colors.correct,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    statLabel: {
      fontSize: 14,
      marginTop: 5,
    },
    scoreContainer: {
      alignItems: 'center',
      marginTop: 20,
      paddingTop: 15,
      borderTopWidth: 1,
      borderTopColor: '#eaeaea',
    },
    scoreLabel: {
      fontSize: 14,
      marginBottom: 5,
    },
    scoreValue: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    leaderboardButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1,
    },
    buttonIcon: {
      marginRight: 5,
    },
    leaderboardText: {
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text[theme] }]}>
            {user?.guessed_words?.length || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondaryText[theme] }]}>
            Words Found
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text[theme] }]}>
            {user?.streak || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondaryText[theme] }]}>
            Current Streak
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text[theme] }]}>
            {user?.longest_streak || 0}
          </Text>
          <Text style={[styles.statLabel, { color: colors.secondaryText[theme] }]}>
            Best Streak
          </Text>
        </View>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreLabel, { color: colors.secondaryText[theme] }]}>
          Weekly Score
        </Text>
        <Text style={[styles.scoreValue, { color: colors.correct }]}>
          {weeklyScore}
        </Text>
        <TouchableOpacity 
          style={[styles.leaderboardButton, { backgroundColor: colors.correct + '20', borderColor: colors.correct }]} 
          onPress={() => router.push('/leaderboard')}
        >
          <Ionicons name="trophy" size={16} color={colors.correct} style={styles.buttonIcon} />
          <Text style={[styles.leaderboardText, { color: colors.correct }]}>View Leaderboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default UserStats; 