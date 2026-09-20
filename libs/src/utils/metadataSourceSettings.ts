import type { MetadataSource, Settings } from '../types';
import { MetadataSourceType } from '../types';

export type ExternalMetadataSource =
  | typeof MetadataSourceType.Apple
  | typeof MetadataSourceType.MusicBrainz
  | typeof MetadataSourceType.Deezer;

const EXTERNAL_SOURCES: ExternalMetadataSource[] = [
  MetadataSourceType.Apple,
  MetadataSourceType.MusicBrainz,
  MetadataSourceType.Deezer,
];

export function isExternalMetadataSource(source: MetadataSource): source is ExternalMetadataSource {
  return EXTERNAL_SOURCES.includes(source as ExternalMetadataSource);
}

/** Active provider when at least one of artist/album is enabled; otherwise null. */
export function getActiveMetadataProvider(settings: Settings): ExternalMetadataSource | null {
  if (isExternalMetadataSource(settings.artistSource)) return settings.artistSource;
  if (isExternalMetadataSource(settings.albumSource)) return settings.albumSource;
  return null;
}

/** Provider shown in the settings dropdown (defaults to Apple when both toggles are off). */
export function getMetadataProviderForUi(settings: Settings): ExternalMetadataSource {
  return getActiveMetadataProvider(settings) ?? MetadataSourceType.Apple;
}

export function isCorrectingArtist(settings: Settings): boolean {
  return settings.artistSource !== MetadataSourceType.Discogs;
}

export function isCorrectingAlbum(settings: Settings): boolean {
  return settings.albumSource !== MetadataSourceType.Discogs;
}

/** Coerce mismatched dual providers to a single source (prefer artist). */
export function migrateUnifiedMetadataSource(settings: Settings): Settings {
  const { artistSource, albumSource } = settings;
  if (
    isExternalMetadataSource(artistSource) &&
    isExternalMetadataSource(albumSource) &&
    artistSource !== albumSource
  ) {
    return { ...settings, albumSource: artistSource };
  }
  return settings;
}

export function withMetadataProvider(settings: Settings, provider: ExternalMetadataSource): Settings {
  return {
    ...settings,
    artistSource: isCorrectingArtist(settings) ? provider : MetadataSourceType.Discogs,
    albumSource: isCorrectingAlbum(settings) ? provider : MetadataSourceType.Discogs,
  };
}

export function withCorrectArtist(
  settings: Settings,
  enabled: boolean,
  provider: ExternalMetadataSource = getMetadataProviderForUi(settings)
): Settings {
  return {
    ...settings,
    artistSource: enabled ? provider : MetadataSourceType.Discogs,
  };
}

export function withCorrectAlbum(
  settings: Settings,
  enabled: boolean,
  provider: ExternalMetadataSource = getMetadataProviderForUi(settings)
): Settings {
  return {
    ...settings,
    albumSource: enabled ? provider : MetadataSourceType.Discogs,
  };
}
