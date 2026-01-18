import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

interface QueueButtonProps {
  queueCount: number;
  selectedTrackCount: number;
  onPress: () => void;
}

// Vinyl icon as a simple circle with inner circle (mimics web VinylIcon)
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
    backgroundColor: '#181818', // gray-800
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3e3e3e', // gray-600
  },
  inner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b3b3b3', // gray-400
  },
});

export const QueueButton: React.FC<QueueButtonProps> = ({
  queueCount,
  selectedTrackCount,
  onPress,
}) => {
  if (queueCount === 0) {
    return null;
  }

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <VinylIcon />

      {/* Blue badge (album count) on top-left - matches web */}
      <View style={styles.albumBadge}>
        <Text style={styles.badgeText}>{queueCount}</Text>
      </View>

      {/* Red badge (track count) on top-right - matches web */}
      {selectedTrackCount > 0 && (
        <View style={styles.trackBadge}>
          <Text style={styles.badgeText}>{selectedTrackCount}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#282828', // gray-700
    borderRadius: 28,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  albumBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#2563eb', // blue-600
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#121212', // gray-900
  },
  trackBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444', // red-500
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#121212', // gray-900
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
