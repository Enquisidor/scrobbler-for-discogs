/**
 * Tests for useSettings hook
 *
 * Covers: Settings persistence across app restarts (Plan Phase 2.6)
 * Testing requirements from plan:
 * - Test settings persistence across app restarts
 * - Test all settings save correctly
 * - Test default track selection behavior
 * - Test metadata source preferences
 */

// Mock AsyncStorage before any imports
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../useSettings';
import type { Settings } from '../../types';

// Cast mocks for TypeScript
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

const initialSettings: Settings = {
    selectAllTracksPerRelease: true,
    selectSubtracksByDefault: true,
    showFeatures: true,
    selectFeaturesByDefault: false,
    artistSource: 'discogs',
    albumSource: 'discogs',
};

const customSettings: Settings = {
    selectAllTracksPerRelease: false,
    selectSubtracksByDefault: false,
    showFeatures: false,
    selectFeaturesByDefault: true,
    artistSource: 'apple',
    albumSource: 'musicbrainz',
};

describe('useSettings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Initial Load', () => {
        it('should return default settings when storage is empty', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            expect(result.current.isLoading).toBe(true);

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings).toEqual(initialSettings);
        });

        it('should load stored settings from AsyncStorage', async () => {
            mockGetItem.mockResolvedValue(JSON.stringify(customSettings));

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings).toEqual(customSettings);
            expect(mockGetItem).toHaveBeenCalledWith('scrobbler-for-discogs-settings');
        });
    });

    describe('Settings Updates', () => {
        it('should update all settings via onSettingsChange', async () => {
            mockGetItem.mockResolvedValue(null);
            mockSetItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.onSettingsChange(customSettings);
            });

            expect(result.current.settings).toEqual(customSettings);
            expect(mockSetItem).toHaveBeenCalledWith(
                'scrobbler-for-discogs-settings',
                JSON.stringify(customSettings)
            );
        });

        it('should support functional updates', async () => {
            mockGetItem.mockResolvedValue(JSON.stringify(initialSettings));
            mockSetItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.onSettingsChange((prev) => ({
                    ...prev,
                    selectAllTracksPerRelease: false,
                }));
            });

            expect(result.current.settings.selectAllTracksPerRelease).toBe(false);
            // Other settings should remain unchanged
            expect(result.current.settings.showFeatures).toBe(true);
        });
    });

    describe('Default Track Selection Behavior', () => {
        it('should have correct default for selectAllTracksPerRelease', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings.selectAllTracksPerRelease).toBe(true);
        });

        it('should have correct default for selectSubtracksByDefault', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings.selectSubtracksByDefault).toBe(true);
        });

        it('should have correct default for selectFeaturesByDefault', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings.selectFeaturesByDefault).toBe(false);
        });

        it('should have correct default for showFeatures', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings.showFeatures).toBe(true);
        });
    });

    describe('Metadata Source Preferences', () => {
        it('should have correct default for artistSource', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings.artistSource).toBe('discogs');
        });

        it('should have correct default for albumSource', async () => {
            mockGetItem.mockResolvedValue(null);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings.albumSource).toBe('discogs');
        });

        it('should persist artistSource change to apple', async () => {
            mockGetItem.mockResolvedValue(null);
            mockSetItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.onSettingsChange((prev) => ({
                    ...prev,
                    artistSource: 'apple',
                }));
            });

            expect(result.current.settings.artistSource).toBe('apple');
        });

        it('should persist albumSource change to musicbrainz', async () => {
            mockGetItem.mockResolvedValue(null);
            mockSetItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            await act(async () => {
                await result.current.onSettingsChange((prev) => ({
                    ...prev,
                    albumSource: 'musicbrainz',
                }));
            });

            expect(result.current.settings.albumSource).toBe('musicbrainz');
        });
    });

    describe('Settings Persistence (App Restart Simulation)', () => {
        it('should persist settings across hook remounts', async () => {
            mockGetItem.mockResolvedValue(JSON.stringify(customSettings));

            // First mount
            const { result, unmount } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.settings).toEqual(customSettings);

            // Unmount (simulates app being closed)
            unmount();

            // Second mount (simulates app restart)
            const { result: result2 } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result2.current.isLoading).toBe(false);
            });

            expect(result2.current.settings).toEqual(customSettings);
            expect(mockGetItem).toHaveBeenCalledTimes(2);
        });

        it('should save all settings correctly for later retrieval', async () => {
            mockGetItem.mockResolvedValue(null);
            mockSetItem.mockResolvedValue(undefined);

            const { result } = renderHook(() => useSettings());

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            // Update to custom settings
            await act(async () => {
                await result.current.onSettingsChange(customSettings);
            });

            // Verify the saved value
            const savedCall = mockSetItem.mock.calls[0];
            expect(savedCall[0]).toBe('scrobbler-for-discogs-settings');
            const savedSettings = JSON.parse(savedCall[1]);

            // Verify all settings were saved correctly
            expect(savedSettings.selectAllTracksPerRelease).toBe(false);
            expect(savedSettings.selectSubtracksByDefault).toBe(false);
            expect(savedSettings.showFeatures).toBe(false);
            expect(savedSettings.selectFeaturesByDefault).toBe(true);
            expect(savedSettings.artistSource).toBe('apple');
            expect(savedSettings.albumSource).toBe('musicbrainz');
        });
    });
});