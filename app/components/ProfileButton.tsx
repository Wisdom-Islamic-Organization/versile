import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import useColors from '../hooks/useColors';
import useTheme from '../context/ThemeContext';
import { router } from 'expo-router';
import ProfileModal from './ProfileModal';

const ProfileButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsUpdateModalVisible, setDetailsUpdateModalVisible] = useState(false);
  const { user, isGuest, signOut, signInWithGoogle, isWeb } = useAuth();
  const colors = useColors();
  const { theme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    setModalVisible(false);
    router.replace('/login');
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.profileButton} 
        onPress={() => setModalVisible(true)}
      >
        <View style={[
          styles.profileIcon, 
          { backgroundColor: isGuest ? colors.button.background[theme] : '#4285F4' }
        ]}>
          <Text style={styles.profileInitial}>
            {isGuest ? 'G' : user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[
            styles.modalView, 
            { backgroundColor: colors.modal.background[theme] }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text[theme] }]}>
                {isGuest ? 'Guest Profile' : 'Your Profile'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.closeText, { color: colors.text[theme] }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {isGuest ? (
              <View style={styles.guestInfo}>
                <Text style={[styles.guestText, { color: colors.text[theme] }]}>
                  You're playing as a guest
                </Text>
                {isWeb && (
                  <>
                    <Text style={[styles.guestSubtext, { color: colors.secondaryText[theme] }]}>
                      Sign in to save your progress and stats
                    </Text>
                    <TouchableOpacity
                      style={[styles.signInButton, { backgroundColor: '#4285F4' }]}
                      onPress={handleSignIn}
                    >
                      <Image 
                        source={require('../../assets/images/google-logo.png')}
                        style={styles.googleIcon}
                      />
                      <Text style={styles.signInText}>Sign in with Google</Text>
                    </TouchableOpacity>
                  </>
                )}
                {!isWeb && (
                  <Text style={[styles.guestSubtext, { color: colors.secondaryText[theme] }]}>
                    Your progress will be saved locally on this device
                  </Text>
                )}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.updateDetailsButton}
                    onPress={() => setDetailsUpdateModalVisible(true)}
                  >
                    <Text style={[styles.updateDetailsText, { color: colors.text[theme] }]}>Update Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.userInfo}>
                <View style={[styles.avatarLarge, { backgroundColor: '#4285F4' }]}>
                  <Text style={styles.avatarText}>
                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <Text style={[styles.username, { color: colors.text[theme] }]}>
                  {user?.username || 'User'}
                </Text>
                <Text style={[styles.email, { color: colors.secondaryText[theme] }]}>
                  {user?.email || ''}
                </Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text[theme] }]}>
                      {user?.streak || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.secondaryText[theme] }]}>
                      Streak
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text[theme] }]}>
                      {user?.guessed_words?.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.secondaryText[theme] }]}>
                      Words
                    </Text>
                  </View>
                </View>

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.updateDetailsButton}
                    onPress={() => setDetailsUpdateModalVisible(true)}
                  >
                    <Text style={[styles.updateDetailsText, { color: colors.text[theme] }]}>Update Details</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.signOutButton, 
                    { 
                      backgroundColor: colors.button.background[theme],
                      borderColor: colors.button.text[theme]
                    }
                  ]}
                  onPress={handleSignOut}
                >
                  <Text style={[styles.signOutText, { color: colors.button.text[theme] }]}>
                    Sign Out
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <ProfileModal 
              visible={detailsUpdateModalVisible}
              onClose={() => setDetailsUpdateModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  profileButton: {
    marginRight: 10,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  guestInfo: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 20,
  },
  guestText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  guestSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  signInText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  signOutButton: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 10,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  updateDetailsButton: {
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  updateDetailsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileButton; 