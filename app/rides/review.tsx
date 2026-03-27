import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  Star,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card } from '../../components/ui';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export default function PostReview() {
  const { bookingId, targetId, targetName, role } = useLocalSearchParams<{ 
    bookingId: string, 
    targetId: string, 
    targetName?: string, 
    role: "DRIVER" | "PASSENGER" 
  }>();
  const router = useRouter();
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('reviews.error.ratingRequired'), t('reviews.error.ratingMessage'));
      return;
    }

    if (!targetId || !role) {
      Alert.alert(t('reviews.error.missingInfo'), t('reviews.error.missingMessage'));
      return;
    }

    setIsSubmitting(true);
    try {
      await client.reviews.create({
        bookingId,
        targetId,
        rating,
        comment: comment.trim() || undefined,
        role: role as "DRIVER" | "PASSENGER",
      });
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('reviews.error.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View entering={ZoomIn} style={styles.successContainer}>
          <CheckCircle2 size={80} color="#10b981" />
          <Text style={[styles.successTitle, { color: theme.text }]}>{t('reviews.success.title')}</Text>
          <Text style={[styles.successSub, { color: theme.textMuted }]}>{t('reviews.success.subtitle')}</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('reviews.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <View style={styles.targetSection}>
            <Text style={[styles.label, { color: theme.textMuted }]}>{t('reviews.rateLabel')}</Text>
            <Text style={[styles.targetName, { color: theme.text }]}>{targetName || t('ride.passengerCard.unknown')}</Text>
          </View>

          <Card style={styles.ratingCard}>
            <Text style={[styles.instruction, { color: theme.text }]}>{t('reviews.instruction')}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                >
                  <Star 
                    size={40} 
                    color={star <= rating ? "#FFD700" : (isDark ? "#333" : "#e5e7eb")} 
                    fill={star <= rating ? "#FFD700" : "transparent"} 
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingLabel, { color: theme.textMuted }]}>
              {rating === 0 ? t('reviews.selectRating') : (
                rating === 1 ? t('reviews.levels.poor') :
                rating === 2 ? t('reviews.levels.fair') :
                rating === 3 ? t('reviews.levels.good') :
                rating === 4 ? t('reviews.levels.veryGood') : t('reviews.levels.excellent')
              )}
            </Text>
          </Card>

          <Card style={styles.commentCard}>
            <Text style={[styles.label, { color: theme.textMuted, marginBottom: 12 }]}>{t('reviews.commentLabel')}</Text>
            <TextInput
              style={[styles.input, { 
                color: theme.text, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: theme.border
              }]}
              placeholder={t('reviews.commentPlaceholder')}
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
            />
          </Card>

          <View style={styles.btnContainer}>
            <Button
              label={isSubmitting ? t('reviews.submitting') : t('reviews.submit')}
              onPress={handleSubmit}
              variant="primary"
              disabled={isSubmitting || rating === 0}
            />
            <View style={styles.safetyInfo}>
              <ShieldCheck size={16} color={theme.textMuted} />
              <Text style={[styles.safetyText, { color: theme.textMuted }]}>
                {t('reviews.safetyNote')}
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 24,
  },
  targetSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  targetName: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  ratingCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  instruction: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  starTouch: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  commentCard: {
    padding: 16,
    marginBottom: 24,
  },
  input: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  btnContainer: {
    gap: 16,
  },
  safetyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  safetyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 24,
  },
  successSub: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
});
