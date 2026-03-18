import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { createClient, User, AuthResponse } from '@/src/api/client';
import { useRouter, useSegments } from 'expo-router';

import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 
  (Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001');

const client = createClient({
  baseUrl: API_URL,
  getToken: () => SecureStore.getItemAsync('token'),
});

type AuthContextType = {
  user: User | null;
  signIn: (authData: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  client: typeof client;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();

    // Set up refresh interval (every 45 minutes)
    const interval = setInterval(() => {
      refreshAuth();
    }, 1000 * 60 * 45);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  const refreshAuth = async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (refreshToken) {
        const response = await client.auth.refresh(refreshToken);
        await SecureStore.setItemAsync('token', response.access_token);
        await SecureStore.setItemAsync('refresh_token', response.refresh_token);
        return true;
      }
    } catch (e) {
      console.error("Token refresh failed", e);
      // If refresh fails, sign out
      signOut();
    }
    return false;
  };

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
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
  };

  const signIn = async (authData: AuthResponse) => {
    await SecureStore.setItemAsync('token', authData.access_token);
    await SecureStore.setItemAsync('refresh_token', authData.refresh_token);
    setUser(authData.user);
  };

  const signOut = async () => {
    try {
      await client.auth.logout();
    } catch (e) {
      console.error("Logout error", e);
    }
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refresh_token');
    setUser(null);
  };

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
