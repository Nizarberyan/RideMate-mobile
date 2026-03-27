import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutDashboard, PlusCircle, User, Search, Ticket } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { theme, isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <Tabs 
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? theme.primary : '#000',
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
          backgroundColor: theme.surface,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        ...({ unmountOnBlur: false } as any),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('common.tabs.home'),
          tabBarLabel: t('common.tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: isDark ? 'rgba(190, 242, 100, 0.1)' : 'rgba(190, 242, 100, 0.2)' }]}>
              <LayoutDashboard size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('common.tabs.search'),
          tabBarLabel: t('common.tabs.search'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: isDark ? 'rgba(190, 242, 100, 0.1)' : 'rgba(190, 242, 100, 0.2)' }]}>
              <Search size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('common.tabs.bookings'),
          tabBarLabel: t('common.tabs.bookings'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: isDark ? 'rgba(190, 242, 100, 0.1)' : 'rgba(190, 242, 100, 0.2)' }]}>
              <Ticket size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: t('common.tabs.offer'),
          tabBarLabel: t('common.tabs.offer'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: isDark ? 'rgba(190, 242, 100, 0.1)' : 'rgba(190, 242, 100, 0.2)' }]}>
              <PlusCircle size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('common.tabs.profile'),
          tabBarLabel: t('common.tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: isDark ? 'rgba(190, 242, 100, 0.1)' : 'rgba(190, 242, 100, 0.2)' }]}>
              <User size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    width: 50,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  }
});
