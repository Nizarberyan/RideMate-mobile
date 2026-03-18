import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Leaf, 
  Car, 
  Calendar, 
  MapPin,
  Star
} from 'lucide-react-native';
import { User } from '@/src/api/client';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, user: currentUser } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    if (!id) return;
    try {
      // @ts-ignore - newly added method
      const data = await client.users.getOne(id);
      setUser(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load user profile");
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [id, client, router]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!user) return null;

  const joinedDate = new Date(user.createdAt);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header / Banner */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.primary }]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#151515" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.profileBanner}>
          <View style={[styles.avatarContainer, { backgroundColor: theme.background }]}>
            {user.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.text }]}>{user.name?.charAt(0) || 'U'}</Text>
            )}
            <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
              <ShieldCheck size={14} color="#151515" />
            </View>
          </View>
          
          <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={theme.textMuted} />
            <Text style={[styles.locationText, { color: theme.textMuted }]}>
              {user.city || "Earth"}
            </Text>
          </View>

          <StatsRow>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Leaf size={16} color="#10b981" />
              <Text style={[styles.statValue, { color: theme.text }]}>{user.carbonSavedKg}kg</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>CO2 Saved</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Star size={16} color="#f59e0b" />
              <Text style={[styles.statValue, { color: theme.text }]}>4.9</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Rating</Text>
            </View>
          </StatsRow>
        </Animated.View>

        {/* Bio Section */}
        {user.bio && (
          <Animated.View entering={FadeInDown.delay(200).duration(600).springify()}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
            <Card style={styles.infoCard} contentStyle={{ padding: 20 }}>
              <Text style={[styles.bioText, { color: theme.textMuted }]}>
                {user.bio}
              </Text>
            </Card>
          </Animated.View>
        )}

        {/* Vehicle Section */}
        {user.vehicleModel && (
          <Animated.View entering={FadeInDown.delay(300).duration(600).springify()}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Vehicle</Text>
            <Card style={styles.infoCard} contentStyle={{ padding: 20 }}>
              <View style={styles.vehicleRow}>
                <View style={[styles.vehicleIcon, { backgroundColor: isDark ? 'rgba(193, 241, 29, 0.1)' : 'rgba(193, 241, 29, 0.2)' }]}>
                  <Car size={24} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.vehicleName, { color: theme.text }]}>
                    {user.vehicleColor} {user.vehicleModel}
                  </Text>
                  <Text style={[styles.vehicleLabel, { color: theme.textMuted }]}>
                    Verified Vehicle
                  </Text>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}

        {/* Footer info */}
        <Animated.View 
          entering={FadeInDown.delay(400).duration(600).springify()}
          style={styles.footerInfo}
        >
          <Calendar size={14} color={theme.textMuted} />
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Joined RideMate in {joinedDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const StatsRow = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.statsRow}>{children}</View>
);

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
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 21, 21, 0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#151515',
  },
  scrollContent: {
    padding: 24,
  },
  profileBanner: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#C1F11D',
    position: 'relative',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '900',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#FFFEE9', // Matches beige bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 8,
  },
  infoCard: {
    borderRadius: 28,
    borderWidth: 0,
    marginBottom: 24,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '800',
  },
  vehicleLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
  }
});
