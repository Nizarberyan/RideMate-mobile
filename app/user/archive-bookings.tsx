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
  Ticket,
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Booking } from '../../src/api/client';

function StatusBadge({ status }: { status: string }) {
  const { theme } = useTheme();

  const config: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
    PENDING: {
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
      icon: <AlertCircle size={12} color="#f59e0b" />,
      label: 'Pending',
    },
    CONFIRMED: {
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
      icon: <CheckCircle size={12} color="#10b981" />,
      label: 'Confirmed',
    },
    CANCELLED: {
      color: theme.textMuted,
      bg: 'rgba(0,0,0,0.05)',
      icon: <XCircle size={12} color={theme.textMuted} />,
      label: 'Cancelled',
    },
    COMPLETED: {
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      icon: <CheckCircle size={12} color="#6366f1" />,
      label: 'Completed',
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

export default function ArchiveBookingsScreen() {
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const all = await client.bookings.getMine();
      const now = new Date();
      const past = all.filter(b => 
        b.status === 'CANCELLED' || 
        b.status === 'COMPLETED' || 
        (b.ride?.departureDatetime && new Date(b.ride.departureDatetime) < now)
      );
      
      // Sort by date descending
      past.sort((a, b) => {
        const dateA = new Date(a.ride?.departureDatetime || 0).getTime();
        const dateB = new Date(b.ride?.departureDatetime || 0).getTime();
        return dateB - dateA;
      });

      setPastBookings(past);
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Booking History',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
            <ChevronLeft size={24} color={theme.text} />
          </TouchableOpacity>
        )
      }} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : pastBookings.length === 0 ? (
        <View style={styles.center}>
          <Ticket size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No history found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Your completed and cancelled trips will appear here.
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
          {pastBookings.map((booking, i) => {
            const ride = booking.ride;
            const departureDate = new Date(ride?.departureDatetime ?? '');
            const dateStr = departureDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <Animated.View key={booking.id} entering={FadeInDown.delay(i * 50).duration(600).springify()}>
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: theme.surface }]}
                  onPress={() => router.push(`/rides/${ride?.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.locationRow}>
                      <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{ride?.startLocation}</Text>
                      <ArrowRight size={14} color={theme.textMuted} style={{ marginHorizontal: 8 }} />
                      <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{ride?.endLocation}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Calendar size={12} color={theme.textMuted} />
                        <Text style={[styles.metaText, { color: theme.textMuted }]}>{dateStr}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={theme.textMuted} />
                        <Text style={[styles.metaText, { color: theme.textMuted }]}>{timeStr}</Text>
                      </View>
                    </View>

                    <View style={styles.footer}>
                      <Text style={[styles.seatsText, { color: theme.textMuted }]}>
                        {booking.seatsBooked} {booking.seatsBooked === 1 ? 'Seat' : 'Seats'}
                      </Text>
                      <StatusBadge status={booking.status} />
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
    padding: 24,
  },
  card: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  seatsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
