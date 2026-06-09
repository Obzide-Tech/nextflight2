/**
 * NextFlight Academy — Design Tokens
 *
 * Colors: exact hex values from the official brand identity guide.
 * Fonts: Google Fonts stand-ins. When client provides .ttf/.otf files, swap:
 *   ClassicoURW-Regular      → heading, body
 *   ClassicoURW-Bold         → headingBold
 *   IvyPrestoHeadline-Italic → headingItalic (decorative accent)
 *   GenoraSans-Regular       → support, buttons
 *   GenoraSans-Medium        → supportMedium, bodyMedium
 *   GenoraSans-SemiBold      → bodySemibold
 *   IvyOraDisplay-MediumItalic → connector
 *   DebbieRate-Regular       → signature
 */

// Brand colors — exact values from NextFlight Academy identity guide
export const colors = {
  burgundy: {
    900: '#30050E', // darkest background — brand #30050E
    800: '#4D0C12', // deep — brand #4D0C12
    700: '#70041D', // principal — brand #70041D (primary brand color)
    600: '#8A1A2C',
    500: '#A82540',
  },
  gold: {
    600: '#8A6A3A',
    500: '#9C7A45',
    400: '#AF8956', // accent — brand #AF8956
    300: '#C9A876',
    200: '#E0C99A',
  },
  cream: {
    50: '#FDFCF5',
    100: '#F1EEDB', // light cream — brand #F1EEDB
    200: '#E0DBC3', // medium cream — brand #E0DBC3
    300: '#CAC4A8',
  },
  ink: {
    900: '#12040A',
    800: '#1E0810',
    700: '#2E1018',
    500: '#5C3A42',
    300: '#9A7880',
    100: '#C8B0B5',
  },
  state: {
    success: '#3A6B46',
    warning: '#A67828',
    error: '#70041D',
    info: '#3A547A',
  },
  surface: {
    base: '#F1EEDB',
    raised: '#FDFCF5',
    sunken: '#E0DBC3',
    overlay: 'rgba(48, 5, 14, 0.62)',
  },
  border: {
    soft: '#E0DBC3',
    medium: '#AF8956',
    strong: '#70041D',
  },
};

export const fonts = {
  heading: 'PlayfairDisplay-Regular',
  headingBold: 'PlayfairDisplay-Bold',
  headingItalic: 'PlayfairDisplay-Italic',
  body: 'Poppins-Regular',
  bodyMedium: 'Poppins-Medium',
  bodySemibold: 'Poppins-SemiBold',
  support: 'Inter-Regular',
  supportMedium: 'Inter-Medium',
  connector: 'PlayfairDisplay-Italic',
  signature: 'PlayfairDisplay-Italic',
};

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 38,
  hero: 48,
};

export const lineHeight = {
  body: 1.5,
  heading: 1.2,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const shadow = {
  soft: {
    shadowColor: colors.burgundy[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  medium: {
    shadowColor: colors.burgundy[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  gold: {
    shadowColor: colors.gold[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const tokens = { colors, fonts, fontSize, lineHeight, spacing, radius, shadow };
export default tokens;
