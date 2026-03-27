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
  Car,
  ChevronLeft,
  Calendar,
  Clock,
  ArrowRight,
  Users
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Ride } from '../../src/api/client';

export default function ArchiveRidesScreen() {
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [pastRides, setPastRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadRides = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const all = await client.rides.getMine();
      const now = new Date();
      const past = all.filter(r => 
        r.status === 'CANCELLED' || 
        r.status === 'COMPLETED' || 
        (r.departureDatetime && new Date(r.departureDatetime) < now)
      );
      
      // Sort by date descending
      past.sort((a, b) => {
        const dateA = new Date(a.departureDatetime || 0).getTime();
        const dateB = new Date(b.departureDatetime || 0).getTime();
        return dateB - dateA;
      });

      setPastRides(past);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [client]);

  useFocusEffect(useCallback(() => { loadRides(); }, [loadRides]));

  const onRefresh = () => {
    setIsRefreshing(true);
    loadRides(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ 
        headerShown: true, 
        title: 'Ride History',
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
      ) : pastRides.length === 0 ? (
        <View style={styles.center}>
          <Car size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No past rides</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
            Rides you complete or cancel will be archived here.
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
          {pastRides.map((ride, i) => {
            const departureDate = new Date(ride.departureDatetime);
            const dateStr = departureDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <Animated.View key={ride.id} entering={FadeInDown.delay(i * 50).duration(600).springify()}>
                <TouchableOpacity
                  style={[styles.card, { backgroundColor: theme.surface }]}
                  onPress={() => router.push(`/rides/${ride.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.header}>
                      <View style={styles.locationRow}>
                        <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{ride.startLocation}</Text>
                        <ArrowRight size={14} color={theme.textMuted} style={{ marginHorizontal: 8 }} />
                        <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1}>{ride.endLocation}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <Text style={[styles.statusText, { color: theme.textMuted }]}>{ride.status.toUpperCase()}</Text>
                      </View>
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
                      <View style={styles.footerItem}>
                        <Users size={14} color={theme.textMuted} />
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>
                          {ride.bookings?.length || 0} Passengers
                        </Text>
                      </View>
                      {ride.distanceKm && (
                        <Text style={[styles.footerText, { color: theme.primary, fontWeight: '900' }]}>
                          {ride.distanceKm.toFixed(0)} km
                        </Text>
                      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '900',
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
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
