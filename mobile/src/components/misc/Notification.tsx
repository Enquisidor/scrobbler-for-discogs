import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onDismiss?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  onDismiss,
}) => {
  const isError = type === 'error';

  return (
    <Pressable
      style={[
        styles.container,
        isError ? styles.errorContainer : styles.successContainer,
      ]}
      onPress={onDismiss}
    >
      <Text
        style={[styles.text, isError ? styles.errorText : styles.successText]}
      >
        {message}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 50,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  successText: {
    color: '#86EFAC', // green-300
  },
  errorText: {
    color: '#FCA5A5', // red-300
  },
});
