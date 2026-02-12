import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { AppColors } from '../constants/theme.ts';
import Icon from './atoms/Icon.tsx';

interface OrderSummaryCardProps {
  id: number;
  imageUri: string;
  date: string;
  status: string;
  itemCount: number;
  total: number;
  // Handler is now simply triggered by the card press
  onViewOrder: () => void;
}

/**
 * Renders a summary card for a past order.
 * The entire card is now a Pressable that triggers the onViewOrder action.
 */
export default function OrderSummaryCardAlternative({
                                           id,
                                           imageUri,
                                           date,
                                           status,
                                           itemCount,
                                           total,
                                           onViewOrder
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
    <Pressable onPress={onViewOrder} style={styles.cardContainer}>

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
          <View style={[styles.imageStyle, styles.imagePlaceholder]}>
            <Text style={styles.itemCount}>{itemCount}</Text>
          </View>
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
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>View Order</Text>
        </View>

        <View style={styles.bottomRow}>
          {/* Item count and Total Price */}
          <Text style={styles.itemCount}>{itemCount} item{itemCount>1?'s':''}</Text>
          <View style={styles.bottomRowSpacer}>
            <Icon name={'ellipse'} width={4} height={4} />
          </View>
          <Text style={styles.priceText}>£{total.toFixed(2)}</Text>
        </View>

      </View>
    </Pressable>
  );
}

// --- STYLESHEETS ---

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
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
    color: AppColors.primary,
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
