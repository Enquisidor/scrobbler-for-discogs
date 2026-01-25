// Jest setup file for Web
// Enable Immer MapSet plugin for Redux slices that use Set
const { enableMapSet } = require('immer');
enableMapSet();

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  pathname: '/',
  search: '',
  replace: jest.fn(),
};
delete window.location;
window.location = mockLocation;

// Mock window.history
window.history.replaceState = jest.fn();

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock localStorage (used by AsyncStorage web implementation)
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock @react-native-async-storage/async-storage for web
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
}));

// Mock crypto-js for MD5 hashing
jest.mock('crypto-js', () => ({
  MD5: jest.fn((message) => ({
    toString: () => 'mock-md5-hash',
  })),
}));
