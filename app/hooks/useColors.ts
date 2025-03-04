import colors from '../constants/colors';
import { ColorScheme } from '../types';

export default function useColors(): ColorScheme {

  return {
    background: {
      light: colors.background.light,
      dark: colors.background.dark
    },
    surface: {
      light: colors.surface.light,
      dark: colors.surface.dark
    },
    text: {
      light: colors.text.light,
      dark: colors.text.dark
    },
    secondaryText: {
      light: colors.secondaryText.light,
      dark: colors.secondaryText.dark
    },
    correct: colors.correct,
    present: colors.present,
    absent: colors.absent,
    button: {
      background: {
        light: colors.button.background.light,
        dark: colors.button.background.dark
      },
      text: {
        light: colors.button.text.light,
        dark: colors.button.text.dark
      }
    },
    key: {
      background: {
        light: colors.key.background.light,
        dark: colors.key.background.dark
      },
      text: {
        light: colors.key.text.light,
        dark: colors.key.text.dark
      }
    },
    header: {
      background: {
        light: colors.header.background.light,
        dark: colors.header.background.dark
      },
      text: {
        light: colors.header.text.light,
        dark: colors.header.text.dark
      },
      border: {
        light: colors.header.border.light,
        dark: colors.header.border.dark
      }
    },
    modal: {
      background: {
        light: colors.modal.background.light,
        dark: colors.modal.background.dark
      },
      overlay: colors.modal.overlay
    },
    border: {
      light: colors.border.light,
      dark: colors.border.dark
    }
  };
}; 