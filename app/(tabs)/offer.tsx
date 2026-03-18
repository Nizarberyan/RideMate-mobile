import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Dimensions,
  TouchableOpacity,
  KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, MapPin, Map, Calendar, Plus, AlertCircle, CheckCircle2, Clock, X } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input, Card } from '../../components/ui';
import { MapSearchBar } from '../../components/ui/MapSearchBar';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoogleMaps, AppleMaps } from 'expo-maps';
const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export default function OfferRide() {
  const { user, client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    startLocation: '',
    endLocation: '',
    availableSeats: '3',
    description: '',
  });

  const [startCoords, setStartCoords] = useState<{ latitude: number, longitude: number } | null>(null);
  const [endCoords, setEndCoords] = useState<{ latitude: number, longitude: number } | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [pickingMode, setPickingMode] = useState<'start' | 'end'>('start');
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = React.useRef<any>(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState<'hours' | 'minutes'>('hours');
  const [dateSelected, setDateSelected] = useState(false);

  // Clock UI constants
  const CLOCK_RADIUS = width * 0.35;
  const NUMBER_RADIUS = CLOCK_RADIUS - 30;


  // Custom Date Options
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const hasVehicle = !!(user?.vehicleModel && user?.vehiclePlate);

  const openMap = async (mode: 'start' | 'end') => {
    setPickingMode(mode);
    setMapModalVisible(true);
    
    // Default initial location if no value
    if (mapRef.current) {
        mapRef.current.setCameraPosition({ coordinates: { latitude: mapRegion.latitude, longitude: mapRegion.longitude }, zoom: 15 });
    }

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const lastKnown = await Location.getLastKnownPositionAsync({});
      if (lastKnown) {
        const lat = lastKnown.coords.latitude;
        const lng = lastKnown.coords.longitude;
        setMapRegion(prev => ({...prev, latitude: lat, longitude: lng}));
        mapRef.current?.setCameraPosition({ coordinates: { latitude: lat, longitude: lng }, zoom: 15 });
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      if (location) {
        const lat = location.coords.latitude;
        const lng = location.coords.longitude;
        setMapRegion(prev => ({...prev, latitude: lat, longitude: lng}));
        mapRef.current?.setCameraPosition({ coordinates: { latitude: lat, longitude: lng }, zoom: 15 });
      }
    } catch (e) {
      console.log("Location fetch skipped or failed");
    }
  };

  const formatAddress = (address: any) => {
    let name = address.name || '';
    if (name.includes('+')) name = ''; // Filter out plus codes
    
    let streetPart = address.street || '';
    if (streetPart && address.streetNumber) {
      streetPart = `${address.streetNumber} ${streetPart}`;
    }
    
    const primary = streetPart || name;
    return [primary, address.city || address.subregion].filter(Boolean).join(', ').trim();
  };

  const handleMapConfirm = async () => {
    const coords = { latitude: mapRegion.latitude, longitude: mapRegion.longitude };
    if (pickingMode === 'start') {
      setStartCoords(coords);
      try {
        const address = await Location.reverseGeocodeAsync(coords);
        if (address[0]) {
          setFormData({ ...formData, startLocation: formatAddress(address[0]) || 'Selected Location' });
        }
      } catch (e) {}
      setPickingMode('end');
    } else {
      setEndCoords(coords);
      try {
        const address = await Location.reverseGeocodeAsync(coords);
        if (address[0]) {
          setFormData({ ...formData, endLocation: formatAddress(address[0]) || 'Selected Location' });
        }
      } catch (e) {}
      setMapModalVisible(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.startLocation || !formData.endLocation || !dateSelected || !formData.availableSeats) {
      Alert.alert("Missing Information", "Please fill in all details including departure, destination, date, and seats.");
      return;
    }

    setIsSubmitting(true);
    try {
      await client.rides.create({
        startLocation: formData.startLocation,
        startLat: startCoords?.latitude,
        startLng: startCoords?.longitude,
        endLocation: formData.endLocation,
        endLat: endCoords?.latitude,
        endLng: endCoords?.longitude,
        departureDatetime: date.toISOString(),
        availableSeats: parseInt(formData.availableSeats),
        description: formData.description,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          startLocation: '',
          endLocation: '',
          availableSeats: '3',
          description: '',
        });
        setStartCoords(null);
        setEndCoords(null);
        setDate(new Date());
        setDateSelected(false);
        router.push('/(tabs)');
      }, 2000);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to create ride");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <Animated.View entering={FadeInUp.springify().damping(15)}>
          <CheckCircle2 size={80} color={theme.primary} />
        </Animated.View>
        <Animated.Text entering={FadeInUp.delay(100).springify().damping(15)} style={[styles.successTitle, { color: theme.text }]}>
          Ride Offered!
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200).springify().damping(15)} style={[styles.successSub, { color: theme.textMuted }]}>
          Redirecting to your dashboard...
        </Animated.Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.background, flexGrow: 1, paddingTop: insets.top + 20, paddingBottom: 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ backgroundColor: theme.primary, position: 'absolute', top: -(insets.top + 20), left: 0, right: 0, height: insets.top + 20 + 90, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }} />
        <View style={{ padding: 24, paddingTop: 0 }}>
          <Animated.Text 
            entering={FadeInUp.delay(200).duration(800).springify()}
            style={[styles.headerTitle, { color: '#151515', marginBottom: 8 }]}
          >
            Offer a Ride
          </Animated.Text>
          {!hasVehicle ? (
            <Card
              delay={400}
              style={[styles.warningBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fffbeb', borderColor: isDark ? '#333' : '#fde68a', marginTop: 24 }]}
            >
              <View style={styles.warningContent}>
                <AlertCircle size={44} color="#b45309" />
                <Text style={[styles.warningTitle, { color: isDark ? '#fde68a' : '#92400e' }]}>Vehicle Info Missing</Text>
                <Text style={[styles.warningText, { color: isDark ? '#d1d5db' : '#b45309' }]}>
                  You need to add your vehicle details in your profile before you can offer a ride to the community.
                </Text>
                <Button
                  label="Go to Profile"
                  onPress={() => router.push('/profile')}
                  variant="black"
                  size="md"
                />
              </View>
            </Card>
          ) : (
            <View style={styles.form} pointerEvents={isSubmitting ? "none" : "auto"}>
              <Animated.Text 
                entering={FadeInUp.delay(300).duration(800).springify()}
                style={[styles.formSubtitle, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(21, 21, 21, 0.5)', fontWeight: '900', marginBottom: 32, letterSpacing: 1 }]}
              >
                FILL IN THE TRIP DETAILS
              </Animated.Text>

              <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
                <View style={styles.inputWithButton}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Departure Location"
                      leftIcon={<MapPin size={20} color={theme.primary} />}
                      value={formData.startLocation}
                      onChangeText={(text) => setFormData({ ...formData, startLocation: text })}
                      placeholder="e.g. San Francisco"
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.mapButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }]} 
                    onPress={() => openMap('start')}
                  >
                    <Map size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
                <View style={styles.inputWithButton}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Destination"
                      leftIcon={<MapPin size={20} color="#ef4444" />}
                      value={formData.endLocation}
                      onChangeText={(text) => setFormData({ ...formData, endLocation: text })}
                      placeholder="e.g. San Jose"
                    />
                  </View>
                  <TouchableOpacity 
                    style={[styles.mapButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6' }]} 
                    onPress={() => openMap('end')}
                  >
                    <Map size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View 
                entering={FadeInDown.delay(600).duration(800).springify()}
                style={styles.row}
              >
                <View style={{ flex: 1, marginRight: 12 }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                    <Input
                      label="Departure Date"
                      editable={false}
                      pointerEvents="none"
                      leftIcon={<Calendar size={20} color={theme.textMuted} />}
                      value={dateSelected ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""}
                      placeholder="Select Date"
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <TouchableOpacity onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
                    <Input
                      label="Time"
                      editable={false}
                      pointerEvents="none"
                      leftIcon={<Clock size={20} color={theme.textMuted} />}
                      value={dateSelected ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                      placeholder="Select Time"
                    />
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Custom Time Picker Modal */}
              <Modal
                visible={showTimePicker}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTimePicker(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowTimePicker(false)}
                >
                  <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
                      <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Select Time</Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(false)} style={{ padding: 8, marginRight: -8 }}>
                          <X size={24} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={{ alignItems: 'center', marginBottom: 32 }}>
                        {/* Digital Time Display (Toggle between Hours/Minutes) */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32, gap: 12 }}>
                          <TouchableOpacity 
                            onPress={() => setTimePickerMode('hours')}
                            style={[
                              styles.digitalTimeBlock, 
                              timePickerMode === 'hours' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                          >
                            <Text style={[styles.digitalTimeText, { color: timePickerMode === 'hours' ? '#151515' : theme.text }]}>
                              {((date.getHours() % 12) || 12).toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 32, fontWeight: '900', color: theme.text }}>:</Text>
                          <TouchableOpacity 
                            onPress={() => setTimePickerMode('minutes')}
                            style={[
                              styles.digitalTimeBlock, 
                              timePickerMode === 'minutes' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                          >
                            <Text style={[styles.digitalTimeText, { color: timePickerMode === 'minutes' ? '#151515' : theme.text }]}>
                              {date.getMinutes().toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Analog Clock Face */}
                        <View style={[styles.clockFace, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderColor: theme.border, width: CLOCK_RADIUS * 2, height: CLOCK_RADIUS * 2, borderRadius: CLOCK_RADIUS }]}>
                          {/* Center Dot */}
                          <View style={[styles.clockCenterPoint, { backgroundColor: theme.primary }]} />

                          {/* Clock Numbers */}
                          {Array.from({ length: 12 }, (_, i) => {
                            let value;
                            if (timePickerMode === 'hours') {
                              value = i === 0 ? 12 : i;
                            } else {
                              value = i * 5;
                            }
                            
                            // Calculate position based on angle
                            // 0 index is 12 o'clock (top), so angle starts at -90deg (or -PI/2)
                            const angle = (i * 30 - 90) * (Math.PI / 180);
                            const x = NUMBER_RADIUS * Math.cos(angle);
                            const y = NUMBER_RADIUS * Math.sin(angle);

                            const isSelected = timePickerMode === 'hours' 
                              ? (date.getHours() % 12 || 12) === value
                              : date.getMinutes() === value;

                            // For minutes, only exact 5-min increments have explicit numbers in the circle renderer, but allow clicking near them. Let's make it simple: 
                            return (
                              <TouchableOpacity
                                key={`clock-${value}`}
                                style={[
                                  styles.clockNumberContainer, 
                                  {
                                    left: CLOCK_RADIUS + x - 20, // 20 is half the width of the container
                                    top: CLOCK_RADIUS + y - 20,
                                  },
                                  isSelected && { backgroundColor: theme.primary }
                                ]}
                                onPress={() => {
                                  const newDate = new Date(date);
                                  if (timePickerMode === 'hours') {
                                    const isPM = newDate.getHours() >= 12;
                                    let newH = value;
                                    if (isPM && value !== 12) newH += 12;
                                    if (!isPM && value === 12) newH = 0;
                                    newDate.setHours(newH);
                                    setDate(newDate);
                                    setDateSelected(true);
                                    // Auto-advance to minutes
                                    setTimeout(() => setTimePickerMode('minutes'), 300);
                                  } else {
                                    newDate.setMinutes(value);
                                    setDate(newDate);
                                    setDateSelected(true);
                                  }
                                }}
                              >
                                <Text style={[
                                  styles.clockNumberText,
                                  { color: isSelected ? '#151515' : theme.text }
                                ]}>
                                  {timePickerMode === 'minutes' ? value.toString().padStart(2, '0') : value}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                          
                          {/* Clock Hand */}
                          <View style={[
                            styles.clockHand,
                            { 
                              backgroundColor: theme.primary,
                              height: NUMBER_RADIUS - 10,
                              marginTop: -(NUMBER_RADIUS - 10) / 2,
                              transform: [
                                { rotate: `${timePickerMode === 'hours' ? ((date.getHours() % 12 || 12) * 30) : (date.getMinutes() * 6)}deg` },
                                { translateY: -(NUMBER_RADIUS - 10) / 2 }
                              ]
                            }
                          ]} />
                        </View>
                      </View>

                      <View style={styles.ampmContainer}>
                        {['AM', 'PM'].map(period => {
                          const isPM = date.getHours() >= 12;
                          const isSelected = (period === 'PM' && isPM) || (period === 'AM' && !isPM);
                          return (
                            <TouchableOpacity 
                              key={period} 
                              style={[styles.ampmBlock, { borderColor: theme.border }, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
                              onPress={() => {
                                const newDate = new Date(date);
                                const h = newDate.getHours();
                                if (period === 'PM' && h < 12) newDate.setHours(h + 12);
                                if (period === 'AM' && h >= 12) newDate.setHours(h - 12);
                                setDate(newDate);
                                setDateSelected(true);
                              }}
                            >
                              <Text style={[styles.ampmText, { color: isSelected ? '#151515' : theme.text }]}>{period}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      
                      <Button
                        label="Confirm Time"
                        variant="black"
                        size="lg"
                        onPress={() => setShowTimePicker(false)}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Modal>

              <Animated.View 
                entering={FadeInDown.delay(700).duration(800).springify()}
                style={styles.row}
              >
                <View style={{ flex: 1 }}>
                  <Input
                    label="Seats"
                    value={formData.availableSeats}
                    onChangeText={(text) => setFormData({ ...formData, availableSeats: text })}
                    keyboardType="numeric"
                    placeholder="3"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(800).duration(800).springify()}>
                <Input
                  label="Additional Notes"
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Any rules or pickup details?"
                  multiline
                  numberOfLines={3}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(900).duration(800).springify()}>
                <Button
                  label="Post Ride Offer"
                  variant="black"
                  size="lg"
                  icon={<Plus size={24} color={isDark ? theme.primary : '#fff'} />}
                  onPress={handleSubmit}
                  isLoading={isSubmitting}
                  style={{ marginTop: 24 }}
                />
              </Animated.View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ padding: 8, marginRight: -8 }}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.calendarGrid}
              >
                <View style={styles.daysContainer}>
                  {calendarDays.map((d, index) => {
                    const isSelected = dateSelected && date.toDateString() === d.toDateString();
                    const isToday = new Date().toDateString() === d.toDateString();

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayButton,
                          { borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => {
                          const newDate = new Date(date);
                          newDate.setFullYear(d.getFullYear());
                          newDate.setMonth(d.getMonth());
                          newDate.setDate(d.getDate());
                          setDate(newDate);
                          setDateSelected(true);
                          setShowDatePicker(false);
                          setTimeout(() => {
                            setShowTimePicker(true);
                            setTimePickerMode('hours');
                          }, 300);
                        }}
                      >
                        <Text style={[
                          styles.dayName,
                          { color: isSelected ? '#151515' : theme.textMuted }
                        ]}>
                          {d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                        </Text>
                        <Text style={[
                          styles.dayNumber,
                          { color: isSelected ? '#151515' : theme.text }
                        ]}>
                          {d.getDate()}
                        </Text>
                        {isToday && !isSelected && (
                          <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Button
                label="Confirm Selection"
                variant="black"
                size="lg"
                onPress={() => setShowDatePicker(false)}
                style={{ marginTop: 24 }}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Map Selector Modal */}
      <Modal
        visible={mapModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setMapModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            onMapLoaded={() => {
              mapRef.current?.setCameraPosition({
                coordinates: { latitude: mapRegion.latitude, longitude: mapRegion.longitude },
                zoom: 15
              });
            }}
            uiSettings={{
              myLocationButtonEnabled: true,
            }}
            properties={{
              isMyLocationEnabled: true,
            }}
            onCameraMove={(event: any) => {
              const lat = event.nativeEvent?.cameraPosition?.coordinates?.latitude ?? event.coordinates?.latitude;
              const lng = event.nativeEvent?.cameraPosition?.coordinates?.longitude ?? event.coordinates?.longitude;
              if (lat && lng) {
                setMapRegion(prev => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                }));
              }
            }}
            markers={[{
              coordinates: {
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              },
              color: theme.primary
            }]}
          />
          
          <View style={styles.mapOverlayTop}>
            <TouchableOpacity 
              style={[styles.closeMapButton, { backgroundColor: theme.surface }]} 
              onPress={() => setMapModalVisible(false)}
            >
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <MapSearchBar
              onSelect={(coords, address) => {
                setMapRegion(prev => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
                mapRef.current?.setCameraPosition({ coordinates: coords, zoom: 15 })
                  ?.catch(() => {});
              }}
            />
          </View>

          <View style={styles.mapOverlayBottom}>
            <Button
              label={`Confirm ${pickingMode === 'start' ? 'Departure' : 'Destination'}`}
              variant="black"
              size="lg"
              onPress={handleMapConfirm}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
    padding: 20,
  },
  scrollContent: {
    padding: 0,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  formSubtitle: {
    fontSize: 12,
  },
  form: {
    flex: 1,
    marginTop: 20,
  },
  warningBox: {
    padding: 0,
  },
  warningContent: {
    padding: 32,
    alignItems: 'center',
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 16,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  mapButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapOverlayTop: {
    position: 'absolute',
    top: 60,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    zIndex: 99,
  },
  closeMapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#151515',
  },
  mapOverlayBottom: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 24,
  },
  successSub: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 32,
    paddingBottom: 48,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  calendarGrid: {
    paddingBottom: 24,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  dayButton: {
    width: (width - 100) / 4,
    height: 85,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 6,
  },
  dayNumber: {
    fontSize: 22,
    fontWeight: '900',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    bottom: 12,
  },
  digitalTimeBlock: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  digitalTimeText: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  clockFace: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockCenterPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    zIndex: 10,
  },
  clockNumberContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  clockNumberText: {
    fontSize: 16,
    fontWeight: '900',
  },
  clockHand: {
    position: 'absolute',
    width: 2,
    borderRadius: 2,
    zIndex: 1,
    top: '50%',
    left: '50%',
    marginLeft: -1, // half width
  },
  ampmContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  ampmBlock: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ampmText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  }
});
