import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';

// ============================================
// Main Screen Styles
// ============================================
export const mainScreenStyles = {
    container: {
        flex: 1,
        backgroundColor: colors.gray[900],
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing[4],
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
} as const;
