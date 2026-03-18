import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { GoogleMaps, AppleMaps } from 'expo-maps';
const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;
import * as Location from "expo-location";
import {
  User as UserIcon,
  Car,
  Save,
  LogOut,
  MapPin,
  Settings,
  Camera,
  X,
  Map,
} from "lucide-react-native";

const { width, height } = Dimensions.get("window");
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button, Input, Card, Toggle } from "../../components/ui";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Platform } from "react-native";

export default function Profile() {
  const { user, client, signIn, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    city: "",
    radius: "50",
    latitude: null as number | null,
    longitude: null as number | null,
    photo: "",
    vehicleModel: "",
    vehicleColor: "",
    vehiclePlate: "",
  });

  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = React.useRef<any>(null);

  const loadProfile = useCallback(async () => {
    try {
      const updatedUser = await client.auth.getProfile();
      const token = await client.getToken();
      const refreshToken = await SecureStore.getItemAsync("refresh_token");

      if (token && refreshToken) {
        await signIn({
          access_token: token,
          refresh_token: refreshToken,
          user: updatedUser,
        });
      }
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    } finally {
      setRefreshing(false);
    }
  }, [client, signIn]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        bio: user.bio || "",
        city: user.city || "",
        radius: user.radius?.toString() || "50",
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        photo: user.photo || "",
        vehicleModel: user.vehicleModel || "",
        vehicleColor: user.vehicleColor || "",
        vehiclePlate: user.vehiclePlate || "",
      });
    }
  }, [user]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Sorry, we need camera roll permissions to make this work!",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      // For a real app, you'd upload this to S3/Cloudinary.
      // For this prototype, we'll send the base64 string if it's small enough,
      // or just keep it as a local URI if the backend doesn't store it.
      // Let's use base64 for now so it "persists" in the DB.
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData({ ...formData, photo: base64Image });
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, photo: "" });
  };

  const openCityMap = async () => {
    setMapModalVisible(true);

    if (mapRef.current) {
        mapRef.current.setCameraPosition({ coordinates: { latitude: mapRegion.latitude, longitude: mapRegion.longitude }, zoom: 15 });
    }

    try {
      if (!formData.latitude) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

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
      } else {
        const lat = formData.latitude;
        const lng = formData.longitude!;
        setMapRegion(prev => ({...prev, latitude: lat, longitude: lng}));
        mapRef.current?.setCameraPosition({ coordinates: { latitude: lat, longitude: lng }, zoom: 15 });
      }
    } catch (e) {
      console.log("Location fetch skipped or failed");
    }
  };

  const handleCityMapConfirm = async () => {
    const coords = {
      latitude: mapRegion.latitude,
      longitude: mapRegion.longitude,
    };
    setFormData({
      ...formData,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    // Try to get city name
    try {
      const address = await Location.reverseGeocodeAsync(coords);
      if (address[0]) {
        setFormData((prev) => ({
          ...prev,
          city: address[0].city || address[0].region || "",
        }));
      }
    } catch (e) {}

    setMapModalVisible(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updateData = {
        ...formData,
        radius: parseFloat(formData.radius) || 50,
        latitude: formData.latitude ?? undefined,
        longitude: formData.longitude ?? undefined,
      };
      const updatedUser = await client.auth.updateProfile(updateData);
      // Update local context
      const token = await client.getToken();
      const refreshToken = await SecureStore.getItemAsync("refresh_token");

      if (token && refreshToken) {
        await signIn({
          access_token: token,
          refresh_token: refreshToken,
          user: updatedUser,
        });
      }
      Alert.alert("Success", "Profile updated successfully!");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { backgroundColor: theme.background, paddingTop: insets.top + 20 },
        ]}
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
        <View
          style={{
            backgroundColor: theme.background,
            position: "absolute",
            top: -(insets.top + 20),
            left: 0,
            right: 0,
            height: insets.top + 20 + 100,
          }}
        />

        <Animated.View
          entering={FadeInUp.delay(200).duration(800).springify()}
          style={styles.profileHeader}
        >
          <TouchableOpacity
            style={[styles.avatarContainer, { shadowColor: theme.primary }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <View
              style={[styles.avatarCircle, { backgroundColor: theme.primary }]}
            >
              {formData.photo ? (
                <Image
                  source={{ uri: formData.photo }}
                  style={styles.avatarImage}
                />
              ) : (
                <UserIcon size={44} color="#151515" />
              )}
            </View>
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: isDark ? "#262626" : "#fff" },
              ]}
            >
              <Camera size={16} color={theme.primary} />
            </View>
            {formData.photo ? (
              <TouchableOpacity
                style={styles.removeBadge}
                onPress={removeImage}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={12} color="#fff" />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.name || "User"}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {user?.email}
          </Text>
        </Animated.View>

        <Card
          title="App Settings"
          subTitle="Customize your app experience"
          icon={<Settings size={20} color={theme.text} />}
          style={styles.card}
          delay={400}
        >
          <Toggle
            label="Dark Mode"
            subLabel="Switch between light and dark themes"
            value={isDark}
            onValueChange={toggleTheme}
          />
        </Card>

        <Card
          title="General Information"
          subTitle="Manage your public profile details"
          icon={<UserIcon size={20} color={theme.text} />}
          style={styles.card}
          delay={500}
        >
          <Input
            label="Full Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g. John Doe"
          />

          <View style={styles.inputWithButton}>
            <View style={{ flex: 1 }}>
              <Input
                label="Home City"
                leftIcon={<MapPin size={20} color={theme.primary} />}
                value={formData.city}
                onChangeText={(text) =>
                  setFormData({ ...formData, city: text })
                }
                placeholder="e.g. San Francisco"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.mapButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "#f3f4f6",
                },
              ]}
              onPress={openCityMap}
            >
              <Map size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <Input
            label="Search Radius (km)"
            leftIcon={<Settings size={20} color={theme.primary} />}
            value={formData.radius}
            onChangeText={(text) => setFormData({ ...formData, radius: text })}
            placeholder="e.g. 50"
            keyboardType="numeric"
          />

          <Input
            label="Bio"
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Share a bit about yourself with the community..."
            multiline
            numberOfLines={4}
          />
        </Card>

        <Card
          title="Vehicle Details"
          subTitle="Add your car info to start hosting rides"
          icon={<Car size={20} color={theme.text} />}
          style={styles.card}
          delay={600}
        >
          <Input
            label="Vehicle Model"
            value={formData.vehicleModel}
            onChangeText={(text) =>
              setFormData({ ...formData, vehicleModel: text })
            }
            placeholder="e.g. Tesla Model 3"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Input
                label="Color"
                value={formData.vehicleColor}
                onChangeText={(text) =>
                  setFormData({ ...formData, vehicleColor: text })
                }
                placeholder="e.g. Silver"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="License Plate"
                value={formData.vehiclePlate}
                onChangeText={(text) =>
                  setFormData({ ...formData, vehiclePlate: text })
                }
                placeholder="e.g. ABC-1234"
              />
            </View>
          </View>
        </Card>

        <Animated.View
          entering={FadeInDown.delay(700).duration(800).springify()}
        >
          <Button
            label="Save Changes"
            variant="black"
            size="lg"
            icon={<Save size={22} color={isDark ? theme.primary : "#fff"} />}
            onPress={handleSubmit}
            isLoading={isSubmitting}
            style={styles.saveButton}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(800).duration(800).springify()}
        >
          <Button
            label="Sign Out"
            variant="danger"
            size="md"
            icon={<LogOut size={20} color="#ef4444" />}
            onPress={signOut}
            style={styles.logoutButton}
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

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
              style={[
                styles.closeMapButton,
                { backgroundColor: theme.surface },
              ]}
              onPress={() => setMapModalVisible(false)}
            >
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={[styles.mapBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.mapBadgeText}>Set Home City</Text>
            </View>
          </View>

          <View style={styles.mapOverlayBottom}>
            <Button
              label="Confirm Location"
              variant="black"
              size="lg"
              onPress={handleCityMapConfirm}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 20,
    position: "relative",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  cameraBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C1F11D", // Primary color
    elevation: 2,
  },
  removeBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFEE9", // Background color
  },
  userName: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 6,
  },
  card: {
    borderRadius: 32,
    borderWidth: 0,
    marginBottom: 24,
    padding: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  row: {
    flexDirection: "row",
  },
  inputWithButton: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  mapButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mapOverlayTop: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeMapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapBadgeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#151515",
  },
  mapOverlayBottom: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 20,
  },
  logoutButton: {
    marginTop: 20,
    borderRadius: 20,
  },
});
