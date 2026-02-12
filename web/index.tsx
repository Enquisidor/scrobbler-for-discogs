// Enable Immer MapSet plugin BEFORE importing store
import { enableMapSet } from 'immer';
enableMapSet();

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store, initConfig } from '@libs';
import App from './src/components/App';

// Initialize shared config from libs/.env (loaded via vite.config.ts)
initConfig({
  DISCOGS_PERSONAL_ACCESS_TOKEN: process.env.DISCOGS_PERSONAL_ACCESS_TOKEN,
  DISCOGS_CONSUMER_KEY: process.env.DISCOGS_CONSUMER_KEY,
  DISCOGS_CONSUMER_SECRET: process.env.DISCOGS_CONSUMER_SECRET,
  LASTFM_API_KEY: process.env.LASTFM_API_KEY,
  LASTFM_SECRET: process.env.LASTFM_SECRET,
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);