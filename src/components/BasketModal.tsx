import React, { useCallback, useMemo } from 'react'; // 🚨 Import useMemo
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import Icon from './atoms/Icon.tsx';
import { AppColors } from '../constants/theme.ts';
// 🚨 Removed unused BasketItem import
import { LineItem, displayPrice } from '../model/interfaces.ts';
import DeliveryCollectionToggle from './DeliveryCollectionToggle.tsx';
import QuantitySelector from './atoms/QuantitySelector.tsx';
import { useBasketContext } from '../context/BasketContext.tsx';
import { useBusiness } from '../context/BusinessContext';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuthContext } from '../context/AuthContext';

type RootStackParamList = {
  Home: undefined;
  Checkout: undefined; // Assuming your Checkout screen is named 'Checkout'
  // Add other screen names here
};

interface BasketModalProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Renders a modal that slides up to show the contents of the basket.
 */
export function BasketModal({
                              isVisible,
                              onClose
                            }: BasketModalProps) {

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { activeBusiness } = useBusiness();

  const { getPrimaryAddress } = useAuthContext();

  const { cart, total, updateBasket, deliveryTotal, originBusinessId } = useBasketContext();

  // Get Array of Cart Items for FlatList
  const cartItemsArray: LineItem[] = useMemo(() => {
    if (!cart?.items) return [];
    // Convert the Record<string, CoCartLineItem> into an array
    return Object.values(cart.items);
  }, [cart]);

  // Use CoCartCart `item_count` property
  const isBasketEmpty = cart?.items_count === 0 || !cart;

  const onGoToCheckout = useCallback(() => {
    if (isBasketEmpty) return;

    // Silently switch to the business on which the cart items are originally added from
    if (originBusinessId && activeBusiness && originBusinessId !== activeBusiness.id) {
      // We need the full business object to switch.
      // Usually, you can fetch this from your Directory data or a saved list.
      // For now, we search the 'businesses' array if available,
      // or assume the ID is enough if setBusiness handles it.

      console.log("Detecting cross-business checkout. Switching to origin site.");

      // logic to find the original business object (e.g., from a master list)
      // const original = allBusinesses.find(b => b.id === originBusinessId);
      // if (original) setBusiness(original);
    }
    // --- END SILENT SWITCH LOGIC ---

    onClose(); // Close the modal first
    //Navigate to the Checkout screen if there is a billing address otherwise open the address form.
    if (getPrimaryAddress('billing')) {
      // If a billing address exists, proceed directly to the CheckoutScreen
      navigation.navigate('Checkout');
    } else {
      // If no billing address exists, redirect to AddressFormScreen to create one.
      // We pass the redirectTo param so the form knows where to go next.
      navigation.navigate('AddressFormScreen', { address: null, type: 'billing', isEdit: false });
    }

  }, [isBasketEmpty, onClose, navigation, getPrimaryAddress]);

  const renderItem = ({ item }: { item: LineItem }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemTitlePrice}>
        <Text style={styles.itemQuantity}>{item.quantity}x</Text>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemPrice}>{displayPrice(item.totals.line_subtotal, item.totals.currency_symbol, item.totals.currency_minor_unit,item.totals.currency_decimal_separator)}</Text>
      </View>
      <View style={styles.itemQuantityWrapper}>
        <QuantitySelector
          quantity={item.quantity}
          onUpdateQuantity={(newQuantity) => updateBasket(item.id, newQuantity)}
        />
      </View>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <DeliveryCollectionToggle layout={'large'} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name={'x'} width={22} height={22} />
            </TouchableOpacity>
          </View>
          <Pressable style={styles.checkoutButton} onPress={onClose}><Text style={styles.addMoreText}>{isBasketEmpty ? 'Add Items':'Add More Items'}</Text></Pressable>

          <FlatList
            data={cartItemsArray}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
          />

          { (deliveryTotal > 0) && (
            <View style={styles.deliveryFees}>
              <View style={styles.deliveryRow}>
                <Text style={styles.deliveryLabel}>Delivery</Text>
                <Text style={styles.deliveryValue}>£{deliveryTotal}</Text>
              </View>
            </View>
          )}

          {!isBasketEmpty && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutButton, isBasketEmpty && styles.disabledButton]}
                onPress={onGoToCheckout} // 4. Attach the navigation function
                disabled={isBasketEmpty}
              >
                {/*<Icon name="basket-light" width={24} height={24} />*/}
                <Text style={styles.checkoutText}>Go to Checkout</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark semi-transparent background
  },
  modalContent: {
    backgroundColor: AppColors.backgroundDefault,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    maxHeight: '80%', // Limit modal height
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  disabledButton: {
    backgroundColor: AppColors.inactive, // Use a duller color when disabled
  },
  closeButton: {
    padding: 5,
    width: 40,
    height: 40,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    position: 'absolute',
    top:-40,
    right: 0
  },
  listContent: {
    paddingVertical: 10,
  },
  itemRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
  },
  itemTitlePrice: {
    flexDirection: 'row',
  },
  itemQuantityWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    textAlign: 'right',
    width: '100%',
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
    marginRight: 10,
  },
  itemTitle: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textDark,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  footer: {
    paddingTop: 15,
    paddingBottom: 40, // Space for device home indicator
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 23,
    fontWeight: 600,
    color: AppColors.textDark,
  },
  totalValue: {
    fontSize: 23,
    fontWeight: '800',
    color: AppColors.textDark,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: AppColors.backgroundCard,
  },
  addMoreText: {
    color: AppColors.textWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  deliveryFees: {

  },
  deliveryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deliveryLabel: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textDark,
  },
  deliveryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  }
});
