import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation, useFocusEffect, NavigationProp } from '@react-navigation/native';
import Icon from '../components/atoms/Icon';
import { AppColors } from '../constants/theme';
import { useApiService } from '../services/apiService';
import { useAuthContext } from '../context/AuthContext';
import { Address } from '../model/interfaces';
import CustomAlertModal from '../components/AlertModal';
import { useCustomerContext } from '../context/CustomerContext';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the expected navigation parameters for AddressForm
type AddressFormParams = {
  address?: Address;
  type: 'shipping' | 'billing';
  isEdit: boolean;
};

// Define the expected stack type for type-safe navigation (Mocked for context)
type MoreStackParamList = {
  AddressesScreen: undefined;
  AddressFormScreen: AddressFormParams;
};
type AddressScreenNavigationProp = NavigationProp<MoreStackParamList, 'AddressesScreen'>;

// --- Address Card Component ---

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
}

const AddressCard: React.FC<AddressCardProps> = React.memo(({ address, onEdit, onDelete }) => {
  const formatAddress = (addr: Address): string => {
    // Only display non-empty fields
    return [
      addr.address_1,
      addr.address_2,
      `${addr.city}, ${addr.state} ${addr.postcode}`
    ].filter(line => line.trim().length > 0 && line.trim() !== ',').join(', ');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.addressName}>{address.first_name} {address.last_name}</Text>
      <Text style={styles.addressText}>{formatAddress(address)}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: AppColors.primary }]}
          onPress={() => onEdit(address)}
        >
          <Icon name="edit" width={16} height={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: AppColors.warning }]}
          onPress={() => address.address_id && onDelete(address.address_id)}
        >
          <Icon name="trash" width={16} height={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// --- Main Screen Component ---

const AddressesScreen: React.FC = () => {
  const navigation = useNavigation<AddressScreenNavigationProp>();
  const { userId ,addresses} = useAuthContext();
  const { deleteCustomerAddress } = useApiService();

  // const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState({ isVisible: false, title: '', message: '' });
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null); // address_id to be deleted

  // Split addresses into billing and shipping lists
  const billingAddresses = useMemo(() => addresses.filter(a => a.address_type === 'billing'), [addresses]);
  const shippingAddresses = useMemo(() => addresses.filter(a => a.address_type === 'shipping'), [addresses]);

  const handleDeleteConfirmation = useCallback((addressId: string) => {
    setDeleteCandidate(addressId);
    setAlert({
      isVisible: true,
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this address? This action cannot be undone.',
    });
  }, []);

  const handleDeleteAddress = useCallback(async () => {
    if (!userId || !deleteCandidate) return;

    // Close the confirmation modal
    setAlert({ isVisible: false, title: '', message: '' });
    setIsDeleting(true);

    try {
      await deleteCustomerAddress(userId, deleteCandidate);
      // Remove the deleted address from the local state
      // setAddresses(prev => prev.filter(a => a.address_id !== deleteCandidate));
    } catch (error) {
      console.error('Failed to delete address:', error);
      setAlert({ isVisible: true, title: 'Error', message: 'Failed to delete address. Please try again.' });
    } finally {
      setIsDeleting(false);
      setDeleteCandidate(null);
    }
  }, [userId, deleteCandidate, deleteCustomerAddress]);


  const handleEditAddress = useCallback((address: Address) => {
    navigation.navigate('AddressFormScreen', { address, type: address.address_type, isEdit: true });
  }, [navigation]);

  const handleAddAddress = useCallback((type: 'billing' | 'shipping') => {
    navigation.navigate('AddressFormScreen', { type, isEdit: false });
  }, [navigation]);


  const renderAddressList = ({ item }: { item: Address }) => (
    <AddressCard
      address={item}
      onEdit={handleEditAddress}
      onDelete={handleDeleteConfirmation}
    />
  );

  const renderSection = (title: string, data: Address[], type: 'billing' | 'shipping') => (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title} Addresses</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleAddAddress(type)}>
          <Icon name="plus" width={16} height={16} />
          {/*<Text style={styles.addButtonText}>Add New</Text>*/}
        </TouchableOpacity>
      </View>
      {data.length > 0 ? (
        <FlatList
          data={data}
          renderItem={renderAddressList}
          keyExtractor={item => item.address_id || item.address_1}
          scrollEnabled={false} // Disable FlatList scrolling inside ScrollView
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="location" width={30} height={30} color={AppColors.inactive} />
          <Text style={styles.emptyText}>No {title.toLowerCase()} addresses saved.</Text>
        </View>
      )}
    </View>
  );

  if (isLoading || isDeleting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AppColors.primary} />
        <Text style={styles.loadingText}>{isDeleting ? 'Deleting Address...' : 'Loading your addresses...'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CustomAlertModal
        isVisible={alert.isVisible}
        title={alert.title}
        message={alert.message}
        onConfirm={deleteCandidate ? handleDeleteAddress : () => setAlert({ ...alert, isVisible: false })}
        onCancel={deleteCandidate ? () => setAlert({ ...alert, isVisible: false, deleteCandidate: null }) : undefined}
        confirmText={deleteCandidate ? 'Yes, Delete' : 'OK'}
        type={deleteCandidate ? 'warning' : 'info'}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Address Book</Text>
        <Text style={styles.subHeader}>
          Manage your saved locations for billing and shipping below.
        </Text>

        {renderSection('Billing', billingAddresses, 'billing')}
        {renderSection('Shipping', shippingAddresses, 'shipping')}

        {addresses.length === 0 && !isLoading && (
          <View style={styles.emptyScreenContainer}>
            <Icon name="map" width={60} height={60} color={AppColors.inactive} />
            <Text style={styles.emptyScreenText}>Your address book is empty!</Text>
            <Text style={styles.emptyScreenSubText}>Start by adding your home or work address.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundLight,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundLight,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: AppColors.textMedium,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: AppColors.textMedium,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: AppColors.borderMedium,
    paddingBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  separator: {
    height: 1,
    backgroundColor: AppColors.borderLight,
    marginVertical: 10,
  },
  // --- Card Styles ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    borderLeftColor: AppColors.primaryDark,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginLeft: 8,
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
    marginTop: 5,
  },
  addressText: {
    fontSize: 14,
    color: AppColors.textMedium,
    lineHeight: 20,
    marginTop: 2,
  },
  addressLine: {
    flexDirection: 'row',
  },
  addressContact: {
    fontSize: 14,
    color: AppColors.textDark,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
    paddingTop: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    marginTop: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.inactive,
    marginTop: 10,
  },
  emptyScreenContainer: {
    marginTop: 50,
    alignItems: 'center',
    padding: 20,
  },
  emptyScreenText: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.textDark,
    marginTop: 15,
  },
  emptyScreenSubText: {
    fontSize: 16,
    color: AppColors.textMedium,
    textAlign: 'center',
    marginTop: 5,
  },
  // Placeholder styles - using mock constants from theme
  // We assume AppColors.danger and AppColors.inactive exist.
});

export default AddressesScreen;
