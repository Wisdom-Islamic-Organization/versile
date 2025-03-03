require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, setDoc, doc, Timestamp } = require('firebase/firestore');

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Load words from parsed_words.json file
 * @returns {Array} Array of word objects
 */
function loadParsedWords() {
  try {
    const filePath = path.join(__dirname, 'parsed_words.json');
    if (!fs.existsSync(filePath)) {
      console.error('parsed_words.json file not found. Please run parse-words.js first.');
      process.exit(1);
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const words = JSON.parse(data);
    
    // Add timestamps to each word
    return words.map(word => ({
      ...word,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    }));
  } catch (error) {
    console.error('Error loading parsed words:', error);
    process.exit(1);
  }
}

async function initializeFirestore() {
  try {
    console.log('Starting Firestore initialization...');
    
    // Check if running in dry run mode
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
      console.log('Running in DRY RUN mode - no data will be written to Firestore');
    }
    
    // Load words from parsed_words.json
    const words = loadParsedWords();
    console.log(`Loaded ${words.length} words from parsed_words.json`);
    
    if (isDryRun) {
      console.log('Dry run complete. No data was written to Firestore.');
      process.exit(0);
      return;
    }
    
    // Add each word to Firestore using setDoc with explicit document IDs
    for (const word of words) {
      const wordId = word.id;
      console.log(`Processing word: ${word.english_translation} (ID: ${wordId})`);
      
      const wordRef = doc(db, 'words', wordId);
      
      try {
        await setDoc(wordRef, word);
        console.log(`Added word: ${word.english_translation} with ID: ${wordId}`);
      } catch (error) {
        console.error(`Error adding word ${wordId}:`, error);
      }
    }
    
    console.log('Successfully initialized Firestore with parsed data');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeFirestore(); 
