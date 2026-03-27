import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Storage } from '../src/utils/Storage';

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
    danger: '#EF4444',
    dangerBg: '#FEE2E2',
    shadow: 'rgba(21, 21, 21, 0.08)',
    overlay: 'rgba(193, 241, 29, 0.15)',
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
    danger: '#F87171',
    dangerBg: '#3D1212',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(193, 241, 29, 0.1)',
  }
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Typography = {
  display: {
    fontSize: 32,
    fontWeight: '900' as const,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 24,
    fontWeight: '900' as const,
    lineHeight: 30,
    letterSpacing: 0,
  },
  h2: {
    fontSize: 20,
    fontWeight: '800' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
  h3: {
    fontSize: 18,
    fontWeight: '900' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '800' as const,
    lineHeight: 22,
  },
  subtext: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  subtextBold: {
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '900' as const,
    lineHeight: 16,
    letterSpacing: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '900' as const,
    lineHeight: 14,
    letterSpacing: 0.5,
  }
};

type ThemeContextType = {
  isDark: boolean;
  theme: typeof Colors.light;
  toggleTheme: () => void;
  spacing: typeof Spacing;
  typography: typeof Typography;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // Load saved preference
    Storage.getItemAsync('theme_preference').then((saved) => {
      if (saved) {
        setIsDark(saved === 'dark');
      }
    });
  }, []);

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    Storage.setItemAsync('theme_preference', newValue ? 'dark' : 'light');
  };

  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      theme, 
      toggleTheme,
      spacing: Spacing,
      typography: Typography
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
