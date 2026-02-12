import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { View, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApiService } from '../services/apiService';
import { Address, Order, JwtAuthResponse } from '../model/interfaces'; // Import customer-related types

// Id generator - Used to assign a temporary unique ID to new addresses created by guests.
const generateUniqueId = (): string => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
// Define Storage Key for guest addresses
const GUEST_ADDRESSES_STORAGE_KEY = '@GuestAddresses:key';

// Define the key for AsyncStorage
const AUTH_TOKEN_KEY = '@AuthToken:key';
const USER_DISPLAY_NAME_KEY = '@UserDisplayName:key';
const USER_ID_KEY = '@UserId:key';
const USER_EMAIL_KEY = '@UserEmailKey:key';

// --- INTERFACES: MERGED CONTEXT TYPE ---

export interface AuthContextType {
  // Auth Data
  isLoggedIn: boolean;
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  user: any;
  userDisplayName: string | null;
  userId: number | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Customer Data
  addresses: Address[];
  orders: Order[];
  isCustomerDataLoading: boolean; // Renamed to avoid confusion with initial auth loading
  refetchAddresses: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  updateLocalAddress: (address: Address) => void;
  deleteLocalAddress: (addressId: string) => void;
  getPrimaryAddress: (type: 'shipping' | 'billing') => Address | null;
}

const defaultContextValue: AuthContextType = {
  // Auth Defaults
  isLoggedIn: false,
  authToken: null,
  setAuthToken: () => {},
  user: null,
  userDisplayName: null,
  userId: null,
  login: async () => false,
  logout: () => {},

  // Customer Data Defaults
  addresses: [],
  orders: [],
  isCustomerDataLoading: false,
  refetchAddresses: () => Promise.resolve(),
  refetchOrders: () => Promise.resolve(),
  updateLocalAddress: () => {},
  deleteLocalAddress: () => {},
  getPrimaryAddress: () => null,
};

const base64UrlDecode = (str: string): string => {
  // 1. Replace non-url-safe characters with their standard Base64 counterparts
  str = str.replace(/-/g, '+').replace(/_/g, '/');

  // 2. Pad out with '=' characters if it's not a multiple of 4
  while (str.length % 4) {
    str += '=';
  }

  // 3. Decode Base64 and handle UTF-8 characters
  try {
    // atob is available in React Native environments
    return decodeURIComponent(
      atob(str)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    console.error("Base64 URL Decode Error:", e);
    return '{}'; // Return empty object string on failure
  }
};

const decodeJwtPayload = (token: string): any => {
  try {
    // JWT format: Header.Payload.Signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error("Invalid JWT format or token structure.");
      return null;
    }

    const payloadBase64 = parts[1];
    const decodedString = base64UrlDecode(payloadBase64);

    return JSON.parse(decodedString);

  } catch (e) {
    console.error('Error decoding or parsing JWT payload:', e);
    return null;
  }
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const useAuthContext = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { customerLogin, getCustomerAddresses, getOrders  } = useApiService();

  // --- AUTH STATE ---
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true); // For initial check

  const isLoggedIn = !!authToken;

  // --- CUSTOMER DATA STATE ---
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCustomerDataLoading, setIsCustomerDataLoading] = useState(false); // For ongoing data fetch

  // --- ASYNC STORAGE UTILITIES FOR GUEST ADDRESSES ---

  const loadGuestAddresses = useCallback(async (): Promise<Address[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(GUEST_ADDRESSES_STORAGE_KEY);
      const addresses: Address[] = jsonValue != null ? JSON.parse(jsonValue) : [];
      return addresses;
    } catch (e) {
      console.error('Error loading guest addresses:', e);
      return [];
    }
  }, []);

  const saveGuestAddresses = useCallback(async (addrs: Address[]): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(addrs);
      await AsyncStorage.setItem(GUEST_ADDRESSES_STORAGE_KEY, jsonValue);
    } catch (e) {
      console.error('Error saving guest addresses:', e);
    }
  }, []);

  // --- DATA FETCHING LOGIC ---

  const fetchAllCustomerData = useCallback(async (userId: number, token: string | null): Promise<void> => {
    if (!token) {
      setAddresses([]);
      setOrders([]);
      return;
    }

    setIsCustomerDataLoading(true);
    try {
      // These functions rely on the authToken being set in the ApiService hook
      const [fetchedAddresses, fetchedOrders] = await Promise.all([
        getCustomerAddresses(userId, token),
        getOrders(userId, token),
      ]);

      setAddresses(fetchedAddresses);
      setOrders(fetchedOrders);

    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      setAddresses([]);
      setOrders([]);
    } finally {
      setIsCustomerDataLoading(false);
    }
  }, [getCustomerAddresses, getOrders]);

  const refetchAddresses = useCallback(async (): Promise<void> => {

    setIsCustomerDataLoading(true);
    if (isLoggedIn) {
      try {
        if (userId) {
          const fetchedAddresses = await getCustomerAddresses(
            userId,
            authToken,
          );
          setAddresses(fetchedAddresses);
        }
      } catch (error) {
        console.error('Failed to refetch addresses:', error);
      } finally {
        setIsCustomerDataLoading(false);
      }
    } else {
      // Guest: Load from Async Storage
      const localAddresses = await loadGuestAddresses();
      setAddresses(localAddresses);
    }
  }, [isLoggedIn, userId, getCustomerAddresses, authToken, loadGuestAddresses]);

  const refetchOrders = useCallback(async (): Promise<void> => {
    if (!isLoggedIn) return;
    setIsCustomerDataLoading(true);
    try {
      if(userId){
        const fetchedOrders = await getOrders(userId, authToken);
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error('Failed to refetch orders:', error);
    } finally {
      setIsCustomerDataLoading(false);
    }
  }, [isLoggedIn, userId, getOrders, authToken]);


  // --- AUTH AND REHYDRATION EFFECT ---
  useEffect(() => {
    const loadAuthData = async () => {
      console.log('Loading auth data on reload');
      try {
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const name = await AsyncStorage.getItem(USER_DISPLAY_NAME_KEY);
        const id = await AsyncStorage.getItem(USER_ID_KEY);
        const userEmail = await AsyncStorage.getItem(USER_EMAIL_KEY);

        if (token && id) {
          setAuthToken(token);
          setUserDisplayName(name);
          setUser(userEmail);
          const parsedId = parseInt(id, 10);
          setUserId(parsedId);

          // Fetch customer data upon rehydration
          await fetchAllCustomerData(parsedId, token);
        } else {
          // If no token, ensure the ApiService token is cleared
          setAuthToken(null);
        }
      } catch (e) {
        console.error('Failed to load auth data:', e);
        setAuthToken(null);
      } finally {
        setIsInitialAuthLoading(false);
      }
    };
    loadAuthData();
  }, [fetchAllCustomerData, setAuthToken]); // Dependency array ensures fetchAllCustomerData is stable

  // --- PERSISTENCE EFFECT: Save token when state changes ---
  useEffect(() => {

    if (isInitialAuthLoading) {
      return;
    }

    if (authToken) {
      AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
      if (userDisplayName) AsyncStorage.setItem(USER_DISPLAY_NAME_KEY, userDisplayName);
      if (userId !== null) AsyncStorage.setItem(USER_ID_KEY, userId.toString());
      if ((user!== null) && (typeof user === 'string')) {
          AsyncStorage.setItem(USER_EMAIL_KEY, user);
      }

    } else {
      AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      AsyncStorage.removeItem(USER_DISPLAY_NAME_KEY);
      AsyncStorage.removeItem(USER_ID_KEY);
      AsyncStorage.removeItem(USER_EMAIL_KEY);
    }
  }, [authToken, setAuthToken, userDisplayName, userId, user, isInitialAuthLoading]);

  // --- AUTH METHODS ---

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const authResponse: JwtAuthResponse = await customerLogin(username, password);

        if (!authResponse && !authResponse.token) {
          Alert.alert('Login error', authResponse.message || 'Invalid credentials or access denied.');
          return false;
        }

        // 1. Set Auth State
        const token = authResponse.token;
        setAuthToken(token);
        setUserDisplayName(authResponse.user_display_name);
        setUser(authResponse.user_email);
        const payload = decodeJwtPayload(token);
        setUserId(payload.data.user.id);

        // 2. Trigger data fetch in the same provider
        await fetchAllCustomerData(payload.data.user.id, token);

        return true;
      } catch (e) {
        console.error('Login failed:', e);
        Alert.alert('Login Failed', 'Could not connect or an unknown error occurred.');
        return false;
      }
    },
    [customerLogin, fetchAllCustomerData],
  );

  const logout = useCallback(() => {
    // Clear all states
    setAuthToken(null);
    setUserDisplayName(null);
    setUserId(null);
    setUser(null);
    setAddresses([]);
    setOrders([]);
    setIsCustomerDataLoading(false); // Ensure loading state is reset
  }, []);

  // --- CUSTOMER DATA MANIPULATION METHODS ---

  const updateLocalAddress = useCallback((address: Address) => {
    setAddresses(prev => {
      let nextState;
      const existingIndex = prev.findIndex(addr => addr.id === address.id);
      if (existingIndex > -1) {
        // Update existing address
        nextState = prev.map((addr, i) => (i === existingIndex ? address : addr));
      } else {
        // Add new address (ensure it has an ID if it's new)
        const newAddress = { ...address, id: address.id || generateUniqueId() };
        nextState = [...prev, newAddress];
      }

      // If guest, save the updated list to local storage
      if (!isLoggedIn) {
        saveGuestAddresses(nextState);
      }

      return nextState;
    });
  }, [isLoggedIn, saveGuestAddresses]);

  const deleteLocalAddress = useCallback((addressId: string) => {
    setAddresses(prev => {
      const nextState = prev.filter(addr => addr.id !== addressId);

      // If guest, save the updated list to local storage
      if (!isLoggedIn) {
        saveGuestAddresses(nextState);
      }

      return nextState;
    });
  }, [isLoggedIn, saveGuestAddresses]);

  // const getPrimaryAddress = useCallback((type: 'shipping' | 'billing'): Address | null => {
  //   return addresses.find(addr => addr.address_type === type && addr.is_default === true) || null;
  // }, [addresses]);

  const getPrimaryAddress = useCallback((type: 'shipping' | 'billing'): Address | null => {

    const addressesOfType = addresses.filter(addr => addr.address_type === type);

    const explicitPrimary = addressesOfType.find(addr => addr.is_default === true);

    if (explicitPrimary) {
      return explicitPrimary;
    }

    // 3. Fallback: If no explicit primary is set, check if there is only one address of this type.
    if (addressesOfType.length === 1) {
      return addressesOfType[0];
    }

    // 4. Otherwise, return null
    return null;
  }, [addresses]);


  // --- CONTEXT VALUE ---

  const contextValue: AuthContextType = useMemo(() => ({
    isLoggedIn,
    authToken,
    setAuthToken,
    user,
    userDisplayName,
    userId,
    login,
    logout,
    addresses,
    orders,
    isCustomerDataLoading,
    refetchAddresses,
    refetchOrders,
    updateLocalAddress,
    deleteLocalAddress,
    getPrimaryAddress,
  }), [
    isLoggedIn, authToken, user, userDisplayName, userId,
    login, logout,
    addresses, orders, isCustomerDataLoading,
    refetchAddresses, refetchOrders, updateLocalAddress, deleteLocalAddress, getPrimaryAddress,
  ]);

  // Do not render children until we know the authentication state from storage
  if (isInitialAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading Session...</Text>
      </View>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
