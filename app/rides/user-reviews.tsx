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
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Star,
  MessageSquare,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/ui';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Review } from '../../src/api/client';

export default function UserReviews() {
  const { userId, name } = useLocalSearchParams<{ userId: string, name?: string }>();
  const router = useRouter();
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await client.reviews.getForUser(userId);
      setReviews(data);
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, client]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadReviews();
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Reviews for {name || 'User'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {reviews.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color={theme.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No reviews yet</Text>
          </View>
        ) : (
          reviews.map((review, index) => (
            <Animated.View 
              key={review.id} 
              entering={FadeInDown.delay(index * 100).duration(600).springify()}
            >
              <Card style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAuthor}>
                    <Image 
                      source={review.reviewer.photo ? { uri: review.reviewer.photo } : require('../../assets/icon.png')} 
                      style={styles.reviewAvatar} 
                    />
                    <View>
                      <Text style={[styles.reviewerName, { color: theme.text }]}>{review.reviewer.name}</Text>
                      <Text style={[styles.reviewDate, { color: theme.textMuted }]}>
                        {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewRating}>
                    <Star size={14} color="#FFD700" fill="#FFD700" />
                    <Text style={[styles.ratingText, { color: theme.text }]}>{review.rating.toFixed(1)}</Text>
                  </View>
                </View>
                {review.comment && (
                  <Text style={[styles.reviewComment, { color: theme.text }]}>{review.comment}</Text>
                )}
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewCard: {
    marginBottom: 16,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
