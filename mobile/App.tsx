import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { MainScreen } from './src/components/MainScreen';

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
