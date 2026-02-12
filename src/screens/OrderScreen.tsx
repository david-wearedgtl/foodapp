// OrderScreen.tsx (edited)
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Pressable
} from 'react-native';
import ProductItemCard from '../components/ProductItemCard';
import { useProductContext } from '../context/ProductContext';
import { useBasketContext } from '../context/BasketContext';
import { useBusiness } from '../context/BusinessContext';
import DeliveryCollectionToggle from '../components/DeliveryCollectionToggle';
import CategorySlider from '../components/CategorySlider';
import { BasketModal } from '../components/BasketModal';
import { AppColors } from '../constants/theme';
import Icon from '../components/atoms/Icon';
import type { Product } from '../model/interfaces';
import { cleanHtml } from '../components/utlities.ts';
import { SafeAreaView } from 'react-native-safe-area-context';

/* -------- ProductList moved to module scope and memoized -------- */
type ProductListProps = {
  products: Product[];
  onPress: (id: number) => void;
};
const ProductList: React.FC<ProductListProps> = React.memo(({ products, onPress }) => {
  return (
    <View style={productStyles.contentContainer}>
      {products.map((product) => (
        <Pressable key={product.id} onPress={() => onPress(product.id)}>
          <ProductItemCard
            layout="large"
            title={product.name}
            price={product.price}
            description={cleanHtml(product.description)}
            imageUri={product.images?.length ? product.images[0].thumbnail : ''}
          />
        </Pressable>
      ))}
    </View>
  );
});

/* -------- Screen components -------- */
export const OrderScreen: React.FC = () => (
  <OrderScreenContent />
);

export const OrderScreenContent: React.FC = () => {
  const { itemCount, updateBasket, getItemQuantity } = useBasketContext();
  const [isBasketVisible, setIsBasketVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const { activeBusiness } = useBusiness();
  const fallbackImage = require('../assets/images/home.jpg');
  const {
    products: allProducts,
    productsLoading: productsLoadingContext,
    productsError: productsErrorContext,
  } = useProductContext();

  // Optional: concise render debug (only counts renders, not full objects)
  const renderCountRef = React.useRef(0);
  renderCountRef.current++;
  console.log(
    `OrderScreen render #${renderCountRef.current} — products:${allProducts.length} itemCount:${itemCount} selectedCategory:${selectedCategoryId}`
  );

  // Filtered products (stable because allProducts from ProductContext is now stable)
  const filteredProducts = React.useMemo(() => {
    if (productsLoadingContext || allProducts.length === 0) return [];

    if (selectedCategoryId === null) return allProducts;

    return allProducts.filter((product) =>
      product.categories?.some((c) => c.id === selectedCategoryId)
    );
  }, [allProducts, productsLoadingContext, selectedCategoryId]);

  // stable handlers
  const handleOpenBasket = useCallback(() => setIsBasketVisible(true), []);
  const handleCloseBasket = useCallback(() => setIsBasketVisible(false), []);

  const handleAddOrUpdateItem = useCallback((productId: number) => {
    const currentQty = getItemQuantity(productId);
    updateBasket(productId, currentQty + 1);
  }, [getItemQuantity, updateBasket]);

  const handleCategorySelected = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const popularProducts = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) {
      return [];
    }

    const TARGET_CATEGORY_ID = 20;

    const filteredPopularProducts = allProducts.filter((p, index) => {

      // Check if the product has categories ---
      if (!p.categories || p.categories.length === 0) {
        return false;
      }

      //Check for the target category ID in the categories array ---
      return p.categories.some((c) => {
        const categoryId = c.id;

        return String(categoryId) === String(TARGET_CATEGORY_ID);
      });

    });

    return filteredPopularProducts.slice(0, 5);
  }, [allProducts]);

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name={'search'} width={23} height={23} />
        <View style={styles.toggleContainer}><DeliveryCollectionToggle layout={'large'} /></View>
        <View>
          <Pressable onPress={handleOpenBasket}>
            <Icon name={'basket-dark'} width={23} height={23} />
          </Pressable>
          <View style={styles.basketSmallItemCount}>
            <Text style={styles.itemCount}>{itemCount}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={activeBusiness?.cover_image ? { uri: activeBusiness.cover_image } : fallbackImage}
            style={styles.imageStyle}
            resizeMode="cover"
          />

          {activeBusiness?.logo ? (
            <Image
              source={{ uri: activeBusiness.logo }}
              style={styles.imageOverlay}
              resizeMode={'contain'}
            />
          ) : (
            <>
              {/* Dark overlay that matches the image dimensions */}
              <View style={styles.darkOverlay} />
              <Text style={styles.textOverlay}>{activeBusiness?.name}</Text>
            </>
          )}

        </View>

        {/* Popular */}
        <View>
          <Text style={styles.title}>Popular</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={carouselStyles.scrollView}>
            {popularProducts.map((product:Product) => (
              <View key={product.id}>
                <Pressable onPress={() => handleAddOrUpdateItem(product.id)}>
                  <ProductItemCard
                    title={product.name}
                    price={product.price}
                    imageUri={product.images?.length ? product.images[0].thumbnail : ''}
                    description={cleanHtml(product.description)}
                    layout={'small'}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <CategorySlider onCategorySelect={handleCategorySelected} selectedCategoryId={selectedCategoryId} />
        </View>

        {/* Products */}
        <View>
          {productsLoadingContext && (
            <View style={[productStyles.loadingContainer]}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={productStyles.secondaryText}>Loading products...</Text>
            </View>
          )}

          {!productsLoadingContext && allProducts.length === 0 && (
            <View style={[productStyles.noDataContainer]}>
              <Text style={productStyles.secondaryText}>No products found</Text>
            </View>
          )}

          {!productsLoadingContext && filteredProducts.length === 0 && allProducts.length > 0 && (
            <View style={[productStyles.noDataContainer]}>
              <Text style={productStyles.secondaryText}>No products found in this category</Text>
            </View>
          )}

          {!productsLoadingContext && filteredProducts.length > 0 && (
            <ProductList products={filteredProducts} onPress={handleAddOrUpdateItem} />
          )}
        </View>
      </ScrollView>

      <View style={styles.basketFloatWrapper}>
        <Pressable onPress={handleOpenBasket}><Icon name={'basket-light'} width={35} height={35} /></Pressable>
        <View style={styles.basketItemCount}><Text style={styles.itemCount}>{itemCount}</Text></View>
      </View>

      <BasketModal isVisible={isBasketVisible} onClose={handleCloseBasket} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    width:'100%'
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundDefault,
    borderRadius: 16,
    padding: 24,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: AppColors.backgroundDefault,
    alignItems: 'center',
    justifyContent: 'space-between',
    // position: 'absolute',
    marginHorizontal:0,
    paddingHorizontal:16,
    // top: 0,
    // left: 0,
    // right: 0,
    zIndex: 10,
  },
  toggleContainer: {
    width: '80%',
  },
  imageContainer: {
    marginBottom: 20,
    marginHorizontal: 0,
    // Ensure the container clips the overlay to the same border radius as the image
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageStyle: {
    width: '100%',
    height: 165,
  },
  darkOverlay: {
    // Fill the entire parent container
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)', // Black with 40% opacity
  },
  imageOverlay: {
    position: 'absolute',
    width: 150,
    height: 80,
  },
  textOverlay: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 20,
    // Optional: adds extra legibility
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textDark,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.inactive,
    marginBottom: 20,
  },
  content: {
    fontSize: 18,
    color: AppColors.textDark,
    lineHeight: 28,
  },
  categoryContainer: {
    backgroundColor: AppColors.primary,
    marginHorizontal: -24,
    paddingVertical: 14,
  },
  basketFloatWrapper: {
    position: 'absolute',
    width:50,
    height:50,
    backgroundColor: AppColors.primary,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    // Positioning above the 110px footer + 20px margin
    bottom: 0,
    right:16,

    // Centering the 50px wide button horizontally
    zIndex: 50, // Highest zIndex to ensure visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  basketItemCount: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: AppColors.backgroundCard,
    height: 14.5,
    width:14.5,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius:'50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketSmallItemCount:{
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: AppColors.backgroundCard,
    height: 14.5,
    width:14.5,
    borderRadius:'50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCount: {
    color: AppColors.primary,
    fontSize:6,
    fontWeight:600
  }
});

const carouselStyles = StyleSheet.create({
  scrollView: {
    // Style for the ScrollView itself (optional)
    marginTop: 10,
    marginBottom: 20,
    gap:8
  }
});

const productStyles = StyleSheet.create({
  mainWrapper: {
    // Wrapper for the entire component's UI, centered
    alignItems: 'center',
    paddingVertical: 20,
  },
  contentContainer: {
    marginTop:20,
    gap:20
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'left',
  },
  resultCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#0EA5E9',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginTop: 5,
  },
  resultValue: {
    fontWeight: '700',
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#B91C1C',
    fontWeight: '600',
  },
  noDataContainer: {
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
  },
  secondaryText: {
    marginTop: 5,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  userIdText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 10,
  }
});
