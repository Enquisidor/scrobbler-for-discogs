import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type {
  QueueItem as QueueItemType,
  Settings,
  CombinedMetadata,
  SelectedTracks,
  SelectedFeatures,
  ArtistSelections,
} from '@libs';
import { getThemeColors } from '@libs';
import { QueueItem } from './QueueItem';

interface QueueSheetProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'queue' | 'history';
  queue: QueueItemType[];
  scrobbledHistory: QueueItemType[];
  settings: Settings;
  isLastfmConnected: boolean;
  metadata?: Record<number, CombinedMetadata>;
  selectedTracks?: SelectedTracks;
  selectedFeatures?: SelectedFeatures;
  artistSelections?: ArtistSelections;
  scrobbleTimestamps?: Record<string, Record<string, number>>;
  onRemoveItem?: (instanceKey: string) => void;
  onScrobbleItem?: (instanceKey: string) => void;
  onScrobbleAll?: () => void;
  onClearQueue?: () => void;
  isScrobbling?: boolean;
  onSelectAll?: (instanceKey: string) => void;
  onDeselectAll?: (instanceKey: string) => void;
  onToggleGroup?: (instanceKey: string, groupKeys: string[], parentKeysInGroup: string[]) => void;
  onToggle?: (instanceKey: string, trackKey: string) => void;
  onFeatureToggle?: (instanceKey: string, trackKey: string) => void;
  onArtistToggle?: (instanceKey: string, trackKey: string, artistName: string) => void;
  onToggleParent?: (instanceKey: string, parentIndex: number, subTrackKeys: string[]) => void;
  onSelectParentAsSingle?: (instanceKey: string, parentKey: string, subTrackKeys: string[]) => void;
  onScrobbleModeToggle?: (instanceKey: string, useTrackArtist: boolean) => void;
  testID?: string;
}

export const QueueSheet: React.FC<QueueSheetProps> = ({
  isOpen,
  onClose,
  view,
  queue,
  scrobbledHistory,
  settings,
  isLastfmConnected,
  metadata = {},
  selectedTracks = {},
  selectedFeatures = {},
  artistSelections = {},
  scrobbleTimestamps = {},
  onRemoveItem = () => {},
  onScrobbleItem = () => {},
  onScrobbleAll = () => {},
  onClearQueue = () => {},
  isScrobbling = false,
  onSelectAll = () => {},
  onDeselectAll = () => {},
  onToggleGroup = () => {},
  onToggle = () => {},
  onFeatureToggle = () => {},
  onArtistToggle = () => {},
  onToggleParent = () => {},
  onSelectParentAsSingle = () => {},
  onScrobbleModeToggle = () => {},
  testID,
}) => {
  const totalSelectedTracks = Object.values(selectedTracks)
    .reduce((sum, keys) => sum + keys.size, 0);

  const hasQueueItems = queue.length > 0;
  const hasHistory = scrobbledHistory.length > 0;

  const t = getThemeColors(settings.darkMode);
  const styles = useMemo(() => makeStyles(t), [settings.darkMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} testID={testID} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{view === 'history' ? 'History' : 'Queue'}</Text>
          <Pressable
            testID={testID ? `${testID}-close` : undefined}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>

        {/* Actions Bar */}
        {hasQueueItems && (
          <View style={styles.actionsBar}>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {queue.length} album{queue.length !== 1 ? 's' : ''} • {totalSelectedTracks} track{totalSelectedTracks !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <Pressable
                testID={testID ? `${testID}-clear` : undefined}
                style={styles.clearButton}
                onPress={onClearQueue}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
              <Pressable
                testID={testID ? `${testID}-scrobble-all` : undefined}
                style={[styles.scrobbleAllButton, (isScrobbling || !isLastfmConnected) && styles.buttonDisabled]}
                onPress={onScrobbleAll}
                disabled={isScrobbling || totalSelectedTracks === 0 || !isLastfmConnected}
              >
                <Text style={styles.scrobbleAllButtonText}>
                  {isLastfmConnected ? 'Scrobble All' : 'Connect Last.fm'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Empty State */}
          {!hasQueueItems && !hasHistory && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Your queue is empty</Text>
              <Text style={styles.emptyText}>
                Tap albums in your collection to add them to the queue for scrobbling.
              </Text>
            </View>
          )}

          {/* Queue Items */}
          {hasQueueItems && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ready to Scrobble</Text>
              {queue.map((item) => (
                <QueueItem
                  key={item.instanceKey}
                  testID={testID ? `${testID}-item-${item.instanceKey}` : undefined}
                  item={item}
                  selectedTrackKeys={selectedTracks[item.instanceKey] || new Set()}
                  selectedFeatures={selectedFeatures[item.instanceKey] || new Set()}
                  artistSelections={artistSelections[item.instanceKey] || {}}
                  scrobbleTimestamps={scrobbleTimestamps[item.instanceKey] || {}}
                  settings={settings}
                  metadata={metadata[item.id]}
                  onSelectAll={() => onSelectAll(item.instanceKey)}
                  onDeselectAll={() => onDeselectAll(item.instanceKey)}
                  onToggleGroup={(groupKeys, parentKeysInGroup) => onToggleGroup(item.instanceKey, groupKeys, parentKeysInGroup)}
                  onToggle={(trackKey) => onToggle(item.instanceKey, trackKey)}
                  onFeatureToggle={(trackKey) => onFeatureToggle(item.instanceKey, trackKey)}
                  onArtistToggle={(trackKey, artistName) => onArtistToggle(item.instanceKey, trackKey, artistName)}
                  onToggleParent={(parentIndex, subTrackKeys) => onToggleParent(item.instanceKey, parentIndex, subTrackKeys)}
                  onSelectParentAsSingle={(parentKey, subTrackKeys) => onSelectParentAsSingle(item.instanceKey, parentKey, subTrackKeys)}
                  onRemoveAlbumInstanceFromQueue={() => onRemoveItem(item.instanceKey)}
                  onScrobbleModeToggle={(useTrackArtist) => onScrobbleModeToggle(item.instanceKey, useTrackArtist)}
                  onScrobbleSingleRelease={() => onScrobbleItem(item.instanceKey)}
                  isScrobbling={isScrobbling}
                  isHistoryItem={false}
                />
              ))}
            </View>
          )}

          {/* History */}
          {hasHistory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recently Scrobbled</Text>
              {scrobbledHistory.map((item) => (
                <QueueItem
                  key={`history-${item.instanceKey}`}
                  testID={testID ? `${testID}-history-${item.instanceKey}` : undefined}
                  item={item}
                  selectedTrackKeys={new Set()}
                  selectedFeatures={new Set()}
                  artistSelections={{}}
                  scrobbleTimestamps={{}}
                  settings={settings}
                  metadata={metadata[item.id]}
                  onSelectAll={() => {}}
                  onDeselectAll={() => {}}
                  onToggleGroup={() => {}}
                  onToggle={() => {}}
                  onFeatureToggle={() => {}}
                  onArtistToggle={() => {}}
                  onToggleParent={() => {}}
                  onSelectParentAsSingle={() => {}}
                  onRemoveAlbumInstanceFromQueue={() => {}}
                  onScrobbleModeToggle={() => {}}
                  onScrobbleSingleRelease={() => {}}
                  isScrobbling={false}
                  isHistoryItem={true}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const makeStyles = (t: ReturnType<typeof getThemeColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  headerTitle: {
    color: t.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: t.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: t.border,
  },
  statsContainer: {
    flex: 1,
  },
  statsText: {
    color: t.textMuted,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: t.bgDivider,
    borderRadius: 20,
  },
  clearButtonText: {
    color: t.text,
    fontSize: 14,
    fontWeight: '600',
  },
  scrobbleAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#d51007',
    borderRadius: 20,
  },
  scrobbleAllButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    color: t.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: t.textMuted,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: t.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
});

export default QueueSheet;
