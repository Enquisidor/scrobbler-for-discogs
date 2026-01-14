import { useAsyncStorage } from './useAsyncStorage';
import type { Settings } from 'scrobbler-for-discogs-libs';

const initialSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  artistSource: 'discogs',
  albumSource: 'discogs',
};

/**
 * Mobile settings management hook using AsyncStorage.
 * Provides settings state and method to update settings.
 */
export function useSettings() {
  const [settings, setSettings, { isLoading }] = useAsyncStorage<Settings>(
    'vinyl-scrobbler-settings',
    initialSettings
  );

  const onSettingsChange = async (newSettings: Settings | ((prev: Settings) => Settings)) => {
    await setSettings(newSettings);
  };

  return {
    settings,
    isLoading,
    onSettingsChange,
  };
}
