import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { createClient, Ride, User } from '@/src/api/client';
import { Car, MapPin, Leaf, LogOut, User as UserIcon } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



const API_URL = process.env.EXPO_PUBLIC_API_URL;

const client = createClient({
  baseUrl: API_URL,
  getToken: () => SecureStore.getItemAsync('token'),
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [email, setEmail] = useState('jane@example.com');
  const [password, setPassword] = useState('password123');

  console.log("API URL:", API_URL);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const userData = await client.auth.getProfile();
        setUser(userData);
        loadDashboardData();
      }
    } catch (e) {
      console.log("Not logged in or session expired");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const myRides = await client.rides.getMine();
      setRides(myRides);
    } catch (e) {
      console.error("Failed to load rides:", e);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log(`Attempting login to: ${API_URL}/auth/login`);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        await SecureStore.setItemAsync('token', data.access_token);
        setUser(data.user);
        loadDashboardData();
      } else {
        alert(`Login failed: ${data.message || 'Invalid credentials'}`);
      }
    } catch (e: any) {
      console.error("Network error details:", e);
      alert(`Network Error: Cannot reach the API at ${API_URL}. Check your IP address and ensure the API is running.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
    setRides([]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#bef264" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>RM</Text>
          </View>
          <Text style={styles.loginTitle}>Welcome to RideMate</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoTextSmall}>RM</Text>
          </View>
          <Text style={styles.headerTitle}>RideMate</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerLabel}>DASHBOARD</Text>
            <Text style={styles.bannerTitle}>Welcome back,{"\n"}{user.name?.split(' ')[0]}</Text>
            <View style={styles.carbonBadge}>
              <Leaf size={14} color="#000" />
              <Text style={styles.carbonText}>{user.carbonSavedKg} kg saved</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Rides as Driver</Text>
        {rides.length === 0 ? (
          <View style={styles.emptyState}>
            <Car size={32} color="#9ca3af" />
            <Text style={styles.emptyText}>No rides offered yet.</Text>
          </View>
        ) : (
          rides.map((ride) => (
            <View key={ride.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationText}>{ride.startLocation}</Text>
                  <Text style={styles.arrow}> → </Text>
                  <Text style={styles.locationText}>{ride.endLocation}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{ride.status}</Text>
                </View>
              </View>
              <Text style={styles.cardSubtext}>
                {new Date(ride.departureDatetime).toLocaleDateString()} at {new Date(ride.departureDatetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>{ride.availableSeats} seats left</Text>
                <Text style={styles.footerTextBold}>{ride.bookings.length} Bookings</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContainer: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: '#bef264',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 30,
    color: '#111827',
  },
  input: {
    width: '100%',
    height: 55,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#111827',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSmall: {
    backgroundColor: '#bef264',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
  },
  logoTextSmall: {
    fontSize: 12,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  scrollContent: {
    padding: 20,
  },
  banner: {
    backgroundColor: '#bef264',
    borderRadius: 30,
    padding: 30,
    marginBottom: 30,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 1,
    marginBottom: 5,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    lineHeight: 34,
  },
  carbonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  carbonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 15,
    color: '#111827',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  emptyText: {
    marginTop: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  arrow: {
    color: '#d1d5db',
  },
  statusBadge: {
    backgroundColor: 'rgba(190, 242, 100, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#4d7c0f',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerTextBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
});
