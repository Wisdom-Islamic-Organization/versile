import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  View,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { getPreviousWeekTopPositions, getPreviousWeekDates } from '../utils/leaderboard';
import { LeaderboardEntry } from '../types';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';

export default function PreviousWeekLeaderboardScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekDates, setWeekDates] = useState({ week_start: '', week_end: '' });
  const colors = useColors();
  const { theme } = useTheme();

  useEffect(() => {
    fetchPreviousWeekLeaderboard();
  }, []);

  const fetchPreviousWeekLeaderboard = async () => {
    try {
      setLoading(true);
      const dates = getPreviousWeekDates();
      setWeekDates(dates);
      
      // Get top 3 positions with tiebreaker logic
      const entries = await getPreviousWeekTopPositions(3, true);
      setLeaderboard(entries);
    } catch (error) {
      console.error('Error fetching previous week leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = (item: LeaderboardEntry, index: number) => {
    // Different styling for 1st, 2nd, and 3rd positions
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    const rankColor = index < 3 ? rankColors[index] : '#888888';
    const backgroundColor = theme === 'dark' ? '#333' : '#f5f5f5';
    
    return (
      <View 
        key={item.user_id}
        style={[
          styles.leaderboardItem, 
          { backgroundColor }
        ]}
      >
        <View style={[styles.rankContainer, { backgroundColor: rankColor }]}>
          <Text style={styles.rankText}>{item.rank}</Text>
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={[styles.username, { color: theme === 'dark' ? colors.text.dark : colors.text.light }]}>
            {item.username}
          </Text>
          <Text style={[styles.statsText, { color: theme === 'dark' ? colors.secondaryText.dark : colors.secondaryText.light }]}>
            Games: {item.games_played} | Won: {item.games_won} | 
            Win Rate: {item.games_played > 0 ? ((item.games_won / item.games_played) * 100).toFixed(1) : 0}% | 
            Best Streak: {item.best_streak}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color: theme === 'dark' ? colors.text.dark : colors.text.light }]}>
            {item.score}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? colors.background.dark : colors.background.light }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme === 'dark' ? '#fff' : '#000'} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? colors.background.dark : colors.background.light }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme === 'dark' ? colors.text.dark : colors.text.light }]}>
            Previous Week Top 3
          </Text>
          <Text style={[styles.subtitle, { color: theme === 'dark' ? colors.secondaryText.dark : colors.secondaryText.light }]}>
            {weekDates.week_start} to {weekDates.week_end}
          </Text>
        </View>
        
        <View style={styles.leaderboardContainer}>
          {leaderboard.length > 0 ? (
            leaderboard.map((item, index) => renderLeaderboardItem(item, index))
          ) : (
            <Text style={[styles.emptyText, { color: theme === 'dark' ? colors.text.dark : colors.text.light }]}>
              No data available for the previous week
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  leaderboardContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  userInfoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 12,
  },
  scoreContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 24,
  },
}); 