import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Order, Orders } from '../model/interfaces';
import { useApiService } from '../services/apiService';
import { useAuthContext } from '../context/AuthContext';
import { useCustomerContext } from '../context/CustomerContext';

import { AppColors } from '../constants/theme';
import OrderSummaryCard from '../components/OrderSummaryCard';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { useBasketContext } from '../context/BasketContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ReorderScreen: React.FC = () => (
  <ReorderScreenContent />
);

/**
 * Screen 2: Order
 */
export const ReorderScreenContent: React.FC = () => {

  const { user, userId,orders, } = useAuthContext();
  // const { getOrders } = useApiService();
  const { reorderItems } = useBasketContext();
  // const [orders, setOrders] = useState<Order[]>([]);
  // const [ordersLoading, setOrdersLoading] = useState(true);
  // const ordersLoading = ordersLoadingContext;

  const [error, setError] = useState<string | null>(null);

  // State to control modal visibility
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  // State to hold the order data passed to the modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleCloseOrderModal = () => {
    setSelectedOrder(null);
    setIsOrderModalVisible(false);
  }

  // Updated handler to accept the full order object
  const handleOpenOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalVisible(true);
  }

  const handleReorder = (order: Order) => {

    if (order.line_items) {
      // Use the consolidated reorder logic from the context
      reorderItems(order.line_items);
      // Notify the user
      Alert.alert(
        "Items Added!",
        `Order #${order.id} items have been added to your basket.`
      );
    }
  };

  // useEffect(() => {
  //   setOrdersLoading(true);
  //   setError(null);
  //
  //   const loadOrders = async () => {
  //     try {
  //       // --- THIS IS THE KEY CHANGE: Calling the external service method ---
  //       if(userId){
  //         const orderData: Order[] = await getOrders();
  //
  //         // Data structure is { success, orders }
  //         if (orderData && orderData.length > 0) {
  //           setOrders(orderData);
  //         } else {
  //           setError('Failed to load orders.');
  //         }
  //       }
  //     } catch (e) {
  //       console.error('Error loading orders:', e);
  //       setError('An unexpected error occurred while fetching orders.');
  //     } finally {
  //       setOrdersLoading(false);
  //     }
  //   };
  //
  //   loadOrders();
  // }, [getOrders, userId]);

  const renderOrderList = () => {
    // if (ordersLoading) {
    //   return (
    //     <View style={orderStyles.loadingContainer}>
    //       <ActivityIndicator size="large" color={AppColors.primary} />
    //       <Text style={{ marginTop: 10, color: AppColors.textDark }}>Loading previous orders...</Text>
    //     </View>
    //   );
    // }

    if (error) {
      return (
        <View style={orderStyles.errorContainer}>
          <Text style={{ color: AppColors.warning }}>Error: {error}</Text>
        </View>
      );
    }

    // if(!userId){
    //   return (
    //     <View style={orderStyles.emptyContainer}>
    //       <Text style={{ color: AppColors.textDark }}>Login to view previous orders</Text>
    //     </View>
    //   )
    // }

    if (orders.length === 0) {
      return (
        <View style={orderStyles.emptyContainer}>
          <Text style={{ color: AppColors.textDark }}>You have no previous orders.</Text>
        </View>
      );
    }

    return (
      <View style={orderStyles.contentContainer}>
        {orders.map((order) => {
          // Calculate item count
          const itemCount = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <OrderSummaryCard
              key={order.id}
              id={order.id}
              // NOTE: imageUri is hardcoded/mocked for now, pending API integration
              // imageUri={}
              date={new Date(order.date_created).toLocaleDateString()}
              status={order.status}
              itemCount={itemCount}
              currency_symbol={order.currency_symbol}
              total={order.total}
              // Pass the full order object to the handler
              onViewOrder={() => handleOpenOrderDetails(order)}
              onOrderAgain={() => handleReorder(order)}
            />
          );
        })}
      </View>
    );
  };


  return (
    <SafeAreaView style={orderStyles.safeAreaViewContainer} edges={['top']}>
      <ScrollView contentContainerStyle={orderStyles.mainWrapper} style={orderStyles.scrollView}>
        <View style={{ width: '90%', maxWidth: 600 }}>
          <Text style={orderStyles.headerTitle}>Orders</Text>
          {renderOrderList()}
        </View>
      </ScrollView>

      {/* --- Order Detail Modal --- */}
      <OrderDetailModal
        isVisible={isOrderModalVisible}
        onClose={handleCloseOrderModal}
        // Pass the selected order data to the modal
        order={selectedOrder}
      />
    </SafeAreaView>
  );
};

// --- STYLESHEETS ---

const orderStyles = StyleSheet.create({
  safeAreaViewContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault
  },
  scrollView: {
    flex: 1,
  },
  mainWrapper: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.textDark,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: AppColors.textMedium,
    marginBottom: 20,
  },
  contentContainer: {
    gap: 12,
    width: '100%',
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  errorContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: 'center',
    padding: 20,
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 8,
  }
});
