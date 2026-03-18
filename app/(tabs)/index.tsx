import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ride } from '@/src/api/client';
import { Car, Leaf, ArrowRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Dashboard() {
  const { user, client } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const myRides = await client.rides.getMine();
      setRides(myRides);
      console.tron.display({
        name: '🚗 My Rides Loaded',
        value: { count: myRides.length, rides: myRides },
        preview: `${myRides.length} ride(s) fetched`,
      });
    } catch (e) {
      console.tron.display({
        name: '❌ Failed to Load Rides',
        value: e,
        important: true,
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [client]);

  useEffect(() => {
    console.tron.display({
      name: '👤 Dashboard Mounted — Current User',
      value: user,
      preview: user ? `Logged in as ${user.name}` : 'No user',
    });
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background, flexGrow: 1 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressViewOffset={insets.top + 20}
          />
        }
      >
        <View style={[
          styles.banner,
          {
            backgroundColor: theme.primary,
            paddingTop: insets.top + 20
          }
        ]}>
          <Animated.View entering={FadeInUp.delay(200).duration(800).springify()}>
            <Text style={[styles.bannerLabel, { color: isDark ? 'rgba(21, 21, 21, 0.6)' : 'rgba(21, 21, 21, 0.5)' }]}>DASHBOARD</Text>
            <Text style={[styles.bannerTitle, { color: '#151515' }]}>Welcome back,{"\n"}{user?.name?.split(' ')[0]}</Text>
            <View style={[styles.carbonBadge, { backgroundColor: 'rgba(21, 21, 21, 0.08)' }]}>
              <Leaf size={14} color="#151515" />
              <Text style={[styles.carbonText, { color: '#151515' }]}>{user?.carbonSavedKg} kg saved</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.mainContent}>
          <Animated.Text 
            entering={FadeInDown.delay(400).duration(800).springify()}
            style={[styles.sectionTitle, { color: theme.text }]}
          >
            Your Rides as Driver
          </Animated.Text>
          {rides.length === 0 ? (
            <Card style={styles.emptyCard} delay={600}>
              <View style={styles.emptyState}>
                <Car size={40} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>No rides offered yet.</Text>
              </View>
            </Card>
          ) : (
            rides.map((ride, index) => (
              <Card 
                key={ride.id} 
                style={styles.rideCard}
                contentStyle={{ padding: 0 }}
                delay={600 + (index * 100)}
                onPress={() => router.push(`/rides/${ride.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.locationRow, { marginRight: 12 }]}>
                    <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{ride.startLocation}</Text>
                    <ArrowRight size={16} color={theme.textMuted} style={{ marginHorizontal: 8, flexShrink: 0 }} />
                    <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{ride.endLocation}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(193, 241, 29, 0.15)' : 'rgba(193, 241, 29, 0.3)' }]}>
                    <Text style={[styles.statusText, { color: isDark ? theme.primary : '#4d7c0f' }]}>{ride.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.cardSubtext, { color: theme.textMuted }]}>
                  {new Date(ride.departureDatetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(ride.departureDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.footerItem}>
                    <Text style={[styles.footerText, { color: theme.textMuted }]}>{ride.availableSeats} seats left</Text>
                  </View>
                  <View style={[styles.bookingsBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.footerTextBold, { color: '#151515' }]}>{ride.bookings.length} Bookings</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
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
    padding: 24,
  },
  banner: {
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 30,
    paddingBottom: 40,
    marginBottom: 10,
  },
  bannerLabel: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    letterSpacing: -1,
  },
  carbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    alignSelf: 'flex-start',
  },
  carbonText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  emptyCard: {
    padding: 0,
    borderRadius: 32,
    borderWidth: 0,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontWeight: '700',
    fontSize: 16,
  },
  rideCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 32,
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '900',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardSubtext: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bookingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  footerTextBold: {
    fontSize: 14,
    fontWeight: '900',
  },
});

