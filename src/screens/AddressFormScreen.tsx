import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp
} from '@react-navigation/native';
import { AppColors } from '../constants/theme';
import { Address } from '../model/interfaces';
import { useApiService } from '../services/apiService';
import CustomAlertModal from '../components/AlertModal';
import { useAuthContext } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the shape of the navigation parameters for this screen
type AddressFormRouteParams = {
  address?: Address;
  type: 'shipping' | 'billing';
  isEdit: boolean;
  redirectTo?: 'AddressesScreen';
};

type AddressFormRouteProp = RouteProp<{ AddressFormScreen: AddressFormRouteParams }, 'AddressFormScreen'>;
// Define the navigation stack for type safety
type RootStackParamList = {
  AddressFormScreen: AddressFormRouteParams;
  CheckoutScreen: undefined; // Assuming CheckoutScreen is in the root stack
  // Add other screens as needed
};
type AddressFormNavigationProp = NavigationProp<RootStackParamList, 'AddressFormScreen'>;

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
}

const FormInput: React.FC<FormInputProps> = React.memo(({
                                                          label,
                                                          value,
                                                          onChangeText,
                                                          placeholder,
                                                          required = false,
                                                          keyboardType = 'default'
                                                        }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    {/* The TextInput is now stable and won't lose focus */}
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={AppColors.inactive}
      keyboardType={keyboardType}
      // Added autoCorrect and autoCapitalize for better form behavior
      autoCorrect={false}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
    />
  </View>
));

/**
 * A reusable form component for creating and editing customer addresses.
 */
const AddressFormScreen: React.FC = () => {
  const navigation = useNavigation<AddressFormNavigationProp>();
  const route = useRoute<AddressFormRouteProp>();

  // --- GENERIC ALERT MODAL STATE ---
  const [alertConfig, setAlertConfig] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmText: string;
    cancelText?: string;
    type: 'alert' | 'warning' | 'info';
  }>({
    isVisible: false,
    title: '',
    message: '',
    onConfirm: () => setAlertConfig(prev => ({ ...prev, isVisible: false })),
    confirmText: 'OK',
    type: 'info',
  });

  // Helper to hide the modal
  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, isVisible: false }));
  };

  // Helper to show the modal with flexible configuration
  const showAlert = (
    title: string,
    message: string,
    confirmHandler: () => void = hideAlert,
    cancelHandler?: () => void,
    confirmText: string = cancelHandler ? 'Confirm' : 'OK',
    cancelText?: string,
    type: 'alert' | 'warning' | 'info' = 'info'
  ) => {
    setAlertConfig({
      isVisible: true,
      title,
      message,
      onConfirm: confirmHandler,
      onCancel: cancelHandler,
      confirmText,
      cancelText,
      type,
    });
  };

  const { address, type, isEdit, redirectTo } = route.params;
  const { isLoggedIn, userId, refetchAddresses, updateLocalAddress } = useAuthContext();

  const { address: initialAddress } = route.params;

  const { createCustomerAddress, updateCustomerAddress } = useApiService();

  // Initialize form state
  const [formState, setFormState] = useState<Address>(initialAddress || {
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    state: '',
    postcode: '',
    country: 'UK',
    email: initialAddress?.email || '',
    phone: initialAddress?.phone || '',
    address_type: type,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCancelled, setIsCancelled] = useState(false);

  const headerTitle = isEdit
    ? `Edit ${type === 'shipping' ? 'Shipping' : 'Billing'} Address`
    : `Add New ${type === 'shipping' ? 'Shipping' : 'Billing'} Address`;

  const isNew = !initialAddress || !initialAddress.address_id;
  const title = isNew
    ? 'Add New Address'
    : `Edit ${initialAddress.address_type === 'billing' ? 'Billing' : 'Shipping'} Address`;

  // Set header title dynamically
  useLayoutEffect(() => {
    navigation.setOptions({
      title: title,
    });
  }, [navigation, title]);

  // 2. Use useCallback for the state handler
  const handleChange = useCallback((key: keyof Address, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []); // Stable reference

  const validateForm = useCallback((): boolean => {
    // Basic validation: must have a first name, address line 1, city, postcode, and email
    if (
      !formState.first_name ||
      !formState.address_1 ||
      !formState.city ||
      !formState.postcode ||
      !formState.email
    ) {
      setAlertConfig(prev => ({ ...prev,
          title: 'Validation Error',
          message: 'Please fill in all required fields: First Name, Address Line 1, City, Postcode, and Email.',
          type: 'alert',
          isVisible: true
        })
      );
      return false;
    }
    return true;
  }, [formState]);

  useLayoutEffect(() => {
    if(isCancelled){
      navigation.goBack();
    }
  }, [navigation, isCancelled]);

  let handleSave: () => Promise<void>;
  handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!isLoggedIn) {
        // --- GUEST CHECKOUT LOGIC (LOCAL STORAGE) ---
        // 1. Update the local address state and save to AsyncStorage
        updateLocalAddress(formState);

      } else {
        const { address_id, user_id, ...dataToSave } = formState;

        if (isNew) {
          // --- CREATE ---
          await createCustomerAddress(userId, dataToSave);
        } else {
          // --- UPDATE ---
          const addressId = initialAddress.address_id!;
          await updateCustomerAddress(userId, addressId, dataToSave);
        }

        //now refresh the address list
        await refetchAddresses();

      }

      if (redirectTo === 'CheckoutScreen') {
        navigation.navigate('CheckoutScreen');
      } else {
        // Default behavior: go back to the previous screen (AddressesScreen)
        navigation.goBack();
      }

    } catch (error) {
      console.error('Error saving address:', error);
      setAlertConfig(prev => ({ ...prev,
          title: 'Failed to save address',
          message: 'Please check your connection or try again.',
          type: 'alert',
          isVisible: true
        })
      );

    } finally {
      setIsLoading(false);
    }
  }, [validateForm, isLoggedIn, updateLocalAddress, formState, isNew, refetchAddresses, redirectTo, createCustomerAddress, userId, updateCustomerAddress, navigation]);


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAlertModal
        isVisible={alertConfig.isVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => hideAlert()}
        confirmText="OK"
        type={alertConfig.type}
      />

      <View style={{ paddingHorizontal: 20 }}>
        <Text style={styles.sectionTitle}>{headerTitle}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Info */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <FormInput
          label="First Name"
          value={formState.first_name}
          onChangeText={text => handleChange('first_name', text)}
          required
        />
        <FormInput
          label="Last Name"
          value={formState.last_name}
          onChangeText={text => handleChange('last_name', text)}
        />
        <FormInput
          label="Email"
          value={formState.email}
          onChangeText={text => handleChange('email', text)}
          keyboardType="email-address"
        />
        <FormInput
          label="Phone"
          value={formState.phone}
          onChangeText={text => handleChange('phone', text)}
          keyboardType="phone-pad"
        />

        {/* Address Fields */}
        <Text style={styles.sectionTitle}>Address Details</Text>
        <FormInput
          label="Address Line 1"
          value={formState.address_1}
          onChangeText={text => handleChange('address_1', text)}
          required
          placeholder="Street address, P.O. Box, Company name"
        />
        <FormInput
          label="Address Line 2"
          value={formState.address_2}
          onChangeText={text => handleChange('address_2', text)}
          placeholder="Apartment, suite, unit, building, floor, etc."
        />
        <FormInput
          label="Town/City"
          value={formState.city}
          onChangeText={text => handleChange('city', text)}
          required
        />
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <FormInput
              label="County"
              value={formState.state}
              onChangeText={text => handleChange('state', text)}
            />
          </View>
          <View style={styles.halfInput}>
            <FormInput
              label="Postcode"
              value={formState.postcode}
              onChangeText={text => handleChange('postcode', text)}
              required
              keyboardType="default"
            />
          </View>
        </View>

        <FormInput
          label="Country"
          value={formState.country}
          onChangeText={text => handleChange('country', text)}
          placeholder="US, CA, UK, etc."
        />
        <FormInput
          label="Company (Optional)"
          value={formState.company}
          onChangeText={text => handleChange('company', text)}
        />

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={function onCancel() { setIsCancelled(true)}}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Ensure space for the fixed footer
  },
  // --- Selector Styles ---
  selectorContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.borderMedium,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textMedium,
    marginBottom: 8,
  },
  selectorButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: AppColors.backgroundLight,
    borderWidth: 1,
    borderColor: AppColors.borderMedium,
  },
  selectorButtonActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  selectorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  selectorButtonTextActive: {
    color: AppColors.backgroundCard, // White text on primary background
  },
  // --- Form Input Styles ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
    marginTop: 15,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textMedium,
    marginBottom: 5,
  },
  required: {
    color: AppColors.primaryDark,
  },
  input: {
    backgroundColor: AppColors.backgroundCard,
    borderColor: AppColors.borderMedium,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: AppColors.textDark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  halfInput: {
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.backgroundCard,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    gap:10
  },
  saveButton: {
    backgroundColor: AppColors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: AppColors.warning,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  spacer: {
    height: 50,
  }
});

export default AddressFormScreen;
