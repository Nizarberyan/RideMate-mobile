import React from 'react';
import { 
  StyleSheet, 
  View, 
  ViewStyle, 
  Text, 
  TextStyle, 
  Pressable 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeInDown
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subTitle?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  headerStyle?: ViewStyle;
  delay?: number;
}

export const Card = ({ 
  children, 
  title, 
  subTitle, 
  icon, 
  onPress, 
  style, 
  contentStyle, 
  titleStyle, 
  headerStyle,
  delay = 0
}: CardProps) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const innerContent = (
    <>
      {(title || icon) && (
        <View style={[styles.header, headerStyle]}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <View style={styles.titleContainer}>
            {title && (
              <Text style={[styles.title, { color: theme.text }, titleStyle]}>
                {title}
              </Text>
            )}
            {subTitle && (
              <Text style={[styles.subTitle, { color: theme.textMuted }]}>
                {subTitle}
              </Text>
            )}
          </View>
        </View>
      )}
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </>
  );

  const cardStyle = [
    styles.card, 
    { 
      backgroundColor: theme.surface, 
      borderColor: theme.border,
      shadowColor: '#000',
    }, 
    animatedStyle,
    style
  ];

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()}>
      {onPress ? (
        <AnimatedPressable 
          style={cardStyle}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {innerContent}
        </AnimatedPressable>
      ) : (
        <Animated.View style={cardStyle}>
          {innerContent}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    // Styling for icon if needed
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  content: {
    // Content styling
  },
});
