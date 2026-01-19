/**
 * Queue component styles - Queue sheet, queue items, track selection, scrobbler
 */

import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

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
// Queue Item Styles
// ============================================
export const queueItemStyles = {
  container: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
    marginBottom: spacing[2],
  },
  containerError: {
    borderWidth: 1,
    borderColor: colors.errorDark,
  },
  containerHistory: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing[3],
  },
  coverImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[700],
  },
  info: {
    flex: 1,
    marginLeft: spacing[3],
    minWidth: 0,
  },
  title: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  artist: {
    color: colors.gray[400],
    fontSize: fontSize.xs,
    marginTop: spacing[0.5],
  },
  actions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    marginLeft: spacing[2],
  },
  errorBadge: {
    color: colors.error,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    paddingHorizontal: spacing[1.5],
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  badgeHistory: {
    backgroundColor: colors.gray[600],
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  chevron: {
    color: colors.gray[400],
    fontSize: 12,
    paddingHorizontal: spacing[1],
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  actionButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  scrobbleIcon: {
    color: colors.success,
    fontSize: 18,
    fontWeight: fontWeight.bold,
  },
  removeIcon: {
    color: colors.gray[400],
    fontSize: 14,
  },
  expandedContent: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray[700],
  },
  loadingContainer: {
    alignItems: 'center' as const,
    paddingVertical: spacing[4],
  },
  errorContainer: {
    backgroundColor: 'rgba(185, 28, 28, 0.2)',
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    alignItems: 'center' as const,
  },
  errorTitle: {
    color: colors.error,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[1],
  },
  errorMessage: {
    color: '#fca5a5',
    fontSize: fontSize.xs,
    marginBottom: spacing[3],
    textAlign: 'center' as const,
  },
  removeButton: {
    backgroundColor: colors.errorDark,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  removeButtonText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  tracklistContainer: {
    marginTop: spacing[2],
  },
  controlsRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    marginBottom: spacing[2],
  },
  selectAllRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
  },
  selectAllText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
  scrobbleModeContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  scrobbleModeLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[300],
  },
  groupContainer: {
    marginTop: spacing[2],
  },
  groupHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing[2],
    marginBottom: spacing[1],
  },
  groupHeading: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.gray[400],
  },
  groupSelectRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
  },
  groupSelectText: {
    fontSize: fontSize.xs,
    color: colors.primary,
  },
} as const;

// ============================================
// Track Styles
// ============================================
export const trackStyles = {
  trackRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },
  checkboxPlaceholder: {
    width: 20,
    height: 20,
  },
  position: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    fontFamily: 'monospace',
    width: 40,
    textAlign: 'right' as const,
  },
  trackInfo: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'baseline' as const,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginRight: spacing[1],
  },
  subTrackTitle: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginRight: spacing[1],
  },
  artistText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  artistCheckContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[1],
  },
  artistName: {
    color: colors.gray[400],
  },
  artistNameSelected: {
    color: colors.gray[200],
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
    marginTop: spacing[1],
  },
  featureContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[1],
  },
  featureText: {
    fontSize: fontSize.xs,
    fontStyle: 'italic' as const,
    color: colors.gray[500],
  },
  scrobbleAsSingleText: {
    fontSize: fontSize.xs,
    fontStyle: 'italic' as const,
    color: colors.primary,
  },
  creditsContainer: {
    marginTop: spacing[1],
    maxHeight: 80,
  },
  creditRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'baseline' as const,
    marginBottom: spacing[0.5],
  },
  creditRole: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.gray[500],
  },
  creditArtist: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  creditSeparator: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  duration: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    width: 48,
    textAlign: 'right' as const,
  },
  durationScheduled: {
    color: '#228B22',
    fontWeight: fontWeight.semibold,
  },
  miniCheckbox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.gray[600],
    backgroundColor: colors.gray[700],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  miniCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  miniCheckmark: {
    width: 6,
    height: 3,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  subTracksContainer: {
    marginLeft: spacing[8],
    paddingLeft: spacing[4],
    borderLeftWidth: 2,
    borderLeftColor: colors.gray[700],
  },
} as const;

// ============================================
// Queue Scrobbler Styles
// ============================================
export const queueScrobblerStyles = {
  container: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray[700],
    gap: spacing[2],
  },
  sliderRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[4],
  },
  label: {
    fontWeight: fontWeight.semibold,
    color: colors.gray[300],
    fontSize: fontSize.sm,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeDisplayRow: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
    minHeight: 24,
    alignItems: 'center' as const,
  },
  timeDisplay: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
  editContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing[2],
  },
  timeInput: {
    backgroundColor: colors.gray[700],
    color: colors.gray[200],
    fontSize: fontSize.sm,
    textAlign: 'right' as const,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    width: 80,
  },
  unitSelector: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray[700],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
    gap: spacing[1],
  },
  unitText: {
    color: colors.gray[200],
    fontSize: fontSize.sm,
  },
  unitArrow: {
    color: colors.gray[400],
    fontSize: 10,
  },
  doneButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center' as const,
  },
  scrobbleButton: {
    backgroundColor: colors.brand.lastfm,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 48,
  },
  scrobbleButtonDisabled: {
    opacity: 0.5,
  },
  scrobbleButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  scrobbleButtonTextDisabled: {
    color: colors.gray[900],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing[6],
  },
  pickerContainer: {
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden' as const,
  },
  pickerHeader: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  pickerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    textAlign: 'center' as const,
  },
  pickerOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing[3.5],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  pickerOptionSelected: {
    backgroundColor: colors.gray[700],
  },
  pickerOptionText: {
    fontSize: fontSize.base,
    color: colors.white,
  },
  pickerOptionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  pickerCheckmark: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
} as const;
