import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, Button } from 'react-native';
import { AppColors } from '../constants/theme.ts';
import Icon from './atoms/Icon.tsx';

interface OrderSummaryCardProps {
  id: number;
  imageUri?: string;
  date: string;
  status: string;
  itemCount: number;
  currency_symbol: string;
  total: string;
  // Handler is now simply triggered by the card press
  onViewOrder: () => void;
  onOrderAgain: () => void;
}

/**
 * Renders a summary card for a past order.
 * The entire card is now a Pressable that triggers the onViewOrder action.
 */
export default function OrderSummaryCard({
                                           id,
                                           imageUri,
                                           date,
                                           status,
                                           itemCount,
                                           currency_symbol,
                                           total,
                                           onViewOrder,
                                           onOrderAgain
                                         }: OrderSummaryCardProps) {

  // Function to determine badge color based on status
  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return { backgroundColor: AppColors.backgroundOk, textColor: AppColors.textWhite };
      case 'processing':
        return { backgroundColor: AppColors.warning, textColor: AppColors.textDark };
      case 'cancelled':
        return { backgroundColor: AppColors.warning, textColor: AppColors.textWhite };
      default:
        return { backgroundColor: AppColors.borderLight, textColor: AppColors.textMedium };
    }
  };

  const statusStyle = getStatusColor(status);

  return (

    <View style={styles.cardContainer}>
      <View style={styles.dataRow}>
        {/* --- Left Column: Image --- */}
        <View style={styles.imageColumn}>
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.imageStyle}
              resizeMode="cover"
            />
          )}
          {/* Placeholder/Fallback for image - showing item count */}
          {!imageUri && (
            <Image
              source={require('../assets/images/sample-product.jpg')}
              style={styles.imageStyle}
            />
          )}

        </View>

        {/* --- Right Column: Details and Action --- */}
        <View style={styles.detailsColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.dateText}>{date}</Text>
            {/* Status Badge */}
            <View>
              <Text style={[styles.statusText]}>
                {status}
              </Text>
            </View>
          </View>

          {/* Action Button: View Order */}
          <Pressable onPress={onViewOrder}>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>View Order</Text>
            </View>
          </Pressable>

          <View style={styles.bottomRow}>
            {/* Item count and Total Price */}
            <Text style={styles.itemCount}>{itemCount} item{itemCount>1?'s':''}</Text>
            <View style={styles.bottomRowSpacer}>
              <Icon name={'ellipse'} width={4} height={4} />
            </View>
            <Text style={styles.priceText}>{currency_symbol}{total}</Text>
          </View>
        </View>
      </View>
      <View style={styles.dataRow}>
        <View style={styles.orderAgainButton}>
          <Pressable onPress={onOrderAgain}>
            <Text style={styles.orderAgainButtonText}>Order Again</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// --- STYLESHEETS ---

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundCard,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  dataRow: {
    flexDirection: 'row',
  },
  detailsColumn: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
    height: 72, // Match image column height
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textDark,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.textDark,
  },
  orderAgainButton: {
    marginTop: 12,
    backgroundColor: AppColors.primary,
    borderRadius: 40,
    width:'100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  orderAgainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textWhite,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  dateText: {
    fontSize: 14,
    color: AppColors.textDark,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: AppColors.backgroundOk,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    color: AppColors.primary,
  },
  imageColumn: {
    width: 72,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    backgroundColor: AppColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRowSpacer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  itemCount: {
    color: AppColors.textDark,
    fontSize: 14,
    fontWeight: '400',
  }
});
