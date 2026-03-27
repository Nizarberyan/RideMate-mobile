import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  View, 
  TextInputProps, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  inputWrapperStyle?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = ({ 
  label, 
  error, 
  helperText, 
  leftIcon, 
  rightIcon, 
  containerStyle, 
  inputStyle, 
  labelStyle,
  inputWrapperStyle,
  multiline,
  onFocus,
  onBlur,
  ...props 
}: InputProps) => {
  const { theme, spacing, typography } = useTheme();
  const focused = useSharedValue(0);

  const handleFocus = (e: any) => {
    focused.value = withTiming(1, { duration: 200 });
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    focused.value = withTiming(0, { duration: 200 });
    onBlur?.(e);
  };

  const animatedWrapperStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focused.value,
      [0, 1],
      [theme.border, theme.primary]
    );

    return {
      borderColor: error ? theme.danger : borderColor,
      borderWidth: 1.5,
      transform: [{ scale: withTiming(focused.value ? 1.01 : 1, { duration: 200 }) }]
    };
  });

  return (
    <View style={[styles.container, { marginBottom: spacing.lg }, containerStyle]}>
      {label && (
        <Text style={[
          typography.caption, 
          { color: theme.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xs }, 
          labelStyle
        ]}>
          {label}
        </Text>
      )}
      
      <AnimatedView style={[
        styles.inputWrapper, 
        { 
          backgroundColor: theme.surface, 
          borderRadius: 16,
          paddingHorizontal: spacing.lg,
          minHeight: 56,
        },
        multiline && styles.textArea,
        animatedWrapperStyle,
        inputWrapperStyle,
      ]}>
        {leftIcon && <View style={[styles.leftIcon, { marginRight: spacing.md }]}>{leftIcon}</View>}
        
        <TextInput
          style={[
            typography.bodyBold,
            { color: theme.text, flex: 1, height: '100%', paddingVertical: spacing.md }, 
            inputStyle
          ]}
          placeholderTextColor={theme.textMuted}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && <View style={[styles.rightIcon, { marginLeft: spacing.md }]}>{rightIcon}</View>}
      </AnimatedView>
      
      {error ? (
        <Text style={[typography.subtextBold, { color: theme.danger, marginTop: spacing.xs, marginLeft: spacing.xs }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[typography.subtext, { color: theme.textMuted, marginTop: spacing.xs, marginLeft: spacing.xs }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 14,
  },
  textArea: {
    alignItems: 'flex-start',
    minHeight: 120,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
});
