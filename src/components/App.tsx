import React from 'react';
import MainScreen from './MainScreen';
import ErrorBoundary from './misc/ErrorBoundary';
import { useCredentials } from '../hooks/useCredentials';
import { useSettings } from '../hooks/useSettings';

export default function App() {
  const { 
    credentials, 
    onCredentialsChange, 
    handleDiscogsLogout, 
    handleLastfmLogout 
  } = useCredentials();
  
  const { settings, onSettingsChange } = useSettings();

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