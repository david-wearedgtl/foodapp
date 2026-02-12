import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useBasketContext } from '../context/BasketContext';
import { useAuthContext } from '../context/AuthContext';
import { useApiService } from '../services/apiService';
import { AppColors } from '../constants/theme';
import Icon from '../components/atoms/Icon';
import { Address, displayPrice, Order, PaymentGateway } from '../model/interfaces';
import CustomAlertModal from '../components/AlertModal';
import CartSummary from '../components/CartSummary';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define Checkout Stages
type CheckoutStage = 'REVIEW' | 'PAYMENT' | 'CONFIRMATION';

// --- CONCEPTUAL WEBVIEW MODAL (PLACEHOLDER) ---
// In a real application, you would use 'react-native-webview' here.
const PaymentWebViewModal = ({ isVisible, paymentUrl, onPaymentComplete, onModalClose }) => {

  if (!isVisible || !paymentUrl) return null;

  // 🚨 IMPORTANT: In a real app, you would use the 'onNavigationStateChange'
  // prop of the WebView to monitor the URL. When the URL matches your
  // configured Deep Link success/failure URL, you call onPaymentComplete.

  // Simulating the payment completion redirect after a short delay for demonstration
  useEffect(() => {
    if (isVisible) {
      console.log("WebView opened to:", paymentUrl);
      const timer = setTimeout(() => {
        // *** This simulates the user completing the payment and the WebView redirecting back. ***
        console.log("Simulating payment completion/redirect...");
        onPaymentComplete(true); // Assuming success
        // *** In reality, this is triggered by WebView's onNavigationStateChange, NOT a timer. ***
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onPaymentComplete, paymentUrl]);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onModalClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: AppColors.backgroundDefault }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Complete Payment</Text>
          <TouchableOpacity onPress={onModalClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.webViewPlaceholder}>
          <Text style={{ textAlign: 'center', color: AppColors.textMedium }}>
            [IN REALITY, THIS IS THE WEBVIEW]
          </Text>
          <Text style={{ textAlign: 'center', color: AppColors.textMedium }}>
            Loading secure payment page from:
          </Text>
          <Text style={{ textAlign: 'center', color: AppColors.primary, marginTop: 5 }}>
            {paymentUrl}
          </Text>
          <ActivityIndicator size="large" color={AppColors.primaryDark} style={{marginTop: 20}}/>
          <Text style={{ textAlign: 'center', color: AppColors.textMedium, marginTop: 20, fontStyle: 'italic' }}>
            (Simulated success in 3 seconds)
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};
// --- END CONCEPTUAL WEBVIEW MODAL ---

// --- ALERT CONFIG TYPE ---
interface AlertConfig {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void; // Optional for one-button modals
  confirmText?: string;
  cancelText?: string;
}

//Set the Initial values for the Alert Config
const INITIAL_ALERT_CONFIG: AlertConfig = {
  isVisible: false,
  title: '',
  message: '',
  type: 'info',
  onConfirm: () => {},
  onCancel: undefined,
  confirmText: 'OK',
  cancelText: 'Cancel',
};

/**
 * Renders the full multi-step checkout screen.
 */
export const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { cart, isDelivery, selectedShippingAddress, refreshCart,
    selectedBillingAddress,
    setSelectedShippingAddress,
    setSelectedBillingAddress, cartTokenManager } = useBasketContext();
  const { addresses, isCustomerDataLoading, refetchAddresses } = useAuthContext();
  const { createOrder, getPaymentGateways } = useApiService(cartTokenManager);

  const [currentStage, setCurrentStage] = useState<CheckoutStage>('REVIEW');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalOrder, setFinalOrder] = useState<Order | null>(null);

  // 🚨 NEW: Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentGateway[]>([]);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // 🚨 NEW: State for the WebView modal
  const [paymentWebView, setPaymentWebView] = useState<{ isVisible: boolean, url: string | null }>({
    isVisible: false,
    url: null,
  });

  // Custom Alert Config
  const [alertConfig, setAlertConfig] = useState<AlertConfig>(INITIAL_ALERT_CONFIG);

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

  const handleAlertClose = useCallback(() => {
    setAlertConfig(INITIAL_ALERT_CONFIG);
  }, []);

  // Check if the cart is ready for checkout
  const isCartValid = useMemo(() => {
    // Check if cart is loaded, has items, and totals are present
    return cart && cart.items && cart.items.length > 0 && cart.totals?.total_price;
  }, [cart]);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        setIsPaymentLoading(true);
        // Call the memoized API function
        const methods = await getPaymentGateways();

        setPaymentMethods(methods);

        // Auto-select the first method if available
        if (methods.length > 0) {
          setSelectedPaymentMethod(methods[0].id);
        }
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        setError('Failed to load payment options. Please check your connection.');
      } finally {
        setIsPaymentLoading(false);
      }
    };

    loadPaymentMethods();

  }, [getPaymentGateways]); // Dependency array is clean.


  const handlePaymentCompletion = useCallback((success: boolean, orderId?: number) => {
    // 1. Close the WebView modal
    setPaymentWebView({ isVisible: false, url: null });
    setIsLoading(true);

    if (success) {
      // If payment was successful (based on deep link redirect)
      // You would typically refetch the final order status from your backend using the orderId
      // For this example, we'll navigate directly to confirmation

      setFinalOrder({
        order_idid: orderId, // Use the actual order ID from the redirect, or mock
        status: 'processing', // Payment is done, order is processing
        total: cart?.totals?.total_price || '0.00',
        currency: cart?.totals?.currency_code || 'USD',
      } as Order);

      setCurrentStage('CONFIRMATION');

      //Refresh the cart by retrieving the cart from the server which should now be clear
      refreshCart();

    } else {
      // Payment failed or was cancelled
      setIsLoading(false);
      // Show error and remain on the Payment screen
      showAlert("Payment failed", "Payment failed or was cancelled. Please try a different payment method.");
    }
    setIsLoading(false);
  }, [cart?.totals?.currency_code, cart?.totals?.total_price, refreshCart, showAlert]);


  // --- ORDER PLACEMENT LOGIC ---

  const handlePlaceOrder = useCallback(async () => {
    if (!isCartValid || !selectedPaymentMethod || !selectedBillingAddress || (isDelivery && !selectedShippingAddress)) {
      setError('Cannot place order: Cart invalid, payment missing, or addresses are incomplete.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      billing_address: selectedBillingAddress,
      shipping_address: isDelivery ? selectedShippingAddress : selectedBillingAddress,
      payment_method: selectedPaymentMethod,
    };

    try {
      // 1. Send Order to WooCommerce API
      const order = await createOrder(payload);

      // Check for mandatory payment URL (Stripe, PayPal, etc.)
      if (order.status === 'pending' && order.payment_result.redirect_url) {

        setIsLoading(false);

        // 2. Open the WebView modal to handle the external payment URL
        setPaymentWebView({
          isVisible: true,
          // This URL initiates the payment flow (e.g., Stripe's 3D Secure)
          url: order.payment_result.redirect_url,
        });

        // Note: The app now waits for the user to complete the payment in the modal.
        // The modal's simulated redirect will call handlePaymentCompletion.

      } else if (order.status === 'processing' || order.status === 'completed' || selectedPaymentMethod === 'cod') {

        // 3. Payment was direct (COD, BACS) or already processed successfully by API
        setFinalOrder(order);
        setCurrentStage('CONFIRMATION');

      } else {
        // Unexpected status (e.g., failed immediately)
        throw new Error(`Order placed with unexpected status: ${order.status}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during checkout.';
      setError(errorMessage);
      setIsLoading(false);
      showAlert("Order Error","There was an issue creating your order. Please try again.");
      setCurrentStage('REVIEW');
    } finally {
      // We don't hide the loader here if the WebView opens, as the modal handles the next step
      if (!paymentWebView.isVisible) {
        setIsLoading(false);
      }
      refreshCart();
    }
  }, [isCartValid, selectedPaymentMethod, selectedBillingAddress, isDelivery, selectedShippingAddress, createOrder, refreshCart, showAlert, paymentWebView.isVisible]);


  // --- STAGE NAVIGATION HANDLERS ---

  const handleNext = useCallback(() => {
    setError(null);
    if (currentStage === 'REVIEW') {
      setCurrentStage('PAYMENT');

    } else if (currentStage === 'PAYMENT') {
      if (!selectedPaymentMethod) {
        setError('Please select a payment method.');
        return;
      }
      // Skip straight to placing the order (or could be 'CONFIRMATION' stage)
      handlePlaceOrder();
    }
  }, [currentStage, selectedPaymentMethod, handlePlaceOrder]); // Added handlePlaceOrder dependency

  const handleBack = useCallback(() => {
    if (currentStage === 'PAYMENT') {
      setCurrentStage('REVIEW');
    } else {
      // For any other state, just go back one step in the navigation stack
      navigation.goBack();
    }
  }, [currentStage, navigation]);

  const handleCancel = useCallback(() => {
    setAlertConfig({
      isVisible: true,
      title: 'Cancel Checkout',
      message: 'Are you sure you want to cancel and return to the home screen? Your basket contents will be saved.',
      type: 'warning',
      onConfirm: () => {
        // Action: Navigate to Home
        handleAlertClose(); // Close the modal first
        navigation.navigate('MainTabs', { screen: 'Home' });
      },
      onCancel: handleAlertClose, // Action: Simply close the modal (No, Continue)
      confirmText: 'Yes, Cancel',
      cancelText: 'No, Continue',
    });
  }, [navigation, handleAlertClose]);

  // --- RENDERING SUB-COMPONENTS ---

  const renderAddressCard = (type: 'shipping' | 'billing', address: Address | null, onSelect: (addr: Address | null) => void) => (
    <View style={styles.addressCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardHeader}>{type === 'shipping' ? 'Shipping Address' : 'Billing Address'}</Text>
        <TouchableOpacity onPress={() => {/* Logic to open address selection modal */}} style={styles.changeButton}>
          <Text style={styles.changeButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
      {address ? (
        <>
          <Text style={styles.addressText}>{address.first_name} {address.last_name}</Text>
          <Text style={styles.addressText}>{address.address_1}</Text>
          <Text style={styles.addressText}>{address.city}, {address.postcode}</Text>
          <Text style={styles.addressText}>{address.phone}</Text>
        </>
      ) : (
        <Text style={[styles.addressText, styles.errorText]}>No address selected. Please select one.</Text>
      )}
    </View>
  );

  const renderStageContent = () => {
    if (!isCartValid && !finalOrder) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Your cart is empty or invalid. Please add items before checking out.</Text>
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('Order')}>
            <Text style={styles.buttonSecondaryText}>Go to Menu</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (currentStage === 'REVIEW') {
      return (
        <View style={styles.stageContainer}>
          <Text style={styles.stageTitle}>Review Order & Addresses</Text>

          {/*{renderCartSummary(cart as StoreApiCart)}*/}
          {cart && (
            <CartSummary cartData={cart}/>
          )}

          {/* Shipping Address - Only for Delivery */}
          {isDelivery && (
            renderAddressCard('shipping', selectedShippingAddress, setSelectedShippingAddress)
          )}

          {/* Billing Address */}
          {renderAddressCard('billing', selectedBillingAddress, setSelectedBillingAddress)}

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleNext}
            disabled={!selectedBillingAddress || (isDelivery && !selectedShippingAddress)}
          >
            <Text style={styles.buttonPrimaryText}>Continue to Payment</Text>
          </TouchableOpacity>

          {/* CANCEL BUTTON */}
          <TouchableOpacity style={[styles.buttonPrimary, styles.cancelButton]} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel Checkout</Text>
          </TouchableOpacity>

        </View>
      );
    }

    if (currentStage === 'PAYMENT') {
      return (
        <View style={styles.stageContainer}>
          <Text style={styles.stageTitle}>Select Payment</Text>

          {paymentMethods && paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.paymentOption,
                selectedPaymentMethod === method.id && styles.paymentSelected,
              ]}
              onPress={() => setSelectedPaymentMethod(method.id)}
            >
              <Icon
                name={selectedPaymentMethod === method.id ? 'radio-checked' : 'radio-unchecked'}
                width={20}
                height={20}
                color={selectedPaymentMethod === method.id ? AppColors.primaryDark : AppColors.inactive}
              />
              <View style={styles.paymentTextContainer}>
                <Text style={styles.paymentTitle}>{method.title}</Text>
                <Text style={styles.paymentDescription}>{method.description}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.bottomActions}>
            {/* The primary button is now Place Order */}
            <TouchableOpacity
              style={[styles.buttonPrimary, styles.flex1]}
              onPress={handlePlaceOrder}
              disabled={isLoading || !selectedPaymentMethod}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Place Order ({displayPrice(cart?.totals?.total_price,cart?.totals.currency_prefix,cart?.totals.currency_minor_unit, cart?.totals.currency_decimal_separator) || '...' })</Text>
              )}
            </TouchableOpacity>
            {/* Secondary button is Back */}
            <TouchableOpacity style={[styles.buttonSecondary, styles.flexHalf]} onPress={handleBack}>
              <Text style={styles.buttonSecondaryText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (currentStage === 'CONFIRMATION' && finalOrder) {
      return (
        <View style={styles.stageContainer}>
          <Icon name="tick" width={80} height={80} style={{ alignSelf: 'center', marginBottom: 20 }}/>
          <Text style={styles.stageTitle}>Order Placed Successfully!</Text>
          <Text style={styles.confirmationText}>
            Your order has been confirmed.
          </Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultValue}>Order Number: {finalOrder.order_number}</Text>
            <Text style={styles.resultText}>Status: {finalOrder.status}</Text>
          </View>

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
          >
            <Text style={styles.buttonPrimaryText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Fallback in case of an issue
    return <ActivityIndicator size="large" color={AppColors.primaryDark} style={{marginTop: 50}}/>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStageContent()}

        {/* Generic Custom Alert Modal, receiving state from alertConfig */}
        <CustomAlertModal
          isVisible={alertConfig.isVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          // Conditionally spread onCancel if it exists (for two-button modals)
          {...(alertConfig.onCancel && { onCancel: alertConfig.onCancel })}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          type={alertConfig.type}
        />

        <PaymentWebViewModal
          isVisible={paymentWebView.isVisible}
          paymentUrl={paymentWebView.url}
          onPaymentComplete={handlePaymentCompletion}
          onModalClose={() => setPaymentWebView({ isVisible: false, url: null })}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

// --- STYLES ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // NEW: Cancel Button Styles
  cancelButton: {
    backgroundColor: AppColors.warning,
  },
  cancelButtonText: {
    color: AppColors.textWhite,
    fontSize: 18,
    fontWeight: '700',
    textDecorationLine: 'none',
  },
  stageContainer: {
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    gap: 15,
  },
  stageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
    paddingBottom: 10,
  },
  // --- Summary Styles ---
  summaryContainer: {
    padding: 15,
    backgroundColor: AppColors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderMedium,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryItemName: {
    fontSize: 14,
    color: AppColors.textDark,
  },
  summaryItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.textDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: AppColors.borderMedium,
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  summaryTotalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  // --- Address/Review Styles ---
  addressCard: {
    padding: 15,
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: AppColors.primaryLight,
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: AppColors.textMedium,
  },
  helpText: {
    fontSize: 12,
    color: AppColors.inactive,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  // --- Payment Styles ---
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: AppColors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderMedium,
    marginBottom: 10,
  },
  paymentSelected: {
    borderColor: AppColors.primaryDark,
    backgroundColor: AppColors.primaryLightest,
  },
  paymentTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  paymentDescription: {
    fontSize: 12,
    color: AppColors.textMedium,
  },
  // --- Confirmation Styles ---
  confirmationText: {
    fontSize: 16,
    color: AppColors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  resultCard: {
    padding: 20,
    backgroundColor: AppColors.backgroundLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.borderMedium,
    gap: 5,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  resultText: {
    fontSize: 16,
    color: AppColors.textMedium,
  },
  // --- General UI ---\
  buttonPrimary: {
    backgroundColor: AppColors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: AppColors.borderMedium,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSecondaryText: {
    color: AppColors.textDark,
    fontSize: 18,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  flex1: {
    flex: 1,
  },
  flexHalf: {
    // Make the "Back" button smaller than "Place Order"
    flex: 0.5,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: AppColors.dangerLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: AppColors.dangerDark,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  changeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: AppColors.primaryLight,
  },
  changeButtonText: {
    color: AppColors.primaryDark,
    fontSize: 14,
    fontWeight: '600',
  },
});
