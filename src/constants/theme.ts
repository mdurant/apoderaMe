import '@/global.css';

import { Platform } from 'react-native';

/**
 * Semantic color tokens for ApoderaMe.
 *
 * Components consume roles (surface, textMuted, positive, etc.) instead of
 * palette values, keeping both themes visually consistent and easy to evolve.
 */
export const Colors = {
  light: {
    background: '#F7F5FC',
    backgroundElevated: '#FFFFFF',
    backgroundElement: '#F0ECF8',
    backgroundSelected: '#E4D9F7',
    surface: '#FFFFFF',
    surfaceStrong: '#4B167D',
    surfaceSubtle: '#F0ECF8',
    text: '#21182B',
    textSecondary: '#71677C',
    textInverse: '#FFFFFF',
    primary: '#6818A5',
    primaryStrong: '#4B0C7B',
    primarySoft: '#EBDCF8',
    accent: '#C44DFF',
    accentSoft: '#F3E2FC',
    info: '#2F73D9',
    infoSoft: '#E2EDFC',
    border: '#E5DEEC',
    divider: '#EEE8F2',
    positive: '#159B72',
    positiveSoft: '#DDF6EC',
    negative: '#D84B68',
    negativeSoft: '#FCE4E9',
    warning: '#D78B19',
    warningSoft: '#FFF0D7',
    chartPrimary: '#6818A5',
    chartSecondary: '#2AB68C',
    overlay: 'rgba(33, 24, 43, 0.45)',
    shadow: '#2F1745',
  },
  dark: {
    background: '#100917',
    backgroundElevated: '#1B1025',
    backgroundElement: '#261333',
    backgroundSelected: '#3B1850',
    surface: '#1B1025',
    surfaceStrong: '#2C0D42',
    surfaceSubtle: '#261333',
    text: '#F9F5FC',
    textSecondary: '#B8A9C4',
    textInverse: '#FFFFFF',
    primary: '#B75AE5',
    primaryStrong: '#D184F4',
    primarySoft: '#3B1850',
    accent: '#E0A0FF',
    accentSoft: '#3A1B49',
    info: '#78A9F5',
    infoSoft: '#182C4A',
    border: '#3C2949',
    divider: '#30203B',
    positive: '#54D4A7',
    positiveSoft: '#143A30',
    negative: '#FF7891',
    negativeSoft: '#481D2B',
    warning: '#F2B85B',
    warningSoft: '#453218',
    chartPrimary: '#C86AF1',
    chartSecondary: '#4AD3A7',
    overlay: 'rgba(5, 2, 8, 0.72)',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeMode = keyof typeof Colors;
export type ThemePreference = ThemeMode | 'system';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 24,
  six: 32,
  seven: 48,
  eight: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 18,
  xLarge: 24,
  pill: 999,
} as const;

export const MaxContentWidth = 720;
