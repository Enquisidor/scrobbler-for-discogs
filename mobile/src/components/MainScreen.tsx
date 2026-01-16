import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { DiscogsRelease } from '@libs';
import { applyMetadataCorrections } from '@libs';

// Hooks
import { useCredentials } from '../hooks/useAuth/useCredentials';
import { useAuthHandler } from '../hooks/useAuth/useAuthHandler';
import { useSettings } from '../hooks/useSettings';

// Components
import { Header } from './layout/Header';
import { CollectionScreen } from './collection/CollectionScreen';
import { QueueButton } from './queue/QueueButton';
import { QueueSheet } from './queue/QueueSheet';
import { SettingsSheet } from './settings/SettingsSheet';
import { Notification } from './misc/Notification';

// TODO: Implement these hooks when adapting more web logic
// import { useDiscogsCollection } from '../hooks/useCollection/useDiscogsCollection';
// import { useCollectionFilters } from '../hooks/useCollection/useCollectionFilters';
// import { useQueue } from '../hooks/useQueue';

const CLIENT_PAGE_SIZE = 50;

type NotificationData = { message: string; type: 'success' | 'error' };

export const MainScreen: React.FC = () => {
  // Auth state
  const {
    credentials,
    isLoading: isCredentialsLoading,
    onCredentialsChange,
    handleDiscogsLogout,
    handleLastfmLogout,
  } = useCredentials();

  const { settings, onSettingsChange } = useSettings();

  const {
    loadingService,
    error: authError,
    handleDiscogsConnect,
    handleLastfmConnect,
  } = useAuthHandler(credentials, onCredentialsChange);

  const isDiscogsConnected = !!credentials.discogsAccessToken;

  // UI state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [queueView, setQueueView] = useState<'queue' | 'history'>('queue');
  const [notification, setNotification] = useState<NotificationData | null>(null);

  // Redux selectors
  const queue = useSelector((state: RootState) => state.queue.queue);
  const scrobbledHistory = useSelector((state: RootState) => state.queue.scrobbledHistory);
  const collection = useSelector((state: RootState) => state.collection.collection);
  const isCollectionLoading = useSelector((state: RootState) => state.collection.isLoading);
  const isSyncing = useSelector((state: RootState) => state.collection.isSyncing);
  const metadata = useSelector((state: RootState) => state.metadata.data);

  // Show notification helper
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  // Queue handlers
  const handleOpenQueue = useCallback(() => {
    setQueueView('queue');
    setIsQueueOpen(true);
  }, []);

  const handleOpenHistory = useCallback(() => {
    setQueueView('history');
    setIsQueueOpen(true);
  }, []);

  // Placeholder for collection with metadata corrections
  const collectionWithCorrections = useMemo(() => {
    return applyMetadataCorrections(collection, metadata, settings);
  }, [collection, metadata, settings]);

  // Placeholder handlers until full hooks are implemented
  const handleAddAlbumToQueue = useCallback((release: DiscogsRelease) => {
    // TODO: Implement via useQueue hook
    console.log('Add to queue:', release.id);
  }, []);

  const handleRemoveLastInstance = useCallback((releaseId: number) => {
    // TODO: Implement via useQueue hook
    console.log('Remove last instance:', releaseId);
  }, []);

  const handleRemoveAllInstances = useCallback((releaseId: number) => {
    // TODO: Implement via useQueue hook
    console.log('Remove all instances:', releaseId);
  }, []);

  const handleForceReload = useCallback(() => {
    // TODO: Implement force reload
    console.log('Force reload collection');
  }, []);

  // Calculate queue counts
  const queueCount = queue.length;
  const totalSelectedTracks = 0; // TODO: Calculate from track selection state

  if (isCredentialsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading indicator */}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Header
          isSyncing={isSyncing}
          credentials={credentials}
          loadingService={loadingService}
          handleDiscogsConnect={handleDiscogsConnect}
          onDiscogsLogout={handleDiscogsLogout}
          isCollectionLoading={isCollectionLoading}
          handleForceReload={handleForceReload}
          handleLastfmConnect={handleLastfmConnect}
          onLastfmLogout={handleLastfmLogout}
          onSettingsOpen={() => setIsSettingsOpen(true)}
        />

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onDismiss={() => setNotification(null)}
          />
        )}

        <CollectionScreen
          collection={collectionWithCorrections}
          queue={queue}
          isLoading={isCollectionLoading}
          isSyncing={isSyncing}
          hasMore={false} // TODO: Implement pagination
          onLoadMore={() => {}}
          onRefresh={handleForceReload}
          isFiltered={false}
          onAddAlbumToQueue={handleAddAlbumToQueue}
          onRemoveLastInstanceOfAlbumFromQueue={handleRemoveLastInstance}
          onRemoveAllInstancesOfAlbumFromQueue={handleRemoveAllInstances}
          onConnectDiscogs={handleDiscogsConnect}
          isConnectingDiscogs={loadingService === 'discogs'}
          settings={settings}
          metadata={metadata}
          numColumns={3}
        />
      </View>

      {isDiscogsConnected && (
        <QueueButton
          queueCount={queueCount}
          selectedTrackCount={totalSelectedTracks}
          onPress={handleOpenQueue}
        />
      )}

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />

      <QueueSheet
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        view={queueView}
        queue={queue}
        scrobbledHistory={scrobbledHistory}
        settings={settings}
        isLastfmConnected={!!credentials.lastfmSessionKey}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // gray-900
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
