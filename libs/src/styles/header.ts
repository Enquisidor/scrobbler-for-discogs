/**
 * Layout component styles - Header, Main Screen, etc.
 */

import { opacity, colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

// ============================================
// Header Styles
// ============================================
export const headerStyles = {
  container: {
    paddingVertical: spacing[4],
  },
  titleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  buttonsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
  },
} as const;

// ============================================
// Connection Button Styles
// ============================================
export const connectionButtonStyles = {
  base: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    minWidth: 80,
    alignItems: 'center' as const,
  },
  connected: {
    backgroundColor: colors.gray[700],
  },
  discogs: {
    backgroundColor: colors.brand.discogs,
  },
  lastfm: {
    backgroundColor: colors.brand.lastfm,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[1.5],
  },
  text: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
} as const;

// ============================================
// Icon Button Styles
// ============================================
export const iconButtonStyles = {
  base: {
    width: spacing[10],
    height: spacing[10],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[700],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  disabled: {
    opacity: opacity.disabled,
  },
} as const;

