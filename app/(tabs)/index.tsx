import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ride, Booking } from '@/src/api/client';
import { Car, Leaf, ArrowRight, MapPin, Calendar, Clock } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Dashboard() {
  const { user, client, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'driving' | 'riding'>('riding');
  const [drivingRides, setDrivingRides] = useState<Ride[]>([]);
  const [ridingBookings, setRidingBookings] = useState<Booking[]>([]);
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

  const renderDrivingEmpty = () => (
    <Card style={styles.emptyCard} delay={200}>
      <View style={styles.emptyState}>
        <Car size={40} color={theme.textMuted} accessibilityLabel="Car icon" />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No rides offered yet.</Text>
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
        <View style={[styles.locationRow, { marginRight: 12 }]}>
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{ride.startLocation}</Text>
          <ArrowRight size={16} color={theme.textMuted} style={{ marginHorizontal: 8, flexShrink: 0 }} accessible={false} />
          <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{ride.endLocation}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.overlay }]}>
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
          <Text style={[styles.footerTextBold, { color: '#151515' }]}>{ride.bookings?.length || 0} Bookings</Text>
        </View>
      </View>
    </Card>
  );

  const renderRidingEmpty = () => (
    <Card style={styles.emptyCard} delay={200}>
      <View style={styles.emptyState}>
        <MapPin size={40} color={theme.textMuted} accessibilityLabel="Map pin icon" />
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No upcoming trips booked.</Text>
        <TouchableOpacity 
          style={[styles.searchLink, { backgroundColor: theme.shadow }]}
          onPress={() => router.push('/(tabs)/search')}
          accessibilityRole="button"
          accessibilityLabel="Find a ride"
        >
          <Text style={[styles.searchLinkText, { color: theme.primary }]}>Find a Ride</Text>
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
          <View style={[styles.locationRow, { marginRight: 12 }]}>
            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{ride.startLocation}</Text>
            <ArrowRight size={16} color={theme.textMuted} style={{ marginHorizontal: 8, flexShrink: 0 }} accessible={false} />
            <Text style={[styles.locationText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{ride.endLocation}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: booking.status === 'CONFIRMED' ? theme.overlay : theme.dangerBg }]}>
            <Text style={[styles.statusText, { color: booking.status === 'CONFIRMED' ? (isDark ? theme.primary : '#4d7c0f') : theme.danger }]}>
              {booking.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.dateRow}>
          <Calendar size={14} color={theme.textMuted} style={{ marginRight: 6 }} accessible={false} />
          <Text style={[styles.cardSubtext, { color: theme.textMuted, marginBottom: 0 }]}>
            {new Date(ride.departureDatetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
          <View style={styles.dotSeparator} />
          <Clock size={14} color={theme.textMuted} style={{ marginRight: 6 }} accessible={false} />
          <Text style={[styles.cardSubtext, { color: theme.textMuted, marginBottom: 0 }]}>
            {new Date(ride.departureDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        
        <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
          <View style={styles.footerItem}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>
              {booking.seatsBooked} {booking.seatsBooked === 1 ? 'Seat' : 'Seats'} Booked
            </Text>
          </View>
          <View style={[styles.viewRideBadge, { backgroundColor: theme.shadow }]}>
            <Text style={[styles.footerTextBold, { color: theme.text }]}>View Ride</Text>
            <ArrowRight size={14} color={theme.text} style={{ marginLeft: 6 }} accessible={false} />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <FlatList
        data={activeTab === 'driving' ? drivingRides : ridingBookings}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background, flexGrow: 1 }]}
        ListHeaderComponent={
          <>
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
              <Animated.View 
                entering={FadeInDown.delay(300).duration(800).springify()}
                style={[styles.tabsContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
              >
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'riding' && [styles.activeTabButton, { backgroundColor: theme.surface }]]}
                  onPress={() => setActiveTab('riding')}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'riding' }}
                  accessibilityLabel="Riding"
                >
                  <Text style={[styles.tabText, activeTab === 'riding' ? [styles.activeTabText, { color: theme.text }] : { color: theme.textMuted }]}>
                    Riding
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.tabButton, activeTab === 'driving' && [styles.activeTabButton, { backgroundColor: theme.surface }]]}
                  onPress={() => setActiveTab('driving')}
                  activeOpacity={0.8}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'driving' }}
                  accessibilityLabel="Driving"
                >
                  <Text style={[styles.tabText, activeTab === 'driving' ? [styles.activeTabText, { color: theme.text }] : { color: theme.textMuted }]}>
                    Driving
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {isLoading && !refreshing && (
                <View style={{ marginTop: 40, marginBottom: 40 }}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              )}
            </View>
          </>
        }
        renderItem={({ item, index }) => {
          if (isLoading && !refreshing) return null;
          return activeTab === 'driving' ? renderDrivingRide({ item: item as Ride, index }) : renderRidingBooking({ item: item as Booking, index });
        }}
        ListEmptyComponent={() => {
          if (isLoading) return null;
          return (
            <View style={styles.mainContent}>
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
            progressViewOffset={insets.top + 20}
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
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabButton: {
    // Removed the generic drop shadow in favor of a cleaner text-highlight approach as per /quieter
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeTabText: {
    fontWeight: '900',
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
    marginBottom: 16,
  },
  searchLink: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  searchLinkText: {
    fontSize: 14,
    fontWeight: '900',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
    marginHorizontal: 8,
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
  viewRideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  footerTextBold: {
    fontSize: 14,
    fontWeight: '900',
  },
});


