import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export type IconName = keyof typeof Ionicons.glyphMap;

export interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 22,
  color = '#0F172A',
  style,
}) => {
  return (
    <Ionicons
      name={name}
      size={size}
      color={color}
      style={style}
    />
  );
};
