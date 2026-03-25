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
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft, 
  AlertCircle,
  ShieldAlert,
  ChevronDown,
  Camera,
  CheckCircle2
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Card } from '../../components/ui';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

const CATEGORIES = [
  'Safety Concern',
  'Driver Behavior',
  'Vehicle Condition',
  'Navigation/Route',
  'Unexpected Delay',
  'Other'
];

export default function PostComplaint() {
  const { bookingId, targetName } = useLocalSearchParams<{ bookingId: string, targetName?: string }>();
  const router = useRouter();
  const { client } = useAuth();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Details Required', 'Please provide a description of the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await client.complaints.create({
        bookingId,
        category,
        description: description.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Animated.View entering={ZoomIn} style={styles.successContainer}>
          <CheckCircle2 size={80} color="#ef4444" />
          <Text style={[styles.successTitle, { color: theme.text }]}>Report Submitted</Text>
          <Text style={[styles.successSub, { color: theme.textMuted }]}>
            Our safety team will review this report within 24 hours. Your safety is our priority.
          </Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Report an Issue</Text>
        <ShieldAlert size={20} color="#ef4444" />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
        <Animated.View entering={FadeInDown.delay(100).duration(600).springify()}>
          <View style={styles.alertBanner}>
            <AlertCircle size={20} color="#ef4444" />
            <Text style={styles.alertText}>
              If this is an emergency, please contact local authorities immediately.
            </Text>
          </View>

          <Text style={[styles.label, { color: theme.textMuted, marginTop: 20 }]}>REPORTING FOR RIDE WITH</Text>
          <Text style={[styles.targetName, { color: theme.text }]}>{targetName || 'User'}</Text>

          {/* Category Selector */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textMuted, marginBottom: 12 }]}>ISSUE CATEGORY</Text>
            <TouchableOpacity 
              style={[styles.categoryDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text style={[styles.categoryText, { color: theme.text }]}>{category}</Text>
              <ChevronDown size={20} color={theme.textMuted} />
            </TouchableOpacity>

            {showCategories && (
              <View style={[styles.dropdownList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.dropdownItem, category === cat && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}
                    onPress={() => {
                      setCategory(cat);
                      setShowCategories(false);
                    }}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }, category === cat && { fontWeight: '800' }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textMuted, marginBottom: 12 }]}>DETAILS</Text>
            <TextInput
              style={[styles.input, { 
                color: theme.text, 
                backgroundColor: theme.surface,
                borderColor: theme.border
              }]}
              placeholder="What happened? Please be as specific as possible..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Evidence placeholder */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textMuted, marginBottom: 12 }]}>ATTACH PHOTO (OPTIONAL)</Text>
            <TouchableOpacity 
              style={[styles.photoButton, { borderColor: theme.border, borderStyle: 'dashed' }]}
              onPress={() => Alert.alert('Photos', 'Photo upload feature coming soon.')}
            >
              <Camera size={24} color={theme.textMuted} />
              <Text style={[styles.photoButtonText, { color: theme.textMuted }]}>Add photos for evidence</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 32 }]} />

          <Button
            label={isSubmitting ? "Submitting..." : "Submit Formal Report"}
            onPress={handleSubmit}
            variant="primary"
            disabled={isSubmitting || !description.trim()}
            style={{ backgroundColor: '#ef4444' }}
          />
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  alertText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
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
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  categoryDropdown: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    height: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    fontSize: 15,
    fontWeight: '500',
  },
  photoButton: {
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
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
