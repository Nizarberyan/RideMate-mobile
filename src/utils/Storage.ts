import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * A web-safe wrapper for SecureStore.
 * Falls back to localStorage on web since SecureStore is not supported there.
 */
export const Storage = {
  getItemAsync: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return null;
    }
  },

  setItemAsync: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },

  deleteItemAsync: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
};
