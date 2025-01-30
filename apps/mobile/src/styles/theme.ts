import { StyleSheet } from 'react-native';

export const colors = {
  // Background colors
  background: '#1A1B1E',
  surface: '#25262B',
  surfaceHover: '#2C2E33',
  
  // Text colors
  text: '#FFFFFF',
  textSecondary: '#909296',
  textMuted: '#5C5F66',
  
  // Brand colors
  primary: '#228BE6',
  primaryHover: '#1C7ED6',
  
  // Status colors
  success: '#40C057',
  error: '#FA5252',
  warning: '#FD7E14',
  info: '#228BE6',
  
  // Border colors
  border: '#2C2E33',
  borderLight: '#373A40',
};

export const typography = {
  fontFamily: 'Chakra-Petch',
  
  // Font sizes
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  small: 14,
  tiny: 12,
  
  // Line heights
  lineHeightRelaxed: 1.5,
  lineHeightNormal: 1.2,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const shadows = StyleSheet.create({
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export const commonStyles = StyleSheet.create({
  // Layout containers
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  
  // Text styles
  heading1: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h1,
    color: colors.text,
    fontWeight: 'bold',
  },
  heading2: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h2,
    color: colors.text,
    fontWeight: '600',
  },
  heading3: {
    fontFamily: typography.fontFamily,
    fontSize: typography.h3,
    color: colors.text,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: typography.body * typography.lineHeightRelaxed,
  },
  caption: {
    fontSize: typography.small,
    color: colors.textSecondary,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.surfaceHover,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  
  // Form inputs
  input: {
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
  },
  
  // Lists and grids
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -spacing.sm,
  },
  gridItem: {
    padding: spacing.sm,
  },
}); 