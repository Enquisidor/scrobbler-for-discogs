import { useStorage } from './useStorage/useStorage';
import type { Settings } from '../types';
import { migrateUnifiedMetadataSource } from '../utils/metadataSourceSettings';
import { useCallback, useEffect, useRef } from 'react';


const initialSettings: Settings = {
  selectAllTracksPerRelease: true,
  selectSubtracksByDefault: true,
  showFeatures: true,
  selectFeaturesByDefault: false,
  showCredits: true,
  hideAlbumNames: false,
  darkMode: true,
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
  const didMigrateRef = useRef(false);

  useEffect(() => {
    if (isLoading || didMigrateRef.current) return;
    didMigrateRef.current = true;
    const migrated = migrateUnifiedMetadataSource(settings);
    if (
      migrated.artistSource !== settings.artistSource ||
      migrated.albumSource !== settings.albumSource
    ) {
      void setSettings(migrated);
    }
  }, [isLoading, settings, setSettings]);

  const onSettingsChange = useCallback(
    (next: Settings) => setSettings(migrateUnifiedMetadataSource(next)),
    [setSettings]
  );

  return {
    settings: migrateUnifiedMetadataSource(settings),
    isLoading,
    onSettingsChange,
  };
}
