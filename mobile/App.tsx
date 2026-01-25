import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initConfig, useHydrateStore } from '@libs';
import {
  DISCOGS_PERSONAL_ACCESS_TOKEN,
  DISCOGS_CONSUMER_KEY,
  DISCOGS_CONSUMER_SECRET,
  LASTFM_API_KEY,
  LASTFM_SECRET,
} from '@env';
import { store } from '../libs/src/store';
import { MainScreen } from './src/components/MainScreen';

// Initialize shared config from libs/.env (loaded via react-native-dotenv)
initConfig({
  DISCOGS_PERSONAL_ACCESS_TOKEN,
  DISCOGS_CONSUMER_KEY,
  DISCOGS_CONSUMER_SECRET,
  LASTFM_API_KEY,
  LASTFM_SECRET,
});

// Inner component that uses hooks (must be inside Provider)
function AppContent() {
  const isHydrated = useHydrateStore();

  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <MainScreen />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
}
