import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import colors from '../constants/colors';
import useTheme from '../context/ThemeContext';

interface IntroModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CONTENT_WIDTH = Platform.OS === 'web'
  ? (Platform.select({
      web: SCREEN_WIDTH > 768 ? SCREEN_WIDTH * 0.35 : SCREEN_WIDTH * 0.95
    }))
  : SCREEN_WIDTH * 0.9;
const EXAMPLE_TILE_SIZE = Platform.OS === 'web'
  ? (SCREEN_WIDTH > 768 ? 40 : 30)
  : Math.min(SCREEN_WIDTH / 12, 35);

const IntroModal: React.FC<IntroModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      backgroundColor: colors.modal.background[theme],
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    modalView: {
      width: CONTENT_WIDTH,
      backgroundColor: colors.modal.background[theme],
      borderRadius: 15,
      padding: Platform.OS === 'web' ? 20 : 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      maxHeight: '80%',
    },
    scrollContent: {
      paddingHorizontal: 15,
    },
    closeButton: {
      position: 'absolute',
      right: 10,
      top: 10,
      zIndex: 1,
      padding: 5,
    },
    closeButtonText: {
      fontSize: 28,
      color: colors.text[theme],
      lineHeight: 28,
    },
    title: {
      fontSize: Platform.OS === 'web' ? 24 : 22,
      fontWeight: 'bold',
      color: colors.text[theme],
      textAlign: 'center',
      marginTop: 20,
      marginBottom: 15,
    },
    subtitle: {
      fontSize: Platform.OS === 'web' ? 16 : 15,
      color: colors.text[theme],
      textAlign: 'center',
      marginBottom: 20,
    },
    bulletPoints: {
      marginBottom: 25,
      paddingHorizontal: 10,
    },
    bulletPoint: {
      fontSize: Platform.OS === 'web' ? 15 : 14,
      color: colors.text[theme],
      marginBottom: 10,
      lineHeight: 20,
    },
    examplesTitle: {
      fontSize: Platform.OS === 'web' ? 18 : 16,
      fontWeight: 'bold',
      color: colors.text[theme],
      marginBottom: 20,
      textAlign: 'center',
    },
    exampleContainer: {
      marginBottom: 25,
      alignItems: 'center',
    },
    wordRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 8,
    },
    exampleTile: {
      width: EXAMPLE_TILE_SIZE,
      height: EXAMPLE_TILE_SIZE,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 4,
      borderWidth: 2,
      borderColor: colors.surface[theme],
      backgroundColor: 'transparent',
    },
    tileText: {
      fontSize: EXAMPLE_TILE_SIZE * 0.5,
      fontWeight: 'bold',
      color: colors.text[theme],
    },
    correctTile: {
      backgroundColor: colors.correct,
      borderColor: colors.correct,
    },
    presentTile: {
      backgroundColor: colors.present,
      borderColor: colors.present,
    },
    absentTile: {
      backgroundColor: colors.absent,
      borderColor: colors.absent,
    },
    exampleText: {
      fontSize: 16,
      color: colors.text[theme],
      marginTop: 5,
    },
    divider: {
      height: 1,
      backgroundColor: colors.surface[theme],
      marginVertical: 15,
      width: '100%',
    },
    note: {
      fontSize: 14,
      color: colors.text[theme],
      textAlign: 'center',
      marginBottom: 15,
    },
    contentScrollView: {
      pointerEvents: 'auto',
    },
    contentContainer: {
      paddingHorizontal: 15,
    }
  });

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={[styles.centeredView, { pointerEvents: 'auto' }]}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          
          <ScrollView 
            style={styles.contentScrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>How To Play</Text>
            
            <Text style={styles.subtitle}>Guess the Quranic word in 6 tries.</Text>
            
            <View style={styles.bulletPoints}>
              <Text style={styles.bulletPoint}>• Each guess must be a valid 5-letter word</Text>
              <Text style={styles.bulletPoint}>• The color of the tiles will change to show how close your guess was to the word</Text>
            </View>
            
            <Text style={styles.examplesTitle}>Examples</Text>
            
            <View style={styles.exampleContainer}>
              <View style={styles.wordRow}>
                <View style={[styles.exampleTile, styles.correctTile]}>
                  <Text style={styles.tileText}>W</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>O</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>R</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>D</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>Y</Text>
                </View>
              </View>
              <Text style={styles.exampleText}>W is in the word and in the correct spot</Text>
            </View>

            <View style={styles.exampleContainer}>
              <View style={styles.wordRow}>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>L</Text>
                </View>
                <View style={[styles.exampleTile, styles.presentTile]}>
                  <Text style={styles.tileText}>I</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>G</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>H</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>T</Text>
                </View>
              </View>
              <Text style={styles.exampleText}>I is in the word but in the wrong spot</Text>
            </View>

            <View style={styles.exampleContainer}>
              <View style={styles.wordRow}>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>R</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>O</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>G</Text>
                </View>
                <View style={[styles.exampleTile, styles.absentTile]}>
                  <Text style={styles.tileText}>U</Text>
                </View>
                <View style={styles.exampleTile}>
                  <Text style={styles.tileText}>E</Text>
                </View>
              </View>
              <Text style={styles.exampleText}>U is not in the word in any spot</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.note}>A new puzzle is released daily at midnight.</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default IntroModal; 