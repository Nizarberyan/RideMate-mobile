import React from 'react';
import {
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Pressable,
  PressableProps
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'black' | 'brand';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
}

export const Button = ({
  label,
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  style,
  textStyle,
  disabled,
  ...props
}: ButtonProps) => {
  const { theme, isDark, spacing, typography } = useTheme();
  const scale = useSharedValue(1);

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.primary,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'secondary':
        return {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: theme.border,
          borderWidth: 1
        };
      case 'danger':
        return {
          backgroundColor: theme.dangerBg,
        };
      case 'black':
        return {
          backgroundColor: isDark ? theme.primary : theme.text,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'brand':
        return {
          backgroundColor: theme.text,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 5,
        };
      default:
        return { backgroundColor: theme.primary };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: isDark ? theme.background : theme.text };
      case 'secondary':
      case 'outline':
        return { color: theme.text };
      case 'danger':
        return { color: theme.danger };
      case 'black':
        return { color: isDark ? theme.background : theme.background };
      case 'brand':
        return { color: theme.primary };
      default:
        return { color: isDark ? theme.background : theme.text };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { height: 44, paddingHorizontal: spacing.lg, borderRadius: 12 };
      case 'md':
        return { height: 56, paddingHorizontal: spacing.xl, borderRadius: 18 };
      case 'lg':
        return { height: 64, paddingHorizontal: spacing.xxl, borderRadius: 24 };
      default:
        return { height: 56, paddingHorizontal: spacing.xl, borderRadius: 18 };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return typography.subtextBold;
      case 'md':
        return typography.bodyBold;
      case 'lg':
        return typography.h3;
      default:
        return typography.bodyBold;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        getSizeStyle(),
        getVariantStyle(),
        disabled && styles.disabled,
        animatedStyle,
        style
      ]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextStyle().color} />
      ) : (
        <>
          {icon}
          <Text 
            style={[getTextSizeStyle(), styles.text, getTextStyle(), textStyle]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    // Removed negative letterSpacing as it breaks Arabic cursive rendering and causes measurement issues
    flexShrink: 1,
    letterSpacing: 0,
  },
  disabled: {
    opacity: 0.5,
  },
});
