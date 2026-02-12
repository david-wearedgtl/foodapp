import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppColors } from '../../constants/theme.ts';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'outline' | 'ghost';
}

/**
 * A simple, reusable button component for React Native.
 */
const Button: React.FC<ButtonProps> = ({ title, onPress, style, variant = 'primary' }) => {

  const buttonStyle = [
    styles.base,
    variant === 'primary' && styles.primary,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    style, // Apply custom style last
  ];

  const textStyle = [
    styles.textBase,
    variant === 'primary' && styles.textPrimary,
    variant === 'outline' && styles.textOutline,
    variant === 'ghost' && styles.textGhost,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyle,
        { opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={onPress}
    >
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Primary (Default)
  primary: {
    backgroundColor: AppColors.primary,
  },
  textPrimary: {
    color: AppColors.textWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  // Outline
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },
  textOutline: {
    color: AppColors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  // Ghost
  ghost: {
    backgroundColor: 'transparent',
  },
  textGhost: {
    color: AppColors.textGrey,
    fontWeight: '500',
    fontSize: 16,
  },
  textBase: {
    textTransform: 'uppercase',
  }
});

export default Button;
