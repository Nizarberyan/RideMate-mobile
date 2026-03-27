import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronLeft, CheckCircle2, XCircle, Info, Calendar } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Notification } from '../../src/api/client';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await client.notifications.getAll();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [client]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadNotifications(true);
  };

  const markAsRead = async (id: string) => {
    try {
      await client.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error('Failed to mark as read', e);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read immediately
    if (!notification.read) {
      markAsRead(notification.id);
    }

    const rideId = notification.data?.rideId;
    if (rideId) {
      router.push(`/rides/${rideId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'BOOKING_CONFIRMED':
        return <CheckCircle2 size={20} color="#10b981" />;
      case 'BOOKING_REJECTED':
      case 'BOOKING_CANCELLED':
      case 'RIDE_CANCELLED':
        return <XCircle size={20} color="#ef4444" />;
      case 'NEW_BOOKING':
        return <Bell size={20} color={theme.primary} />;
      default:
        return <Info size={20} color={theme.textMuted} />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
        >
          <ChevronLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('notifications.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Bell size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('notifications.empty.title')}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {t('notifications.empty.subtitle')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {notifications.map((notification, i) => {
            const date = new Date(notification.createdAt);
            const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            const type = notification.data?.type || '';

            return (
              <Animated.View key={notification.id} entering={FadeInDown.delay(i * 50).duration(600).springify()}>
                <TouchableOpacity
                  style={[
                    styles.notificationCard, 
                    { backgroundColor: theme.surface },
                    !notification.read && { borderLeftWidth: 4, borderLeftColor: theme.primary }
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                    {getIcon(type)}
                  </View>
                  <View style={styles.textContainer}>
                    <View style={styles.headerRow}>
                      <Text style={[styles.notificationTitle, { color: theme.text }]}>{notification.title}</Text>
                      {!notification.read && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
                    </View>
                    <Text style={[styles.notificationMessage, { color: theme.textMuted }]}>{notification.message}</Text>
                    <View style={styles.footerRow}>
                      <Calendar size={12} color={theme.textMuted} style={{ marginRight: 4 }} />
                      <Text style={[styles.dateText, { color: theme.textMuted }]}>{dateStr}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationMessage: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
