import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWeeklyLeaderboard, getUserLeaderboardPosition, getCurrentWeekDates } from '../utils/leaderboard';
import { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeGuests, setIncludeGuests] = useState(true);
  const { user, isGuest } = useAuth();
  const colors = useColors();
  const { theme } = useTheme();

  useEffect(() => {
    fetchLeaderboard();
  }, [includeGuests]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const entries = await getWeeklyLeaderboard(20, includeGuests);
      setLeaderboard(entries);

      if (user) {
        const position = await getUserLeaderboardPosition(user.id, isGuest);
        setUserPosition(position);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const { week_start, week_end } = getCurrentWeekDates();
  const weekStartDate = new Date(week_start);
  const weekEndDate = new Date(week_end);
  const formattedWeekStart = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formattedWeekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const renderItem = ({ item, index }: { item: LeaderboardEntry, index: number }) => {
    const isCurrentUser = user && item.user_id === user.id;
    const backgroundColor = isCurrentUser ? colors.correct + '30' : 'transparent';
    
    // Determine medal or rank
    let rankDisplay;
    if (item.rank === 1) {
      rankDisplay = <Ionicons name="medal" size={24} color="#FFD700" />;
    } else if (item.rank === 2) {
      rankDisplay = <Ionicons name="medal" size={24} color="#C0C0C0" />;
    } else if (item.rank === 3) {
      rankDisplay = <Ionicons name="medal" size={24} color="#CD7F32" />;
    } else {
      rankDisplay = <Text style={[styles.rank, { color: colors.text[theme] }]}>{item.rank}</Text>;
    }

    return (
      <View style={[styles.item, { backgroundColor }]}>
        <View style={styles.rankContainer}>
          {rankDisplay}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.text[theme] }]}>
            {item.username}
            {isCurrentUser && ' (You)'}
          </Text>
          <Text style={[styles.stats, { color: colors.secondaryText[theme] }]}>
            {item.games_won}/{item.games_played} games • Best streak: {item.best_streak}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.text[theme] }]}>{item.score}</Text>
          <Text style={[styles.scoreLabel, { color: colors.secondaryText[theme] }]}>pts</Text>
        </View>
      </View>
    );
  };

  const renderUserPosition = () => {
    if (!userPosition) return null;

    return (
      <View style={styles.userPositionContainer}>
        <Text style={[styles.userPositionTitle, { color: colors.secondaryText[theme] }]}>
          Your Position
        </Text>
        {renderItem({ item: userPosition, index: -1 })}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background[theme] }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text[theme] }]}>Weekly Leaderboard</Text>
        <Text style={[styles.subtitle, { color: colors.secondaryText[theme] }]}>
          {formattedWeekStart} - {formattedWeekEnd}
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[
            styles.toggleButton, 
            { backgroundColor: includeGuests ? colors.correct + '30' : 'transparent' }
          ]}
          onPress={() => setIncludeGuests(!includeGuests)}
        >
          <Text style={[styles.toggleText, { color: colors.text[theme] }]}>
            {includeGuests ? 'Including Guests' : 'Registered Users Only'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.correct} style={styles.loader} />
      ) : (
        <>
          {userPosition && !leaderboard.some(entry => entry.user_id === userPosition.user_id) && (
            renderUserPosition()
          )}
          
          <FlatList
            data={leaderboard}
            renderItem={renderItem}
            keyExtractor={(item) => item.user_id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.secondaryText[theme] }]}>
                  No scores yet for this week
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  toggleText: {
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stats: {
    fontSize: 12,
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
  },
  loader: {
    marginTop: 32,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  userPositionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  userPositionTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default LeaderboardScreen; 