import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import Slider from '@react-native-community/slider';
import {
  decomposeTimeOffset,
  formatTimeOffset,
  TIME_OFFSETS,
  TimeUnit,
  MAX_FUTURE_SECONDS,
  MAX_PAST_SECONDS,
  colors,
  queueScrobblerStyles,
} from '@libs';
import { Loader } from '../misc/Loader';

type TimeUnitValue = typeof TimeUnit[keyof typeof TimeUnit];

interface QueueScrobblerProps {
  scrobbleTimeOffset: number;
  onScrobbleTimeOffsetChange: (offset: number) => void;
  scrobbleError: string | null;
  onScrobble: () => void;
  isLastfmConnected: boolean;
  isScrobbling: boolean;
  totalSelectedTracks: number;
}

const TIME_UNIT_OPTIONS: { value: TimeUnitValue; label: string }[] = [
  { value: TimeUnit.MINUTE, label: 'minutes' },
  { value: TimeUnit.HOUR, label: 'hours' },
  { value: TimeUnit.DAY, label: 'days' },
];

const QueueScrobbler: React.FC<QueueScrobblerProps> = ({
  scrobbleTimeOffset,
  onScrobbleTimeOffsetChange,
  scrobbleError,
  onScrobble,
  isLastfmConnected,
  isScrobbling,
  totalSelectedTracks,
}) => {
  const [isEditingTimeOffset, setIsEditingTimeOffset] = useState(false);
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const decomposed = useMemo(() => decomposeTimeOffset(scrobbleTimeOffset), [scrobbleTimeOffset]);
  const [editedTimeValue, setEditedTimeValue] = useState(String(decomposed.value));
  const [editedTimeUnit, setEditedTimeUnit] = useState<TimeUnitValue>(decomposed.unit);

  useEffect(() => {
    if (!isEditingTimeOffset) {
      const { value, unit } = decomposeTimeOffset(scrobbleTimeOffset);
      setEditedTimeValue(String(value));
      setEditedTimeUnit(unit);
    }
  }, [scrobbleTimeOffset, isEditingTimeOffset]);

  const handleTimeEditCommit = () => {
    let multiplier = 60;
    if (editedTimeUnit === TimeUnit.HOUR) multiplier = 3600;
    if (editedTimeUnit === TimeUnit.DAY) multiplier = 86400;

    const numValue = Number(editedTimeValue) || 0;
    let totalSeconds = Math.round(numValue * multiplier);
    totalSeconds = Math.max(totalSeconds, -MAX_PAST_SECONDS);
    totalSeconds = Math.min(totalSeconds, MAX_FUTURE_SECONDS);

    onScrobbleTimeOffsetChange(totalSeconds);
    setIsEditingTimeOffset(false);
  };

  const sliderIndex = useMemo(() => {
    if (scrobbleTimeOffset === 0) return TIME_OFFSETS.findIndex(t => t.value === 0);
    const closestIndex = TIME_OFFSETS.reduce((prevIndex, curr, currIndex) => {
      const prevValue = TIME_OFFSETS[prevIndex].value;
      const prevDistance = Math.abs(prevValue - scrobbleTimeOffset);
      const currDistance = Math.abs(curr.value - scrobbleTimeOffset);
      return currDistance < prevDistance ? currIndex : prevIndex;
    }, 0);
    return closestIndex;
  }, [scrobbleTimeOffset]);

  const handleSliderChange = (value: number) => {
    const index = Math.round(value);
    const offset = TIME_OFFSETS[index]?.value ?? 0;
    onScrobbleTimeOffsetChange(offset);
  };

  const isDisabled = !isLastfmConnected || isScrobbling || totalSelectedTracks === 0;

  const getUnitLabel = (unit: TimeUnitValue) => {
    return TIME_UNIT_OPTIONS.find(o => o.value === unit)?.label || unit;
  };

  return (
    <View style={styles.container}>
      <View style={styles.sliderRow}>
        <Text style={styles.label}>When?</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={TIME_OFFSETS.length - 1}
          step={1}
          value={sliderIndex}
          onValueChange={handleSliderChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.gray[700]}
          thumbTintColor={colors.white}
        />
      </View>

      <View style={styles.timeDisplayRow}>
        {isEditingTimeOffset ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.timeInput}
              value={editedTimeValue}
              onChangeText={setEditedTimeValue}
              keyboardType="numeric"
              autoFocus
              selectTextOnFocus
              onSubmitEditing={handleTimeEditCommit}
            />
            <TouchableOpacity
              style={styles.unitSelector}
              onPress={() => setShowUnitPicker(true)}
            >
              <Text style={styles.unitText}>{getUnitLabel(editedTimeUnit)}</Text>
              <Text style={styles.unitArrow}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneButton} onPress={handleTimeEditCommit}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditingTimeOffset(true)}>
            <Text style={styles.timeDisplay}>{formatTimeOffset(scrobbleTimeOffset)}</Text>
          </TouchableOpacity>
        )}
      </View>

      {scrobbleError && <Text style={styles.errorText}>{scrobbleError}</Text>}

      <TouchableOpacity
        style={[styles.scrobbleButton, isDisabled && styles.scrobbleButtonDisabled]}
        onPress={onScrobble}
        disabled={isDisabled}
      >
        {isScrobbling ? (
          <Loader color={colors.white} />
        ) : (
          <Text style={[styles.scrobbleButtonText, isDisabled && styles.scrobbleButtonTextDisabled]}>
            Scrobble {totalSelectedTracks} {totalSelectedTracks === 1 ? 'Track' : 'Tracks'}
          </Text>
        )}
      </TouchableOpacity>

      {/* Unit Picker Modal */}
      <Modal
        visible={showUnitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Unit</Text>
            </View>
            <FlatList
              data={TIME_UNIT_OPTIONS}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    editedTimeUnit === item.value && styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setEditedTimeUnit(item.value);
                    setShowUnitPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      editedTimeUnit === item.value && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {editedTimeUnit === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: queueScrobblerStyles.container,
  sliderRow: queueScrobblerStyles.sliderRow,
  label: queueScrobblerStyles.label,
  slider: queueScrobblerStyles.slider,
  timeDisplayRow: queueScrobblerStyles.timeDisplayRow,
  timeDisplay: queueScrobblerStyles.timeDisplay,
  editContainer: queueScrobblerStyles.editContainer,
  timeInput: queueScrobblerStyles.timeInput,
  unitSelector: queueScrobblerStyles.unitSelector,
  unitText: queueScrobblerStyles.unitText,
  unitArrow: queueScrobblerStyles.unitArrow,
  doneButton: queueScrobblerStyles.doneButton,
  doneButtonText: queueScrobblerStyles.doneButtonText,
  errorText: queueScrobblerStyles.errorText,
  scrobbleButton: queueScrobblerStyles.scrobbleButton,
  scrobbleButtonDisabled: queueScrobblerStyles.scrobbleButtonDisabled,
  scrobbleButtonText: queueScrobblerStyles.scrobbleButtonText,
  scrobbleButtonTextDisabled: queueScrobblerStyles.scrobbleButtonTextDisabled,
  modalOverlay: queueScrobblerStyles.modalOverlay,
  pickerContainer: queueScrobblerStyles.pickerContainer,
  pickerHeader: queueScrobblerStyles.pickerHeader,
  pickerTitle: queueScrobblerStyles.pickerTitle,
  pickerOption: queueScrobblerStyles.pickerOption,
  pickerOptionSelected: queueScrobblerStyles.pickerOptionSelected,
  pickerOptionText: queueScrobblerStyles.pickerOptionText,
  pickerOptionTextSelected: queueScrobblerStyles.pickerOptionTextSelected,
  checkmark: queueScrobblerStyles.pickerCheckmark,
});

export default QueueScrobbler;
