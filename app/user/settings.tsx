import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ArrowLeft, Settings, Save, MapPin, Moon, CheckCircle2 } from "lucide-react-native";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button, Input, Card, Toggle, ConfirmDialog } from "../../components/ui";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function SettingsScreen() {
  const { user, client, signIn } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    radius: "50",
  });

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
        radius: user.radius?.toString() || "50",
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updateData = {
        radius: parseFloat(formData.radius) || 50,
      };
      const updatedUser = await client.auth.updateProfile(updateData);
      
      const token = await client.getToken();
      const refreshToken = await SecureStore.getItemAsync("refresh_token");

      if (token && refreshToken) {
        await signIn({
          access_token: token,
          refresh_token: refreshToken,
          user: updatedUser,
        });
      }
      setDialog({
        visible: true,
        title: 'Settings Saved',
        message: 'Your preferences have been updated successfully.',
        icon: <CheckCircle2 size={26} color="#22c55e" strokeWidth={2.5} />,
        actions: [{ label: 'Done', onPress: dismissDialog, style: 'default' }],
      });
    } catch (e: any) {
      setDialog({
        visible: true,
        title: 'Update Failed',
        message: (e as Error).message || 'Something went wrong. Please try again.',
        actions: [{ label: 'OK', onPress: dismissDialog, style: 'cancel' }],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 44 }} /> {/* Spacer to keep title perfectly centered */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInUp.delay(100).duration(600).springify()}>
          <Card
            title="App Appearance"
            subTitle="Customize your app experience"
            icon={<Moon size={20} color={theme.text} />}
            style={styles.card}
            delay={200}
          >
            <Toggle
              label="Dark Mode"
              subLabel="Switch between light and dark themes"
              value={isDark}
              onValueChange={toggleTheme}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(600).springify()}>
          <Card
            title="Search Preferences"
            subTitle="Configure how we find rides for you"
            icon={<Settings size={20} color={theme.text} />}
            style={styles.card}
            delay={300}
          >
            <Input
              label="Intra-City Search Radius (km)"
              leftIcon={<MapPin size={20} color={theme.primary} />}
              value={formData.radius}
              onChangeText={(text) => setFormData({ ...formData, radius: text })}
              placeholder="e.g. 50"
              keyboardType="numeric"
            />
            <Text style={[styles.helperText, { color: theme.textMuted }]}>
              This determines how far we search for rides outside your exact location when taking a local ride.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
          <Button
            label="Save Preferences"
            variant="black"
            size="lg"
            icon={<Save size={22} color={isDark ? theme.primary : "#fff"} />}
            onPress={handleSubmit}
            isLoading={isSubmitting}
            style={styles.saveButton}
          />
        </Animated.View>
        <View style={{ height: 40 }} />
      </ScrollView>

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
  helperText: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 10,
    borderRadius: 20,
  },
});
