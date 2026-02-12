import React, { useState, useEffect, useCallback } from 'react';
// Core React Native components must be explicitly imported
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';

// Import the external API service and the necessary types
import { useApiService } from '../services/apiService';
import { useAuthContext } from '../context/AuthContext';
import { AppColors } from '../constants/theme';
import { Address } from '../model/interfaces'
import { useFocusEffect } from '@react-navigation/native';

// Extract the nested Address type from the Addresses interface for use in state
// type Address = Addresses['addresses'][number];

// ----------------------------------------------------------------------

/**
 * TYPE DEFINITIONS
 */
interface DropdownOption {
  label: string;
  value: string; // Address ID
}

/**
 * STANDALONE ADDRESS SELECT COMPONENT
 * Handles fetching addresses using the apiService and managing the dropdown state.
 */
export default function AddressSelect() {

  const { getAddresses } = useApiService();
  const { userId, isLoggedIn } = useAuthContext();

  // Data State
  // We now use the Address type inferred from the Addresses interface in apiService.ts
  const [addresses, setAddresses] = useState<Address[]>([]);
  // const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown/Selection State
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedDisplayOption, setSelectedDisplayOption] = useState<DropdownOption | null>(null);

  const formatAddress = (address: Address): DropdownOption => {
    // Concatenate main address parts for display
    return {label: `${address.address_1}, ${address.city}`, value:`${address.id}`};
  };

  const fetchAddresses = useCallback(async () => {
    // Only attempt to fetch if the user is logged in
    if (!isLoggedIn || userId === null) {
      console.log('User not logged in or userId unavailable. Skipping address fetch.');
      setAddresses([]);
      setSelectedAddressId(null);
      setSelectedDisplayOption({label:'Sign In for Addresses', value:''});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // The API service uses the auth token (managed by useAuthContext) to fetch addresses for the current user
      const data = await getAddresses();
      const fetchedAddresses = data.addresses || [];
      setAddresses(fetchedAddresses);

      if (fetchedAddresses.length > 0) {
        // Set the first address as the initial selection
        const firstAddress = fetchedAddresses[0];
        setSelectedAddressId(firstAddress.id.toString());
        setSelectedDisplayOption(formatAddress(firstAddress));
      } else {
        setSelectedAddressId(null);
        setSelectedDisplayOption({label:'Add a Delivery Address',value:''});
      }

    } catch (e) {
      setError('Failed to load addresses.');
      console.error('Error fetching addresses:', e);
      setAddresses([]);
      setSelectedAddressId(null);
      setSelectedDisplayOption({label:'Error Loading', value: ''});
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, userId, getAddresses]);

  // --- 1. DATA FETCHING (Using apiService.getAddresses) ---
  // useEffect(() => {
  //   setLoading(true);
  //   setError(null);

    // const loadAddresses = async () => {
    //   try {
    //     // --- THIS IS THE KEY CHANGE: Calling the external service method ---
    //     const data: Address[] = getAddresses();
    //
    //     if(data && data.length > 0){
    //       // Data structure is { success, user_id, addresses }
    //       setUserId(data.user_id);
    //       setAddresses(data.addresses);
    //
    //       // Auto-select the first address and set its ID as the initial selection
    //       if (data.addresses.length > 0) {
    //         setSelectedAddressId(data.addresses[0].id);
    //       }
    //     }
    //
    //   } catch (e) {
    //     // Error handling now uses the exception thrown by the apiService request wrapper
    //     const errorMessage = (e as Error).message || 'Failed to fetch addresses via API Service.';
    //     console.error("Failed to fetch addresses:", e);
    //     setError(errorMessage);
    //     setAddresses([]);
    //     setUserId('Error');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

  //   loadAddresses();
  //
  // }, [loadAddresses]);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
      // Dependencies array for fetchAddresses is already set up to include isLoggedIn and userId.
    }, [fetchAddresses])
  );

  // Convert fetched addresses to the format required by the dropdown
  const dropdownOptions: DropdownOption[] = addresses.map(addr => ({
    value: addr.id,
    label: `${addr.label} (${addr.fullAddress.substring(0, 30)}${addr.fullAddress.length > 30 ? '...' : ''})`,
  }));

  // --- 2. SELECTION EFFECT ---
  // Sets the selected display option whenever addresses or selectedAddressId changes
  useEffect(() => {
    if (addresses.length > 0) {
      const targetId = selectedAddressId || addresses[0].id;
      const targetOption = dropdownOptions.find(opt => opt.value === targetId);

      if (targetOption && selectedDisplayOption?.value !== targetId) {
        setSelectedDisplayOption(targetOption);
        setSelectedAddressId(targetId); // Ensure state consistency
      }
    } else {
      setSelectedDisplayOption(null);
      setSelectedAddressId(null);
    }
    // Dependency array ensures this runs only when relevant states change
  }, [addresses, selectedAddressId, dropdownOptions, selectedDisplayOption]);


  // --- 3. DROPDOWN HANDLERS ---
  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option: DropdownOption) => {
    setSelectedDisplayOption(option);
    setSelectedAddressId(option.value);
    setIsOpen(false);
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const displayValue = selectedDisplayOption ? selectedDisplayOption.label : "Select an address from your account...";
  const Icon = () => <Text style={styles.icon}>{isOpen ? '▲' : '▼'}</Text>;

  // --- RENDERING LOGIC ---
  if (error) {
    return (
      <View style={[componentStyles.errorContainer]}>
        <Text style={componentStyles.errorText}>API Error: {error}</Text>
        <Text style={componentStyles.secondaryText}>Check your network or WordPress API settings.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[componentStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={componentStyles.secondaryText}>Loading addresses...</Text>
      </View>
    );
  }

  if (addresses.length === 0) {
    return (
      <View style={[componentStyles.noDataContainer]}>
        <Text style={componentStyles.secondaryText}>No addresses</Text>
      </View>
    );
  }

  return (
    <View style={componentStyles.mainWrapper}>
      {/* --- DROPDOWN UI START --- */}
      <View style={[styles.container]}>
        {/* --- Dropdown Button/Trigger --- */}
        <TouchableOpacity
          style={styles.triggerButton}
          onPress={toggleDropdown}
          activeOpacity={0.8}
        >
          <Text numberOfLines={1} style={[styles.triggerText, selectedDisplayOption ? styles.selectedText : styles.placeholderText]}>
            {displayValue}
          </Text>
          <Icon />
        </TouchableOpacity>

        {/* --- Options List --- */}
        {isOpen && (
          <View style={styles.optionsContainer}>
            <ScrollView style={styles.optionsScrollView} nestedScrollEnabled={true}>
              {dropdownOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.optionItem, option.value === selectedAddressId && styles.selectedOption]}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
      {/* --- DROPDOWN UI END --- */}

    </View>
  );
}

// --- DROPDOWN STYLESHEET ---
const styles = StyleSheet.create({
  container: {
    zIndex: 10,
    marginBottom: 0,
    width: '100%',
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 2,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF'
  },
  triggerText: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  selectedText: {
    color: AppColors.textDark,
  },
  placeholderText: {
    color: AppColors.textMedium,
  },
  icon: {
    fontSize: 14,
    color: AppColors.textDark,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  optionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 220,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 4,
  },
  optionsScrollView: {
    flexGrow: 1,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#F3F4F6', // Slight highlight for the currently selected item in the dropdown list
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
});

// --- COMPONENT SUPPORT STYLESHEET ---
const componentStyles = StyleSheet.create({
  mainWrapper: {
    // Wrapper for the entire component's UI, centered
    alignItems: 'center',
    paddingVertical: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'left',
  },
  resultCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#0EA5E9',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 5,
  },
  resultValue: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    fontWeight: '600',
  },
  noDataContainer: {
    marginTop: 6,
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
  },
  secondaryText: {
    marginTop: 0,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  userIdText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
  }
});
