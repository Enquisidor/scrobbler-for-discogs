
import React from 'react';
import MainScreen from './MainScreen';
import ErrorBoundary from './misc/ErrorBoundary';
import { useCredentials, useSettings, useHydrateStore } from '@libs';
import { Loader } from './misc/Loader';

export default function App() {
  const isHydrated = useHydrateStore();

  const {
    credentials,
    onCredentialsChange,
    handleDiscogsLogout,
    handleLastfmLogout
  } = useCredentials();

  const { settings, onSettingsChange } = useSettings();

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-900 font-sans">
        <MainScreen
          credentials={credentials}
          onCredentialsChange={onCredentialsChange}
          onDiscogsLogout={handleDiscogsLogout}
          onLastfmLogout={handleLastfmLogout}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </div>
    </ErrorBoundary>
  );
}
