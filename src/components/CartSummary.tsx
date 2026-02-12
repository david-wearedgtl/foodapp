import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StoreApiCart, displayPrice } from '../model/interfaces'; // Assuming model/interfaces exports StoreApiCart
import { AppColors } from '../constants/theme';
import { useBasketContext } from '../context/BasketContext.tsx'; // Assuming constants/theme exports AppColors

interface CartOrderSummaryProps {
  cartData: StoreApiCart;
}

/**
 * Renders a detailed, read-only summary of the cart contents and totals
 * suitable for the Checkout Review screen.
 */
const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({ cartData }) => {

  const { isDelivery } = useBasketContext();

  // Helper to render generic summary rows (Subtotal, Shipping, Total)
  const renderSummaryRow = (label: string, value: string, isTotal = false) => (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryItemName, isTotal && styles.summaryTotalLabel]}>{label}</Text>
      {/* Price values are expected to be formatted strings (e.g., "$10.00") from the API */}
      <Text style={[styles.summaryItemPrice, isTotal && styles.summaryTotalPrice]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Order Summary</Text>

      {/* 1. Itemized List */}
      {cartData.items.map(item => (
        <View key={item.key} style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>
            {item.quantity} x {item.name}
          </Text>
          {/* Item total is retrieved from the line item totals object */}
          <Text style={styles.summaryItemPrice}>
            {displayPrice(item.totals.line_total,item.totals.currency_prefix, item.totals.currency_minor_unit, item.totals.currency_decimal_separator)}
          </Text>
        </View>
      ))}

      <View style={styles.summaryDivider} />

      {/* 2. Totals Rows */}
      {renderSummaryRow('Subtotal:', displayPrice(cartData.totals.total_items,cartData.totals.currency_prefix, cartData.totals.currency_minor_unit, cartData.totals.currency_decimal_separator))}

      {/* Shipping Row - Uses the first rate's name for context */}
      {isDelivery && cartData && renderSummaryRow(
        `Shipping (${cartData.shipping_rates[0]?.name || 'N/A'}):`,
        displayPrice(cartData.totals.total_shipping,cartData.totals.currency_prefix, cartData.totals.currency_minor_unit, cartData.totals.currency_decimal_separator)
      )}

      <View style={styles.summaryDivider} />

      {/* 3. Grand Total */}
      {renderSummaryRow('Total:', displayPrice(cartData.totals.total_price,cartData.totals.currency_prefix, cartData.totals.currency_minor_unit, cartData.totals.currency_decimal_separator), true)}

    </View>
  );
};

// --- STYLES (Moved from CheckoutScreen/inline function) ---
const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 12,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: AppColors.borderMedium,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: AppColors.textDark,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderLight,
    paddingBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryItemName: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textMedium,
  },
  summaryItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: AppColors.textLight,
    marginVertical: 10,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  summaryTotalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.primaryDark,
  },
});

export default CartOrderSummary;
