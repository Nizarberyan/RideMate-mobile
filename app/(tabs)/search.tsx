import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, MapPin, Map, Calendar, Users, ArrowRight, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Ride } from '../../src/api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input, Card, SegmentedControl, PredictionInput } from '../../components/ui';
import { LocationPicker } from '../../components/ui/LocationPicker';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const { client, user } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Search Form State
  const [searchForm, setSearchForm] = useState({
    from: '',
    fromCoords: null as { latitude: number; longitude: number } | null,
    to: '',
    toCoords: null as { latitude: number; longitude: number } | null,
    date: null as Date | null,
  });

  const [rideType, setRideType] = useState<'intra' | 'inter'>('intra');

  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Custom Date Picker Logic
  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    // Show next 30 days
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const loadInitialRides = useCallback(async () => {
    try {
      const initialRides = await client.rides.getAll({ 
        city: user?.city || undefined,
        radius: user?.radius || undefined,
        lat: user?.latitude || undefined,
        lng: user?.longitude || undefined
      });
      setRides(initialRides);
      setIsSearching(false);
    } catch (e) {
      // Silently handle initial load failure
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [client, user?.city, user?.radius, user?.latitude, user?.longitude]);

  const handleSearch = async () => {
    if (!searchForm.from && !searchForm.to && !searchForm.date) {
      loadInitialRides();
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    try {
      let formattedDate: string | undefined = undefined;
      if (searchForm.date) {
        const year = searchForm.date.getFullYear();
        const month = String(searchForm.date.getMonth() + 1).padStart(2, '0');
        const day = String(searchForm.date.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }

      const results = await client.rides.getAll({
        from: searchForm.from || undefined,
        to: searchForm.to || undefined,
        date: formattedDate,
        lat: searchForm.fromCoords?.latitude,
        lng: searchForm.fromCoords?.longitude,
        radius: searchForm.fromCoords ? 10 : undefined,
      });
      setRides(results);
    } catch (e) {
      const error = e as Error;
      Alert.alert(t('common.error'), error.message || "Failed to search rides");
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchForm({ from: '', fromCoords: null, to: '', toCoords: null, date: null });
    loadInitialRides();
  };

  useEffect(() => {
    loadInitialRides();
  }, [loadInitialRides]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isSearching) {
      handleSearch();
    } else {
      loadInitialRides();
    }
  }, [loadInitialRides, isSearching, searchForm]);

  if (isLoading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
            styles.searchHeader,
            {
              backgroundColor: theme.primary,
              paddingTop: insets.top + 20
            }
          ]}>
            <Animated.Text 
              entering={FadeInUp.delay(200).duration(800).springify()}
              style={[styles.searchTitle, { color: '#151515' }]}
            >
              {t('search.title')}
            </Animated.Text>

            <View style={styles.formContainer}>
              <Animated.View entering={FadeInDown.delay(350).duration(800).springify()}>
                 <SegmentedControl 
                    options={[
                      {label: t('offer.types.intra'), value: 'intra', icon: <MapPin size={16} color={rideType === 'intra' ? theme.text : theme.textMuted}/>}, 
                      {label: t('offer.types.inter'), value: 'inter', icon: <Map size={16} color={rideType === 'inter' ? theme.text : theme.textMuted}/>}
                    ]}
                    selectedValue={rideType}
                    onValueChange={(val) => {
                      setRideType(val as 'intra' | 'inter');
                      setSearchForm({ from: '', to: '', date: null, fromCoords: null, toCoords: null });
                    }}
                    style={{ marginBottom: 24 }}
                 />
              </Animated.View>

              {rideType === 'intra' ? (
                <>
                  <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={{ marginBottom: 12 }}>
                    <LocationPicker
                      label=""
                      placeholder={t('search.placeholders.fromIntra')}
                      icon={<MapPin size={20} color={isDark ? "#C1F11D" : "#151515"} />}
                      value={searchForm.from}
                      initialCoords={searchForm.fromCoords || (user?.latitude && user?.longitude ? { latitude: user.latitude, longitude: user.longitude } : null)}
                      onLocationSelect={(loc) => setSearchForm({ 
                        ...searchForm, 
                        from: loc.address,
                        fromCoords: { latitude: loc.latitude, longitude: loc.longitude }
                      })}
                      restrictedCity={user?.city || undefined}
                      style={{ marginBottom: 0 }}
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(500).duration(800).springify()} style={{ marginBottom: 12 }}>
                    <LocationPicker
                      label=""
                      placeholder={t('search.placeholders.toIntra')}
                      icon={<MapPin size={20} color="#ef4444" />}
                      value={searchForm.to}
                      initialCoords={searchForm.toCoords || (user?.latitude && user?.longitude ? { latitude: user.latitude, longitude: user.longitude } : null)}
                      onLocationSelect={(loc) => setSearchForm({ 
                        ...searchForm, 
                        to: loc.address,
                        toCoords: { latitude: loc.latitude, longitude: loc.longitude }
                      })}
                      restrictedCity={user?.city || undefined}
                      style={{ marginBottom: 0 }}
                    />
                  </Animated.View>
                </>
              ) : (
                <>
                  <Animated.View entering={FadeInUp.delay(400).duration(800).springify()} style={{ zIndex: 2 }}>
                    <PredictionInput
                      containerStyle={{ marginBottom: 12 }}
                      inputWrapperStyle={{ backgroundColor: isDark ? '#151515' : '#ffffff', borderColor: isDark ? '#151515' : '#ffffff' }}
                      inputStyle={{ color: isDark ? '#ffffff' : '#151515' }}
                      leftIcon={<MapPin size={20} color={isDark ? "#C1F11D" : "#151515"} />}
                      placeholder={t('search.placeholders.fromCity')}
                      placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(21, 21, 21, 0.4)"}
                      value={searchForm.from}
                      onSelect={(value) => setSearchForm({ ...searchForm, from: value })}
                    />
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(500).duration(800).springify()} style={{ zIndex: 1 }}>
                    <PredictionInput
                      containerStyle={{ marginBottom: 12 }}
                      inputWrapperStyle={{ backgroundColor: isDark ? '#151515' : '#ffffff', borderColor: isDark ? '#151515' : '#ffffff' }}
                      inputStyle={{ color: isDark ? '#ffffff' : '#151515' }}
                      leftIcon={<MapPin size={20} color="#ef4444" />}
                      placeholder={t('search.placeholders.toCity')}
                      placeholderTextColor={isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(21, 21, 21, 0.4)"}
                      value={searchForm.to}
                      onSelect={(value) => setSearchForm({ ...searchForm, to: value })}
                    />
                  </Animated.View>
                </>
              )}

              <Animated.View entering={FadeInUp.delay(600).duration(800).springify()}>
                <TouchableOpacity
                  style={[
                    styles.dateSelector, 
                    { backgroundColor: isDark ? '#151515' : '#ffffff', borderColor: isDark ? '#151515' : '#ffffff', borderWidth: 1.5 }
                  ]}
                  onPress={() => setShowCustomPicker(true)}
                  activeOpacity={0.7}
                >
                  <Calendar size={20} color={isDark ? "#C1F11D" : "#151515"} />
                  <Text style={[
                    styles.dateText,
                    { color: searchForm.date ? (isDark ? '#ffffff' : '#151515') : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(21, 21, 21, 0.4)') }
                  ]}>
                    {searchForm.date
                      ? searchForm.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                      : t('search.placeholders.date')
                    }
                  </Text>
                  {isSearching && (
                    <TouchableOpacity onPress={clearSearch} style={styles.clearButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <X size={20} color={isDark ? "#ffffff" : "#151515"} />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(700).duration(800).springify()} style={{ marginTop: 8 }}>
                <Button
                  label={t('common.search')}
                  variant={isDark ? "brand" : "black"}
                  size="lg"
                  icon={<SearchIcon size={20} color={isDark ? "#C1F11D" : "#ffffff"} />}
                  onPress={handleSearch}
                />
              </Animated.View>
            </View>
          </View>

          <View style={styles.mainContent}>
            <View style={styles.resultsHeader}>
              <Animated.Text 
                entering={FadeInDown.delay(700).duration(800).springify()}
                style={[styles.resultsLabel, { color: theme.text }]}
              >
                {isSearching 
                  ? t('search.results.found', { count: rides.length }) 
                  : user?.city 
                    ? t('search.results.inCity', { city: user.city }) 
                    : t('search.results.all')
                }
              </Animated.Text>
              {!isSearching && (
                <Animated.View 
                  entering={FadeInDown.delay(700).duration(800).springify()}
                  style={[styles.nearBadge, { backgroundColor: isDark ? 'rgba(193, 241, 29, 0.15)' : 'rgba(193, 241, 29, 0.3)' }]}
                >
                  <Text style={[styles.nearText, { color: isDark ? theme.primary : '#4d7c0f' }]}>{t('search.results.near')}</Text>
                </Animated.View>
              )}
            </View>

            {rides.length === 0 ? (
              <Card style={styles.emptyCard} delay={800}>
                <View style={styles.emptyState}>
                  <SearchIcon size={40} color={theme.textMuted} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    {t('search.results.empty')}
                  </Text>
                </View>
              </Card>
            ) : (
              rides.map((ride, index) => (
                <Card
                  key={ride.id}
                  onPress={() => router.push(`/rides/${ride.id}`)}
                  contentStyle={{ padding: 0 }}
                  style={styles.rideCard}
                  delay={800 + (index * 100)}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.locationRow, { marginRight: 12 }]}>
                      <Text style={[styles.locationText, { color: theme.text, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{ride.startLocation}</Text>
                      <ArrowRight size={16} color={theme.textMuted} style={{ marginHorizontal: 8, flexShrink: 0 }} />
                      <Text style={[styles.locationText, { color: theme.text, flex: 1 }]} numberOfLines={1} ellipsizeMode="tail">{ride.endLocation}</Text>
                    </View>
                  </View>
                  
                  <Text style={[styles.rideDate, { color: theme.textMuted }]}>
                    {new Date(ride.departureDatetime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <View style={styles.cardFooter}>
                    <View style={styles.driverInfo}>
                      <View style={[styles.driverAvatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>{ride.driver?.name?.charAt(0) || 'U'}</Text>
                      </View>
                      <View>
                        <Text style={[styles.driverName, { color: theme.text }]}>{ride.driver?.name || t('ride.passengerCard.unknown')}</Text>
                        <Text style={[styles.vehicleInfo, { color: theme.textMuted }]}>
                          {ride.driver?.vehicleModel || t('ride.details.noPlate')}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.seatsBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Users size={14} color={theme.textMuted} />
                      <Text style={[styles.seatsText, { color: theme.textMuted }]}>{t('search.card.left', { count: ride.availableSeats })}</Text>
                    </View>
                  </View>
                </Card>
              ))
            )}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showCustomPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCustomPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <TouchableOpacity activeOpacity={1} style={{ width: '100%' }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('offer.actions.confirmDate')}</Text>
                <TouchableOpacity onPress={() => setShowCustomPicker(false)} style={styles.closeModalButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.calendarGrid}
              >
                <View style={styles.daysContainer}>
                  {calendarDays.map((date, index) => {
                    const isSelected = searchForm.date?.toDateString() === date.toDateString();
                    const isToday = new Date().toDateString() === date.toDateString();

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayButton,
                          { borderColor: theme.border },
                          isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }
                        ]}
                        onPress={() => {
                          setSearchForm({ ...searchForm, date });
                          setShowCustomPicker(false);
                        }}
                      >
                        <Text style={[
                          styles.dayName,
                          { color: isSelected ? '#151515' : theme.textMuted }
                        ]}>
                          {date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                        </Text>
                        <Text style={[
                          styles.dayNumber,
                          { color: isSelected ? '#151515' : theme.text }
                        ]}>
                          {date.getDate()}
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
                label={t('offer.actions.confirmDate')}
                variant="black"
                size="lg"
                onPress={() => setShowCustomPicker(false)}
                style={{ marginTop: 24 }}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 0 },
  mainContent: { padding: 24 },
  searchHeader: { padding: 24, paddingBottom: 40, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  searchTitle: { fontSize: 32, fontWeight: '900', marginBottom: 24, letterSpacing: -1 },
  formContainer: { width: '100%' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: 18, marginBottom: 12 },
  dateText: { flex: 1, marginLeft: 16, fontSize: 16, fontWeight: '700' },
  clearButton: { padding: 8 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 12 },
  resultsLabel: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  nearBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  nearText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  emptyCard: { padding: 0, marginTop: 24, borderRadius: 32, borderWidth: 0 },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyText: { marginTop: 16, fontWeight: '700', fontSize: 16, textAlign: 'center', lineHeight: 24 },
  rideCard: { padding: 24, marginBottom: 20, borderRadius: 32, borderWidth: 0 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationText: { fontSize: 18, fontWeight: '900', flexShrink: 1 },
  rideDate: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  divider: { height: 1, marginVertical: 18, opacity: 0.5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverAvatar: { width: 44, height: 44, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#151515' },
  driverName: { fontSize: 15, fontWeight: '800' },
  vehicleInfo: { fontSize: 12, fontWeight: '600' },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  seatsText: { fontSize: 13, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, paddingBottom: 48, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  modalTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  closeModalButton: { padding: 4 },
  calendarGrid: { paddingBottom: 24 },
  daysContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  dayButton: { width: (width - 100) / 4, height: 85, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  dayName: { fontSize: 11, fontWeight: '900', marginBottom: 6 },
  dayNumber: { fontSize: 22, fontWeight: '900' },
  todayDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 12 }
});
