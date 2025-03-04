import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWeeklyLeaderboard, getUserLeaderboardPosition, getCurrentWeekDates } from '../utils/leaderboard';
import { LeaderboardEntry, User } from '../types';
import { useAuth } from '../context/AuthContext';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const LeaderboardScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeGuests, setIncludeGuests] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const { user, isGuest } = useAuth();
  const colors = useColors();
  const { theme } = useTheme();

  useEffect(() => {
    fetchLeaderboard();
    loadUserProfile();
  }, [includeGuests]);

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, isGuest ? 'guests' : 'users', user.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setProfileData({
          name: userData.username || '',
          phone: userData.phone || '',
          email: userData.email || ''
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, isGuest ? 'guests' : 'users', user.id);
      await updateDoc(userRef, {
        username: profileData.name,
        phone: profileData.phone,
        email: profileData.email
      });
      setIsEditing(false);
      // Refresh leaderboard to show updated name
      fetchLeaderboard();
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

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

  const renderProfileModal = () => (
    <Modal
      visible={showProfileModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowProfileModal(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.background[theme] }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text[theme] }]}>Your Profile</Text>
            <TouchableOpacity 
              onPress={() => setShowProfileModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text[theme]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text[theme] }]}>Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface[theme],
                  color: colors.text[theme],
                  borderColor: colors.border[theme]
                }]}
                value={profileData.name}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                placeholderTextColor={colors.secondaryText[theme]}
                editable={isEditing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text[theme] }]}>Phone</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface[theme],
                  color: colors.text[theme],
                  borderColor: colors.border[theme]
                }]}
                value={profileData.phone}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.secondaryText[theme]}
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text[theme] }]}>Email</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.surface[theme],
                  color: colors.text[theme],
                  borderColor: colors.border[theme]
                }]}
                value={profileData.email}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                placeholderTextColor={colors.secondaryText[theme]}
                keyboardType="email-address"
                editable={isEditing}
              />
            </View>

            <View style={styles.modalButtons}>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setIsEditing(false);
                      loadUserProfile(); // Reset to original values
                    }}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.editButton]}
                  onPress={() => setIsEditing(true)}
                >
                  <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

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

      {renderProfileModal()}
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LeaderboardScreen; 