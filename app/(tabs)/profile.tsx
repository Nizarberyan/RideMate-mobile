import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  User as UserIcon,
  Car,
  MapPin,
  Settings,
  Star,
  Leaf,
  MessageSquare,
  ChevronRight,
  History,
  Ticket,
  Archive,
  Info,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function Profile() {
  const router = useRouter();
  const { user, client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      // Load reviews
      setIsLoadingReviews(true);
      if (user?.id) {
        const userReviews = await client.reviews.getForUser(user.id);
        setReviews(userReviews);
      }
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setRefreshing(false);
      setIsLoadingReviews(false);
    }
  }, [client, user?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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
            style={[styles.settingsButton, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/user/settings')}
            activeOpacity={0.8}
          >
            <Settings size={22} color={theme.text} />
          </TouchableOpacity>
          <View
            style={[styles.avatarContainer, { shadowColor: theme.primary }]}
          >
            <View
              style={[styles.avatarCircle, { backgroundColor: theme.primary }]}
            >
              {user?.photo ? (
                <Image
                  source={{ uri: user.photo }}
                  style={styles.avatarImage}
                />
              ) : (
                <UserIcon size={44} color="#151515" />
              )}
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.name || "User"}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textMuted }]}>
            {user?.email}
          </Text>
          
          <View style={styles.badgesRow}>
            <View style={styles.ratingBadge}>
              <Star size={18} color="#FFD700" fill="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {user?.rating ? user.rating.toFixed(1) : "N/A"}
              </Text>
              {user?.rating ? (
                <Text style={[styles.ratingCount, { color: theme.textMuted }]}>
                  ({reviews.length})
                </Text>
              ) : null}
            </View>

            <View style={[styles.carbonBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)' }]}>
              <Leaf size={16} color="#10b981" />
              <Text style={[styles.carbonText, { color: '#10b981' }]}>
                {user?.carbonSavedKg || 0}kg CO2
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Activity & History Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
              <History size={20} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.activity.title')}</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('profile.activity.subtitle')}</Text>
            </View>
          </View>

          <View style={[styles.sectionContent, { gap: 12 }]}>
            <TouchableOpacity 
              style={[styles.historyLink, { backgroundColor: theme.surface }]}
              onPress={() => router.push('/user/archive-bookings')}
              activeOpacity={0.7}
            >
              <View style={[styles.historyIcon, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
                <Ticket size={18} color="#6366f1" />
              </View>
              <Text style={[styles.historyText, { color: theme.text }]}>{t('profile.activity.bookingHistory')}</Text>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.historyLink, { backgroundColor: theme.surface }]}
              onPress={() => router.push('/user/archive-rides')}
              activeOpacity={0.7}
            >
              <View style={[styles.historyIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }]}>
                <Archive size={18} color="#10b981" />
              </View>
              <Text style={[styles.historyText, { color: theme.text }]}>{t('profile.activity.rideHistory')}</Text>
              <ChevronRight size={18} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Info Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
              <Info size={20} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.info.title')}</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('profile.info.subtitle')}</Text>
            </View>
          </View>

          <View style={[styles.sectionContent, { gap: 16 }]}>
            <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('profile.info.bio')}</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                {user?.bio || t('profile.info.noBio')}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoCard, { backgroundColor: theme.surface, flex: 1 }]}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('profile.info.city')}</Text>
                <View style={styles.row}>
                  <MapPin size={14} color={theme.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.infoValue, { color: theme.text }]}>{user?.city || t('profile.info.notSet')}</Text>
                </View>
              </View>
              <View style={[styles.infoCard, { backgroundColor: theme.surface, flex: 1 }]}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('profile.info.radius')}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{user?.radius || 50} km</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Vehicle Section */}
        {user?.vehicleModel && (
          <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
                <Car size={20} color={theme.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.vehicle.title')}</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('profile.vehicle.subtitle')}</Text>
              </View>
            </View>

            <View style={[styles.sectionContent, { gap: 16 }]}>
              <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
                <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('profile.vehicle.model')}</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{user.vehicleModel}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoCard, { backgroundColor: theme.surface, flex: 1 }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('profile.vehicle.color')}</Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>{user.vehicleColor || t('profile.info.notSet')}</Text>
                </View>
                <View style={[styles.infoCard, { backgroundColor: theme.surface, flex: 1 }]}>
                  <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{t('profile.vehicle.plate')}</Text>
                  <Text style={[styles.infoValue, { color: theme.text, fontWeight: '900' }]}>{user.vehiclePlate || t('profile.info.notSet')}</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(600).duration(800).springify()} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}>
              <MessageSquare size={20} color={theme.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('profile.reviews.title')}</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>{t('profile.reviews.subtitle')}</Text>
            </View>
            {reviews.length > 3 && (
              <TouchableOpacity onPress={() => router.push({ pathname: '/rides/user-reviews', params: { userId: user?.id } })}>
                <Text style={{ color: theme.primary, fontWeight: '700' }}>{t('profile.reviews.seeAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionContent}>
            {isLoadingReviews ? (
              <ActivityIndicator color={theme.primary} />
            ) : reviews.length > 0 ? (
              reviews.slice(0, 3).map((review, idx) => (
                <View key={review.id} style={[styles.reviewItem, { borderBottomColor: theme.border, borderBottomWidth: idx === reviews.slice(0, 3).length - 1 ? 0 : 1 }]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewAuthor}>
                      <Image 
                        source={review.reviewer.photo ? { uri: review.reviewer.photo } : require('../../assets/icon.png')} 
                        style={styles.reviewAvatar} 
                      />
                      <View>
                        <Text style={[styles.reviewName, { color: theme.text }]}>{review.reviewer.name}</Text>
                        <Text style={[styles.reviewDate, { color: theme.textMuted }]}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} color={s <= review.rating ? "#FFD700" : theme.textMuted} fill={s <= review.rating ? "#FFD700" : "transparent"} />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <Text style={[styles.reviewComment, { color: theme.text }]}>{review.comment}</Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <Text style={{ color: theme.textMuted, fontStyle: 'italic' }}>{t('profile.reviews.noReviews')}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    position: "relative",
    width: "100%",
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  carbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  carbonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '800',
  },
  ratingCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionContent: {
    paddingHorizontal: 4,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    gap: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    padding: 16,
    borderRadius: 24,
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    alignItems: 'center',
  },
  reviewItem: {
    paddingVertical: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ccc',
  },
  reviewName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyReviews: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
