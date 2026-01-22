import { useStorage } from './useStorage';
import type { Settings } from '../types';


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
  const [settings, setSettings, { isLoading }] = useStorage<Settings>(
    'scrobbler-for-discogs-settings',
    initialSettings
  );

  return {
    settings,
    isLoading,
    onSettingsChange: setSettings,
  };
}
