import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback
} from 'react';
import { Address, Order } from '../model/interfaces.ts';
import { useAuthContext } from './AuthContext.tsx';
import { useApiService } from '../services/apiService.ts';
import { Alert } from 'react-native';

// --- INTERFACES ---

export interface CustomerContextType {
  addresses: Address[];
  orders: Order[];
  isLoading: boolean;
  refetchAddresses: () => Promise<void>;
  refetchOrders: () => Promise<void>;
  updateLocalAddress: (address: Address) => void;
  deleteLocalAddress: (addressId: string) => void;
  getPrimaryAddress: (type: 'shipping' | 'billing') => Address | null;
  setCustomerData: (addresses: Address[], orders: Order[], loading: boolean) => void;
}

const defaultContextValue: CustomerContextType = {
  addresses: [],
  orders: [],
  isLoading: true,
  refetchAddresses: () => Promise.resolve(),
  refetchOrders: () => Promise.resolve(),
  updateLocalAddress: () => console.log('updateLocalAddress called without Provider'),
  deleteLocalAddress: () => console.log('deleteLocalAddress called without Provider'),
  getPrimaryAddress: () => null,
  setCustomerData: () => console.log('setCustomerData called without Provider'),
};

const CustomerContext = createContext<CustomerContextType>(defaultContextValue);
export const useCustomerContext = () => useContext(CustomerContext);

interface CustomerProviderProps {
  children: ReactNode;
}

/**
 * Provides access to the customer's persisted data like addresses and past orders.
 */
export const CustomerProvider: React.FC<CustomerProviderProps> = ({ children }) => {
  const { isLoggedIn, userId, authToken } = useAuthContext();
  const { getCustomerAddresses, getOrders } = useApiService();

  // State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setCustomerData = useCallback((fetchedAddresses: Address[], fetchedOrders: Order[], loading: boolean) => {
    setAddresses(fetchedAddresses);
    setOrders(fetchedOrders);
    setIsLoading(loading);
  }, []);

  // --- API FETCHERS ---

  /**
   * Fetches customer's saved addresses from the API. Only used after initial load.
   */
  const refetchAddresses = useCallback(async (): Promise<void> => {
    if (!authToken) {
      setAddresses([]);
      return;
    }
    try {
      const fetchedAddresses = await getCustomerAddresses();
      setAddresses(fetchedAddresses);
    } catch (e) {
      console.error('Failed to refetch addresses:', e);
      Alert.alert('Error', 'Failed to load your saved addresses.');
    }
  }, [getCustomerAddresses, authToken]);


  /**
   * Fetches customer's order history from the API. Only used after initial load.
   */
  const refetchOrders = useCallback(async (): Promise<void> => {
    if (!authToken) {
      setOrders([]);
      return;
    }
    try {
      const fetchedOrders = await getOrders();
      setOrders(fetchedOrders);
    } catch (e) {
      console.error('Failed to refetch orders:', e);
      Alert.alert('Error', 'Failed to load your order history.');
    }
  }, [getOrders, authToken]);


  // --- NEW LOGIN DATA FETCHER ---

  /**
   * Called *after* a successful login to immediately fetch all necessary customer data.
   */
  // const fetchCustomerDataOnLogin = useCallback(async () => {
  //   setIsLoading(true);
  //   // Fetch both addresses and orders concurrently
  //   try {
  //     await Promise.all([
  //       refetchAddresses(),
  //       refetchOrders(),
  //     ]);
  //   } catch (error) {
  //     console.error("Error during post-login customer data fetch:", error);
  //     // We let the individual refetchers handle alerts, but log the overall failure.
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [refetchAddresses, refetchOrders]);


  // --- ADDRESS HELPERS ---

  /**
   * Updates an address in the local address book state, or adds it if new.
   */
  const updateLocalAddress = useCallback((address: Address) => {
    setAddresses(prev => {
      const existingIndex = prev.findIndex(addr => addr.id === address.id);
      if (existingIndex > -1) {
        // Update existing address
        return prev.map((addr, index) => (index === existingIndex ? address : addr));
      } else {
        // Add new address (shouldn't happen often as addresses are usually retrieved from API)
        return [...prev, address];
      }
    });
  }, []);


  /**
   * Deletes an address from the local address book state.
   */
  const deleteLocalAddress = useCallback((addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
  }, []);


  /**
   * Convenience function to retrieve the currently designated primary address.
   * Finds the address marked as primary ('is_primary_shipping' or 'is_primary_billing').
   */
  const getPrimaryAddress = useCallback((type: 'shipping' | 'billing'): Address | null => {
    const isPrimaryField = type === 'shipping' ? 'is_primary_shipping' : 'is_primary_billing';
    return addresses.find(addr => addr[isPrimaryField]) || null;
  }, [addresses]);


  // --- STATE CLEARING ON LOGOUT ---\

  // NOTE: On logout, clear the data. Fetching on login is now triggered by AuthContext.
  useEffect(() => {
    if (!isLoggedIn) {
      // If the user logs out, clear the data and stop loading
      setAddresses([]);
      setOrders([]);
      setIsLoading(false);
    }
  }, [isLoggedIn]);


  // --- CONTEXT VALUE ---

  const contextValue: CustomerContextType = {
    addresses,
    orders,
    isLoading,
    refetchAddresses,
    refetchOrders,
    updateLocalAddress,
    deleteLocalAddress,
    getPrimaryAddress,
    setCustomerData
  };

  return (
    <CustomerContext.Provider value={contextValue}>
      {children}
    </CustomerContext.Provider>
  );
};
