import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Ticket,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Booking } from '../../src/api/client';
import { useTranslation } from 'react-i18next';

type GroupedBookings = {
  upcoming: Booking[];
  past: Booking[];
  cancelled: Booking[];
};

function StatusBadge({ status }: { status: string }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const config: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    PENDING: {
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: <AlertCircle size={12} color="#f59e0b" />,
      label: t('ride.status.pending'),
    },
    CONFIRMED: {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: <CheckCircle size={12} color="#10b981" />,
      label: t('ride.status.confirmed'),
    },
    CANCELLED: {
      color: theme.textMuted,
      bg: 'rgba(0,0,0,0.05)',
      icon: <XCircle size={12} color={theme.textMuted} />,
      label: t('ride.status.cancelled'),
    },
    COMPLETED: {
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      icon: <CheckCircle size={12} color="#6366f1" />,
      label: t('ride.status.completed'),
    },
  };

  const c = config[status] ?? config.PENDING;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      {c.icon}
      <Text style={[styles.badgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

function BookingCard({ booking, index }: { booking: Booking; index: number }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const ride = booking.ride;

  const departureDate = new Date(ride?.departureDatetime ?? '');
  const dateStr = departureDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(600).springify()}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={() => router.push(`/rides/${ride?.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.routeRow}>
          <View style={styles.routeTimeline}>
            <View style={[styles.dot, { backgroundColor: theme.primary }]} />
            <View style={[styles.line, { backgroundColor: theme.border }]} />
            <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
          </View>
          <View style={styles.routeLocations}>
            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>
              {ride?.startLocation}
            </Text>
            <Text style={[styles.locationText, { color: theme.text, marginTop: 16 }]} numberOfLines={1}>
              {ride?.endLocation}
            </Text>
          </View>
        </View>

        <View style={[styles.metaRow, { borderTopColor: theme.border }]}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{dateStr}</Text>
          </View>
          <View style={styles.metaItem}>
            <Clock size={13} color={theme.textMuted} />
            <Text style={[styles.metaText, { color: theme.textMuted }]}>{timeStr}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <StatusBadge status={booking.status} />
          </View>
          <ChevronRight size={16} color={theme.textMuted} />
        </View>

        {booking.status === 'COMPLETED' && !booking.isRated && (
          <TouchableOpacity 
            style={[styles.reviewButton, { backgroundColor: theme.primary }]}
            onPress={(e) => {
              e.stopPropagation();
              router.push({
                pathname: '/rides/review',
                params: { 
                  bookingId: booking.id, 
                  targetId: ride?.driverId, 
                  targetName: ride?.driver?.name,
                  role: 'DRIVER' 
                }
              });
            }}
          >
            <Text style={styles.reviewButtonText}>{t('ride.actions.reviewDriver')}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <View style={[styles.countBadge, { backgroundColor: theme.surface }]}>
        <Text style={[styles.countText, { color: theme.textMuted }]}>{count}</Text>
      </View>
    </View>
  );
}

export default function BookingsScreen() {
  const { client } = useAuth();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [grouped, setGrouped] = useState<GroupedBookings>({ upcoming: [], past: [], cancelled: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const all = await client.bookings.getMine();
      const now = new Date();
      const upcoming: Booking[] = [];
      const past: Booking[] = [];
      const cancelled: Booking[] = [];

      for (const b of all) {
        if (b.status === 'CANCELLED') {
          cancelled.push(b);
        } else if (b.ride?.departureDatetime && new Date(b.ride.departureDatetime) < now) {
          past.push(b);
        } else {
          upcoming.push(b);
        }
      }

      setGrouped({ upcoming, past, cancelled });
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [client]);

  useFocusEffect(useCallback(() => { loadBookings(); }, [loadBookings]));

  const onRefresh = () => {
    setIsRefreshing(true);
    loadBookings(true);
  };

  const totalCount = grouped.upcoming.length + grouped.past.length + grouped.cancelled.length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={[styles.headerIcon, { backgroundColor: theme.surface }]}>
          <Ticket size={22} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('bookings.title')}</Text>
          <Text style={[styles.headerSub, { color: theme.textMuted }]}>
            {t(`bookings.total${totalCount !== 1 ? '_plural' : ''}`, { count: totalCount })}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : totalCount === 0 ? (
        <View style={styles.center}>
          <Ticket size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>{t('bookings.empty.title')}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            {t('bookings.empty.subtitle')}
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
          {grouped.upcoming.length > 0 && (
            <>
              <SectionHeader title={t('bookings.sections.upcoming')} count={grouped.upcoming.length} />
              {grouped.upcoming.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} />
              ))}
            </>
          )}

          {grouped.past.length > 0 && (
            <>
              <SectionHeader title={t('bookings.sections.past')} count={grouped.past.length} />
              {grouped.past.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} />
              ))}
            </>
          )}

          {grouped.cancelled.length > 0 && (
            <>
              <SectionHeader title={t('bookings.sections.cancelled')} count={grouped.cancelled.length} />
              {grouped.cancelled.map((b, i) => (
                <BookingCard key={b.id} booking={b} index={i} />
              ))}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingBottom: 20 },
  headerIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  emptySubtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 28, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  countText: { fontSize: 12, fontWeight: '800' },
  card: { borderRadius: 24, marginBottom: 12, overflow: 'hidden' },
  routeRow: { flexDirection: 'row', padding: 20, paddingBottom: 16 },
  routeTimeline: { alignItems: 'center', width: 16, marginRight: 14 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  line: { width: 2, flex: 1, marginVertical: 4, minHeight: 20 },
  routeLocations: { flex: 1 },
  locationText: { fontSize: 15, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, fontWeight: '700' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  reviewButton: { margin: 20, marginTop: 0, paddingVertical: 12, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  reviewButtonText: { fontSize: 14, fontWeight: '900', color: '#151515' },
});
