/**
 * Settings component styles
 */

import { colors, spacing, borderRadius, fontSize, fontWeight, opacity } from '../theme';

// ============================================
// Settings Styles
// ============================================
export const settingsStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  closeButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },
  closeText: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  section: {
    marginBottom: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(40, 40, 40, 0.5)',
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gray[500],
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  sectionDescription: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing[3],
  },
  settingRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3],
  },
  settingRowDisabled: {
    opacity: opacity.disabled,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing[4],
  },
  settingLabel: {
    fontSize: fontSize.base,
    color: colors.gray[300],
    fontWeight: fontWeight.semibold,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing[0.5],
  },
  dangerSection: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: colors.gray[700],
    paddingTop: spacing[4],
  },
  dangerSectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.error,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: spacing[2],
  },
  resetButton: {
    backgroundColor: colors.errorDark,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.full,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
} as const;
