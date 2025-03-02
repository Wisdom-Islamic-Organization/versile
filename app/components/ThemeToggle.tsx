import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../context/ThemeContext';
import useColors from '../hooks/useColors';

interface ThemeToggleProps {
  style?: object;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
  const { theme, toggleTheme } = useTheme();
  const colors = useColors();

  return (
    <TouchableOpacity 
      onPress={toggleTheme} 
      style={style || { marginRight: 15 }}
    >
      <Ionicons 
        name={theme === 'light' ? 'moon' : 'sunny'} 
        size={24} 
        color={colors.header.text[theme]} 
      />
    </TouchableOpacity>
  );
};

export default ThemeToggle; 