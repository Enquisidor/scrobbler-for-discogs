import { useLocalStorage } from './useLocalStorage';
import type { Settings } from '../types';

const initialSettings: Settings = {
    selectAllTracksPerRelease: true,
    selectSubtracksByDefault: true,
    showFeatures: true,
    selectFeaturesByDefault: false,
    useAppleMusicArtist: false,
    useAppleMusicAlbum: false,
};

export function useSettings() {
    const [settings, setSettings] = useLocalStorage<Settings>('vinyl-scrobbler-settings', initialSettings);
    
    return {
        settings,
        onSettingsChange: setSettings,
    };
}