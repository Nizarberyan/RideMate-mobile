import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

export interface SegmentedControlOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  style?: object;
}

export function SegmentedControl({ options, selectedValue, onValueChange, style }: SegmentedControlProps) {
  const { theme, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }, style]}>
      {options.map((option) => {
        const isActive = selectedValue === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                  }
                ]}
              />
            )}
            <View style={styles.contentRow}>
              {option.icon}
              <Text 
                style={[
                  styles.label, 
                  isActive ? { color: theme.text, fontWeight: '900' } : { color: theme.textMuted, fontWeight: '700' },
                  option.icon ? { marginLeft: 8 } : null
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    height: 56,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 15,
    flexShrink: 1,
  },
});
