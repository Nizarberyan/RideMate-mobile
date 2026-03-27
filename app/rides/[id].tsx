import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Car, 
  ShieldCheck, 
  Leaf,
  ChevronRight,
  Info,
  Star,
  UserCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { Ride, decodePolyline } from '../../src/api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card, ConfirmDialog } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
const { GoogleMaps, AppleMaps } = Platform.OS !== 'web' ? require('expo-maps') : { GoogleMaps: { View: View }, AppleMaps: { View: View } };
const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;
import { Platform } from 'react-native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

export default function RideDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, user } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [routePolyline, setRoutePolyline] = useState<{latitude: number; longitude: number}[] | null>(null);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const mapRef = useRef<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  type DialogConfig = {
    visible: boolean;
    title: string;
    message?: string;
    actions: { label: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[];
  };
  const [dialog, setDialog] = useState<DialogConfig>({ visible: false, title: '', actions: [] });
  const dismissDialog = () => setDialog(prev => ({ ...prev, visible: false }));

  const hasCoords = !!(ride?.startLat && ride?.startLng && ride?.endLat && ride?.endLng);
  const mapRegion = hasCoords ? {
    latitude: (ride!.startLat! + ride!.endLat!) / 2,
    longitude: (ride!.startLng! + ride!.endLng!) / 2,
    latitudeDelta: Math.abs(ride!.startLat! - ride!.endLat!) * 1.5,
    longitudeDelta: Math.abs(ride!.startLng! - ride!.endLng!) * 1.5,
  } : null;

  const loadRideDetails = useCallback(async () => {
    if (!id) return;
    try {
      const data = await client.rides.getOne(id);
      setRide(data);
    } catch (e: any) {
      setDialog({
        visible: true,
        title: t('common.error'),
        message: e.message || t('ride.dialogs.error'),
        actions: [{ label: t('common.ok'), onPress: () => { dismissDialog(); router.back(); }, style: 'cancel' }],
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, client, router, t]);

  const safelyMoveCamera = async (coords: { latitude: number, longitude: number }, zoom = 15) => {
    try {
      if (mapRef.current && isMounted.current) {
        await mapRef.current.setCameraPosition({ coordinates: coords, zoom });
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadRideDetails();
  }, [loadRideDetails]);

  useEffect(() => {
    if (ride?.startLat && ride?.startLng && ride?.endLat && ride?.endLng) {
      client.rides.getRoute(ride.id)
        .then(res => {
          if (res?.encodedPolyline) {
            setRoutePolyline(decodePolyline(res.encodedPolyline));
          }
        })
        .catch(err => console.warn('Failed to fetch route polyline:', err));
    }
  }, [ride?.startLat, ride?.startLng, ride?.endLat, ride?.endLng]);

  const handleBookRide = () => {
    if (!ride) return;

    if (ride.driverId === user?.id) {
      setDialog({
        visible: true,
        title: t('common.notice'),
        message: t('ride.dialogs.ownRide'),
        actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
      });
      return;
    }

    setDialog({
      visible: true,
      title: t('ride.dialogs.confirmBooking.title'),
      message: t('ride.dialogs.confirmBooking.message', { from: ride.startLocation, to: ride.endLocation }),
      actions: [
        { label: t('common.cancel'), onPress: dismissDialog, style: 'cancel' },
        {
          label: t('ride.actions.book'),
          style: 'default',
          onPress: async () => {
            dismissDialog();
            setBookingStatus('loading');
            try {
              await client.bookings.create({ rideId: ride.id, seatsBooked: 1 });
              setBookingStatus('success');
              setDialog({
                visible: true,
                title: t('ride.dialogs.booked.title'),
                message: t('ride.dialogs.booked.message'),
                actions: [{ label: t('ride.dialogs.booked.button'), onPress: () => { dismissDialog(); router.push('/(tabs)'); }, style: 'default' }],
              });
            } catch (e: any) {
              setBookingStatus('error');
              setDialog({
                visible: true,
                title: t('common.error'),
                message: (e as Error).message || 'Something went wrong.',
                actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
              });
            } finally {
              setBookingStatus('idle');
            }
          },
        },
      ],
    });
  };

  const handleCancelBooking = () => {
    if (!myBooking) return;
    setDialog({
      visible: true,
      title: t('ride.dialogs.cancelBooking.title'),
      message: t('ride.dialogs.cancelBooking.message'),
      actions: [
        { label: t('ride.dialogs.cancelBooking.keep'), onPress: dismissDialog, style: 'cancel' },
        {
          label: t('ride.dialogs.cancelBooking.yes'),
          style: 'destructive',
          onPress: async () => {
            dismissDialog();
            setBookingStatus('loading');
            try {
              await client.bookings.cancel(myBooking.id);
              setBookingStatus('success');
              loadRideDetails();
              router.push('/(tabs)');
            } catch (e: any) {
              setBookingStatus('error');
              setDialog({
                visible: true,
                title: t('common.error'),
                message: (e as Error).message || 'Failed to cancel booking.',
                actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
              });
            } finally {
              setBookingStatus('idle');
            }
          },
        },
      ],
    });
  };

  const handleCancelRide = () => {
    setDialog({
      visible: true,
      title: t('ride.dialogs.cancelRide.title'),
      message: t('ride.dialogs.cancelRide.message'),
      actions: [
        { label: t('ride.dialogs.cancelRide.keep'), onPress: dismissDialog, style: 'cancel' },
        {
          label: t('ride.dialogs.cancelRide.yes'),
          style: 'destructive',
          onPress: async () => {
            dismissDialog();
            setBookingStatus('loading');
            try {
              await client.rides.cancelRide(id);
              router.back();
            } catch (e: any) {
              setBookingStatus('error');
              setDialog({
                visible: true,
                title: t('common.error'),
                message: (e as Error).message || 'Failed to cancel ride.',
                actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
              });
            } finally {
              setBookingStatus('idle');
            }
          },
        },
      ],
    });
  };

  const handleCompleteRide = () => {
    setDialog({
      visible: true,
      title: t('ride.dialogs.completeRide.title'),
      message: t('ride.dialogs.completeRide.message'),
      actions: [
        { label: t('common.cancel'), onPress: dismissDialog, style: 'cancel' },
        {
          label: t('ride.actions.complete'),
          style: 'default',
          onPress: async () => {
            dismissDialog();
            setBookingStatus('loading');
            try {
              await client.rides.completeRide(id);
              loadRideDetails();
            } catch (e: any) {
              setBookingStatus('error');
              setDialog({
                visible: true,
                title: t('common.error'),
                message: (e as Error).message || 'Failed to complete ride.',
                actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
              });
            } finally {
              setBookingStatus('idle');
            }
          },
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!ride) return null;

  const isOwner = ride.driverId === user?.id;
  const myBooking = ride.bookings?.find(b => b.userId === user?.id);
  const hasBooked = !!myBooking;
  const departureDate = new Date(ride.departureDatetime);

  const navigateToUser = (userId: string) => {
    if (userId === user?.id) {
      router.push('/(tabs)/profile');
    } else {
      router.push(`/user/${userId}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('ride.details.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={isScrollEnabled}
      >
        {/* Map View */}
        {hasCoords && mapRegion && (
          <Animated.View
            entering={FadeInUp.duration(600).springify()}
            style={[styles.mapContainer, { borderColor: theme.border }]}
            onTouchStart={() => setIsScrollEnabled(false)}
            onTouchEnd={() => setIsScrollEnabled(true)}
            onTouchCancel={() => setIsScrollEnabled(true)}
          >
            <MapView
              ref={mapRef}
              style={styles.map}
              onMapLoaded={async () => {
                try {
                  if (!mapRef.current) return;
                  const centerLat = (ride.startLat! + ride.endLat!) / 2;
                  const centerLng = (ride.startLng! + ride.endLng!) / 2;
                  const latDelta = Math.abs(ride.startLat! - ride.endLat!);
                  const lngDelta = Math.abs(ride.startLng! - ride.endLng!);
                  const maxDelta = Math.max(latDelta, lngDelta, 0.005);
                  const zoom = Math.max(5, Math.min(15, Math.log2(360 / maxDelta) - 1.5));
                  await mapRef.current.setCameraPosition({
                    coordinates: { latitude: centerLat, longitude: centerLng },
                    zoom,
                  });
                } catch {}
              }}
              uiSettings={{ myLocationButtonEnabled: false }}
              markers={[
                { coordinates: { latitude: ride!.startLat!, longitude: ride!.startLng! }, title: "Start", color: theme.primary },
                { coordinates: { latitude: ride!.endLat!, longitude: ride!.endLng! }, title: "End", color: "#ef4444" }
              ]}
              polylines={routePolyline ? [{ coordinates: routePolyline, color: theme.primary, width: 3 }] : [{ coordinates: [{ latitude: ride!.startLat!, longitude: ride!.startLng! }, { latitude: ride!.endLat!, longitude: ride!.endLng! }], color: theme.primary, width: 3 }]}
            />
          </Animated.View>
        )}

        {/* Route Card */}
        <Animated.View entering={FadeInUp.duration(600).delay(100).springify()}>
          <Card style={styles.routeCard} contentStyle={{ padding: 24 }}>
            <View style={styles.routeContainer}>
              <View style={styles.timeline}>
                <View style={[styles.dot, { backgroundColor: theme.primary }]} />
                <View style={[styles.line, { backgroundColor: theme.border }]} />
                <View style={[styles.dot, { backgroundColor: '#ef4444' }]} />
              </View>
              <View style={styles.locations}>
                <View style={styles.locationItem}>
                  <Text style={[styles.locationLabel, { color: theme.textMuted }]}>{t('ride.details.pickup')}</Text>
                  <Text style={[styles.locationName, { color: theme.text }]}>{ride.startLocation}</Text>
                </View>
                <View style={[styles.locationItem, { marginTop: 32 }]}>
                  <Text style={[styles.locationLabel, { color: theme.textMuted }]}>{t('ride.details.dropoff')}</Text>
                  <Text style={[styles.locationName, { color: theme.text }]}>{ride.endLocation}</Text>
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.dateTimeRow}>
              <View style={styles.infoBox}>
                <Calendar size={18} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  {departureDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
              </View>
              <View style={styles.infoBox}>
                <Clock size={18} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Driver Section */}
        <Animated.Text 
          entering={FadeInDown.delay(200).duration(600).springify()}
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          {t('ride.details.driverTitle')}
        </Animated.Text>
        
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
          <Card style={styles.driverCard} contentStyle={{ padding: 20 }} onPress={() => navigateToUser(ride.driverId)}>
            <View style={styles.driverHeader}>
              <TouchableOpacity 
                style={[styles.driverAvatar, { backgroundColor: theme.primary }]}
                onPress={() => navigateToUser(ride.driverId)}
              >
                {ride.driver?.photo ? (
                  <Image source={{ uri: ride.driver.photo }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{ride.driver?.name?.charAt(0) || 'U'}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.driverMainInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.driverName, { color: theme.text }]} numberOfLines={1}>
                    {ride.driver?.name}
                  </Text>
                  <ShieldCheck size={16} color={theme.primary} style={{ marginLeft: 6 }} />
                </View>
                <View style={[styles.driverRating, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 }]}>
                  <Star size={12} color="#f59e0b" fill="#f59e0b" />
                  <Text style={[styles.driverRatingText, { color: theme.text }]}>
                    {ride.driver?.rating ? ride.driver.rating.toFixed(1) : "N/A"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.contactButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
                onPress={() => navigateToUser(ride.driverId)}
              >
                <ChevronRight size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {ride.driver?.bio && (
              <Text style={[styles.driverBio, { color: theme.textMuted }]}>
                "{ride.driver.bio}"
              </Text>
            )}

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 16 }]} />

            <View style={styles.vehicleInfo}>
              <View style={[styles.vehicleIcon, { backgroundColor: isDark ? 'rgba(193, 241, 29, 0.1)' : 'rgba(193, 241, 29, 0.2)' }]}>
                <Car size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.vehicleName, { color: theme.text }]}>
                  {ride.driver?.vehicleColor} {ride.driver?.vehicleModel}
                </Text>
                <Text style={[styles.vehiclePlate, { color: theme.textMuted }]}>
                  {ride.driver?.vehiclePlate || t('ride.details.noPlate')}
                </Text>
              </View>
            </View>

            {/* Booking Requirements */}
            {(ride.requirePhoto || ride.minRating) && (
              <View style={[styles.requirementsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderColor: theme.border }]}>
                <Text style={[styles.requirementsTitle, { color: theme.text }]}>{t('ride.details.requirements')}</Text>
                <View style={styles.requirementBadges}>
                  {ride.requirePhoto && (
                    <View style={[styles.reqBadge, { backgroundColor: user?.photo ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                      <UserCircle2 size={14} color={user?.photo ? '#10b981' : '#ef4444'} />
                      <Text style={[styles.reqBadgeText, { color: user?.photo ? '#10b981' : '#ef4444' }]}>{t('ride.details.verifiedPhoto')}</Text>
                    </View>
                  )}
                  {ride.minRating && (
                    <View style={[styles.reqBadge, { backgroundColor: (user?.rating || 0) >= ride.minRating ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                      <Star size={14} color={(user?.rating || 0) >= ride.minRating ? '#10b981' : '#ef4444'} />
                      <Text style={[styles.reqBadgeText, { color: (user?.rating || 0) >= ride.minRating ? '#10b981' : '#ef4444' }]}>{t('ride.details.minRating', { rating: ride.minRating })}</Text>
                    </View>
                  )}
                </View>
                {!isOwner && !hasBooked && (
                  (ride.requirePhoto && !user?.photo) || (ride.minRating && (user?.rating || 0) < ride.minRating)
                ) && (
                  <View style={styles.warningBox}>
                    <AlertCircle size={14} color="#ef4444" />
                    <Text style={styles.warningText}>{t('ride.details.notMet')}</Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        </Animated.View>

        {/* Ride Details */}
        <Animated.Text 
          entering={FadeInDown.delay(400).duration(600).springify()}
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          {t('ride.details.rideInfo')}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
          <View style={styles.detailsGrid}>
            <View style={[styles.detailItem, { backgroundColor: theme.surface }]}>
              <Users size={20} color={theme.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{t('ride.details.seats')}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{t('ride.details.seatsAvailable', { count: ride.availableSeats })}</Text>
              </View>
            </View>
            <View style={[styles.detailItem, { backgroundColor: theme.surface }]}>
              <Leaf size={20} color="#10b981" />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{t('ride.details.co2')}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{ride.distanceKm ? (ride.distanceKm * 0.17).toFixed(1) : '0.0'} kg</Text>
              </View>
            </View>
            <View style={[styles.detailItem, { backgroundColor: theme.surface }]}>
              <Info size={20} color={theme.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>{t('ride.details.status')}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{t(`ride.status.${ride.status.toLowerCase()}`).toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {ride.description && (
            <Card style={styles.descriptionCard} contentStyle={{ padding: 20 }}>
              <Text style={[styles.descriptionTitle, { color: theme.text }]}>{t('ride.details.driverNote')}</Text>
              <Text style={[styles.descriptionText, { color: theme.textMuted }]}>
                {ride.description}
              </Text>
            </Card>
          )}

          {/* Passengers Section */}
          {ride.bookings && ride.bookings.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {t('ride.details.passengers', { count: ride.bookings.length })}
              </Text>
              <View style={styles.passengersList}>
                {ride.bookings.map((booking, index) => {
                  const statusColors: Record<string, string> = {
                    PENDING: '#f59e0b',
                    CONFIRMED: '#10b981',
                    CANCELLED: theme.textMuted,
                    COMPLETED: '#6366f1',
                  };
                  const statusColor = statusColors[booking.status] ?? theme.textMuted;

                  return (
                    <Animated.View
                      key={booking.id}
                      entering={FadeInDown.delay(600 + (index * 100)).duration(600).springify()}
                      style={[styles.passengerCard, { backgroundColor: theme.surface }]}
                    >
                      <TouchableOpacity
                        style={styles.passengerInfoRow}
                        onPress={() => navigateToUser(booking.userId)}
                      >
                        <View style={[styles.passengerAvatar, { backgroundColor: theme.primary }]}>
                          {booking.user?.photo ? (
                            <Image source={{ uri: booking.user.photo }} style={styles.avatarImage} />
                          ) : (
                            <Text style={styles.passengerAvatarText}>{booking.user?.name?.charAt(0) || 'U'}</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.passengerName, { color: theme.text }]} numberOfLines={1}>
                            {booking.user?.name || t('ride.passengerCard.unknown')}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor, marginTop: 2 }}>
                            {t(`ride.status.${booking.status.toLowerCase()}`)}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textMuted }}>
                          {t(`ride.passengerCard.seats${booking.seatsBooked > 1 ? '_plural' : ''}`, { count: booking.seatsBooked })}
                        </Text>
                      </TouchableOpacity>

                      {isOwner && booking.status === 'PENDING' && (
                        <View style={[styles.bookingActions, { borderTopColor: theme.border }]}>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(16,185,129,0.1)' }]}
                            onPress={async () => {
                              try {
                                await client.bookings.confirm(booking.id);
                                loadRideDetails();
                              } catch (e: any) {
                                setDialog({ visible: true, title: t('common.error'), message: e.message, actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }] });
                              }
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#10b981' }}>✓ {t('ride.actions.confirm')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                            onPress={async () => {
                              try {
                                await client.bookings.reject(booking.id);
                                loadRideDetails();
                              } catch (e: any) {
                                setDialog({ visible: true, title: t('common.error'), message: e.message, actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }] });
                              }
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#ef4444' }}>✕ {t('ride.actions.reject')}</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {isOwner && booking.status === 'COMPLETED' && !booking.isRated && (
                        <View style={[styles.bookingActions, { borderTopColor: theme.border }]}>
                          <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                            onPress={() => {
                              router.push({
                                pathname: '/rides/review',
                                params: { 
                                  bookingId: booking.id, 
                                  targetId: booking.userId, 
                                  targetName: booking.user?.name,
                                  role: 'PASSENGER' 
                                }
                              });
                            }}
                          >
                            <Text style={{ fontSize: 13, fontWeight: '800', color: '#151515' }}>{t('ride.actions.review')}</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 150 }} />
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <View style={{ flex: 1 }}>
          {isOwner ? (
            <View style={{ flexDirection: 'column', gap: 12 }}>
              {ride.status === 'ACTIVE' && new Date(ride.departureDatetime) <= new Date() && (
                <Button
                  label={t('ride.actions.complete')}
                  variant="brand"
                  size="lg"
                  disabled={bookingStatus === "loading"}
                  isLoading={bookingStatus === "loading"}
                  onPress={handleCompleteRide}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('ride.actions.edit')}
                    variant="outline"
                    size="lg"
                    onPress={() => router.push(`/rides/edit/${id}`)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('ride.actions.cancelRide')}
                    variant="danger"
                    size="lg"
                    disabled={bookingStatus === "loading" || ride.status === "CANCELLED" || ride.status === "COMPLETED"}
                    isLoading={bookingStatus === "loading"}
                    onPress={handleCancelRide}
                  />
                </View>
              </View>
            </View>
          ) : hasBooked ? (
            <Button
              label={t('ride.actions.cancelBooking')}
              variant="danger"
              size="lg"
              disabled={bookingStatus === "loading"}
              isLoading={bookingStatus === "loading"}
              onPress={handleCancelBooking}
            />
          ) : (
            <Button
              label={
                ride.availableSeats === 0 ? t('ride.actions.full') :
                (ride.requirePhoto && !user?.photo) || (ride.minRating && (user?.rating || 0) < ride.minRating)
                ? t('ride.actions.locked') : t('ride.actions.book')
              }
              variant={
                (ride.requirePhoto && !user?.photo) || (ride.minRating && (user?.rating || 0) < ride.minRating)
                ? "outline" : "black"
              }
              size="lg"
              disabled={
                ride.availableSeats === 0 || 
                bookingStatus === "loading" ||
                (ride.requirePhoto && !user?.photo) || 
                (ride.minRating && (user?.rating || 0) < ride.minRating)
              }
              isLoading={bookingStatus === "loading"}
              onPress={handleBookRide}
            />
          )}
        </View>
      </View>

      <ConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        actions={dialog.actions}
        onDismiss={dismissDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 15 },
  backButton: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  scrollContent: { padding: 24 },
  mapContainer: { height: 200, borderRadius: 32, overflow: 'hidden', marginBottom: 24, borderWidth: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  routeCard: { borderRadius: 32, borderWidth: 0, marginBottom: 32 },
  routeContainer: { flexDirection: 'row' },
  timeline: { alignItems: 'center', width: 20, marginRight: 16, paddingVertical: 6 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, marginVertical: 4 },
  locations: { flex: 1 },
  locationItem: { justifyContent: 'center' },
  locationLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
  locationName: { fontSize: 20, fontWeight: '900' },
  divider: { height: 1, marginVertical: 20, opacity: 0.5 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 16, letterSpacing: -0.5 },
  driverCard: { borderRadius: 32, borderWidth: 0, marginBottom: 32 },
  driverHeader: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 60, height: 60, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#151515' },
  driverMainInfo: { flex: 1, marginLeft: 16, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  driverName: { fontSize: 18, fontWeight: '900' },
  contactButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  driverBio: { marginTop: 16, fontSize: 14, fontWeight: '600', fontStyle: 'italic', lineHeight: 20 },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  vehicleIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '800' },
  vehiclePlate: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  detailItem: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24 },
  detailLabel: { fontSize: 11, fontWeight: '700' },
  detailValue: { fontSize: 14, fontWeight: '900', marginTop: 2 },
  descriptionCard: { borderRadius: 28, borderWidth: 0, marginTop: 4 },
  descriptionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 8 },
  descriptionText: { fontSize: 14, fontWeight: '600', lineHeight: 22 },
  passengersList: { flexDirection: 'column', gap: 10 },
  passengerCard: { borderRadius: 20, overflow: 'hidden' },
  passengerInfoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  bookingActions: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  passengerAvatar: { width: 32, height: 32, borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  passengerAvatarText: { fontSize: 14, fontWeight: '900', color: '#151515' },
  passengerName: { fontSize: 13, fontWeight: '700' },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1 },
  driverRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverRatingText: { fontSize: 13, fontWeight: '800' },
  requirementsBox: { marginTop: 20, padding: 16, borderRadius: 20, borderWidth: 1 },
  requirementsTitle: { fontSize: 13, fontWeight: '800', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  requirementBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reqBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  reqBadgeText: { fontSize: 12, fontWeight: '700' },
  warningBox: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  warningText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
});
