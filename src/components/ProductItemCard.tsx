import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { AppColors } from '../constants/theme.ts';
import Icon from './atoms/Icon.tsx';
interface ProductCardProps {
  title: string;
  price: string;
  imageUri?: string;
  description?: string;
  layout?: 'small' | 'large'
}

/**
 * Renders a product card with a two-column layout:
 * Left: Title and Price (takes remaining space)
 * Right: 63px square image
 */
export default function ProductItemCard({
                                      title,
                                      price,
                                      imageUri,
                                          description = 'Example product description.',
                                          layout = 'small'
                                    }: ProductCardProps) {

  const isLarge = layout === 'large';

  if (isLarge) {
    return (
      <View style={stylesLarge.cardContainer}>
        {/* --- Left Column: Title and Price --- */}
        <View style={stylesLarge.detailsColumn}>
          <View style={stylesLarge.titleRow} >
            <Text style={stylesLarge.titleText} numberOfLines={2}>{title}</Text>
           <Text style={stylesLarge.priceText}>{price}</Text>
          </View>
          <View><Text>{description}</Text></View>
        </View>

        {/* --- Right Column: Image --- */}
        <View style={stylesLarge.imageColumn}>
          {imageUri && (
            <>
              <Image
                source={{ uri: imageUri }}
                style={stylesLarge.imageStyle}
              />
              <View style={styles.plusIconWrapper}>
                <Icon style={styles.plusIcon} name={'plus'} width={10} height={10} />
              </View>
            </>
          )}
          {!imageUri && (
            <>
              <Image
                source={require('../assets/images/sample-product.jpg')}
                style={stylesLarge.imageStyle}
              />
              <View style={styles.plusIconWrapper}>
                <Icon style={styles.plusIcon} name={'plus'} width={10} height={10} />
              </View>
            </>
          )}
        </View>
      </View>
    )
  }
  return (
    <View style={styles.cardContainer}>
      {/* --- Left Column: Title and Price --- */}
      <View style={styles.detailsColumn}>
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.priceText}>{price}</Text>
      </View>

      {/* --- Right Column: Image --- */}
      <View style={styles.imageColumn}>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.imageStyle}
          />
        )}
        {!imageUri && (
          <>
          <Image
            source={require('../assets/images/sample-product.jpg')}
            style={styles.imageStyle}
          />
          <View style={styles.plusIconWrapper}>
            <Icon style={styles.plusIcon} name={'plus'} width={10} height={10} />
          </View>
          </>
        )}
      </View>
    </View>
  );

}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundCard,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.borderLight,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    width:187,
    marginRight: 10
  },
  detailsColumn: {
    // Takes all available space not occupied by the image column
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 4,
    lineHeight: 15,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.textDark,
  },
  imageColumn: {
    // Fixed width/size for the image container
    width: 63,
    height: 63,
    borderRadius: 8,

    backgroundColor: AppColors.borderLight,
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  plusIconWrapper: {
    width: 17,
    height:17,
    backgroundColor: AppColors.primary,
    position: 'absolute',
    right: -8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99
  },
  plusIcon: {
    zIndex: 99
  }
});

const stylesLarge = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundDefault,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: AppColors.borderLight,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    width:'100%',
    marginRight: 10
  },
  detailsColumn: {
    // Takes all available space not occupied by the image column
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textDark,
    marginBottom: 4,
    lineHeight: 20,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.textDark,
  },
  imageColumn: {
    // Fixed width/size for the image container
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: AppColors.borderLight,
    zIndex:99
  },
  imageStyle: {
    width: '100%',
    height: '100%',
    // The image itself is 63x63 based on the parent View's fixed dimensions
  },
});

// Example Usage (for testing the component)
/*
<View style={{ padding: 20, backgroundColor: '#fff' }}>
  <ProductCard
    title="Grilled Chicken Caesar Salad"
    price="£12.50"
  />
  <ProductCard
    title="Premium Beef Burger with Fries and Cola"
    price="£18.00"
    imageUri="https://example.com/some-burger.png" // Replace with actual image URL
  />
</View>
*/
