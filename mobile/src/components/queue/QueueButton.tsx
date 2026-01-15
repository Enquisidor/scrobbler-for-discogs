import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

interface QueueButtonProps {
  queueCount: number;
  selectedTrackCount: number;
  onPress: () => void;
}

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
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{queueCount}</Text>
      </View>
      <Text style={styles.label}>Queue</Text>
      {selectedTrackCount > 0 && (
        <Text style={styles.trackCount}>{selectedTrackCount} tracks</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#1DB954', // Spotify green
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#1DB954',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trackCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});
