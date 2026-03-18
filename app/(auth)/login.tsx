import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input } from '../../components/ui';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function Login() {
  const { signIn, client } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('jane@example.com');
  const [password, setPassword] = useState('password123');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const data = await client.auth.login({ email, password });
      await signIn(data);
    } catch (e: any) {
      Alert.alert("Login Failed", e.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.loginContainer}>
            <Animated.View 
              entering={FadeInUp.delay(200).duration(800).springify()}
              style={styles.logoCircle}
            >
              <Text style={styles.logoText}>RM</Text>
            </Animated.View>
            
            <Animated.Text 
              entering={FadeInDown.delay(400).duration(800).springify()}
              style={[styles.loginTitle, { color: theme.text }]}
            >
              Welcome to RideMate
            </Animated.Text>
            
            <View style={styles.form}>
              <Animated.View entering={FadeInDown.delay(600).duration(800).springify()}>
                <Input
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </Animated.View>
              
              <Animated.View entering={FadeInDown.delay(700).duration(800).springify()}>
                <Input
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              </Animated.View>
              
              <Animated.View entering={FadeInDown.delay(800).duration(800).springify()}>
                <Button 
                  label="Sign In" 
                  variant="black"
                  size="lg"
                  onPress={handleLogin}
                  isLoading={isLoading}
                  style={{ marginTop: 12 }}
                />
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(1000).duration(800).springify()}>
                <TouchableOpacity 
                  onPress={() => router.replace('/(auth)/signup')}
                  style={styles.linkButton}
                >
                  <Text style={[styles.linkText, { color: theme.textMuted }]}>
                    Don't have an account? <Text style={{ color: theme.text, fontWeight: '900' }}>Sign up</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loginContainer: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 100,
    height: 100,
    backgroundColor: '#C1F11D',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#C1F11D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#151515',
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 40,
    letterSpacing: -1,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 15,
    fontWeight: '600',
  }
});
