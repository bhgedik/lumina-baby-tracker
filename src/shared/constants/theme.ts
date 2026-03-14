// ============================================================
// Lumina — Design System Tokens
// Soft pastel palette — playful lavender meets warm peach
// ============================================================

export const colors = {
  // Primary — Soft Lavender (playful, dreamy, nurturing)
  primary: {
    50: '#F5F0FA',
    100: '#E8DDF3',
    200: '#D4C4E8',
    300: '#BEA8DA',
    400: '#B199CE',
    500: '#A78BBA',
    600: '#8E72A4',
    700: '#735A88',
    800: '#58446A',
    900: '#3D2E4C',
  },
  // Secondary — Pastel Peach (warm, soft, play-dough)
  secondary: {
    50: '#FFF5F0',
    100: '#FEE8DC',
    200: '#FCD5C0',
    300: '#F8C1A4',
    400: '#F5ADA0',
    500: '#F2B89C',
    600: '#D89B7E',
    700: '#B87E63',
    800: '#966249',
    900: '#744830',
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
  info: '#A78BBA',

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
    shadowColor: '#8E7A9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#8E7A9E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#8E7A9E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  soft: {
    shadowColor: '#B8A0CC',
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
