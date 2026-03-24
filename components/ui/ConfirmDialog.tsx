import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export interface DialogAction {
  label: string;
  onPress: () => void;
  style?: 'default' | 'destructive' | 'cancel';
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actions: DialogAction[];
  onDismiss?: () => void;
}

export function ConfirmDialog({ visible, title, message, icon, actions, onDismiss }: ConfirmDialogProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(400);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.8 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 180 });
      translateY.value = withTiming(400, { duration: 220, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onDismiss} />

        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: theme.surface,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          {/* Drag pill */}
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {/* Title row — icon inline if provided */}
          <View style={styles.titleRow}>
            {icon && <View style={styles.titleIcon}>{icon}</View>}
            <Text style={[styles.title, { color: theme.text, flex: 1 }]}>{title}</Text>
          </View>

          {/* Message */}
          {message ? (
            <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.actions}>
            {actions.map((action, index) => {
              const isDestructive = action.style === 'destructive';
              const isCancel = action.style === 'cancel';

              return (
                <TouchableOpacity
                  key={index}
                  onPress={action.onPress}
                  activeOpacity={0.75}
                  style={[
                    styles.actionButton,
                    isDestructive && { backgroundColor: '#ef4444' },
                    isCancel && {
                      backgroundColor: 'transparent',
                      borderWidth: 1.5,
                      borderColor: theme.border,
                    },
                    !isDestructive && !isCancel && {
                      backgroundColor: isDark ? '#151515' : '#1a1a1a',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.actionText,
                      isDestructive && { color: '#fff' },
                      isCancel && { color: theme.text },
                      !isDestructive && !isCancel && {
                        color: isDark ? theme.primary : '#fff',
                      },
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    elevation: 24,
  },
  pill: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 28,
  },
  iconWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  titleIcon: {
    flexShrink: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 28,
  },
  actions: {
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  actionButton: {
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
