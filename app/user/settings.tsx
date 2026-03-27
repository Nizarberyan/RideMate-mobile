import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Storage } from "../../src/utils/Storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";

// expo-maps does not support web. Using a placeholder for web to prevent "Cannot find native module 'ExpoMaps'"
const { GoogleMaps, AppleMaps } = Platform.OS !== 'web' ? require('expo-maps') : { GoogleMaps: { View: View }, AppleMaps: { View: View } };

import { 
  ArrowLeft, 
  CheckCircle2, 
  User as UserIcon, 
  Camera, 
  X, 
  MapPin, 
  Map, 
  Car, 
  Settings, 
  LogOut,
  Save,
  Languages
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button, Card, Input, Toggle, ConfirmDialog, MapMarker, MapSearchBar, SegmentedControl } from "../../components/ui";

const MapView = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;
const { width } = Dimensions.get("window");

export default function SettingsScreen() {
  const { user, client, signIn, signOut } = useAuth();
  const { theme, isDark, toggleTheme, spacing, typography } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const isMounted = React.useRef(true);

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
    icon?: React.ReactNode;
    actions: { label: string; onPress: () => void; style?: 'default' | 'destructive' | 'cancel' }[];
  };
  const [dialog, setDialog] = useState<DialogConfig>({ visible: false, title: '', actions: [] });
  const dismissDialog = () => setDialog(prev => ({ ...prev, visible: false }));

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
      setDialog({
        visible: true,
        title: t('settings.dialogs.permission.title'),
        message: t('settings.dialogs.permission.message'),
        actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setFormData({ ...formData, photo: base64Image });
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, photo: "" });
  };

  const safelyMoveCamera = async (coords: { latitude: number, longitude: number }, zoom = 15) => {
    try {
      if (mapRef.current && isMounted.current) {
        await mapRef.current.setCameraPosition({ coordinates: coords, zoom });
      }
    } catch (err) { }
  };

  const openCityMap = async () => {
    setMapModalVisible(true);
    try {
      if (!formData.latitude) {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const lastKnown = await Location.getLastKnownPositionAsync({});
        if (lastKnown) {
          const lat = lastKnown.coords.latitude;
          const lng = lastKnown.coords.longitude;
          setMapRegion(prev => ({ ...prev, latitude: lat, longitude: lng }));
          await safelyMoveCamera({ latitude: lat, longitude: lng });
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (location) {
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          setMapRegion(prev => ({ ...prev, latitude: lat, longitude: lng }));
          await safelyMoveCamera({ latitude: lat, longitude: lng });
        }
      } else {
        const lat = formData.latitude;
        const lng = formData.longitude!;
        setMapRegion(prev => ({ ...prev, latitude: lat, longitude: lng }));
        await safelyMoveCamera({ latitude: lat, longitude: lng });
      }
    } catch (e) { }
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

    try {
      const address = await Location.reverseGeocodeAsync(coords);
      if (address[0]) {
        setFormData((prev) => ({
          ...prev,
          city: address[0].city || address[0].region || "",
        }));
      }
    } catch (e) { }

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
        language: i18n.language.split('-')[0],
      };
      const updatedUser = await client.auth.updateProfile(updateData);
      
      const token = await client.getToken();
      const refreshToken = await Storage.getItemAsync("refresh_token");

      if (token && refreshToken) {
        await signIn({
          access_token: token,
          refresh_token: refreshToken,
          user: updatedUser,
        });
      }
      setDialog({
        visible: true,
        title: t('settings.dialogs.success.title'),
        message: t('settings.dialogs.success.message'),
        icon: <CheckCircle2 size={26} color="#22c55e" strokeWidth={2.5} />,
        actions: [{ label: t('common.done'), onPress: dismissDialog, style: 'default' }],
      });
    } catch (e: any) {
      setDialog({
        visible: true,
        title: t('common.error'),
        message: (e as Error).message || 'Something went wrong. Please try again.',
        actions: [{ label: t('common.ok'), onPress: dismissDialog, style: 'cancel' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    await i18n.changeLanguage(newLang);
    // Persist to backend immediately for cross-device sync
    try {
      const updatedUser = await client.auth.updateProfile({ language: newLang });
      const token = await client.getToken();
      const refreshToken = await Storage.getItemAsync("refresh_token");
      if (token && refreshToken) {
        await signIn({ access_token: token, refresh_token: refreshToken, user: updatedUser });
      }
    } catch (e) {
      console.error("Failed to sync language to backend", e);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 20, backgroundColor: theme.surface }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.background }]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('settings.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()} style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatarContainer, { shadowColor: theme.primary }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              {formData.photo ? (
                <Image source={{ uri: formData.photo }} style={styles.avatarImage} />
              ) : (
                <UserIcon size={44} color="#151515" />
              )}
            </View>
            <View style={[styles.cameraBadge, { backgroundColor: isDark ? "#262626" : "#fff" }]}>
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
          <Text style={[styles.avatarLabel, { color: theme.textMuted }]}>{t('settings.info.map.select')}</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
          <Card
            title={t('settings.info.title')}
            subTitle={t('settings.info.subtitle')}
            icon={<UserIcon size={20} color={theme.text} />}
            style={styles.card}
          >
            <Input
              label={t('settings.info.name')}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder={t('settings.info.placeholder.name')}
            />

            <View style={styles.inputWithButton}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('settings.info.city')}
                  leftIcon={<MapPin size={20} color={theme.primary} />}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder={t('settings.info.placeholder.city')}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <TouchableOpacity
                style={[styles.mapButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6" }]}
                onPress={openCityMap}
              >
                <Map size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <Input
              label={t('settings.info.bio')}
              value={formData.bio}
              onChangeText={(text) => setFormData({ ...formData, bio: text })}
              placeholder={t('settings.info.placeholder.bio')}
              multiline
              numberOfLines={4}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(600).springify()}>
          <Card
            title={t('settings.vehicle.title')}
            subTitle={t('settings.vehicle.subtitle')}
            icon={<Car size={20} color={theme.text} />}
            style={styles.card}
          >
            <Input
              label={t('settings.vehicle.model')}
              value={formData.vehicleModel}
              onChangeText={(text) => setFormData({ ...formData, vehicleModel: text })}
              placeholder={t('settings.vehicle.placeholder.model')}
            />

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Input
                  label={t('settings.vehicle.color')}
                  value={formData.vehicleColor}
                  onChangeText={(text) => setFormData({ ...formData, vehicleColor: text })}
                  placeholder={t('settings.vehicle.placeholder.color')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('settings.vehicle.plate')}
                  value={formData.vehiclePlate}
                  onChangeText={(text) => setFormData({ ...formData, vehiclePlate: text })}
                  placeholder={t('settings.vehicle.placeholder.plate')}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(600).springify()}>
          <Card
            title={t('settings.preferences.title')}
            subTitle={t('settings.preferences.subtitle')}
            icon={<Settings size={20} color={theme.text} />}
            style={styles.card}
          >
            <Toggle
              label={t('settings.preferences.darkMode')}
              subLabel={t('settings.preferences.darkModeSubtitle')}
              value={isDark}
              onValueChange={toggleTheme}
            />
            
            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: spacing.lg }]} />
            
            <View style={{ marginBottom: spacing.md }}>
              <Text style={[typography.caption, { color: theme.textMuted, marginBottom: spacing.sm, marginLeft: spacing.xs }]}>
                {t('settings.preferences.language')}
              </Text>
              <SegmentedControl
                options={[
                  { label: 'English', value: 'en' },
                  { label: 'Français', value: 'fr' },
                  { label: 'العربية', value: 'ar' }
                ]}
                selectedValue={i18n.language.split('-')[0]}
                onValueChange={handleLanguageChange}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: spacing.lg }]} />

            <Input
              label={t('settings.preferences.radius')}
              leftIcon={<MapPin size={20} color={theme.primary} />}
              value={formData.radius}
              onChangeText={(text) => setFormData({ ...formData, radius: text })}
              placeholder="e.g. 50"
              keyboardType="numeric"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
          <Button
            label={t('settings.actions.save')}
            variant="black"
            size="lg"
            icon={<Save size={22} color={isDark ? theme.primary : "#fff"} />}
            onPress={handleSubmit}
            isLoading={isSubmitting}
            style={styles.saveButton}
          />
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 32 }]} />

        <Animated.View entering={FadeInDown.delay(600).duration(800).springify()}>
          <Text style={[styles.dangerTitle, { color: theme.danger }]}>{t('settings.actions.dangerZone')}</Text>
          <Button
            label={t('settings.actions.signOut')}
            variant="outline"
            size="md"
            icon={<LogOut size={20} color={theme.danger} />}
            onPress={signOut}
            style={[styles.logoutButton, { borderColor: theme.danger }]}
            textStyle={{ color: theme.danger }}
          />
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>

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
            onMapLoaded={async () => {
              await safelyMoveCamera({ latitude: mapRegion.latitude, longitude: mapRegion.longitude });
              await new Promise(resolve => setTimeout(resolve, 400));
              await safelyMoveCamera({ latitude: mapRegion.latitude, longitude: mapRegion.longitude });
            }}
            uiSettings={{ myLocationButtonEnabled: true }}
            properties={{ isMyLocationEnabled: true }}
            onCameraMove={(event: any) => {
              const lat = event.nativeEvent?.cameraPosition?.coordinates?.latitude ?? event.coordinates?.latitude;
              const lng = event.nativeEvent?.cameraPosition?.coordinates?.longitude ?? event.coordinates?.longitude;
              if (lat && lng) {
                setMapRegion(prev => ({ ...prev, latitude: lat, longitude: lng }));
              }
            }}
          />
          <MapMarker />

          <View style={styles.mapOverlayTop}>
            <TouchableOpacity
              style={[styles.closeMapButton, { backgroundColor: theme.surface }]}
              onPress={() => setMapModalVisible(false)}
            >
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <MapSearchBar
              onSelect={async (coords) => {
                setMapRegion(prev => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
                await safelyMoveCamera(coords);
              }}
            />
          </View>

          <View style={styles.mapOverlayBottom}>
            <Button
              label={t('settings.info.map.title')}
              variant="black"
              size="lg"
              onPress={handleCityMapConfirm}
            />
          </View>
        </View>
      </Modal>

      <ConfirmDialog
        visible={dialog.visible}
        title={dialog.title}
        message={dialog.message}
        icon={dialog.icon}
        actions={dialog.actions}
        onDismiss={dismissDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarContainer: {
    marginBottom: 12,
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
  avatarLabel: {
    fontSize: 13,
    fontWeight: '700',
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
    borderColor: "#C1F11D",
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
    borderColor: "#FFFEE9",
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
  inputWithButton: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 20,
  },
  mapButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 20,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 16,
    marginLeft: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  logoutButton: {
    borderRadius: 20,
    borderWidth: 2,
  },
  mapOverlayTop: {
    position: "absolute",
    top: 60,
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    zIndex: 99,
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
  mapOverlayBottom: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
  },
});
