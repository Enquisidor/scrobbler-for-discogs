# Scrobbler for Discogs - Web Application

A web application for scrobbling your Discogs vinyl collection to Last.fm, built with React, Vite, and TypeScript.

## Features

- 🎵 Browse and search your Discogs collection
- 📝 Queue albums for batch scrobbling
- 🎹 Advanced track selection with subtracks and featured artists
- 🎨 Multiple metadata sources (Discogs, Apple Music, MusicBrainz)
- ⚡ Fast fuzzy search and sorting
- 🔄 Real-time sync with Discogs
- 📊 Scrobble history tracking

## Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **APIs**: Discogs OAuth 1.0a, Last.fm API

## Monorepo Structure

This is part of a monorepo with shared business logic:

```
/
├── libs/          # Shared utilities and types
├── web/           # This web application
├── mobile/        # React Native mobile app
└── .github/       # CI/CD workflows
```

## Getting Started

### Prerequisites

1. **Discogs API Keys**
   - Create an app at [Discogs Developer Settings](https://www.discogs.com/settings/developers)
   - Get your Consumer Key and Consumer Secret
   - Update keys in [src/services/discogsService.ts](src/services/discogsService.ts)

2. **Last.fm API Keys**
   - Create an API account at [Last.fm API](https://www.last.fm/api/account/create)
   - Get your API Key and Shared Secret
   - Update keys in [src/hooks/useAuth/useAuthHandler.ts](src/hooks/useAuth/useAuthHandler.ts)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Project Structure

```
src/
├── components/
│   ├── collection/    # Collection browsing and filtering
│   ├── queue/         # Scrobble queue management
│   ├── settings/      # User settings
│   └── misc/          # Shared UI components
├── hooks/             # Custom React hooks
│   ├── useAuth/       # Authentication (Discogs, Last.fm)
│   ├── useCollection/ # Collection fetching and filtering
│   ├── useMetadata/   # Metadata fetching from multiple sources
│   └── useQueue.ts    # Queue management
├── services/          # API services
│   ├── discogsService.ts
│   ├── lastfmService.ts
│   └── appleMusic/    # From shared libs
├── store/             # Redux slices
└── utils/             # Utility functions (from shared libs)
```

## Screenshots

### Main Screen
<img width="1440" alt="Main collection view" src="https://github.com/user-attachments/assets/2eb15416-f282-4a31-87d4-f461bda48a17" />

### Scrobbling Queue
<img width="1440" alt="Queue management" src="https://github.com/user-attachments/assets/bcf0b7fd-afd2-4c8d-b1ae-db620a821ce1" />

### Subtracks & Features
<img width="1440" alt="Advanced track selection" src="https://github.com/user-attachments/assets/482d8bc4-0da8-47b8-8bcb-447c1ae098fc" />

### Settings
<img width="670" alt="Settings panel" src="https://github.com/user-attachments/assets/f2941d4a-3bde-4f31-948c-6f57d6e3b49a" />

## CI/CD

GitHub Actions workflow automatically:
- Runs on changes to `web/**` or `libs/**`
- Installs dependencies
- Builds the application
- Runs all tests

See [.github/workflows/build-web.yml](../.github/workflows/build-web.yml)

## Contributing

This project shares business logic with the mobile app via the `libs/` package. When making changes:

1. Put platform-agnostic logic in `libs/`
2. Keep platform-specific code in `web/src/`
3. Run tests to ensure nothing breaks
4. Update TypeScript types in `libs/src/types.ts`

## License

Built using Google AI Studio
