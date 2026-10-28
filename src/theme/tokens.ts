import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  sky: '#2D9CDB',
  skyDark: '#1678B7',
  skyPale: '#E8F7FF',
  coral: '#FF6B6B',
  coralDark: '#D84A54',
  yellow: '#FFD447',
  yellowDark: '#D9A91F',
  mint: '#54D6A8',
  mintDark: '#2DA77E',
  lilac: '#A88BEB',
  lilacDark: '#7A60C8',
  ink: '#17324D',
  inkSoft: '#5C7083',
  white: '#FFFFFF',
  surface: '#F4FBFF',
  surfaceWarm: '#FFF9EC',
  border: '#D9EAF3',
  flagStage: '#E4EEF3',
  flagStageBorder: '#B7CFDC',
  dangerPale: '#FFF0F1',
  successPale: '#E8FFF7',
  overlay: 'rgba(23, 50, 77, 0.55)',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 44 } as const;
export const radius = { sm: 12, md: 18, lg: 24, xl: 32, round: 999 } as const;

export const type = {
  display: { fontFamily: 'Nunito_900Black', color: colors.ink } satisfies TextStyle,
  heading: { fontFamily: 'Nunito_800ExtraBold', color: colors.ink } satisfies TextStyle,
  body: { fontFamily: 'Nunito_700Bold', color: colors.ink } satisfies TextStyle,
  regular: { fontFamily: 'Nunito_600SemiBold', color: colors.ink } satisfies TextStyle,
} as const;

export const shadow = {
  card: {
    shadowColor: '#164A68', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.12,
    shadowRadius: 12, elevation: 4,
  } satisfies ViewStyle,
  button: {
    shadowColor: '#164A68', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.17,
    shadowRadius: 5, elevation: 4,
  } satisfies ViewStyle,
} as const;

export const motion = {
  quick: 140,
  normal: 240,
  feedback: 1050,
  spring: { damping: 14, stiffness: 210, mass: 0.8 },
} as const;
