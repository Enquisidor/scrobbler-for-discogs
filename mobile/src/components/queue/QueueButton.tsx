import React from 'react';
import { Pressable, Text, View, Image, StyleSheet } from 'react-native';
import type { QueueItem, SelectedTracks } from '@libs';

interface QueueButtonProps {
  queue: QueueItem[];
  selectedTracks: SelectedTracks;
  queueCount: number;
  selectedTrackCount: number;
  onPress: () => void;
}

const MAX_ART_CIRCLES = 5;

// Vinyl icon as concentric circles
const VinylIcon = () => (
  <View style={vinylStyles.container}>
    <View style={vinylStyles.inner} />
  </View>
);

const vinylStyles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#181818',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3e3e3e',
  },
  inner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b3b3b3',
  },
});

export const QueueButton: React.FC<QueueButtonProps> = ({
  queue,
  selectedTracks,
  queueCount,
  selectedTrackCount,
  onPress,
}) => {
  if (queueCount === 0) {
    return null;
  }

  const displayedItems = queue.slice(-MAX_ART_CIRCLES);

  return (
    <View style={styles.row}>
      {/* Album art circles */}
      {displayedItems.map((item, i) => {
        const selectedCount = selectedTracks[item.instanceKey]?.size ?? 0;
        const thumb = item.basic_information.thumb;
        return (
          <View
            key={item.instanceKey}
            style={[styles.artCircleWrapper, i > 0 && styles.artCircleOverlap]}
          >
            {thumb ? (
              <Image source={{ uri: thumb }} style={styles.artCircle} />
            ) : (
              <View style={[styles.artCircle, styles.artCirclePlaceholder]} />
            )}
            {selectedCount > 0 && (
              <View style={styles.artBadge}>
                <Text style={styles.artBadgeText}>{selectedCount}</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Main queue button */}
      <Pressable
        style={[styles.button, displayedItems.length > 0 && styles.buttonOverlap]}
        onPress={onPress}
      >
        <VinylIcon />

        {/* Red badge (track count) — top-left */}
        {selectedTrackCount > 0 && (
          <View style={styles.trackBadge}>
            <Text style={styles.badgeText}>{selectedTrackCount}</Text>
          </View>
        )}

        {/* Blue badge (album count) — top-right */}
        <View style={styles.albumBadge}>
          <Text style={styles.badgeText}>{queueCount}</Text>
        </View>
      </Pressable>
    </View>
  );
};

const CIRCLE_SIZE = 36;
const OVERLAP = -10;
const BORDER_COLOR = '#121212';

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  artCircleWrapper: {
    position: 'relative',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
  },
  artCircleOverlap: {
    marginLeft: OVERLAP,
  },
  artCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    backgroundColor: '#282828',
  },
  artCirclePlaceholder: {
    backgroundColor: '#374151',
  },
  artBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  artBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#282828',
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonOverlap: {
    marginLeft: OVERLAP,
  },
  albumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  trackBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
