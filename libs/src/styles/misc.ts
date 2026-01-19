/**
 * Miscellaneous component styles - Dropdowns, pickers, notifications, checkboxes, error boundaries
 */

import { colors, spacing, borderRadius, fontSize, fontWeight, opacity } from '../theme';

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
// Picker Modal Styles
// ============================================
export const pickerModalStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[700],
  },
  title: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: spacing[2],
  },
  closeText: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  option: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
    borderBottomWidth: 0.5,
    borderBottomColor: colors.gray[700],
  },
  optionSelected: {
    backgroundColor: colors.gray[800],
  },
  optionText: {
    color: colors.gray[300],
    fontSize: fontSize.base,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  checkmark: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
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

// ============================================
// Indeterminate Checkbox Styles
// ============================================
export const checkboxStyles = {
  container: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[600],
    backgroundColor: colors.gray[700],
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  indeterminate: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  checkmark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
  dash: {
    backgroundColor: colors.white,
  },
} as const;

// ============================================
// Error Boundary Styles
// ============================================
export const errorBoundaryStyles = {
  container: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.gray[900],
    padding: spacing[8],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginBottom: spacing[4],
    textAlign: 'center' as const,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[400],
    marginBottom: spacing[6],
    textAlign: 'center' as const,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  errorContainer: {
    marginTop: spacing[8],
    padding: spacing[4],
    backgroundColor: colors.gray[800],
    borderRadius: borderRadius.lg,
    maxHeight: 200,
    width: '100%',
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontFamily: 'monospace',
    marginTop: spacing[2],
  },
} as const;
