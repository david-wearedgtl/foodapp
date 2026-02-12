import Icon from './Icon.tsx';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import React from 'react';
import { AppColors } from '../../constants/theme.ts';

interface QuantitySelectorProps {
  quantity: number;
  onUpdateQuantity: (newQuantity: number) => void;
}


/**
 * A generic component to render an SVG icon dynamically.
 */
const QuantitySelector: React.FC<QuantitySelectorProps> = ({
                                     quantity,
                                     onUpdateQuantity
                                   }) => {

  // Handler for decreasing quantity
  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(quantity - 1);
    }
  };

  // Handler for increasing quantity
  const handleIncrement = () => {
    onUpdateQuantity(quantity + 1);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handleDecrement}>
        <Icon name={'minus'} width={10} height={10} />
      </Pressable>
      <Text style={[styles.quantity, styles.bold]}>{quantity}</Text>
      <Pressable onPress={handleIncrement}>
        <Icon name={'plus'} width={10} height={10} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  quantity: {
    color: AppColors.textWhite,
    marginHorizontal: 8,
    fontSize:14,
    fontWeight: 600
  },
  qtyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bold: {
    fontWeight: '600',
  }
})

export default QuantitySelector;