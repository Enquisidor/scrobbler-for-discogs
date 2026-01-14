import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
} from 'react-native';
import type { DiscogsRelease, Settings, CombinedMetadata } from 'scrobbler-for-discogs-libs';
import { getReleaseDisplayArtist, getReleaseDisplayTitle } from 'scrobbler-for-discogs-libs';

interface AlbumCardProps {
  release: DiscogsRelease;
  onAddInstance: () => void;
  onRemoveLastInstance: () => void;
  onRemoveAllInstances: () => void;
  scrobbleCount: number;
  settings: Settings;
  metadata?: CombinedMetadata;
  testID?: string;
}

const DEFAULT_IMAGE = 'https://st.discogs.com/images/default-release.png';
const LONG_PRESS_DURATION = 5000;

export const AlbumCard: React.FC<AlbumCardProps> = ({
  release,
  onAddInstance,
  onRemoveLastInstance,
  onRemoveAllInstances,
  scrobbleCount,
  settings,
  metadata,
  testID,
}) => {
  const info = release.basic_information;
  const artistName = getReleaseDisplayArtist(release, metadata, settings);
  const title = getReleaseDisplayTitle(release, metadata, settings);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPressRef = useRef(false);

  const hasValidImage = info.cover_image && info.cover_image !== DEFAULT_IMAGE;

  const handleBadgePressIn = () => {
    wasLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      onRemoveAllInstances();
      wasLongPressRef.current = true;
    }, LONG_PRESS_DURATION);
  };

  const handleBadgePressOut = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleBadgePress = () => {
    if (wasLongPressRef.current) {
      wasLongPressRef.current = false;
      return;
    }
    onRemoveLastInstance();
  };

  return (
    <Pressable
      testID={testID}
      style={[styles.container, scrobbleCount > 0 && styles.containerSelected]}
      onPress={onAddInstance}
    >
      {hasValidImage ? (
        <Image
          source={{ uri: info.cover_image }}
          style={styles.image}
          accessibilityLabel={`${artistName} - ${title}`}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artistName}
        </Text>
      </View>

      {/* Scrobble count badge */}
      {scrobbleCount > 0 && (
        <Pressable
          testID={testID ? `${testID}-badge` : undefined}
          style={styles.badge}
          onPress={handleBadgePress}
          onPressIn={handleBadgePressIn}
          onPressOut={handleBadgePressOut}
        >
          <Text style={styles.badgeText}>{scrobbleCount}</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  containerSelected: {
    borderWidth: 4,
    borderColor: '#3b82f6',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: 12,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  artist: {
    color: '#d1d5db',
    fontSize: 11,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default AlbumCard;
