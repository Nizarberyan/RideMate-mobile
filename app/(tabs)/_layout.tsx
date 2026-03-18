import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutDashboard, PlusCircle, User, Search } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabsLayout() {
  const { theme, isDark } = useTheme();

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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Dashboard',
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
          title: 'Find a Ride',
          tabBarLabel: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconContainer, focused && { backgroundColor: isDark ? 'rgba(190, 242, 100, 0.1)' : 'rgba(190, 242, 100, 0.2)' }]}>
              <Search size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: 'Offer a Ride',
          tabBarLabel: 'Offer',
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
          title: 'My Profile',
          tabBarLabel: 'Profile',
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
