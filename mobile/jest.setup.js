// Jest setup file for React Native / Expo
// Note: jest-expo preset already handles core expo mocks via its setup.js
// We only need to add mocks for specific modules we're testing

// Mock expo-secure-store with jest.requireActual for partial mocking
jest.mock('expo-secure-store', () => {
  const actual = jest.requireActual('expo-secure-store');
  return {
    ...actual,
    getItemAsync: jest.fn(),
    setItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock expo-auth-session with jest.requireActual for partial mocking
jest.mock('expo-auth-session', () => {
  const actual = jest.requireActual('expo-auth-session');
  return {
    ...actual,
    makeRedirectUri: jest.fn(() => 'scrobbler-for-discogs://callback'),
    useAuthRequest: jest.fn(),
    ResponseType: { Token: 'token' },
  };
});

// Mock expo-web-browser with jest.requireActual for partial mocking
jest.mock('expo-web-browser', () => {
  const actual = jest.requireActual('expo-web-browser');
  return {
    ...actual,
    maybeCompleteAuthSession: jest.fn(),
    openAuthSessionAsync: jest.fn(),
  };
});

// Silence console warnings during tests (optional)
// global.console.warn = jest.fn();
