import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  Alert, // Use Alert for temporary action
} from 'react-native';
import Icon from './atoms/Icon';
import { AppColors } from '../constants/theme';
import { Order, LineItem } from '../model/interfaces';
import Button from './atoms/Button.tsx';
import { useBasketContext } from '../context/BasketContext';


interface OrderDetailModalProps {
  isVisible: boolean;
  onClose: () => void;
  // Now accepts the specific order to display (can be null if not set)
  order: Order | null;
}

/**
 * Renders a modal that slides up to show the details of a single past order.
 */
export function OrderDetailModal({
                                   isVisible,
                                   onClose,
                                   order
                                 }: OrderDetailModalProps) {

  const { reorderItems } = useBasketContext();

  // If no order is selected, render a minimal modal or return null
  if (!order) {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <View style={styles.modalContent}>
            <Text style={{ textAlign: 'center', paddingVertical: 20 }}>No order selected.</Text>
            <Button title="Close" onPress={onClose} />
          </View>
        </Pressable>
      </Modal>
    );
  }

  // --- ACTIONS ---
  const handleOrderAgain = () => {
    // 1. Pass the line items to the Basket Context's new reorder function
    reorderItems(order.line_items);

    // 2. Provide user feedback and close the modal
    // NOTE: In a production app, replace RN Alert with a non-blocking Toast/Snackbar UI element
    Alert.alert(
      "Re-ordered!",
      `${order.line_items.length} items from Order #${order.id} have been added to your basket.`,
      [{ text: "OK", onPress: onClose }]
    );
  };

  const handleProblem = () => {
    // Implementation: Start a support process or contact form.
    Alert.alert(
      "Report Problem",
      `We recognize the issue with Order #${order.id}. This action would start the support process.`
    );
  };

  // --- DATA EXTRACTION ---
  const orderDate = new Date(order.date_created).toLocaleDateString();
  // const orderTime = new Date(order.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  // const totalItems = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

  // Find the custom delivery/collection meta data
  const deliveryTimeMeta = order.meta_data.find(meta => meta.key === '_delivery_time');
  // const deliveryTypeMeta = order.meta_data.find(meta => meta.key === '_delivery_type');

  const deliveryTime = deliveryTimeMeta?.value || 'N/A';
  // const deliveryType = deliveryTypeMeta?.value || 'N/A';

  // Calculate totals
  const shippingTotal = order.shipping_lines.length > 0 ? parseFloat(order.shipping_lines[0].total.toString()) : 0;
  const grandTotal = parseFloat(order.total.toString());
  const subtotalValue = grandTotal - shippingTotal;


  // --- RENDER FUNCTIONS ---
  const renderLineItem = ({ item }: { item: LineItem }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemQuantity}>{item.quantity} x </Text>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemPrice}>£{parseFloat(item.totals.line_subtotal.toString()).toFixed(2)}</Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={() => { /* Keep the modal open */ }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.title}>
              <Text style={styles.statusText}>Order {order.status} {orderDate}</Text>
              <Text style={styles.statusTime}>{deliveryTime}</Text>
            </View>

              { ((order.status==='delivered') || order.status==='collected') && (
                <>
                  <View style={[styles.statusIconWrapper, styles.statusTick]}>
                    <Icon name={'tick'} width={24} height={24} />
                  </View>
                </>
              ) }
              { ((order.status!=='delivered') && order.status!=='collected') && (
                <>
                  <View style={[styles.statusIconWrapper, styles.statusX]}>
                    <Icon name={'x'} width={24} height={24} />
                  </View>
                </>
              ) }

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon name={'x'} width={21} height={21}/>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent}>

            {/* Line Items List */}
            <FlatList
              data={order.line_items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderLineItem}
              scrollEnabled={false} // Let the parent ScrollView handle scrolling
              contentContainerStyle={styles.listContainer}
            />

            {/* Totals Breakdown */}
            <View style={styles.totalsContainer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValueSmall}>£{subtotalValue.toFixed(2)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery / Service Fee</Text>
                <Text style={styles.totalValueSmall}>£{shippingTotal.toFixed(2)}</Text>
              </View>
              {/* Grand Total */}
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.totalLabelGrand}>Total</Text>
                <Text style={styles.totalValueGrand}>£{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Spacer for bottom buttons */}
            <View style={{ height: 100 }} />

          </ScrollView>

          {/* Fixed Footer for Actions */}
          <View style={styles.footer}>
            <Button
              title="Order Again"
              onPress={handleOrderAgain}
              style={{ marginBottom: 10 }}
            />
            <Button
              title="Report Order Problem"
              onPress={handleProblem}
              variant="outline"
            />
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- STYLESHEETS ---

// @ts-ignore
// @ts-ignore
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: AppColors.backgroundDefault,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    position: 'relative',
  },
  statusIconWrapper: {
    width:46,
    height:46,
    borderRadius: '50%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusTick: {
    backgroundColor: AppColors.backgroundOk
  },
  statusX: {
    backgroundColor: AppColors.warning
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  statusText: {
    fontSize: 14,
    fontWeight:600
  },
  statusTime: {
    fontSize:32,
    fontWeight: 600
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -38,
    width: 38,
    height:38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
    borderRadius:'50%'
  },
  scrollContent: {
    paddingTop: 10,
  },
  // Summary Block
  summaryCard: {
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 10,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: AppColors.textMedium,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: AppColors.textDark,
    fontWeight: '600',
  },
  summaryValueStatus: (status: string) => ({
    fontSize: 14,
    fontWeight: '700',
    color: status.toLowerCase() === 'delivered' ? AppColors.backgroundOk : AppColors.warning,
  }),
  // List Styles
  listHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 10,
  },
  listContainer: {
    marginBottom: 20,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.backgroundCard,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textDark,
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.textDark,
  },
  // Totals
  totalsContainer: {
    paddingTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: AppColors.textMedium,
  },
  totalLabelGrand: {
    fontSize: 23,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  totalValueSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  grandTotalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: AppColors.borderLight,
  },
  totalValueGrand: {
    fontSize: 23,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  // Footer with fixed buttons
  footer: {

    bottom: 0,
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: AppColors.backgroundDefault,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderLight,
  },

});
