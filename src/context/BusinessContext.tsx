import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Business } from '../model/interfaces';

interface BusinessContextType {
  activeBusiness: Business | null;
  setBusiness: (business: Business) => void;
  clearBusiness: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);

  // Load persisted business on startup
  useEffect(() => {
    const loadPersistedBusiness = async () => {
      const saved = await AsyncStorage.getItem('active_business');
      if (saved) setActiveBusiness(JSON.parse(saved));
    };
    loadPersistedBusiness();
  }, []);

  const setBusiness = async (business: Business) => {
    setActiveBusiness(business);
    await AsyncStorage.setItem('active_business', JSON.stringify(business));
  };

  const clearBusiness = async () => {
    setActiveBusiness(null);
    await AsyncStorage.removeItem('active_business');
  };

  return (
    <BusinessContext.Provider value={{ activeBusiness, setBusiness, clearBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};