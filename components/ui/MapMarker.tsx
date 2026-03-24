import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Circle, Path } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface MapMarkerProps {
  color?: string;
  size?: number;
}

export function MapMarker({ color, size = 48 }: MapMarkerProps) {
  const { theme, isDark } = useTheme();
  
  // The user requested to match the colors of the app
  const primaryColor = color || theme.primary; // For the inner circle
  const secondaryColor = isDark ? '#ffffff' : '#151515'; // For the outer marker path
  const detailColor = isDark ? '#151515' : '#ffffff'; // For the crescent highlight

  return (
    <View style={[styles.container, { transform: [{ translateX: -size / 2 }, { translateY: -size }] }]} pointerEvents="none">
      <Animated.View entering={FadeInDown.springify().damping(12).delay(200)}>
        <Svg width={size} height={size} viewBox="0 0 16 16">
          <G>
            <Circle cx="8" cy="4" r="3.5" fill={primaryColor} />
            <Path 
              fill={secondaryColor} 
              d="M12 4a3.95 3.95 0 0 0-.482-1.901.5.5 0 0 0-.876.482c.234.425.358.916.358 1.419 0 1.654-1.346 3-3 3S5 5.654 5 4s1.346-3 3-3c.503 0 .994.124 1.419.358a.5.5 0 1 0 .482-.876A3.95 3.95 0 0 0 8 0C5.794 0 4 1.794 4 4c0 2.034 1.532 3.7 3.5 3.949V15.5a.5.5 0 0 0 1 0V7.949C10.468 7.7 12 6.034 12 4z"
            />
            <Path 
              fill={detailColor} 
              d="M6 4a.5.5 0 0 0 1 0c0-.551.449-1 1-1a.5.5 0 0 0 0-1c-1.103 0-2 .897-2 2z"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
    // Drop shadow adds a nice native floating feel
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  }
});
