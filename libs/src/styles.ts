/**
 * Shared component styles for web and mobile apps
 * These define the styling for specific UI elements/components
 */

import { colors, spacing, borderRadius, fontSize, fontWeight, opacity } from './theme';

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

// ============================================
// Dropdown / Picker Styles
// ============================================
export const dropdownStyles = {
  trigger: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[700],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderWidth: 1,
    borderColor: colors.gray[600],
  },
  triggerText: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginRight: spacing[2],
  },
  arrow: {
    fontSize: 10,
    color: colors.gray[400],
  },
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0, 0, 0, ${opacity.overlay})`,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  container: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden' as const,
  },
  header: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    textAlign: 'center' as const,
  },
  option: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  optionSelected: {
    backgroundColor: colors.gray[700],
  },
  optionText: {
    fontSize: fontSize.base,
    color: colors.white,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  checkmark: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
} as const;

// ============================================
// Collection Styles
// ============================================
export const collectionStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[8],
  },
  emptyText: {
    color: colors.gray[400],
    fontSize: fontSize.base,
    textAlign: 'center' as const,
  },
} as const;

// ============================================
// Album Card Styles
// ============================================
export const albumCardStyles = {
  container: {
    flex: 1,
    margin: spacing[1],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[800],
    overflow: 'hidden' as const,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.gray[700],
  },
  info: {
    padding: spacing[2],
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  artist: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing[0.5],
  },
  queueBadge: {
    position: 'absolute' as const,
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  queueBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
} as const;

// ============================================
// Queue Styles
// ============================================
export const queueStyles = {
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
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[8],
  },
  emptyTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[2],
  },
  emptyDescription: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
    textAlign: 'center' as const,
  },
} as const;

// ============================================
// Queue Button (FAB) Styles
// ============================================
export const queueButtonStyles = {
  container: {
    position: 'absolute' as const,
    bottom: spacing[6],
    right: spacing[4],
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  badge: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    minWidth: 24,
    alignItems: 'center' as const,
  },
  badgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
} as const;

// ============================================
// Filter Styles
// ============================================
export const filterStyles = {
  container: {
    paddingVertical: spacing[3],
  },
  searchRow: {
    flexDirection: 'row' as const,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    color: colors.white,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  filterRow: {
    flexDirection: 'row' as const,
    gap: spacing[2],
  },
  filterButton: {
    flex: 1,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  filterButtonActive: {
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  statsText: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
    marginTop: spacing[2],
  },
} as const;

// ============================================
// Notification Styles
// ============================================
export const notificationStyles = {
  container: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    borderWidth: 1,
  },
  success: {
    borderColor: colors.success,
  },
  error: {
    borderColor: colors.error,
  },
  text: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.sm,
  },
  dismiss: {
    padding: spacing[1],
  },
} as const;
