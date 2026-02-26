// ============================================================
// Sprout — Design System Tokens
// Warm, calming palette inspired by nursery aesthetics
// ============================================================

export const colors = {
  // Primary — Sage Green (trust, calm, nature)
  primary: {
    50: '#F0F5F2',
    100: '#D8E8DD',
    200: '#B3D1BC',
    300: '#8EBA9B',
    400: '#7C9A8E',
    500: '#5E8A72',
    600: '#4A7A5E',
    700: '#3A6249',
    800: '#2A4A35',
    900: '#1A3221',
  },
  // Secondary — Warm Blush (nurturing, gentle)
  secondary: {
    50: '#FEF5F0',
    100: '#FDE8DB',
    200: '#FACDB7',
    300: '#F7B293',
    400: '#F49770',
    500: '#F17C4C',
    600: '#D66A3D',
    700: '#B2582F',
    800: '#8E4621',
    900: '#6A3413',
  },
  // Neutral — Warm Grays
  neutral: {
    0: '#FFFFFF',
    50: '#F8F5F0',
    100: '#F0ECE6',
    200: '#E2DCD4',
    300: '#C9C2B8',
    400: '#A8A099',
    500: '#87807A',
    600: '#6B655F',
    700: '#4F4A44',
    800: '#33302B',
    900: '#1A1815',
  },
  // Semantic
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#E53935',
  info: '#5E8A72',

  // Backgrounds
  background: '#F8F5F0',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#1A1815',
  textSecondary: '#6B655F',
  textTertiary: '#A8A099',
  textInverse: '#FFFFFF',

  // Red flag / emergency
  emergency: '#D32F2F',
  emergencyBackground: '#FFEBEE',
} as const;

export const typography = {
  // Font families (using system fonts for now, can swap for custom)
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  // Font sizes
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
  },
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  '3xl': 32,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#8E7A68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#8E7A68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#8E7A68',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  soft: {
    shadowColor: '#C9A88C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;
