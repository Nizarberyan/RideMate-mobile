import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Storage } from '../src/utils/Storage';
import { createClient, User, AuthResponse } from '@/src/api/client';
import { useRouter, useSegments } from 'expo-router';
import { registerForPushNotificationsAsync } from '../src/utils/notifications';

import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');

const client = createClient({
  baseUrl: API_URL,
  getToken: () => Storage.getItemAsync('token'),
});

type AuthContextType = {
  user: User | null;
  signIn: (authData: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  client: typeof client;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import i18n from 'i18next';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Helper to sync i18n with user language
  const syncLanguage = useCallback((language?: string | null) => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, []);

  useEffect(() => {
    if (user?.language) {
      syncLanguage(user.language);
    }
  }, [user?.language, syncLanguage]);

  const signOut = useCallback(async () => {
    try {
      await client.auth.logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    await Storage.deleteItemAsync('token');
    await Storage.deleteItemAsync('refresh_token');
    setUser(null);
  }, []);

  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = await Storage.getItemAsync('refresh_token');
      if (refreshToken) {
        const response = await client.auth.refresh(refreshToken);
        await Storage.setItemAsync('token', response.access_token);
        await Storage.setItemAsync('refresh_token', response.refresh_token);
        return true;
      }
    } catch (e) {
      console.error("Token refresh failed", e);
      // If refresh fails, sign out
      signOut();
    }
    return false;
  }, [signOut]);

  const checkAuth = useCallback(async () => {
    try {
      const token = await Storage.getItemAsync('token');
      if (token) {
        try {
          const userData = await client.auth.getProfile();
          setUser(userData);
        } catch (e) {
          // Access token might be expired, try to refresh
          const success = await refreshAuth();
          if (success) {
            const userData = await client.auth.getProfile();
            setUser(userData);
          }
        }
      }
    } catch (e) {
      console.log('Not logged in or token invalid');
    } finally {
      setIsLoading(false);
    }
  }, [refreshAuth]);

  useEffect(() => {
    checkAuth();

    // Set up refresh interval (every 45 minutes)
    const interval = setInterval(() => {
      refreshAuth();
    }, 1000 * 60 * 45);

    return () => clearInterval(interval);
  }, [checkAuth, refreshAuth]);

  useEffect(() => {
    if (user && !user.pushToken) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          client.auth.updateProfile({ pushToken: token })
            .then(updated => setUser(updated))
            .catch(err => console.error("Failed to update push token", err));
        }
      });
    }
  }, [user, client]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, router]);

  const signIn = useCallback(async (authData: AuthResponse) => {
    await Storage.setItemAsync('token', authData.access_token);
    await Storage.setItemAsync('refresh_token', authData.refresh_token);
    setUser(authData.user);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading, client }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
