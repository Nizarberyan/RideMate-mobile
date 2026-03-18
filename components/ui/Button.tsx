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
  const { theme, isDark } = useTheme();
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
          backgroundColor: isDark ? '#3d1212' : '#fee2e2',
        };
      case 'black':
        return { 
          backgroundColor: isDark ? theme.primary : '#151515',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        };
      case 'brand':
        return { 
          backgroundColor: '#151515',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
        };
      default:
        return { backgroundColor: theme.primary };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return { color: '#151515' };
      case 'secondary':
      case 'outline':
        return { color: theme.text };
      case 'danger':
        return { color: '#ef4444' };
      case 'black':
        return { color: isDark ? '#151515' : '#ffffff' };
      case 'brand':
        return { color: '#C1F11D' };
      default:
        return { color: '#151515' };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return { height: 44, paddingHorizontal: 16, borderRadius: 12 };
      case 'md':
        return { height: 56, paddingHorizontal: 24, borderRadius: 18 };
      case 'lg':
        return { height: 64, paddingHorizontal: 32, borderRadius: 24 };
      default:
        return { height: 56, paddingHorizontal: 24, borderRadius: 18 };
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'sm':
        return { fontSize: 14, fontWeight: '800' };
      case 'md':
        return { fontSize: 16, fontWeight: '800' };
      case 'lg':
        return { fontSize: 18, fontWeight: '900' };
      default:
        return { fontSize: 16, fontWeight: '800' };
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <AnimatedPressable 
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
          <Text style={[styles.text, getTextSizeStyle(), getTextStyle(), textStyle]}>{label}</Text>
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
    letterSpacing: -0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});
