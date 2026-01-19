import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';
import { colors } from '@libs';

interface LoaderProps {
  size?: 'small' | 'large';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'small',
  color = colors.white,
}) => (
  <ActivityIndicator size={size} color={color} />
);
