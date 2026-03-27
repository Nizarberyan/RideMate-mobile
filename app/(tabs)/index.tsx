import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ride, Booking, Notification } from '../../src/api/client';
import { Car, Leaf, ArrowRight, MapPin, Calendar, Clock, Bell } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

export default function Dashboard() {
  const { user, client, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, isDark, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState<'driving' | 'riding'>('riding');
  const [drivingRides, setDrivingRides] = useState<Ride[]>([]);
  const [ridingBookings, setRidingBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      if (activeTab === 'driving') {
        const myRides = await client.rides.getMine();
        setDrivingRides(myRides);
      } else {
        const myBookings = await client.bookings.getMine();
        setRidingBookings(myBookings);
      }

      const notifs = await client.notifications.getAll();
      setNotifications(notifs);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [client, activeTab]);

  useEffect(() => {
    if (authLoading || !user) return;
    setIsLoading(true);
    loadDashboardData();
  }, [loadDashboardData, activeTab, authLoading, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  if (authLoading || !user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderDrivingEmpty = () => (
    <Card style={styles.emptyCard} delay={200}>
      <View style={styles.emptyState}>
        <Car size={40} color={theme.textMuted} accessibilityLabel="Car icon" />
        <Text style={[typography.h2, { color: theme.textMuted, marginTop: spacing.lg }]}>{t('dashboard.empty.noRides')}</Text>
      </View>
    </Card>
  );

  const renderDrivingRide = ({ item: ride, index }: { item: Ride, index: number }) => (
    <Card 
      key={ride.id} 
      style={styles.rideCard}
      contentStyle={{ padding: 0 }}
      delay={200 + (index * 50)}
      onPress={() => router.push(`/rides/${ride.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.locationRow}>
          <Text style={[typography.h3, { color: theme.text, flex: 1 }]} numberOfLines={1}>{ride.startLocation}</Text>
          <ArrowRight size={16} color={theme.textMuted} style={{ marginHorizontal: spacing.sm, flexShrink: 0 }} />
          <Text style={[typography.h3, { color: theme.text, flex: 1 }]} numberOfLines={1}>{ride.endLocation}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.overlay, flexShrink: 0 }]}>
          <Text style={[typography.label, { color: isDark ? theme.primary : '#4d7c0f' }]}>{ride.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={[typography.subtext, { color: theme.textMuted, marginBottom: spacing.lg }]}>
        {new Date(ride.departureDatetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(ride.departureDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <View style={[styles.cardFooter, { borderTopColor: theme.border, paddingTop: spacing.lg }]}>
        <Text style={[typography.subtextBold, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
          {t('dashboard.card.seatsLeft', { count: ride.availableSeats })}
        </Text>
        <View style={[styles.bookingsBadge, { backgroundColor: theme.primary, flexShrink: 0 }]}>
          <Text style={[typography.subtextBold, { color: '#151515' }]}>
            {t('dashboard.card.bookings', { count: ride.bookings?.length || 0 })}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderRidingEmpty = () => (
    <Card style={styles.emptyCard} delay={200}>
      <View style={styles.emptyState}>
        <MapPin size={40} color={theme.textMuted} accessibilityLabel="Map pin icon" />
        <Text style={[typography.h2, { color: theme.textMuted, marginTop: spacing.lg, marginBottom: spacing.lg, textAlign: 'center' }]}>
          {t('dashboard.empty.noBookings')}
        </Text>
        <TouchableOpacity 
          style={[styles.searchLink, { backgroundColor: theme.shadow }]}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={[typography.subtextBold, { color: theme.primary }]}>{t('dashboard.empty.findRide')}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderRidingBooking = ({ item: booking, index }: { item: Booking, index: number }) => {
    const ride = booking.ride;
    if (!ride) return null;
    
    return (
      <Card 
        key={booking.id} 
        style={styles.rideCard}
        contentStyle={{ padding: 0 }}
        delay={200 + (index * 50)}
        onPress={() => router.push(`/rides/${ride.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.locationRow}>
            <Text style={[typography.h3, { color: theme.text, flex: 1 }]} numberOfLines={1}>{ride.startLocation}</Text>
            <ArrowRight size={16} color={theme.textMuted} style={{ marginHorizontal: spacing.sm, flexShrink: 0 }} />
            <Text style={[typography.h3, { color: theme.text, flex: 1 }]} numberOfLines={1}>{ride.endLocation}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: booking.status === 'CONFIRMED' ? theme.overlay : theme.dangerBg, flexShrink: 0 }]}>
            <Text style={[typography.label, { color: booking.status === 'CONFIRMED' ? (isDark ? theme.primary : '#4d7c0f') : theme.danger }]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={[styles.dateRow, { marginBottom: spacing.lg }]}>
          <Calendar size={14} color={theme.textMuted} style={{ marginRight: spacing.xs, flexShrink: 0 }} />
          <Text style={[typography.subtext, { color: theme.textMuted, flexShrink: 1 }]} numberOfLines={1}>
            {new Date(ride.departureDatetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <View style={styles.dotSeparator} />
          <Clock size={14} color={theme.textMuted} style={{ marginRight: spacing.xs, flexShrink: 0 }} />
          <Text style={[typography.subtext, { color: theme.textMuted, flexShrink: 1 }]} numberOfLines={1}>
            {new Date(ride.departureDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <View style={[styles.cardFooter, { borderTopColor: theme.border, paddingTop: spacing.lg }]}>
          <Text style={[typography.subtextBold, { color: theme.textMuted, flex: 1 }]} numberOfLines={1}>
            {t(`dashboard.card.seatsBooked${booking.seatsBooked > 1 ? '' : ''}`, { count: booking.seatsBooked })}
          </Text>
          <View style={[styles.viewRideBadge, { backgroundColor: theme.shadow, flexShrink: 0 }]}>
            <Text style={[typography.subtextBold, { color: theme.text }]}>{t('dashboard.card.viewRide')}</Text>
            <ArrowRight size={14} color={theme.text} style={{ marginLeft: spacing.sm }} />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={activeTab === 'driving' ? drivingRides : ridingBookings}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <View style={[
              styles.banner,
              {
                backgroundColor: theme.primary,
                paddingTop: insets.top + spacing.lg,
                paddingBottom: spacing.xxl,
              }
            ]}>
              <View style={styles.headerTopRow}>
                <Animated.View entering={FadeInUp.delay(200).duration(800).springify()} style={{ flex: 1 }}>
                  <Text style={[typography.caption, { color: 'rgba(21, 21, 21, 0.5)', marginBottom: spacing.sm }]}>{t('dashboard.label')}</Text>
                  <Text style={[typography.display, { color: '#151515' }]}>{t('dashboard.welcome')}{"\n"}{user?.name?.split(' ')[0]}</Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(300).duration(800).springify()}>
                  <TouchableOpacity 
                    style={[styles.notificationButton, { backgroundColor: 'rgba(21, 21, 21, 0.08)' }]}
                    onPress={() => router.push('/user/notifications')}
                  >
                    <Bell size={22} color="#151515" />
                    {unreadCount > 0 && (
                      <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
                        <Text style={styles.badgeText}>{unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>

              <Animated.View entering={FadeInUp.delay(200).duration(800).springify()}>
                <View style={[styles.carbonBadge, { backgroundColor: 'rgba(21, 21, 21, 0.08)', marginTop: spacing.lg }]}>
                  <Leaf size={14} color="#151515" />
                  <Text style={[typography.subtextBold, { color: '#151515', marginLeft: spacing.sm }]}>{t('dashboard.carbonSaved', { count: user?.carbonSavedKg })}</Text>
                </View>
              </Animated.View>
            </View>

            <View style={[styles.mainContent, { padding: spacing.xl }]}>
              <Animated.View 
                entering={FadeInDown.delay(300).duration(800).springify()}
                style={[styles.tabsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', marginBottom: spacing.xl }]}
              >
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'riding' && { backgroundColor: theme.surface }]}
                  onPress={() => setActiveTab('riding')}
                >
                  <Text style={[typography.subtextBold, { color: activeTab === 'riding' ? theme.text : theme.textMuted }]}>
                    {t('dashboard.tabs.riding')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'driving' && { backgroundColor: theme.surface }]}
                  onPress={() => setActiveTab('driving')}
                >
                  <Text style={[typography.subtextBold, { color: activeTab === 'driving' ? theme.text : theme.textMuted }]}>
                    {t('dashboard.tabs.driving')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {isLoading && !refreshing && (
                <View style={{ marginVertical: spacing.xxxl }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              )}
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          if (isLoading && !refreshing) return null;
          return (
            <View style={{ paddingHorizontal: spacing.xl }}>
              {activeTab === 'driving' ? renderDrivingRide({ item: item as Ride, index }) : renderRidingBooking({ item: item as Booking, index })}
            </View>
          );
        }}
        ListEmptyComponent={() => {
          if (isLoading) return null;
          return (
            <View style={{ paddingHorizontal: spacing.xl }}>
              <Animated.View entering={FadeInDown.duration(600).springify()}>
                {activeTab === 'driving' ? renderDrivingEmpty() : renderRidingEmpty()}
              </Animated.View>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressViewOffset={insets.top + spacing.xl}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    // Padding handled dynamically
  },
  banner: {
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#C1F11D',
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  carbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 24,
    borderWidth: 0,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  searchLink: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  rideCard: {
    borderRadius: 28,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
    marginHorizontal: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  bookingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewRideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
});
