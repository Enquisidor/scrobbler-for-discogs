/**
 * Collection component styles - Album cards, filters, etc.
 */

import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

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
// Filter Styles
// ============================================
export const filterStyles = {
  container: {
    backgroundColor: `rgba(18, 18, 18, 0.95)`,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: colors.gray[700],
  },
  filterButtonActive: {
    borderColor: colors.primary,
  },
  filterButtonText: {
    color: colors.gray[300],
    fontSize: fontSize.sm,
    flex: 1,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  filterArrow: {
    color: colors.gray[500],
    fontSize: 10,
    marginLeft: spacing[1],
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  columnsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[1.5],
    borderWidth: 1,
    borderColor: colors.gray[700],
    gap: spacing[1],
  },
  columnsButtonText: {
    color: colors.gray[300],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  resetButton: {
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  statsText: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
    marginTop: spacing[2],
  },
} as const;
