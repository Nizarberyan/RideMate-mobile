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
  const { theme } = useTheme();
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
      borderColor: error ? '#ef4444' : borderColor,
      borderWidth: 1.5,
      transform: [{ scale: withTiming(focused.value ? 1.01 : 1, { duration: 200 }) }]
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label, 
          { color: theme.textMuted }, 
          labelStyle
        ]}>
          {label}
        </Text>
      )}
      
      <AnimatedView style={[
        styles.inputWrapper, 
        { 
          backgroundColor: theme.background, 
        },
        multiline && styles.textArea,
        inputWrapperStyle, // Moved after internal background to allow override
        animatedWrapperStyle,
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input, 
            { color: theme.text }, 
            inputStyle
          ]}
          placeholderTextColor={theme.textMuted}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </AnimatedView>
      
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>{helperText}</Text>
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
