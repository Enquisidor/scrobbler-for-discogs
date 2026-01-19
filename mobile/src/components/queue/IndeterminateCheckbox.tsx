import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { colors, spacing } from '@libs';

interface IndeterminateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: number;
}

/**
 * A checkbox that supports three states: unchecked, checked, and indeterminate.
 * In React Native, we simulate the indeterminate state with a dash instead of a checkmark.
 */
const IndeterminateCheckbox: React.FC<IndeterminateCheckboxProps> = ({
  checked,
  indeterminate,
  onChange,
  disabled = false,
  size = 20,
}) => {
  const handlePress = () => {
    if (!disabled) {
      onChange();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        { width: size, height: size },
        checked && styles.checked,
        indeterminate && !checked && styles.indeterminate,
        disabled && styles.disabled,
      ]}
      activeOpacity={0.7}
    >
      {checked && (
        <View style={[styles.checkmark, { width: size * 0.5, height: size * 0.25 }]} />
      )}
      {indeterminate && !checked && (
        <View style={[styles.dash, { width: size * 0.5, height: 2 }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[600],
    backgroundColor: colors.gray[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  indeterminate: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  checkmark: {
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.white,
    transform: [{ rotate: '-45deg' }, { translateY: -2 }],
  },
  dash: {
    backgroundColor: colors.white,
  },
});

export default IndeterminateCheckbox;
