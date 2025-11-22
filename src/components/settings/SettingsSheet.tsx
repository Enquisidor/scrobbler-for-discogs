import React from 'react';
import type { Settings } from '../../types';
import { CloseIcon, SettingsIcon } from '../misc/Icons';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

interface SettingsToggleProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ label, description, checked, onChange, disabled }) => (
    <div className={`flex justify-between items-center py-3 ${disabled ? 'opacity-50' : ''}`}>
        <div className="pr-4">
            <label className="font-semibold text-gray-200" id={`${label}-label`}>{label}</label>
            <p className="text-sm text-gray-400" id={`${label}-desc`}>{description}</p>
        </div>
        <button
            type="button"
            className={`${checked ? 'bg-blue-600' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:cursor-not-allowed`}
            role="switch"
            aria-checked={checked}
            aria-labelledby={`${label}-label`}
            aria-describedby={`${label}-desc`}
            onClick={() => onChange(!checked)}
            disabled={disabled}
        >
            <span
                aria-hidden="true"
                className={`${checked ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
        </button>
    </div>
);


export default function SettingsSheet({ isOpen, onClose, settings, onSettingsChange }: SettingsSheetProps) {
  if (!isOpen) return null;
  
  const handleShowFeaturesChange = (checked: boolean) => {
    onSettingsChange({
        ...settings,
        showFeatures: checked,
        // If "show features" is turned off, "select features by default" should also be turned off.
        selectFeaturesByDefault: checked ? settings.selectFeaturesByDefault : false,
    });
  }

  const handleResetApp = () => {
    if (window.confirm('Are you sure? This will log you out, clear your cached collection, and reset all settings.')) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-end" onClick={onClose}>
      <div 
        className="bg-gray-900 w-full max-w-2xl mx-auto h-[90vh] rounded-t-2xl flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-gray-300"/>
            <h2 className="text-xl font-bold">Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto divide-y divide-gray-700/50">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Queue Defaults</h3>
                <SettingsToggle
                    label="Auto-select all tracks"
                    description="Automatically select all tracks when adding an album to the queue."
                    checked={settings.selectAllTracksPerRelease}
                    onChange={(checked) => onSettingsChange({ ...settings, selectAllTracksPerRelease: checked })}
                />
                <SettingsToggle
                    label="Auto-select sub-tracks"
                    description="For medley tracks, select individual parts by default."
                    checked={settings.selectSubtracksByDefault}
                    onChange={(checked) => onSettingsChange({ ...settings, selectSubtracksByDefault: checked })}
                    disabled={!settings.selectAllTracksPerRelease}
                />
            </div>
             <div className="pt-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Featured Artists</h3>
                <SettingsToggle
                    label="Show featured artists"
                    description="Display 'feat.' artists next to track titles in the queue."
                    checked={settings.showFeatures}
                    onChange={handleShowFeaturesChange}
                />
                <SettingsToggle
                    label="Auto-select features for scrobbling"
                    description="Include 'feat.' artists in the scrobble data by default."
                    checked={settings.selectFeaturesByDefault}
                    onChange={(checked) => onSettingsChange({ ...settings, selectFeaturesByDefault: checked })}
                    disabled={!settings.showFeatures}
                />
            </div>
            <div className="pt-4">
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Metadata Source</h3>
                <p className="text-xs text-gray-400 mb-3">This scrobbler can attempt to match your albums with Apple Music to provide cleaner artist and album names. When enabled, matched metadata will override Discogs data.</p>
                <SettingsToggle
                    label="Use Apple Music for Artist Names"
                    description="Use standardized artist names from Apple Music (if available)."
                    checked={settings.useAppleMusicArtist}
                    onChange={(checked) => onSettingsChange({ ...settings, useAppleMusicArtist: checked })}
                />
                 <SettingsToggle
                    label="Use Apple Music for Album Names"
                    description="Use standardized album titles from Apple Music (if available)."
                    checked={settings.useAppleMusicAlbum}
                    onChange={(checked) => onSettingsChange({ ...settings, useAppleMusicAlbum: checked })}
                />
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700">
                <h3 className="text-xs font-bold uppercase text-red-500 tracking-wider mb-2">Danger Zone</h3>
                <div className="flex justify-between items-center py-3">
                    <div>
                        <label className="font-semibold text-gray-200">Reset Application</label>
                        <p className="text-sm text-gray-400">Clear all cached data, settings, and credentials.</p>
                    </div>
                    <button 
                        onClick={handleResetApp}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-full transition-colors"
                    >
                        Reset App
                    </button>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}