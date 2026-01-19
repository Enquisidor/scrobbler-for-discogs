import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import type { Credentials } from '@libs';
import { STRINGS, colors, headerStyles, connectionButtonStyles, iconButtonStyles } from '@libs';
import { DiscogsIcon, LastfmIcon, CheckIcon, RefreshIcon, SettingsIcon } from '../misc/Icons';

interface HeaderProps {
  isSyncing: boolean;
  credentials: Credentials;
  loadingService: 'discogs' | 'lastfm' | null;
  handleDiscogsConnect: () => void;
  onDiscogsLogout: () => void;
  isCollectionLoading: boolean;
  handleForceReload: () => void;
  handleLastfmConnect: () => void;
  onLastfmLogout: () => void;
  onSettingsOpen: () => void;
  totalCount?: number;
  filteredCount?: number;
  isFiltered?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isSyncing,
  credentials,
  loadingService,
  handleDiscogsConnect,
  onDiscogsLogout,
  isCollectionLoading,
  handleForceReload,
  handleLastfmConnect,
  onLastfmLogout,
  onSettingsOpen,
  totalCount,
  filteredCount,
  isFiltered,
}) => {
  const isDiscogsConnected = !!credentials.discogsAccessToken;
  const isLastfmConnected = !!credentials.lastfmSessionKey;

  return (
    <View style={styles.container}>
      {/* Top row: Title + utility buttons */}
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{STRINGS.APP_NAME}</Text>
          {isSyncing && <ActivityIndicator size="small" color={colors.gray[400]} />}
        </View>
        <View style={styles.utilityButtons}>
          {/* Refresh Button */}
          {isDiscogsConnected && (
            <Pressable
              style={[styles.iconButton, (isSyncing || isCollectionLoading) && styles.iconButtonDisabled]}
              onPress={handleForceReload}
              disabled={isSyncing || isCollectionLoading}
            >
              <RefreshIcon size={24} color={colors.gray[400]} />
            </Pressable>
          )}
          {/* Settings Button */}
          <Pressable style={styles.iconButton} onPress={onSettingsOpen}>
            <SettingsIcon size={24} color={colors.gray[400]} />
          </Pressable>
          {/* Album count */}
          {isDiscogsConnected && totalCount !== undefined && (
            <Text style={styles.albumCount}>
              {isFiltered && filteredCount !== undefined
                ? `${filteredCount} / ${totalCount}`
                : `${totalCount}`}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom row: Connection buttons */}
      <View style={styles.buttonsRow}>
        {/* Discogs Button */}
        <Pressable
          style={[
            styles.connectionButton,
            isDiscogsConnected ? styles.connectedButton : styles.discogsButton,
          ]}
          onPress={isDiscogsConnected ? onDiscogsLogout : handleDiscogsConnect}
          disabled={!!loadingService}
        >
          {loadingService === 'discogs' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <DiscogsIcon size={20} fill="#fff" />
              {isDiscogsConnected && <CheckIcon size={16} color={colors.success} />}
              <Text style={styles.buttonText}>
                {isDiscogsConnected ? credentials.discogsUsername : STRINGS.BUTTONS.DISCOGS}
              </Text>
            </View>
          )}
        </Pressable>

        {/* Last.fm Button */}
        <Pressable
          style={[
            styles.connectionButton,
            isLastfmConnected ? styles.connectedButton : styles.lastfmButton,
          ]}
          onPress={isLastfmConnected ? onLastfmLogout : handleLastfmConnect}
          disabled={!!loadingService}
        >
          {loadingService === 'lastfm' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.buttonContent}>
              <LastfmIcon size={20} fill="#fff" />
              {isLastfmConnected && <CheckIcon size={16} color={colors.success} />}
              <Text style={styles.buttonText}>
                {isLastfmConnected ? credentials.lastfmUsername : STRINGS.BUTTONS.LASTFM}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...headerStyles.container,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    ...headerStyles.titleRow,
    marginBottom: 0,
  },
  title: headerStyles.title,
  utilityButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  albumCount: {
    color: colors.gray[400],
    fontSize: 13,
    fontWeight: '500',
  },
  buttonsRow: {
    ...headerStyles.buttonsRow,
    flexWrap: 'wrap' as const,
  },
  connectionButton: {
    ...connectionButtonStyles.base,
    flexShrink: 1,
    minWidth: 60,
  },
  connectedButton: connectionButtonStyles.connected,
  discogsButton: connectionButtonStyles.discogs,
  lastfmButton: connectionButtonStyles.lastfm,
  buttonContent: connectionButtonStyles.content,
  buttonText: {
    ...connectionButtonStyles.text,
    flexShrink: 1,
  },
  iconButton: iconButtonStyles.base,
  iconButtonDisabled: iconButtonStyles.disabled,
});
