import { ColorScheme } from '../types';

const colors: ColorScheme = {
  background: {
    light: '#FFFFFF',
    dark: '#121213'
  },
  surface: {
    light: '#F3F3F3',
    dark: '#272729'
  },
  text: {
    light: '#1A1A1A',
    dark: '#FFFFFF'
  },
  secondaryText: {
    light: '#787C7E',
    dark: '#A3A3A3'
  },
  correct: '#6AAA64',  // Softer green
  present: '#C9B458',  // Warmer yellow
  absent: '#787C7E',   // Lighter gray
  button: {
    background: {
      light: '#6AAA64',
      dark: '#538D4E'
    },
    text: {
      light: '#FFFFFF',
      dark: '#FFFFFF'
    }
  },
  key: {
    background: {
      light: '#D3D6DA',
      dark: '#818384'
    },
    text: {
      light: '#1A1A1A',
      dark: '#FFFFFF'
    }
  },
  header: {
    background: {
      light: '#FFFFFF',
      dark: '#121213'
    },
    text: {
      light: '#1A1A1A',
      dark: '#FFFFFF'
    },
    border: {
      light: '#D3D6DA',
      dark: '#3A3A3C'
    }
  },
  modal: {
    background: {
      light: '#FFFFFF',
      dark: '#121213'
    },
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  border: {
    light: '#D3D6DA',
    dark: '#3A3A3C'
  }
};

export default colors; 