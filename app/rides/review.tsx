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

export default function PostReview() {
  const { bookingId, targetName } = useLocalSearchParams<{ bookingId: string, targetName?: string }>();
  const router = useRouter();
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Selection Required', 'Please select a star rating.');
      return;
    }

    setIsSubmitting(true);
    try {
      await client.reviews.create({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit review');
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
          <Text style={[styles.successTitle, { color: theme.text }]}>Review Shared!</Text>
          <Text style={[styles.successSub, { color: theme.textMuted }]}>Your feedback helps keep the community safe.</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Rate your Experience</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <View style={styles.targetSection}>
            <Text style={[styles.label, { color: theme.textMuted }]}>RATE</Text>
            <Text style={[styles.targetName, { color: theme.text }]}>{targetName || 'the other person'}</Text>
          </View>

          <Card style={styles.ratingCard}>
            <Text style={[styles.instruction, { color: theme.text }]}>How was the ride?</Text>
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
              {rating === 0 ? 'Select a rating' : (
                rating === 1 ? 'Poor' :
                rating === 2 ? 'Fair' :
                rating === 3 ? 'Good' :
                rating === 4 ? 'Very Good' : 'Excellent'
              )}
            </Text>
          </Card>

          <Card style={styles.commentCard}>
            <Text style={[styles.label, { color: theme.textMuted, marginBottom: 12 }]}>ADD A COMMENT (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, { 
                color: theme.text, 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: theme.border
              }]}
              placeholder="Tell us more about your experience..."
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
              label={isSubmitting ? "Submitting..." : "Submit Review"}
              onPress={handleSubmit}
              variant="primary"
              disabled={isSubmitting || rating === 0}
            />
            <View style={styles.safetyInfo}>
              <ShieldCheck size={16} color={theme.textMuted} />
              <Text style={[styles.safetyText, { color: theme.textMuted }]}>
                Reviews are public and visible to other users.
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
