import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const Colors = {
  light: {
    background: '#FFFEE9', // Beige Brand
    surface: '#ffffff',
    text: '#151515',    // Black Brand
    textMuted: '#6B7280', // Refined Gray
    primary: '#C1F11D',  // Lime Brand
    border: '#E5E7EB',
    input: '#ffffff',
    tabBar: '#ffffff',
  },
  dark: {
    background: '#0F0F0F', // Deeper Black
    surface: '#1A1A1A',    // Deep Gray
    text: '#F9FAFB',       // Clean Off-white
    textMuted: '#9CA3AF',  // Better contrast gray
    primary: '#C1F11D',    // Lime Brand
    border: '#262626',
    input: '#1A1A1A',
    tabBar: '#1A1A1A',
  }
};

type ThemeContextType = {
  isDark: boolean;
  theme: typeof Colors.light;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // Load saved preference
    SecureStore.getItemAsync('theme_preference').then((saved) => {
      if (saved) {
        setIsDark(saved === 'dark');
      }
    });
  }, []);

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    SecureStore.setItemAsync('theme_preference', newValue ? 'dark' : 'light');
  };

  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
