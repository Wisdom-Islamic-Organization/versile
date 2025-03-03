const fs = require('fs');
const path = require('path');

/**
 * Parse the words.txt file and return an array of structured word objects
 * @param {string} filePath - Path to the words.txt file
 * @returns {Array} Array of parsed word objects
 */
function parseWordsFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const wordEntries = content.split('---').filter(entry => entry.trim());
    
    const parsedWords = [];
    
    wordEntries.forEach((entry, index) => {
      const lines = entry.trim().split('\n').filter(line => line.trim());
      
      // Skip the "VERSILE" header if present
      const startIndex = lines[0] === 'VERSILE' ? 1 : 0;
      
      if (lines.length <= startIndex) return;
      
      // Extract the word number and name, and possibly Arabic word in parentheses
      const titleLine = lines[startIndex];
      const titleMatch = titleLine.match(/(\d+)\.\s+(.+?)(?:\s*\((.+?)\))?$/);
      
      if (!titleMatch) return;
      
      const wordNumber = parseInt(titleMatch[1]);
      const wordName = titleMatch[2].trim();
      const arabicWord = titleMatch[3] ? titleMatch[3].trim() : "";
      
      // Initialize the word object
      const word = {
        id: wordName.toLowerCase(),
        index: wordNumber - 1,
        english_translation: wordName,
        arabic_word: arabicWord, // Set Arabic word from title if available
        transliteration: "",
        meanings: [],
        occurrences: [],
        frequency: 0,
        part_of_speech: "",
        morphological_info: "",
      };
      
      // Parse the rest of the information
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('Meanings:')) {
          word.meanings = line.replace('Meanings:', '').trim().split(',').map(m => m.trim());
        } else if (line.startsWith('Transliteration:')) {
          word.transliteration = line.replace('Transliteration:', '').trim();
        } else if (line.startsWith('Part of speech:') || line.startsWith('Part of Speech:')) {
          word.part_of_speech = line.replace(/Part of [Ss]peech:/, '').trim().toLowerCase();
        } else if (line.startsWith('Root:')) {
          word.morphological_info = line.trim();
        } else if (line.startsWith('Frequency:')) {
          // Extract the number from "Frequency: 41"
          const match = line.match(/Frequency:\s*(\d+)/i);
          if (match && match[1]) {
            word.frequency = parseInt(match[1]);
          }
        } else if (line.match(/Occurrence[s]? in Qur'an:/i)) {
          // Also check the old format as a fallback
          const match = line.match(/Occurrence[s]? in Qur'an:\s*(\d+)/i);
          if (match && match[1]) {
            word.frequency = parseInt(match[1]);
          }
        } else if (line.match(/Occurrences - Ayah:/i)) {
          // Extract from format: Occurrences - Ayah: (9:41) "Go forth, whether light or heavy..."
          const match = line.match(/Occurrences - Ayah:\s*\((\d+):(\d+)\)\s*"(.+)"/i);
          if (match && match[1] && match[2] && match[3]) {
            const surah = parseInt(match[1]);
            const ayah = parseInt(match[2]);
            const context = match[3].trim();
            
            word.occurrences.push({
              surah,
              ayah,
              context
            });
          }
        } else if (line.startsWith('Arabic:')) {
          // If Arabic wasn't found in the title, try to get it from a dedicated line
          if (!word.arabic_word) {
            word.arabic_word = line.replace('Arabic:', '').trim();
          }
        }
      }
      
      parsedWords.push(word);
    });
    
    return parsedWords;
  } catch (error) {
    console.error('Error parsing words file:', error);
    return [];
  }
}

/**
 * Save the parsed words to a JSON file
 * @param {Array} words - Array of parsed word objects
 * @param {string} outputPath - Path to save the JSON file
 * @returns {boolean} Success status
 */
function saveWordsToJson(words, outputPath) {
  try {
    fs.writeFileSync(outputPath, JSON.stringify(words, null, 2), 'utf8');
    console.log(`Saved parsed words to ${outputPath}`);
    return true;
  } catch (error) {
    console.error('Error saving words to JSON:', error);
    return false;
  }
}

/**
 * Main function to parse words from file and optionally save to JSON
 * @param {string} inputFilePath - Path to the words.txt file
 * @param {string} [outputJsonPath] - Optional path to save the JSON file
 * @returns {Array} Array of parsed word objects
 */
function parseWords(inputFilePath, outputJsonPath = null) {
  const words = parseWordsFile(inputFilePath);
  
  if (outputJsonPath) {
    saveWordsToJson(words, outputJsonPath);
  }
  
  return words;
}

// If this script is run directly (not imported)
if (require.main === module) {
  const wordsFilePath = path.join(__dirname, 'words.txt');
  const outputJsonPath = path.join(__dirname, 'parsed_words.json');
  
  const words = parseWords(wordsFilePath, outputJsonPath);
  console.log(`Successfully parsed ${words.length} words from ${wordsFilePath}`);
}

module.exports = {
  parseWordsFile,
  saveWordsToJson,
  parseWords
}; 