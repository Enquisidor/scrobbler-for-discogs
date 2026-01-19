import React, { useState } from 'react';
import { Modal, View, Text, Pressable, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Settings, MetadataSource } from '@libs';
import { MetadataSourceType, colors, settingsStyles, dropdownStyles } from '@libs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { SettingsIcon } from '../misc/Icons';

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
  <View style={[settingsStyles.settingRow, disabled && settingsStyles.settingRowDisabled]}>
    <View style={settingsStyles.settingInfo}>
      <Text style={settingsStyles.settingLabel}>{label}</Text>
      <Text style={settingsStyles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={checked}
      onValueChange={onChange}
      trackColor={{ true: colors.primary, false: colors.gray[600] }}
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
    <View style={settingsStyles.settingRow}>
      <View style={settingsStyles.settingInfo}>
        <Text style={settingsStyles.settingLabel}>{label}</Text>
        <Text style={settingsStyles.settingDescription}>{description}</Text>
      </View>
      <Pressable
        style={dropdownStyles.trigger}
        onPress={() => setIsPickerOpen(true)}
      >
        <Text style={dropdownStyles.triggerText}>{sourceLabels[value]}</Text>
        <Text style={dropdownStyles.arrow}>▼</Text>
      </Pressable>

      <Modal
        visible={isPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPickerOpen(false)}
      >
        <Pressable style={dropdownStyles.overlay} onPress={() => setIsPickerOpen(false)}>
          <View style={dropdownStyles.container}>
            <View style={dropdownStyles.header}>
              <Text style={dropdownStyles.headerTitle}>{label}</Text>
            </View>
            {sources.map((source) => (
              <Pressable
                key={source}
                style={[
                  dropdownStyles.option,
                  value === source && dropdownStyles.optionSelected,
                ]}
                onPress={() => {
                  onChange(source);
                  setIsPickerOpen(false);
                }}
              >
                <Text
                  style={[
                    dropdownStyles.optionText,
                    value === source && dropdownStyles.optionTextSelected,
                  ]}
                >
                  {sourceLabels[source]}
                </Text>
                {value === source && <Text style={dropdownStyles.checkmark}>✓</Text>}
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
      <SafeAreaView style={settingsStyles.container} edges={['top']}>
        <View style={settingsStyles.header}>
          <View style={settingsStyles.headerLeft}>
            <SettingsIcon size={24} color={colors.gray[300]} />
            <Text style={settingsStyles.title}>Settings</Text>
          </View>
          <Pressable onPress={onClose} style={settingsStyles.closeButton}>
            <Text style={settingsStyles.closeText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView style={settingsStyles.content}>
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Queue Defaults</Text>

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

          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Featured Artists</Text>

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

          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Metadata Sources</Text>
            <Text style={settingsStyles.sectionDescription}>
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

          <View style={[settingsStyles.section, settingsStyles.dangerSection]}>
            <Text style={settingsStyles.dangerSectionTitle}>Danger Zone</Text>

            <View style={settingsStyles.settingRow}>
              <View style={settingsStyles.settingInfo}>
                <Text style={settingsStyles.settingLabel}>Reset Application</Text>
                <Text style={settingsStyles.settingDescription}>
                  Clear all cached data, settings, and credentials.
                </Text>
              </View>
              <Pressable style={settingsStyles.resetButton} onPress={handleResetApp}>
                <Text style={settingsStyles.resetButtonText}>Reset App</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
