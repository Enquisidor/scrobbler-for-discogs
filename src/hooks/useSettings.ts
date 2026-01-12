
import { useLocalStorage } from './useLocalStorage';
import type { Settings } from 'scrobbler-for-discogs-libs';

const initialSettings: Settings = {
    selectAllTracksPerRelease: true,
    selectSubtracksByDefault: true,
    showFeatures: true,
    selectFeaturesByDefault: false,
    artistSource: 'discogs',
    albumSource: 'discogs',
};

export function useSettings() {
    const [settings, setSettings] = useLocalStorage<Settings>('vinyl-scrobbler-settings', initialSettings);
    
    return {
        settings,
        onSettingsChange: setSettings,
    };
}
