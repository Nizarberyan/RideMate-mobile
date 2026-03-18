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
} from 'react-native';
import { GoogleMaps, AppleMaps } from 'expo-maps';
import * as Location from 'expo-location';
import { MapPin, X, Check, Navigation, Search } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;

interface LocationPickerProps {
  label: string;
  value: string;
  onLocationSelect: (location: { address: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}

export function LocationPicker({ label, value, onLocationSelect, placeholder, icon }: LocationPickerProps) {
  const { theme, isDark } = useTheme();
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [tempAddress, setTempAddress] = useState('');
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = React.useRef<any>(null);

  const handleOpenMap = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setLoading(false);
        setShowMap(true);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedCoords(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      mapRef.current?.setCameraPosition({
        coordinates: coords,
        zoom: 15,
      });

      // Reverse geocode initial location
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
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setShowMap(true);
    }
  };

  const handleConfirm = () => {
    if (selectedCoords) {
      onLocationSelect({
        address: tempAddress || value,
        latitude: selectedCoords.latitude,
        longitude: selectedCoords.longitude,
      });
      setShowMap(false);
    }
  };

  return (
    <View style={styles.container}>
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
            onMapLoaded={() => {
              if (selectedCoords) {
                mapRef.current?.setCameraPosition({
                  coordinates: selectedCoords,
                  zoom: 15
                });
              } else {
                mapRef.current?.setCameraPosition({
                  coordinates: { latitude: mapRegion.latitude, longitude: mapRegion.longitude },
                  zoom: 15
                });
              }
            }}
            onCameraMove={(event: any) => {
              const lat = event.nativeEvent?.cameraPosition?.coordinates?.latitude ?? event.coordinates?.latitude;
              const lng = event.nativeEvent?.cameraPosition?.coordinates?.longitude ?? event.coordinates?.longitude;
              if (lat && lng) {
                setMapRegion({
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
                setSelectedCoords({
                  latitude: lat,
                  longitude: lng,
                });
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

          {/* Header */}
          <View style={[styles.mapHeader, { paddingTop: 50 }]}>
            <TouchableOpacity
              onPress={() => setShowMap(false)}
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
          <View style={[styles.mapFooter, { paddingBottom: 40 }]}>
            <Button
              label="Confirm Location"
              variant="black"
              size="lg"
              disabled={!selectedCoords}
              onPress={handleConfirm}
              style={{ width: '100%' }}
              icon={<Check size={20} color={theme.primary} />}
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
