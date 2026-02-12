import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { Business, Cart, LineItem, StoreApiCart, Address, CartTokenManager } from '../model/interfaces';
import { useApiService } from '../services/apiService';
import { CONFIG } from '../constants/config';
import { useAuthContext } from './AuthContext';
import { useBusiness } from './BusinessContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertModal from '../components/AlertModal.tsx';

const CART_TOKEN_STORAGE = '@Cart:token';

// --- INTERFACES ---

export interface BasketContextType {
  cart: StoreApiCart | null;
  isDelivery: boolean;
  total: number;
  deliveryTotal: number; // New derived value
  itemCount: number;
  isCartLoading: boolean;
  selectedShippingAddress: Address | null;
  selectedBillingAddress: Address | null;
  toggleMode: (mode: 'delivery' | 'collection') => void;
  updateBasket: (itemId: number, newQuantity: number) => void;
  reorderItems: (items: LineItem[]) => void;
  getItemQuantity: (itemId: number) => number;
  refreshCart: () => void;
  setSelectedShippingAddress: (address: Address | null) => void;
  setSelectedBillingAddress: (address: Address | null) => void;
  cartTokenManager: CartTokenManager;
  originBusiness: Business | null;
}

const defaultCartTokenManager: CartTokenManager = {
  loadCartToken: async () => null,
  saveCartToken: async () => {},
  getCartTokenValue: () => null
};

const defaultContextValue: BasketContextType = {
  cart: null,
  isDelivery: true,
  total: 0,
  deliveryTotal: 0,
  itemCount: 0,
  isCartLoading: true,
  selectedBillingAddress: null,
  selectedShippingAddress: null,
  toggleMode: () => console.log('toggleMode called without Provider'),
  updateBasket: () => console.log('updateBasket called without Provider'),
  reorderItems: () => console.log('reorderItems called without Provider'),
  getItemQuantity: () => 0,
  refreshCart: () => null,
  setSelectedShippingAddress: () => null,
  setSelectedBillingAddress: () => null,
  cartTokenManager: defaultCartTokenManager,
  originBusiness: null,
};

const BasketContext = createContext<BasketContextType>(defaultContextValue);
export const useBasketContext = () => useContext(BasketContext);

interface BasketProviderProps {
  children: ReactNode;
}
export const BasketProvider: React.FC<BasketProviderProps> = ({ children }) => {

  const [cartToken, _setCartToken] = useState<string | null>(null);
  const cartTokenRef = useRef<string | null>(cartToken);
  const [originBusiness, setOriginBusiness] = useState<Business | null>(null);

  const { activeBusiness } = useBusiness();

  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [pendingItem, setPendingItem] = useState<{id: number, qty: number} | null>(null);

  useEffect(() => {
    cartTokenRef.current = cartToken;
  }, [cartToken]);

  useEffect(() => {
    const loadOrigin = async () => {
      const savedOrigin = await AsyncStorage.getItem('@Cart:originBusiness');
      if (savedOrigin) {
        try {
          setOriginBusiness(JSON.parse(savedOrigin));
        } catch (e) {
          console.error("Failed to parse saved business object", e);
        }
      }
    };
    loadOrigin();
  }, []);

  // 3. Local Token Management Functions
  const getCartToken = useCallback((): string | null => {
    return cartTokenRef.current;
  }, []);

  const saveCartToken = useCallback(async (token: string | null) => {
    try {
      if (token) {
        await AsyncStorage.setItem(CART_TOKEN_STORAGE, token);
      } else {
        await AsyncStorage.removeItem(CART_TOKEN_STORAGE);
      }
      // Update state, which triggers the useEffect above to update the ref
      _setCartToken(token);
    } catch (e) {
      console.error('Error saving cart token in BasketContext:', e);
    }
  }, []);

  const loadCartToken = useCallback(async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem(CART_TOKEN_STORAGE);
      _setCartToken(token);
      return token;
    } catch (e) {
      console.error('Error loading cart token in BasketContext:', e);
      return null;
    }
  }, []);

  // 4. Create the Cart Token Manager object
  const cartTokenManager: CartTokenManager = useMemo(() => ({
    loadCartToken: loadCartToken,
    saveCartToken: saveCartToken,
    getCartTokenValue: getCartToken,
  }), [loadCartToken, saveCartToken, getCartToken]);

  const { getPrimaryAddress } = useAuthContext();

  const { updateShippingMethod, sendWooCommerceCartUpdate, getWooCommerceCart, clearCart, sendWooCommerceCartBatch } = useApiService(cartTokenManager);

  const [cart, setCart] = useState<Cart | null>(null);
  const [isDelivery, setIsDelivery] = useState(true);

  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitializedCart, setHasInitializedCart] = useState(false);

  const [selectedShippingAddress, setSelectedShippingAddress] = useState<Address | null>(null);
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<Address | null>(null);

  const cartRef = useRef<Cart | null>(cart);

  const mounted = useRef(true);

  // Cleanup
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    // Initialize addresses to the user's default/primary address on mount or when cart/auth context changes
    const primaryShipping = getPrimaryAddress('shipping');
    const primaryBilling = getPrimaryAddress('billing');

    // Only set if we don't have a selected address yet, to avoid overriding user choice
    if (!selectedShippingAddress && primaryShipping) {
      setSelectedShippingAddress(primaryShipping);
    }
    if (!selectedBillingAddress && primaryBilling) {
      setSelectedBillingAddress(primaryBilling);
    }

  }, [getPrimaryAddress, selectedBillingAddress, selectedShippingAddress]);

  // --- DERIVED VALUES (Memoized) ---

  const itemCount = useMemo(() => {
    return cart?.items_count ?? 0;
  }, [cart]);

  const total = useMemo(() => {
    if (!cart || !cart.totals || !cart.totals.total_price) return 0;

    // Store API totals are strings in the minor unit (e.g., "11940")
    const rawTotalPrice = cart.totals.total_price;
    const currencyMinorUnit = cart.totals.currency_minor_unit;

    if (typeof rawTotalPrice !== 'string' || isNaN(parseInt(rawTotalPrice, 10))) {
      return 0;
    }

    // Convert minor unit string to major unit number
    const divisionFactor = Math.pow(10, currencyMinorUnit);
    return parseInt(rawTotalPrice, 10) / divisionFactor;

  }, [cart]);

  const deliveryTotal = useMemo(() => {
    if (!cart || !cart.shipping_rates || !cart.totals) return 0;

    // Get factor from totals object
    const minorUnit = cart.totals.currency_minor_unit;
    const divisionFactor = Math.pow(10, minorUnit);

    // Find the selected shipping rate
    const selectedRate = cart.shipping_rates.find(rate => rate.shipping_rates[0].selected);

    if (!selectedRate || !selectedRate.shipping_rates[0].price) {
      // Fallback to total_shipping if specific rate isn't found/chosen
      const rawTotalShipping = cart.totals.total_shipping;
      if (!rawTotalShipping || isNaN(parseInt(rawTotalShipping, 10))) return 0;

      return parseInt(rawTotalShipping, 10) / divisionFactor;
    }

    // The Store API shipping rate price is typically in the minor unit (e.g., "499")
    const rawPrice = selectedRate.shipping_rates[0].price;
    if (typeof rawPrice !== 'string' || isNaN(parseInt(rawPrice, 10))) return 0;

    return parseInt(rawPrice, 10) / divisionFactor;

  }, [cart]);

  // --- Initial cart sync (Fetch cart) ---
  useEffect(() => {
    // Only run this effect once
    if (hasInitializedCart) return;

    const initializeCart = async () => {

      //Load cart token from storage
      await cartTokenManager.loadCartToken();

      //Fetch cart data (whether token exists or not)
      const initialCart: StoreApiCart = await getWooCommerceCart();
      setCart(initialCart);

      //Mark as initialized and log success
      if (mounted.current) {
        setHasInitializedCart(true);
        console.log('BasketContext: Cart initialised successfully.');
      }

    };

    // Call the initialization function immediately on mount
    initializeCart();

  }, [hasInitializedCart, cartTokenManager, getWooCommerceCart]); // hasInitializedCart prevents infinite loop

  /**
   * Core function to sync cart state with the backend.
   * TODO: This needs checking for shipping methods etc
   */
  const syncCart = useCallback(
    async (
      existingToken: string | null,
      source: string,
      endpoint: string = '',
      method: string = 'GET',
      payload: object | null = null
    ): Promise<StoreApiCart | null> => {
      if (isSyncing) {
        console.warn(`BasketContext: Sync skipped. Already syncing from ${source}.`);
        return cart; // Return current cart state
      }

      setIsSyncing(true);
      console.log(`BasketContext: Starting sync from ${source}. Token: ${existingToken}`);

      try {
        const response: StoreApiCart | null = await sendWooCommerceCartUpdate(
          endpoint,
          method,
          payload
        );

        if (mounted.current) {
          const finalCart = response || null;

          setCart(finalCart);

          // Re-evaluate shipping method after cart update, only if cart is not null
          if (finalCart && finalCart.shipping_rates) {
            // Apply default or selected shipping method based on isDelivery state
            const methodKey = isDelivery ? 'flat_rate' : 'local_pickup';
            const defaultMethod = finalCart.shipping_rates.find(rate => rate.method_id === methodKey);

            if (defaultMethod && finalCart.shipping_method !== defaultMethod.key) {
              // If the correct method is available but not selected, update it
              await updateShippingMethod(CONFIG.SHIPPING_PACKAGE_ID,
                finalCart.shipping_method);
            }
          }

        }
        return response;
      } catch (error) {
        console.error('BasketContext: Failed to sync cart.', error);
        return cart; // Return current cart to maintain UI state
      } finally {
        if (mounted.current) {
          setIsSyncing(false);
        }
      }
    },
    [isSyncing, cart, sendWooCommerceCartUpdate, isDelivery, updateShippingMethod]
  );


  // --- Actions ---

  const toggleMode = useCallback(
    async (mode: 'delivery' | 'collection') => {
      setIsDelivery(mode === 'delivery');

      if (isSyncing) return;
      setIsSyncing(true);

      try {
        const findMethod = mode === 'delivery'
          ? CONFIG.DELIVERY_METHOD_ID
          : CONFIG.COLLECTION_METHOD_ID;
        const shippingRate = cart?.shipping_rates[0].shipping_rates.find(
          s => s.method_id === findMethod,
        );

        if (shippingRate) {
          const updatedShipping: any = await updateShippingMethod(
            CONFIG.SHIPPING_PACKAGE_ID,
            shippingRate.rate_id,
          );

          //Refresh the local cart. resync with the server cart
          const updatedCart = await getWooCommerceCart();
          setCart(updatedCart);

          console.log('updatedShipping', updatedShipping);
        }
      } catch (error) {
        console.error('Failed to toggle shipping mode and recalculate:', error);
      } finally {
        setIsSyncing(false);
      }
      setIsSyncing(false);
    },
    [isSyncing]
  );

  const performBasketUpdate = async (itemId: number, newQuantity: number) => {
    setIsSyncing(true);
    const currentCart = cartRef.current;

    // Get the endpoint and payload
    const { endpoint, payload: requestPayload, method } = getCartUpdateEndpoint(
      itemId,
      newQuantity,
      currentCart
    );

    if (!endpoint) {
      setIsSyncing(false);
      return;
    }

    try {
      const updateCartResponse: any = await sendWooCommerceCartUpdate(endpoint, method, requestPayload);
      if (updateCartResponse || method === 'DELETE') {
        const updatedCart = await getWooCommerceCart();
        setCart(updatedCart);

        // Logic to clear origin if basket is now empty
        if (updatedCart.items_count === 0) {
          setOriginBusiness(null);
          await AsyncStorage.removeItem('@Cart:originBusiness');
        }
      }
    } catch (error) {
      console.error('Cart update failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateBasket = useCallback(
    async (itemId: number, newQuantity: number) => {
      if (isSyncing) return;

      // 1. Check for Conflict (Different Business)
      if (newQuantity > 0 && itemCount > 0) {
        if (originBusiness && originBusiness.id !== activeBusiness?.id) {
          setPendingItem({ id: itemId, qty: newQuantity });
          setConflictModalVisible(true);
          return;
        }
      }

      // 2. Set Origin for the FIRST item added
      if (newQuantity > 0 && itemCount === 0) {
        if (activeBusiness) {
          setOriginBusiness(activeBusiness);
          await AsyncStorage.setItem('@Cart:originBusiness', JSON.stringify(activeBusiness));
        }
      }

      await performBasketUpdate(itemId, newQuantity);
    },
    [activeBusiness, originBusiness, itemCount, isSyncing]
  );

  const handleClearAndAdd = async () => {
    if (!pendingItem) return;

    const itemToProcess = { ...pendingItem };
    setPendingItem(null);
    setConflictModalVisible(false);

    setIsSyncing(true);
    try {
      // Clear Server Cart
      await clearCart();
      setCart(null);

      // Set New Origin
      if (activeBusiness) {
        setOriginBusiness(activeBusiness);
        await AsyncStorage.setItem('@Cart:originBusiness', JSON.stringify(activeBusiness));
      }

      // Add the new item
      await performBasketUpdate(itemToProcess.id, itemToProcess.qty);
    } catch (error) {
      console.error("Conflict resolution failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  //New Method to use Batch method
  const reorderItems = useCallback(
    async (items: LineItem[]) => {
      if (isSyncing) return;
      setIsSyncing(true);

      try {
        // Clear the current cart (Must be awaited)
        console.log('Clearing current cart before batch reorder...');
        await clearCart();

        const currentCartToken = cartTokenManager?.getCartTokenValue();

        if (items.length === 0) {
          // If no items, stop here and fetch the empty cart
          const emptyCart = await getWooCommerceCart();
          setCart(emptyCart);
          return;
        }

        // Build the array of batched requests
        console.log(`Building batch request to add ${items.length} items.`);

        const batchRequests = items.map(item => {
          const requestBody: { id: number; quantity: number; variation?: any[] } = {
            id: item.product_id,
            quantity: item.quantity,
          };

          // // Include variation data if it exists
          // if (item.variation && item.variation.length > 0) {
          //   requestBody.variation = item.variation;
          // }

          // NOTE: The Cart-Token must be included in the main batch request headers (handled by request function).
          // Individual requests within the batch DO NOT need a cart token header, but adding 'cache: "no-store"' is good practice.
          return {
            path: '/wc/store/v1/cart/add-item',
            method: 'POST',
            cache: 'no-store',
            body: requestBody,
            headers: {'Cart-Token':currentCartToken}
          };
        });

        // 3. Send the single batch request
        const batchPayload = {
          requests: batchRequests,
        };

        // Call the new batch function
        const batchResponse = await sendWooCommerceCartBatch(batchPayload);

        // Check for errors in the batch response
        const failedRequests = batchResponse.responses?.filter((res: any) => res.status >= 400) || [];

        if (failedRequests.length > 0) {
          throw new Error(`Batch request completed with ${failedRequests.length} failures.`);
        }

        console.log('Batch addition completed successfully.');

        // Final single call to get the complete, updated cart state
        const updatedCart = await getWooCommerceCart();
        setCart(updatedCart);

      } catch (error) {
        console.error('Failed to perform batch reorder:', error);
        // Fallback: Resync on error
        const resyncCart = await getWooCommerceCart();
        setCart(resyncCart);
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, clearCart, sendWooCommerceCartBatch, getWooCommerceCart]
  );

  //New Method to call server side custom API endpoint to process the cart items from the old order
  // const reorderItems = useCallback(
  //   async (orderId: number) => {
  //     if (isSyncing) return;
  //     setIsSyncing(true);
  //
  //     try {
  //       console.log(`Sending reorder request for Order ID: ${orderId}`);
  //
  //       const finalCart: StoreApiCart = await reorder(orderId);
  //
  //       // Update the local cart state with the response
  //       if (finalCart) {
  //         setCart(finalCart);
  //         console.log('Reorder complete. Cart updated from server response.');
  //       } else {
  //         // Handle cases where server returned 200 but cart object was null/empty unexpectedly
  //         const emptyCart = await getWooCommerceCart();
  //         setCart(emptyCart);
  //       }
  //
  //     } catch (error) {
  //       console.error('Failed to reorder items via custom endpoint:', error);
  //       // Fallback: Resync on error
  //       const resyncCart = await getWooCommerceCart();
  //       setCart(resyncCart);
  //     } finally {
  //       setIsSyncing(false);
  //     }
  //   },
  //   [isSyncing, reorder, getWooCommerceCart]
  // );

  // OLD Method using individual calls per line item
  // const reorderItems = useCallback(
  //   async (items: LineItem[]) => {
  //     if (isSyncing) return;
  //     setIsSyncing(true);
  //
  //     try {
  //       // Clear the current cart before adding old items
  //       // The Store API uses /cart/items (DELETE) to clear the cart
  //       console.log('Clearing current cart before reorder...');
  //       await clearCart();
  //
  //       // Sequentially add items from the previous order
  //       let finalCart: Cart | null = null;
  //
  //       for (const item of items) {
  //         const payload = {
  //           id: item.product_id,
  //           quantity: item.quantity,
  //         };
  //
  //         // Call the single-item add endpoint
  //         // The response (finalCart) updates with each loop iteration
  //         finalCart = await sendWooCommerceCartUpdate('/cart/items',{method: 'POST', data: payload});
  //
  //         console.log(`Added item ${item.name}.`);
  //       }
  //
  //       // Check that we have a response
  //       if (finalCart) {
  //         //Get the new updated cart
  //         const updatedCart = await getWooCommerceCart();
  //         setCart(updatedCart);
  //         console.log('Reorder complete. Cart updated.');
  //       } else {
  //         // If the items array was empty, just fetch the new empty cart
  //         const emptyCart = await getWooCommerceCart();
  //         setCart(emptyCart);
  //       }
  //
  //     } catch (error) {
  //       console.error('Failed to reorder items:', error);
  //       // Fallback: Resync on error
  //       const resyncCart = await getWooCommerceCart();
  //       setCart(resyncCart);
  //     } finally {
  //       setIsSyncing(false);
  //     }
  //   },
  //   [isSyncing] // Add isSyncing as a dependency
  // );

  const getItemQuantity = useCallback(
    (itemId: number): number => {
      if (!cart || !cart.items) return 0;

      // Find the item by product ID
      const item = cart.items.find((i) => i.id === itemId);

      // Store API LineItem has 'quantity' as a number directly
      return item?.quantity ?? 0;
    },
    [cart]
  );

  const refreshCart = useCallback(async (): Promise<void> => {

    setCart(null);
    _setCartToken(null);
    const initialCart: StoreApiCart = await getWooCommerceCart();
    setCart(initialCart);

    return;

  }, []);

  // --- Context Value ---
  const contextValue = useMemo(() => ({
    cart,
    isDelivery,
    total,
    deliveryTotal,
    itemCount,
    selectedShippingAddress,
    selectedBillingAddress,
    toggleMode,
    updateBasket,
    reorderItems,
    getItemQuantity,
    refreshCart,
    setSelectedShippingAddress,
    setSelectedBillingAddress,
    cartTokenManager,
    originBusiness
  }), [cart, isDelivery, total, deliveryTotal, itemCount, selectedShippingAddress, selectedBillingAddress, toggleMode, updateBasket, reorderItems, getItemQuantity, refreshCart, cartTokenManager, originBusiness ]);

  return (
    <BasketContext.Provider value={contextValue}>
      {children}

      <AlertModal
        isVisible={conflictModalVisible}
        type="warning"
        title="Start a new basket?"
        message={`Your basket contains items from ${originBusiness?.name}. Would you like to clear it and add this item from ${activeBusiness?.name} instead?`}
        confirmText="Clear & Add"
        cancelText="Keep Existing"
        onConfirm={handleClearAndAdd}
        onCancel={() => {
          setConflictModalVisible(false);
          setPendingItem(null);
        }}
      />

    </BasketContext.Provider>
  );
};

// --- Helpers ---

interface StoreApiUpdatePayload {
  endpoint: string;
  payload: object;
  method: 'POST' | 'PUT' | 'DELETE';
}

/**
 * Determines the correct Store API endpoint, payload, and method for cart updates.
 * Store API Endpoints: /cart/add-item (POST), /cart/items/{key} (POST to update), /cart/items/{key} (DELETE)
 */
const getCartUpdateEndpoint = (
  itemId: number,
  newQuantity: number,
  currentCart: StoreApiCart | null
): StoreApiUpdatePayload => {
  if (!currentCart) {
    // 1. Add Item (No cart session exists yet)
    return {
      endpoint: '/cart/items',
      payload: { id: itemId.toString(), quantity: newQuantity },
      method: 'POST'
    };
  }

  // Find the existing item by product ID. Store API items are an array.
  const existingItem = currentCart.items.find((i) => i.id === itemId);

  // Delete Item (Quantity <= 0 and item exists)
  if (newQuantity <= 0 && existingItem) {
    // Store API uses the item key in the URL for deletion
    return {
      endpoint: `/cart/items/${existingItem.key}`,
      payload: {}, // No body for DELETE
      method: 'DELETE'
    };
  }

  // Update Item (Quantity > 0 and item exists)
  if (existingItem) {
    // Store API uses POST to update quantity by key
    return {
      endpoint: `/cart/items/${existingItem.key}`,
      payload: { quantity: newQuantity },
      method: 'PUT'
    };
  }

  // Add Item (Quantity > 0 and item does NOT exist)
  if (newQuantity > 0 && !existingItem) {
    return {
      endpoint: '/cart/add-item',
      payload: { id: itemId.toString(), quantity: newQuantity },
      method: 'POST'
    };
  }

  // No action
  return { endpoint: '', payload: {}, method: 'POST' };
};