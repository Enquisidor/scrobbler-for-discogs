# Scrobbler for Discogs - Shared Library

Shared business logic, utilities, and types for both web and mobile versions of Scrobbler for Discogs.

## What's Included

### ✅ 100% Shared Code
- **Types** ([types.ts](src/types.ts)) - All TypeScript interfaces and types
- **Utilities**:
  - `queueUtils` - Track preparation, timestamp calculation
  - `collectionUtils` - Metadata correction logic
  - `collectionSyncUtils` - Collection merging
  - `formattingUtils` - Artist name formatting
  - `fuzzyUtils` - Fuzzy search algorithms (Levenshtein distance)
  - `sortCollection` - Collection sorting with multiple options
  - `credentialsUtils` - Last.fm signature generation
- **Services**:
  - `appleMusic/*` - Apple Music metadata fetching
  - `musicbrainz/*` - MusicBrainz metadata fetching

## Monorepo Structure

This library is part of a monorepo:

```
/
├── libs/          # This package - shared code
├── web/           # Web application (Vite + React)
├── mobile/        # Mobile application (Expo + React Native)
└── .github/       # CI/CD workflows
```

## Usage

### In Web App
```typescript
import { queueUtils, fuzzySearch } from '../../libs/src';
import type { DiscogsRelease, Settings } from '../../libs/src';
```

### In Mobile App
```typescript
import { queueUtils, fuzzySearch } from '../../libs';
import type { DiscogsRelease, Settings } from '../../libs';
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Watch for changes during development
npm run watch
```

## Code Reusability

- **~85%** of business logic is shared between web and mobile
- **Platform-specific implementations** handle web vs mobile differences (storage, OAuth, crypto)
- **Single source of truth** for algorithms, utilities, and types

## Architecture Benefits

1. **Maintainability** - Fix bugs in one place
2. **Consistency** - Same logic on web and mobile
3. **Type Safety** - Shared TypeScript types across platforms
4. **Testability** - Test business logic once
5. **Bundle Optimization** - Tree-shakeable exports

## CI/CD

### GitHub Actions Workflows

The monorepo uses GitHub Actions for continuous integration with path-based triggers:

- **libs CI** - Triggers on changes to `libs/**`
- **web CI** - Triggers on changes to `web/**` or `libs/**`
- **mobile CI** - Triggers on changes to `mobile/**` or `libs/**`

All workflows run on pushes to `main` and `develop` branches.

### Building

The library is built using TypeScript compiler:

```bash
npm run build  # Outputs to dist/
```

Build artifacts:
- `dist/index.js` - Compiled JavaScript
- `dist/index.d.ts` - TypeScript declarations
- `dist/**/*.js` - All compiled modules

## Testing

Tests for the shared library are located in the web and mobile app directories, as the library primarily contains utilities and types used by those applications.
