export interface WordOccurrence {
  surah: number;
  ayah: number;
  context: string;
}

export interface QuranicWord {
  id: string;
  index: number;
  english_translation: string;
  arabic_word: string;
  transliteration: string;
  meanings: string[];
  occurrences: WordOccurrence[];
  frequency: number;
  part_of_speech: string;
  morphological_info: string;
}

export interface User {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  streak?: number;
  last_played: string;
  guessed_words: string[];
  total_score?: number;
  current_week_score?: number;
  best_week_score?: number;
  longest_streak?: number;
  last_week_start?: string;
}

export interface GameSession {
  user_id: string;
  date: string;
  word: string;
  attempts: number;
  success: boolean;
  score: number;
}

export interface GuessResult {
  letter: string;
  status: 'correct' | 'present' | 'absent' | 'unused';
}

export interface GameState {
  guesses: GuessResult[][];
  letterStates: Record<string, GuessResult['status']>;
  gameOver: boolean;
  showWordDetails: boolean;
}

export interface WeeklyScore {
  user_id: string;
  week_start: string;
  week_end: string;
  score: number;
  games_played: number;
  games_won: number;
  best_streak: number;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  score: number;
  rank: number;
  games_played: number;
  games_won: number;
  best_streak: number;
  win_rate?: number;
}

export type Theme = 'light' | 'dark';

export interface ColorScheme {
  background: {
    light: string;
    dark: string;
  };
  surface: {
    light: string;
    dark: string;
  };
  text: {
    light: string;
    dark: string;
  };
  secondaryText: {
    light: string;
    dark: string;
  };
  correct: string;
  present: string;
  absent: string;
  border: {
    light: string;
    dark: string;
  };
  button: {
    background: {
      light: string;
      dark: string;
    };
    text: {
      light: string;
      dark: string;
    };
  };
  key: {
    background: {
      light: string;
      dark: string;
    };
    text: {
      light: string;
      dark: string;
    };
  };
  header: {
    background: {
      light: string;
      dark: string;
    };
    text: {
      light: string;
      dark: string;
    };
    border: {
      light: string;
      dark: string;
    };
  };
  modal: {
    background: {
      light: string;
      dark: string;
    };
    overlay: string;
  };
}

export default {}; 