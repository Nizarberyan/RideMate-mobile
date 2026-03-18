import React from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Text,
  Animated
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  subLabel?: string;
}

export const Toggle = ({ value, onValueChange, label, subLabel }: ToggleProps) => {
  const { theme } = useTheme();
  
  // Animated value for the thumb position
  const [translateX] = React.useState(new Animated.Value(value ? 24 : 2));

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 24 : 2,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={() => onValueChange(!value)}
      style={styles.container}
    >
      <View style={styles.textContainer}>
        {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}
        {subLabel && <Text style={[styles.subLabel, { color: theme.textMuted }]}>{subLabel}</Text>}
      </View>
      
      <View style={[
        styles.track, 
        { 
          backgroundColor: value ? theme.primary : theme.border,
          borderColor: value ? theme.primary : theme.border 
        }
      ]}>
        <Animated.View style={[
          styles.thumb, 
          { 
            transform: [{ translateX }],
            backgroundColor: value ? '#151515' : '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }
        ]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  track: {
    width: 52,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
});
