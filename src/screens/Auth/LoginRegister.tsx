import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';

// --- MOCK IMPORTS for demonstration ---
// In a real project, you would import these:
import { useApiService } from '../../services/apiService';
import { useAuthContext } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function AuthScreen() {

  const { registerCustomer } = useApiService();
  const { login, isLoggedIn } = useAuthContext();
  const navigation = useNavigation();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // const navigation = useNavigation(); // For real navigation

  React.useEffect(() => {
    if (isLoggedIn) {
      // Navigate back to the previous screen in the stack (MoreTab)
      // This immediately dismisses the Login/Register screen
      navigation.goBack();
    }
  }, [isLoggedIn, navigation]);

  const handleAuthAction = async () => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const loginSuccess = await login(email, password);

        if (loginSuccess) {
          // Context login handles token storage, the useEffect above handles navigation.
          Alert.alert('Success', 'You are now logged in!');
          // The useEffect will call navigation.goBack() now
        } else {
          // Error handling from AuthContext's login function (e.g., failed API call)
          setError('Login failed. Please check your email and password.');
        }

      } else {
        // --- REGISTRATION LOGIC ---
        const userData = {
          email: email,
          password: password,
          first_name: firstName,
          last_name: lastName,
          // You might need to add a username field here if required by your setup
        };
        const response = await registerCustomer(userData);

        // Success: Log the user in immediately after registration (optional, but common)
        // For simplicity, we just prompt for login:
        if(response.success){
          console.log('Registration Successful, Customer Id:', response.id);
          Alert.alert('Registration Successful! Please log in now.');
          setIsLogin(true); // Switch to login view
        }

      }
    } catch (err) {
      const message = err.message || 'An unknown error occurred.';
      console.error(isLogin ? 'Login Error:' : 'Registration Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>

        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to access your details and orders.' : 'Join us to quickly manage your cart and orders.'}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLogin && (
          <>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuthAction}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isLogin ? 'Log In' : 'Register'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setIsLogin(prev => !prev);
            setError('');
          }}
          disabled={loading}
        >
          <Text style={styles.toggleText}>
            {isLogin
              ? "Don't have an account? Register"
              : 'Already have an account? Log In'}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Light background
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    height: 50,
    backgroundColor: '#007AFF', // Blue primary color
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A0C6FF', // Lighter blue when disabled
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
    alignSelf: 'center',
  },
  toggleText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30', // Red error color
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 14,
  }
});
