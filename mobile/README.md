# Scrobbler for Discogs - Mobile Application

React Native mobile application for scrobbling your Discogs vinyl collection to Last.fm, built with Expo.

## Features

- 🎵 Browse and search your Discogs collection
- 📝 Queue albums for batch scrobbling
- 🎹 Track selection with comprehensive testing
- 🎨 Multiple metadata sources (Discogs, Apple Music, MusicBrainz)
- ⚡ Fast fuzzy search and sorting
- 🔄 Real-time sync with Discogs
- 🔐 Secure credential storage with expo-secure-store
- 📱 Native iOS and Android support

## Tech Stack

- **Framework**: React Native 0.81.5 + Expo 54
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Vanilla React Native StyleSheet
- **Navigation**: React Navigation 7
- **Testing**: Jest 29 + @testing-library/react-native
- **Storage**:
  - AsyncStorage for non-sensitive data
  - Expo SecureStore for credentials
- **APIs**: Discogs OAuth 1.0a, Last.fm API

## Monorepo Structure

This is part of a monorepo with shared business logic:

```
/
├── libs/          # Shared utilities, types, and business logic (~85% reuse)
├── web/           # Web application (Vite + React)
├── mobile/        # This React Native mobile app
└── .github/       # CI/CD workflows
```

## Getting Started

### Prerequisites

1. **Discogs API Keys**
   - Create an app at [Discogs Developer Settings](https://www.discogs.com/settings/developers)
   - Get your Consumer Key and Consumer Secret
   - Update keys in [src/services/discogsService.ts](src/services/discogsService.ts)
   - **Important**: Add `scrobbler-for-discogs://` as a callback URL in your Discogs app settings

2. **Last.fm API Keys**
   - Create an API account at [Last.fm API](https://www.last.fm/api/account/create)
   - Get your API Key and Shared Secret
   - Update keys in [src/hooks/useAuth/useAuthHandler.ts](src/hooks/useAuth/useAuthHandler.ts)

3. **Development Environment**
   - Node.js 20+ and npm
   - Expo CLI: `npm install -g expo-cli`
   - iOS: Xcode (Mac only) or Expo Go app
   - Android: Android Studio or Expo Go app

### Installation

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser (for testing)
npm run web
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage**: 94 tests passing
- ✅ Storage hooks (useSecureStorage, useAsyncStorage)
- ✅ Authentication hooks (useCredentials, useAuthHandler)
- ✅ Settings management (useSettings)
- ✅ Collection components (AlbumCard, CollectionScreen)
- ✅ Queue components (QueueItem, QueueSheet)

## Project Structure

```
src/
├── components/
│   ├── collection/    # Collection browsing (AlbumCard, CollectionScreen)
│   └── queue/         # Queue management (QueueItem, QueueSheet)
├── hooks/
│   ├── useAuth/       # Authentication (OAuth flows)
│   ├── useSecureStorage.ts  # Secure credential storage
│   ├── useAsyncStorage.ts   # Non-sensitive data storage
│   └── useSettings.ts       # User settings
├── services/          # API services
│   ├── discogsService.ts    # Discogs API + OAuth 1.0a
│   ├── lastfmService.ts     # Last.fm API
│   └── adapters/            # Platform adapters (crypto, storage)
├── store/             # Redux slices (TBD - will mirror web structure)
└── libs.ts            # Re-exports shared library
```

## Key Differences from Web

### Platform-Specific Implementations

| Feature | Web | Mobile |
|---------|-----|--------|
| **Storage** | localStorage | AsyncStorage + SecureStore |
| **OAuth** | window.location redirect | expo-auth-session |
| **Crypto** | CryptoJS (browser) | crypto-js + expo-crypto |
| **UI** | HTML + Tailwind | React Native StyleSheet |
| **Navigation** | Browser history | React Navigation |

### Code Reusability

- **~85%** business logic shared via `libs/`
- **100%** type definitions shared
- **100%** utilities and algorithms shared
- **0%** UI components shared (platform-specific)

## OAuth Flow

### Discogs (OAuth 1.0a)
1. App requests request token from Discogs
2. Opens browser via `expo-web-browser` to Discogs authorization page
3. User approves access
4. Discogs redirects to `scrobbler-for-discogs://auth`
5. App exchanges request token + verifier for access token
6. Credentials stored in SecureStore

### Last.fm
1. Opens browser to Last.fm authorization page
2. User approves access
3. Last.fm redirects with token
4. App exchanges token for session key
5. Session key stored in SecureStore

## Development Status

### ✅ Completed
- Project setup with Expo 54
- Jest testing infrastructure (Jest 29 + jest-expo)
- Storage hooks with comprehensive tests
- Authentication hooks with OAuth flows
- Settings management
- Collection UI components
- Queue UI components (simplified version)
- TypeScript configuration
- Removed NativeWind dependency (using vanilla RN)

### 🚧 In Progress
- Redux store integration
- Navigation setup
- App entry point (App.tsx)

### 📋 TODO
- Complete queue functionality with track selection
- Implement scrobbling logic
- Add metadata fetching integration
- Collection sync and pagination
- Error boundaries
- Performance optimization for large collections
- Platform-specific polish (iOS/Android)

## CI/CD

GitHub Actions workflow automatically:
- Runs on changes to `mobile/**` or `libs/**`
- Installs dependencies
- Runs Jest tests
- Validates TypeScript compilation

See [.github/workflows/build-mobile.yml](../.github/workflows/build-mobile.yml)

## Contributing

This project shares business logic with the web app via the `libs/` package. When making changes:

1. Put platform-agnostic logic in `libs/`
2. Keep mobile-specific code in `mobile/src/`
3. Write tests for new features
4. Ensure existing tests pass
5. Update TypeScript types in `libs/src/types.ts`

## Troubleshooting

### Jest Tests Failing
- Make sure Jest 29 is installed (not Jest 30)
- `jest-expo` requires Jest 29.x
- Run `npm install` to ensure correct versions

### Expo Dependencies
- This app uses Expo SDK 54 which requires React 19.1.0
- If you see peer dependency warnings, use `--legacy-peer-deps`

### OAuth Not Working
- Check callback URLs in Discogs/Last.fm app settings
- iOS: Ensure URL scheme is registered in app.json
- Android: Ensure intent filters are configured

## License

Built using Google AI Studio
