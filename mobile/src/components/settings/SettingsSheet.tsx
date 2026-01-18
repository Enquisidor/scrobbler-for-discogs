import React, { useState } from 'react';
import { Modal, View, Text, Pressable, Switch, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Settings, MetadataSource } from '@libs';
import { MetadataSourceType } from '@libs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SettingsIcon, CloseIcon } from '../misc/Icons';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

interface SettingsToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SettingsToggle: React.FC<SettingsToggleProps> = ({ label, description, checked, onChange, disabled }) => (
  <View style={[styles.settingRow, disabled && styles.settingRowDisabled]}>
    <View style={styles.settingInfo}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={checked}
      onValueChange={onChange}
      trackColor={{ true: '#2563eb', false: '#3e3e3e' }}
      disabled={disabled}
    />
  </View>
);

interface SourceSelectProps {
  label: string;
  description: string;
  value: MetadataSource;
  onChange: (value: MetadataSource) => void;
}

const SourceSelect: React.FC<SourceSelectProps> = ({ label, description, value, onChange }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sourceLabels: Record<MetadataSource, string> = {
    [MetadataSourceType.Discogs]: 'Discogs (Default)',
    [MetadataSourceType.Apple]: 'Apple Music',
    [MetadataSourceType.MusicBrainz]: 'MusicBrainz',
  };

  const sources: MetadataSource[] = [
    MetadataSourceType.Discogs,
    MetadataSourceType.Apple,
    MetadataSourceType.MusicBrainz,
  ];

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Pressable
        style={styles.dropdown}
        onPress={() => setIsPickerOpen(true)}
      >
        <Text style={styles.dropdownText}>{sourceLabels[value]}</Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </Pressable>

      <Modal
        visible={isPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <Pressable style={styles.pickerOverlay} onPress={() => setIsPickerOpen(false)}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{label}</Text>
            </View>
            {sources.map((source) => (
              <Pressable
                key={source}
                style={[
                  styles.pickerOption,
                  value === source && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  onChange(source);
                  setIsPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    value === source && styles.pickerOptionTextSelected,
                  ]}
                >
                  {sourceLabels[source]}
                </Text>
                {value === source && <Text style={styles.pickerCheck}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const handleShowFeaturesChange = (checked: boolean) => {
    onSettingsChange({
      ...settings,
      showFeatures: checked,
      // If "show features" is turned off, "select features by default" should also be turned off.
      selectFeaturesByDefault: checked ? settings.selectFeaturesByDefault : false,
    });
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset Application',
      'Are you sure? This will log you out, clear your cached collection, and reset all settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await SecureStore.deleteItemAsync('discogs_access_token');
              await SecureStore.deleteItemAsync('discogs_access_secret');
              await SecureStore.deleteItemAsync('lastfm_session_key');
              // Note: In a real app, you'd also want to reload the app or reset navigation
              onClose();
            } catch {
              Alert.alert('Error', 'Failed to reset application');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <SettingsIcon size={24} color="#e0e0e0" />
            <Text style={styles.title}>Settings</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          {/* Queue Defaults */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Queue Defaults</Text>

            <SettingsToggle
              label="Auto-select all tracks"
              description="Automatically select all tracks when adding an album to the queue."
              checked={settings.selectAllTracksPerRelease}
              onChange={(checked) => onSettingsChange({ ...settings, selectAllTracksPerRelease: checked })}
            />

            <SettingsToggle
              label="Auto-select sub-tracks"
              description="For medley tracks, select individual parts by default."
              checked={settings.selectSubtracksByDefault}
              onChange={(checked) => onSettingsChange({ ...settings, selectSubtracksByDefault: checked })}
              disabled={!settings.selectAllTracksPerRelease}
            />
          </View>

          {/* Featured Artists */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Artists</Text>

            <SettingsToggle
              label="Show featured artists"
              description="Display 'feat.' artists next to track titles in the queue."
              checked={settings.showFeatures}
              onChange={handleShowFeaturesChange}
            />

            <SettingsToggle
              label="Auto-select features for scrobbling"
              description="Include 'feat.' artists in the scrobble data by default."
              checked={settings.selectFeaturesByDefault}
              onChange={(checked) => onSettingsChange({ ...settings, selectFeaturesByDefault: checked })}
              disabled={!settings.showFeatures}
            />
          </View>

          {/* Metadata Sources */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Metadata Sources</Text>
            <Text style={styles.sectionDescription}>
              Choose where to fetch improved metadata. External sources can provide cleaner names and fix formatting issues.
            </Text>

            <SourceSelect
              label="Artist Name Source"
              description="Source for artist names."
              value={settings.artistSource}
              onChange={(val) => onSettingsChange({ ...settings, artistSource: val })}
            />

            <SourceSelect
              label="Album Title Source"
              description="Source for album titles."
              value={settings.albumSource}
              onChange={(val) => onSettingsChange({ ...settings, albumSource: val })}
            />
          </View>

          {/* Danger Zone */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={styles.dangerSectionTitle}>Danger Zone</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Reset Application</Text>
                <Text style={styles.settingDescription}>
                  Clear all cached data, settings, and credentials.
                </Text>
              </View>
              <Pressable style={styles.resetButton} onPress={handleResetApp}>
                <Text style={styles.resetButtonText}>Reset App</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // gray-900
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828', // gray-700
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeText: {
    fontSize: 16,
    color: '#3b82f6', // blue-500
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(40, 40, 40, 0.5)', // gray-700/50
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#535353', // gray-500
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#b3b3b3', // gray-400
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#e0e0e0', // gray-300
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    color: '#b3b3b3', // gray-400
    marginTop: 2,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828', // gray-700
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#3e3e3e', // gray-600
  },
  dropdownText: {
    fontSize: 14,
    color: '#ffffff',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#b3b3b3', // gray-400
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerContainer: {
    backgroundColor: '#181818', // gray-800
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  pickerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828', // gray-700
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#282828', // gray-700
  },
  pickerOptionSelected: {
    backgroundColor: '#282828', // gray-700
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#ffffff',
  },
  pickerOptionTextSelected: {
    color: '#3b82f6', // blue-500
    fontWeight: '600',
  },
  pickerCheck: {
    fontSize: 18,
    color: '#3b82f6', // blue-500
    fontWeight: 'bold',
  },
  dangerSection: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#282828', // gray-700
    paddingTop: 16,
  },
  dangerSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ef4444', // red-500
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  resetButton: {
    backgroundColor: '#dc2626', // red-600
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
