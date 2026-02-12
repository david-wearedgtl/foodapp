import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react';
import { Product } from '../model/interfaces';
import { useApiService } from '../services/apiService';
import { useBasketContext} from './BasketContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useBusiness } from './BusinessContext.tsx';

// --- CONSTANTS ---
let BUSINESS_CACHE_KEY = '@ProductCache:data';
const CACHE_TIMESTAMP_KEY = '@ProductCache:timestamp';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// --- TYPES & CONTEXT ---

// Internal state structure (for use in useState)
interface ProductState {
  products: Product[];
  productsLoading: boolean;
  productsError: string | null;
}

// Exported Context Type (remains the same for external consumers)
export interface ProductContextType extends ProductState {
  getProductById: (id: number) => Product | undefined;
}

const initialProductState: ProductState = {
  products: [],
  productsLoading: true,
  productsError: null,
};

const initialContextValue: ProductContextType = {
  ...initialProductState,
  getProductById: () => undefined,
};

const ProductContext = createContext<ProductContextType>(initialContextValue);
export const useProductContext = () => useContext(ProductContext);

// --- UTILITY FUNCTION ---
/**
 * Compares two product arrays for content equality based on length and item ID sequence.
 */
const areProductsEqual = (arr1: Product[], arr2: Product[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  if (arr1.length === 0) return true; // Both empty
  return arr1.every((product, index) => product.id === arr2[index].id);
};

// --- PROVIDER COMPONENT ---

interface ProductProviderProps {
  children: ReactNode;
}

export const ProductProvider: React.FC<ProductProviderProps> = ({ children }) => {

  const { cartTokenManager } = useBasketContext();
  const { activeBusiness } = useBusiness();
  const { getProducts } = useApiService(cartTokenManager);
  // State is now unified into a single object
  const [state, setState] = useState<ProductState>(initialProductState);

  const backgroundFetchStartedRef = useRef(false);
  const mounted = useRef(true);
  const lastLoadedBusinessId = useRef<number | null>(null);

  // Ref to track if we've completed the first successful load (for logging)
  const isLoadedRef = useRef(false);

  // Clean up effect
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  /**
   * Fetches product data from the API and updates state and cache.
   * @param isBackgroundRefresh - If true, treats the operation as a quiet background update.
   */
  const fetchProductsAndCache = useCallback(async (isBackgroundRefresh: boolean = false) => {

    // Set error to null *before* the API call starts
    if (state.productsError) {
      setState(prev => ({ ...prev, productsError: null }));
    }

    // Only set loading state explicitly if it's a foreground/manual refresh,
    // or if the state is currently NOT loading and we are about to refresh.
    if (!isBackgroundRefresh && !state.productsLoading) {
      setState(prev => ({ ...prev, productsLoading: true, productsError: null }));
    }

    try {
      const productsData: Product[] = await getProducts();

      if (mounted.current) {
        setState(prev => {
          const isContentEqual = areProductsEqual(prev.products, productsData);

          if (isContentEqual) {
            console.log('API response identical, skipping product state update.');
            // Update the loading flag only
            return { ...prev, productsLoading: false };
          } else {
            console.log('API response different or first load, updating products state.');
            // Update products and the loading flag ATOMICALLY
            return {
              ...prev,
              products: productsData,
              productsLoading: false
            };
          }
        });

        // Update cache
        await AsyncStorage.setItem(BUSINESS_CACHE_KEY, JSON.stringify(productsData));
        await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('Products successfully fetched and cached.');
      }
    } catch (error) {
      console.error('API call error:', error);
      if (mounted.current) {
        // Update error and set loading to false ATOMICALLY
        setState(prev => ({
          ...prev,
          productsError: 'Network error while fetching products.',
          productsLoading: false
        }));
      }
    }
  }, [getProducts, activeBusiness?.id]);

  useEffect(() => {
    // 1. GUARD: If no business is selected, or we are on the Directory, clear products and STOP.
    if (!activeBusiness) {
      setState({ products: [], productsLoading: false, productsError: null });
      return;
    }

    // 2. RESET: If the business changed, reset the background fetch lock
    if (lastLoadedBusinessId.current !== activeBusiness.id) {
      backgroundFetchStartedRef.current = false;
      lastLoadedBusinessId.current = activeBusiness.id;
    }

    const loadData = async () => {
      // 3. ATOMIC KEY: Key is unique to the business
      const cacheKey = `@ProductCache:data:${activeBusiness.id}`;
      const timestampKey = `@ProductCache:timestamp:${activeBusiness.id}`;

      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        const cachedTime = await AsyncStorage.getItem(timestampKey);
        const now = Date.now();

        if (cached && cachedTime) {
          const products = JSON.parse(cached);
          const isExpired = now - parseInt(cachedTime) > CACHE_DURATION_MS;

          setState(prev => ({ ...prev, products, productsLoading: false }));

          if (isExpired && !backgroundFetchStartedRef.current) {
            backgroundFetchStartedRef.current = true;
            fetchProductsAndCache(true);
          }
        } else {
          // No cache: Perform foreground fetch
          fetchProductsAndCache(false);
        }
      } catch (e) {
        console.error("Cache load error", e);
        fetchProductsAndCache(false);
      }
    };

    loadData();
  }, [activeBusiness?.id, fetchProductsAndCache]);

  // useEffect(() => {
  //   // If no business is selected, don't try to load products!
  //   if (!activeBusiness) {
  //     setState({
  //       products: [],
  //       productsLoading: false, // Not loading because we aren't even in a shop yet
  //       productsError: null,
  //     });
  //     return;
  //   }
  //
  //   const loadCachedOrFetch = async () => {
  //     // Your existing logic...
  //     // IMPORTANT: You should probably change your CACHE_KEY to be unique per business
  //     BUSINESS_CACHE_KEY = `@ProductCache:data:${activeBusiness.id}`;
  //     // ... use this key instead of the generic one
  //   };
  //
  //   loadCachedOrFetch();
  // }, [activeBusiness, fetchProductsAndCache]);
  //
  // // Effect to handle initial data load: Check cache first, then fetch if stale or missing.
  // useEffect(() => {
  //   const loadCachedOrFetch = async () => {
  //     try {
  //       const cachedProducts = await AsyncStorage.getItem(BUSINESS_CACHE_KEY);
  //       const cachedTimestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
  //       const now = Date.now();
  //       let backgroundRefreshNeeded = false;
  //       let initialFetchNeeded = false;
  //
  //       if (cachedProducts && cachedTimestampStr) {
  //         const cachedTimestamp = parseInt(cachedTimestampStr, 10);
  //         const isCacheValid = now - cachedTimestamp < CACHE_DURATION_MS;
  //         const parsedProducts = JSON.parse(cachedProducts);
  //
  //         if (mounted.current) {
  //
  //           // 1. Update state ATOMICALLY from cache data
  //           setState(prev => {
  //             const isContentEqual = areProductsEqual(prev.products, parsedProducts);
  //
  //             if (isContentEqual) {
  //               console.log('Cache identical, skip product array update.');
  //               // Only update loading status
  //               return { ...prev, productsLoading: false };
  //             }
  //             console.log('Cache different, updating products array.');
  //             // Update products and set loading to false
  //             return {
  //               ...prev,
  //               products: parsedProducts,
  //               productsLoading: false
  //             };
  //           });
  //
  //           // 2. Check for background fetch requirement
  //           if (!isCacheValid && !backgroundFetchStartedRef.current) {
  //             backgroundFetchStartedRef.current = true;
  //             backgroundRefreshNeeded = true;
  //             console.log('Cache expired -> setting flag for background refresh.');
  //           }
  //         }
  //       } else {
  //         console.log('No cache found -> performing initial fetch.');
  //         initialFetchNeeded = true;
  //       }
  //
  //       // 3. Execute foreground/background refresh
  //       if (initialFetchNeeded) {
  //         await fetchProductsAndCache(false); // Foreground fetch
  //       } else if (backgroundRefreshNeeded) {
  //         fetchProductsAndCache(true); // Background fetch (don't await)
  //       }
  //
  //     } catch (err) {
  //       console.error('Initial product loading error:', err);
  //       if (mounted.current) {
  //         // Update error and set loading to false ATOMICALLY
  //         setState(prev => ({
  //           ...prev,
  //           productsError: 'An error occurred during initial data load.',
  //           productsLoading: false
  //         }));
  //       }
  //     }
  //   };
  //
  //   loadCachedOrFetch();
  // }, [activeBusiness?.id, fetchProductsAndCache]);

  // Since `products` is now `state.products`, we use a memo to keep the reference stable
  const getProductById = useCallback((id: number) => state.products.find(p => p.id === id), [state.products]);

  const contextValue = useMemo(() => {

    // We only log when we have completed the first actual data load (productsLoading changes to false)
    if (!state.productsLoading && !isLoadedRef.current) {
      console.log('ProductContext: Creating Context Value Object (Data Loaded)');
      isLoadedRef.current = true;
    } else if (isLoadedRef.current) {
      // Log subsequent updates after initial load
      console.log('ProductContext: Creating Context Value Object (Update)');
    } else {
      // Initial Mount (Loading: true, isLoadedRef: false) - Suppress log
    }

    return {
      products: state.products,
      productsLoading: state.productsLoading,
      productsError: state.productsError,
      getProductById,
    };
  }, [state.products, state.productsLoading, state.productsError, getProductById]);

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};
