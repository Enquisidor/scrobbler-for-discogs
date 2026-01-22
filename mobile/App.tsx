import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initConfig } from '@libs';
import {
  DISCOGS_PERSONAL_ACCESS_TOKEN,
  DISCOGS_CONSUMER_KEY,
  DISCOGS_CONSUMER_SECRET,
  LASTFM_API_KEY,
  LASTFM_SECRET,
} from '@env';
import { store } from './src/store';
import { MainScreen } from './src/components/MainScreen';

// Initialize shared config from libs/.env (loaded via react-native-dotenv)
initConfig({
  DISCOGS_PERSONAL_ACCESS_TOKEN,
  DISCOGS_CONSUMER_KEY,
  DISCOGS_CONSUMER_SECRET,
  LASTFM_API_KEY,
  LASTFM_SECRET,
});

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <MainScreen />
        <StatusBar style="light" />
      </SafeAreaProvider>
    </Provider>
  );
}
