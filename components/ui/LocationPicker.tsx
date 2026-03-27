import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';

// expo-maps does not support web. Using a placeholder for web to prevent "Cannot find native module 'ExpoMaps'"
const { GoogleMaps, AppleMaps } = Platform.OS !== 'web' ? require('expo-maps') : { GoogleMaps: { View: View }, AppleMaps: { View: View } };

import { MapPin, X, Check, Navigation, Search } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from './index';
import { MapMarker } from './MapMarker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ViewStyle, StyleProp } from 'react-native';

const { width, height } = Dimensions.get('window');

const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;

interface LocationPickerProps {
  label: string;
  value: string;
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  restrictedCity?: string;
  initialCoords?: { latitude: number; longitude: number } | null;
  style?: StyleProp<ViewStyle>;
}

export function LocationPicker({ label, value, onLocationSelect, placeholder, icon, restrictedCity, initialCoords, style }: LocationPickerProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [tempAddress, setTempAddress] = useState('');
  
  // Default to SF only if absolutely no other context is provided
  const [mapRegion, setMapRegion] = useState({
    latitude: initialCoords?.latitude || 37.78825,
    longitude: initialCoords?.longitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const mapRef = React.useRef<any>(null);

  const safelyMoveCamera = async (coords: { latitude: number, longitude: number }, zoom = 15) => {
    try {
      if (mapRef.current) {
        await mapRef.current.setCameraPosition({ coordinates: coords, zoom });
      }
    } catch (err) {
      // Silently handle animation cancellation during unmount
    }
  };

  const fetchAddress = async (coords: { latitude: number; longitude: number }) => {
    try {
      const reverse = await Location.reverseGeocodeAsync(coords);
      if (reverse.length > 0) {
        let name = reverse[0].name || '';
        if (name.includes('+')) name = '';
        let streetPart = reverse[0].street || '';
        if (streetPart && reverse[0].streetNumber) {
          streetPart = `${reverse[0].streetNumber} ${streetPart}`;
        }
        const primary = streetPart || name;
        const addr = [primary, reverse[0].city || reverse[0].subregion].filter(Boolean).join(', ');
        setTempAddress(addr.trim() || 'Selected Location');
      } else {
        setTempAddress('Custom Location');
      }
    } catch (e) {
      setTempAddress('Custom Location');
    }
  };

  const handleOpenMap = async () => {
    setShowMap(true);
    setLoading(true);

    try {
      const targetCoords = initialCoords || selectedCoords;
      if (targetCoords) {
        setMapRegion({
          ...targetCoords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSelectedCoords(targetCoords);
        await fetchAddress(targetCoords);
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!targetCoords) {
          Alert.alert('Permission Denied', 'Permission to access location was denied. Please select manually.');
        }
        setLoading(false);
        return;
      }

      if (!targetCoords) {
        let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const currentCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setSelectedCoords(currentCoords);
        setMapRegion({
          ...currentCoords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        await safelyMoveCamera(currentCoords);
        await fetchAddress(currentCoords);
      }
    } catch (e) {
      console.warn("Location fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowMap(false);
  };

  const handleConfirm = async () => {
    if (selectedCoords) {
      const finalAddress = tempAddress || "Selected Location";
      
      if (restrictedCity) {
        setLoading(true);
        try {
          const reverse = await Location.reverseGeocodeAsync(selectedCoords);
          const cityMatched = reverse.some(
            (r) =>
              r.city?.toLowerCase().includes(restrictedCity.toLowerCase()) ||
              r.subregion?.toLowerCase().includes(restrictedCity.toLowerCase())
          );
          
          if (!cityMatched && reverse.length > 0) {
            Alert.alert(
              "Out of Bounds",
              `This ride requires locations within ${restrictedCity}. You selected somewhere else.`
            );
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Geocoding validation failed", e);
        }
        setLoading(false);
      }

      onLocationSelect({
        address: finalAddress,
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
      });
      setShowMap(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

      <TouchableOpacity
        style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={handleOpenMap}
        activeOpacity={0.7}
      >
        <View style={styles.leftIcon}>
          {icon || <MapPin size={20} color={theme.primary} />}
        </View>
        <Text
          style={[styles.valueText, { color: value ? theme.text : theme.textMuted }]}
          numberOfLines={1}
        >
          {value || placeholder || "Select location on map..."}
        </Text>
        {loading && <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 12 }} />}
      </TouchableOpacity>

      <Modal
        visible={showMap}
        animationType="slide"
        transparent={false}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            onMapLoaded={async () => {
              const coords = selectedCoords ? selectedCoords : { latitude: mapRegion.latitude, longitude: mapRegion.longitude };
              await safelyMoveCamera(coords);
            }}
            onCameraMoveComplete={async (event: any) => {
              const lat = event.nativeEvent?.cameraPosition?.coordinates?.latitude ?? event.coordinates?.latitude;
              const lng = event.nativeEvent?.cameraPosition?.coordinates?.longitude ?? event.coordinates?.longitude;
              if (lat && lng) {
                const newCoords = { latitude: lat, longitude: lng };
                setSelectedCoords(newCoords);
                await fetchAddress(newCoords);
              }
            }}
          />
          <MapMarker />

          {/* Header */}
          <View style={[styles.mapHeader, { paddingTop: 50 }]}>
            <TouchableOpacity
              onPress={handleDismiss}
              style={[styles.circleButton, { backgroundColor: theme.surface }]}
            >
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={[styles.addressCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={2}>
                {tempAddress || "Move map to select location"}
              </Text>
            </View>
          </View>

          {/* Bottom Action */}
          <View style={[styles.mapFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <Button
              label={loading ? "Verifying Area..." : "Confirm Location"}
              variant="black"
              size="lg"
              disabled={!selectedCoords || loading}
              onPress={handleConfirm}
              style={{ width: '100%' }}
              icon={!loading ? <Check size={20} color={theme.primary} /> : undefined}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
  },
  leftIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  addressCard: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '800',
  },
  mapFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  }
});
