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
  Info
} from 'lucide-react-native';
import { Ride } from '@/src/api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp, FadeInRight, FadeInLeft } from 'react-native-reanimated';
import { GoogleMaps, AppleMaps } from 'expo-maps';
const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;
import { Platform } from 'react-native';
import { useRef } from 'react';

const { width, height } = Dimensions.get('window');

export default function RideDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, user } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [routePolyline, setRoutePolyline] = useState<{latitude: number; longitude: number}[] | null>(null);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const mapRef = useRef<any>(null);

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
      Alert.alert("Error", e.message || "Failed to load ride details");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, client, router]);

  useEffect(() => {
    loadRideDetails();
  }, [loadRideDetails]);

  useEffect(() => {
    if (ride?.startLat && ride?.startLng && ride?.endLat && ride?.endLng) {
      import('../../utils/maps').then(({ getDirections }) => {
        getDirections(ride.startLat!, ride.startLng!, ride.endLat!, ride.endLng!)
          .then(res => {
            if (res?.polyline) {
              setRoutePolyline(res.polyline);
            }
          });
      });
    }
  }, [ride?.startLat, ride?.startLng, ride?.endLat, ride?.endLng]);

  const handleBookRide = async () => {
    if (!ride) return;

    if (ride.driverId === user?.id) {
      Alert.alert("Notice", "You cannot book your own ride.");
      return;
    }

    Alert.alert(
      "Confirm Booking",
      `Do you want to book 1 seat for the ride from ${ride.startLocation} to ${ride.endLocation}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setBookingStatus("loading");
            try {
              await client.bookings.create({
                rideId: ride.id,
                seatsBooked: 1,
              });
              setBookingStatus("success");
              Alert.alert("Success", "Ride booked successfully!", [
                { text: "OK", onPress: () => router.push('/(tabs)/profile') }
              ]);
            } catch (e: any) {
              setBookingStatus("error");
              Alert.alert("Booking Failed", e.message || "Something went wrong");
            } finally {
              setBookingStatus("idle");
            }
          }
        }
      ]
    );
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Ride Details</Text>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MapView
              ref={mapRef}
              style={styles.map}
              onMapLoaded={() => {
                mapRef.current?.setCameraPosition({
                  coordinates: {
                    latitude: ride.startLat!,
                    longitude: ride.startLng!,
                  },
                  zoom: 11,
                });
              }}
              uiSettings={{
                myLocationButtonEnabled: false,
              }}
              markers={[
                {
                  coordinates: { latitude: ride!.startLat!, longitude: ride!.startLng! },
                  title: "Start",
                  color: theme.primary,
                },
                {
                  coordinates: { latitude: ride!.endLat!, longitude: ride!.endLng! },
                  title: "End",
                  color: "#ef4444",
                }
              ]}
              polylines={routePolyline ? [
                {
                  coordinates: routePolyline,
                  color: theme.primary,
                  width: 3,
                }
              ] : [
                {
                  coordinates: [
                    { latitude: ride!.startLat!, longitude: ride!.startLng! },
                    { latitude: ride!.endLat!, longitude: ride!.endLng! }
                  ],
                  color: theme.primary,
                  width: 3,
                }
              ]}
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
                  <Text style={[styles.locationLabel, { color: theme.textMuted }]}>PICKUP</Text>
                  <Text style={[styles.locationName, { color: theme.text }]}>{ride.startLocation}</Text>
                </View>
                <View style={[styles.locationItem, { marginTop: 32 }]}>
                  <Text style={[styles.locationLabel, { color: theme.textMuted }]}>DROPOFF</Text>
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
          Your Driver
        </Animated.Text>
        
        <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
          <Card style={styles.driverCard} contentStyle={{ padding: 20 }} onPress={() => navigateToUser(ride.driverId)}>
            <View style={styles.driverHeader}>
              <View style={[styles.driverAvatar, { backgroundColor: theme.primary }]}>
                {ride.driver?.photo ? (
                  <Image source={{ uri: ride.driver.photo }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{ride.driver?.name?.charAt(0) || 'U'}</Text>
                )}
              </View>
              <View style={styles.driverMainInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.driverName, { color: theme.text }]}>{ride.driver?.name}</Text>
                  <ShieldCheck size={16} color={theme.primary} style={{ marginLeft: 6 }} />
                </View>
                <View style={styles.ratingRow}>
                  <Leaf size={14} color="#10b981" />
                  <Text style={[styles.carbonText, { color: '#10b981' }]}>{ride.driver?.carbonSavedKg}kg CO2 saved</Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.contactButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
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
                  {ride.driver?.vehiclePlate || "Plate Not Provided"}
                </Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Ride Details */}
        <Animated.Text 
          entering={FadeInDown.delay(400).duration(600).springify()}
          style={[styles.sectionTitle, { color: theme.text }]}
        >
          Ride Information
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(500).duration(600).springify()}>
          <View style={styles.detailsGrid}>
            <View style={[styles.detailItem, { backgroundColor: theme.surface }]}>
              <Users size={20} color={theme.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Seats</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{ride.availableSeats} Available</Text>
              </View>
            </View>
            <View style={[styles.detailItem, { backgroundColor: theme.surface }]}>
              <Info size={20} color={theme.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Status</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{ride.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {ride.description && (
            <Card style={styles.descriptionCard} contentStyle={{ padding: 20 }}>
              <Text style={[styles.descriptionTitle, { color: theme.text }]}>Driver's Note</Text>
              <Text style={[styles.descriptionText, { color: theme.textMuted }]}>
                {ride.description}
              </Text>
            </Card>
          )}

          {/* Passengers Section */}
          {ride.bookings && ride.bookings.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Passengers ({ride.bookings.length})
              </Text>
              <View style={styles.passengersList}>
                {ride.bookings.map((booking, index) => (
                  <Animated.View 
                    key={booking.id}
                    entering={FadeInDown.delay(600 + (index * 100)).duration(600).springify()}
                  >
                    <TouchableOpacity 
                      style={[styles.passengerItem, { backgroundColor: theme.surface }]}
                      onPress={() => navigateToUser(booking.userId)}
                    >
                      <View style={[styles.passengerAvatar, { backgroundColor: theme.primary }]}>
                        {booking.user?.photo ? (
                          <Image source={{ uri: booking.user.photo }} style={styles.avatarImage} />
                        ) : (
                          <Text style={styles.passengerAvatarText}>{booking.user?.name?.charAt(0) || 'U'}</Text>
                        )}
                      </View>
                      <Text style={[styles.passengerName, { color: theme.text }]} numberOfLines={1}>
                        {booking.user?.name?.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 150 }} />
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <View style={styles.priceInfo}>
          <Text style={[styles.priceLabel, { color: theme.textMuted }]}>Total Price</Text>
          <Text style={[styles.priceValue, { color: theme.text }]}>$25.00</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 20 }}>
          {isOwner ? (
            <Button
              label="Edit My Ride"
              variant="outline"
              size="lg"
              onPress={() => Alert.alert("Edit", "Edit functionality coming soon!")}
            />
          ) : (
            <Button
              label={ride.availableSeats > 0 ? "Book Ride" : "Fully Booked"}
              variant="black"
              size="lg"
              disabled={ride.availableSeats === 0 || bookingStatus === "loading"}
              isLoading={bookingStatus === "loading"}
              onPress={handleBookRide}
            />
          )}
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  scrollContent: {
    padding: 24,
  },
  mapContainer: {
    height: 200,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  routeCard: {
    borderRadius: 32,
    borderWidth: 0,
    marginBottom: 32,
  },
  routeContainer: {
    flexDirection: 'row',
  },
  timeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 16,
    paddingVertical: 6,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  locations: {
    flex: 1,
  },
  locationItem: {
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.5,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  driverCard: {
    borderRadius: 32,
    borderWidth: 0,
    marginBottom: 32,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#151515',
  },
  driverMainInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 18,
    fontWeight: '900',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  carbonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverBio: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '800',
  },
  vehiclePlate: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  descriptionCard: {
    borderRadius: 28,
    borderWidth: 0,
    marginTop: 4,
  },
  descriptionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  passengersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  passengerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 16,
    borderRadius: 20,
    gap: 10,
  },
  passengerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  passengerAvatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#151515',
  },
  passengerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  priceInfo: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
  }
});
