import { useAuthContext } from '../context/AuthContext';
import { useCallback, useMemo } from 'react';
import {
  Address,
  Businesses,
  Cart,
  CartTokenManager,
  Categories,
  CheckoutPayload,
  JwtAuthResponse,
  Order,
  PaymentGateway,
  Product,
  RequestConfig,
  StoreApiCart,
} from '../model/interfaces';
import { useBusiness } from '../context/BusinessContext';

// const INITIAL_CONFIG_API_URL = 'https://FoodApp.wpenginepowered.com/wp-json/foodapp/v1/config';

export function useApiService(cartTokenManager?: CartTokenManager) {
  const { authToken, setAuthToken, userId, user } = useAuthContext();

  const { activeBusiness } = useBusiness();

  const request = useCallback(async <T>(
    endpoint: string,
    apiType: 'custom' | 'woocommerce' | 'wordpress' | 'store' | 'auth' = 'custom',
    method: string = 'GET',
    body: object | null = null,
    headers: Record<string, string> = {},
    // Keeping overrideToken for user-authenticated calls like getOrders
    overrideToken?: string | null,
  ): Promise<T> => {
    // const baseUrl = 'https://foodapp1.wpenginepowered.com/wp-json/';
    const PLATFORM_BASE_URL = 'https://foodapp1.wpenginepowered.com/wp-json/';

    let baseUrl: string;

    if (endpoint === '/businesses' || apiType === 'auth') {
      baseUrl = PLATFORM_BASE_URL;
    } else if (activeBusiness?.home_url) {
      // Ensure the URL ends with /wp-json/
      baseUrl = activeBusiness.home_url.endsWith('/')
        ? `${activeBusiness.home_url}wp-json/`
        : `${activeBusiness.home_url}/wp-json/`;
    } else {
      // Fallback to main site if no business is selected yet
      baseUrl = PLATFORM_BASE_URL;
    }

    let fullEndpoint: string;
    const currentCartToken = cartTokenManager?.getCartTokenValue();
    console.log(`Current cart token -> ${currentCartToken}`);

    const config: RequestConfig = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Use the overrideToken if provided, otherwise fall back to the context token.
    const customerAuthToken = overrideToken !== undefined ? overrideToken : authToken;

    switch (apiType) {
      case 'woocommerce':
        //Add the customer auth token if set
        if (customerAuthToken) {
          config.headers.Authorization = `Bearer ${customerAuthToken}`;
        }
        fullEndpoint = `wc/v3${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        break;
      case 'store':
        fullEndpoint = `wc/store/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

        //Add the cart token if set
        // const currentCartToken = cartTokenManager?.getCartTokenValue() ?? null;
        if (currentCartToken) {
          config.headers['Cart-Token'] = currentCartToken;
        }
        config.headers.Authorization = `Bearer ${customerAuthToken}`;
        break;
      case 'custom':
        //Add the customer auth token if set
        if (customerAuthToken) {
          config.headers.Authorization = `Bearer ${customerAuthToken}`;
        }
        fullEndpoint = `foodapp/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        break;
      case 'auth':
      case 'wordpress':
      default:
        fullEndpoint = `${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        break;
    }

    const url = `${baseUrl}${fullEndpoint}`;
    if (body) config.body = JSON.stringify(body);

    try {
      console.log(`Attempt the fetch using url ${url}`);
      const response = await fetch(url, config);
      const newCartToken = response.headers.get('cart-token');
      console.log(`Response from URL ${url} with cart token ${newCartToken}`);

      // update the cart token if it has changed BasketContext's state is updated.
      if (newCartToken && (newCartToken !== (currentCartToken ?? null))) {
        console.log('Saving new cart token');
        await cartTokenManager?.saveCartToken(newCartToken);
      }

      if (!response.ok) {
        let errorMsg = '';
        try {
          const data = await response.json();
          errorMsg = data.message || JSON.stringify(data);
        } catch {
          errorMsg = response.statusText;
        }
        throw new Error(`API Error ${response.status}: ${errorMsg}`);
      }

      if (method === 'DELETE') return [] as T;
      return (await response.json()) as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }, [authToken, cartTokenManager, activeBusiness]); // Request is now dependent on cartTokenManager

  /**
   * Get Businesses
   */
  const getBusinesses = useCallback(async (): Promise<Businesses> => {

    try {
      const response = await request<Businesses>(
        '/businesses',
        'custom',
        'GET'
      );
      return response;
    } catch (error) {
      // Re-throw the error so the consuming component can handle it
      console.error('Failed to fetch businesses:', error);
      throw error;
    }

  },[request]);

  const getAddresses = useCallback(async (): Promise<Address[]> => {

    if(userId){
      try {
        const response = await request<Address[]>(
          `/customers/${userId}`,
          'woocommerce',
          'GET',
        );

        return response;
      } catch (error) {
        console.error('Failed to fetch customer data for addresses:', error);
        throw error;
      }
    }

    return [];

  },[request, userId]);

  const updateCustomerAddresses = useCallback(async (userId: number, addresses: Partial<Address[]>): Promise<Address[]> => {

    const updatedCustomer = await request<any>(
      `/customers/${userId}`,
      'woocommerce',
      'PUT',
      addresses
    );

    // WooCommerce returns the updated customer object, which contains the new addresses
    // We return only the addresses, asserting the structure.
    return {
      billing: updatedCustomer.billing || {} as Address,
      shipping: updatedCustomer.shipping || {} as Address,
    };
  }, [request]);

  const getCustomerAddresses = useCallback(async (userId: number, token?: string | null): Promise<Address[]> => {
    try {
      // Pass the token to the request function
      const addresses = await request<Address[]>(
        `/customer/${userId}/addresses`,
        'custom',
        'GET',
        undefined,
        {},
        token
      );
      return addresses;
    } catch (error) {
      console.error('Failed to fetch customer addresses:', error);
      throw error;
    }
  }, [request]);

  const createCustomerAddress = useCallback(async (userId: number, addressData: Omit<Address, 'address_id' | 'user_id'>): Promise<Address> => {
    try {
      // Endpoint: /foodapp/v1/customer/{userId}/addresses (POST)
      const newAddress = await request<Address>(
        `/customer/${userId}/addresses`,
        'custom',
        'POST',
        addressData
      );
      return newAddress;
    } catch (error) {
      console.error('Failed to create customer address:', error);
      throw error;
    }
  }, [request]);

  const updateCustomerAddress = useCallback(async (userId: number, addressId: number, addressData: Partial<Address>): Promise<Address> => {
    try {
      // Endpoint: /foodapp/v1/customer/{userId}/addresses/{addressId} (PUT)
      const updatedAddress = await request<Address>(
        `/customer/${userId}/addresses/${addressId}`,
        'custom',
        'PUT',
        addressData
      );
      return updatedAddress;
    } catch (error) {
      console.error('Failed to update customer address:', error);
      throw error;
    }
  }, [request]);

  const deleteCustomerAddress = useCallback(async (userId: number, addressId: number): Promise<void> => {
    try {
      // Endpoint: /foodapp/v1/customer/{userId}/addresses/{addressId} (DELETE)
      // We expect a 200/204 response with an empty object on success.
      await request<{}>(
        `/customer/${userId}/addresses/${addressId}`,
        'custom',
        'DELETE'
      );
    } catch (error) {
      console.error('Failed to delete customer address:', error);
      throw error;
    }
  }, [request]);

  const getCategories = useCallback(async (): Promise<Categories> => {

    try {
      const response = await request<Categories>(
        '/products/categories',
        'store',
        'GET'
      );
      return response;
    } catch (error) {
      // Re-throw the error so the consuming component can handle it
      console.error('Failed to fetch categories:', error);
      throw error;
    }

  },[request]);

  const getProducts = useCallback(async (): Promise<Product[]> => {

    try {
      const response = await request<Product[]>(
        '/products',
        'store',
        'GET'
      );

      return response;

    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }

  },[request]);

  const getOrders = useCallback(async (userId: number, token?: string | null): Promise<Order[]> => {
    try {
      // Pass the token to the request function
      const orders = await request<Order[]>(
        `/orders?customer=${userId}`,
        'woocommerce',
        'GET',
        undefined,
        {},
        token
      );
      return orders;
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      throw error;
    }
  }, [request]);

  /**
   * Fetches the current cart state, creating a new session if one doesn't exist.
   */
  const getWooCommerceCart = useCallback(async (): Promise<Cart> => {
    try {
      const cartEndpoint = '/cart';

      const cart = await request<StoreApiCart>(
        cartEndpoint,
        'store',
        'GET'
      );
      return cart;

    } catch (error) {
      console.error('Failed to retrieve WooCommerce cart:', error);
      throw error;
    }
  },[request]);
  /**
   * Sends an update to the cart (add, update, or remove item).
   * @param endpoint The specific cart action endpoint (e.g., '/cart/add-item').
   * @param payload The data required for the action, including method.
   */
  const sendWooCommerceCartUpdate = useCallback(async (
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    data: object
  ): Promise<any> => { // Return Cart object or [] for Delete operations
    try {
      let updatedCartResponse: Cart | [];
      if(method === 'DELETE') {
        updatedCartResponse = await request<[]>(
          endpoint,
          'store',
          method,
          data,
        );
      } else {
        updatedCartResponse = await request<Cart>(
          endpoint,
          'store',
          method,
          data,
        );
      }

      return updatedCartResponse;

    } catch (error) {
      console.error(`Failed to update cart via ${endpoint}:`, error);
      throw error;
    }
  },[request]);

  /**
   * Clears the entire cart using the Store API.
   * Endpoint: DELETE /wc/store/v1/cart/items
   */

  const clearCart = useCallback(async (): Promise<Cart> => {
    try {
      console.log('Attempting to clear the cart:');
      if(cartTokenManager.getCartTokenValue()){
        const clearedCart = await request<Cart>(
          '/cart/items',
          'store',
          'DELETE',
          {}, // No body required
        );
        // The response is the newly emptied cart
        return clearedCart;
      }
    } catch (error) {
      console.error('Failed to clear cart via Store API:', error);
      throw error;
    }
  },[request]);

  /****
   * Update Shipping method
   *
   */
  const updateShippingMethod = useCallback( async (package_id: number, rate_id: string): Promise<any> => {
    try {
      const data = {
        package_id: package_id,
        rate_id: rate_id,
      }

      const updatedShippingResponse = await request<Cart>(
        '/cart/select-shipping-rate',
        'store',
        'POST',
        data
      );

      return updatedShippingResponse;

    } catch (error) {
      console.error(`Failed to update shipping method:`, error);
      throw error;
    }
  },[request]);

  const customerLogin = useCallback(async (username: string, password: string) => {
    const response = await request<JwtAuthResponse>(
      'jwt-auth/v1/token',
      'auth',
      'POST',
      { username, password }
    );
    setAuthToken(response.token);
    return response;
  }, [setAuthToken, request]);

  const registerCustomer = useCallback( async (data: any): Promise<{ token: string; user_id: number }> => {
    try {
      // NOTE: This endpoint might vary based on your auth plugin (e.g., JWT, Application Passwords)
      const response = await request<{ token: string; user_id: number }>(
        'jwt-auth/v1/token',
        'store',
        'POST',
        { data }
      );

      return response;
    } catch (error) {
      console.error('Customer login failed:', error);
      throw error;
    }
  }, [request]);

  const reorder = useCallback( async (orderId: number): Promise<StoreApiCart> => {
    try {
      // NOTE: This endpoint might vary based on your auth plugin (e.g., JWT, Application Passwords)
      const response = await request<StoreApiCart>(
        '/reorder',
        'custom',
        'POST',
        { order_id: orderId }
      );

      return response;
    } catch (error) {
      console.error('Process Reorder failed:', error);
      throw error;
    }
  }, [request]);

  /**
   * Sends a batch request to the Store API (POST /wc/store/v1/batch).
   * @param payload The body containing the 'requests' array.
   */
  const sendWooCommerceCartBatch = useCallback(async (
    payload: object
  ): Promise<any> => {
    try {

      const batchResponse = await request<any>(
        '/batch',
        'store',
        'POST',
        payload,
      );

      return batchResponse;

    } catch (error) {
      console.error(`Failed to send batch request:`, error);
      throw error;
    }
  },[request]);


  const createOrder = useCallback(async (payload: CheckoutPayload): Promise<Order> => {
    try {

      const orderPayload = {
        payment_method: payload.payment_method,
        billing_address: {
          first_name: payload.billing_address.first_name,
          last_name: payload.billing_address.last_name,
          company: '',
          address_1: payload.billing_address.address_1,
          address_2: payload.billing_address.address_2,
          city: payload.billing_address.city,
          state: payload.billing_address.state,
          postcode: payload.billing_address.postcode,
          country: payload.billing_address.country==='UK'?'GB':payload.billing_address.country,
          email: user,
          phone: '',
        },
        shipping_address: {
          first_name: payload.shipping_address.first_name,
          last_name: payload.shipping_address.last_name,
          company: '',
          address_1: payload.shipping_address.address_1,
          address_2: payload.shipping_address.address_2,
          city: payload.shipping_address.city,
          state: payload.shipping_address.state,
          postcode: payload.shipping_address.postcode,
          country: payload.shipping_address.country==='UK'?'GB':payload.shipping_address.country,
          email: user,
          phone: '',
        },
      };

      // Use the 'store' API type which targets the WC Store API /checkout endpoint
      const newOrder = await request<Order>(
        'checkout',
        'store',
        'POST',
        orderPayload
      );

      // CRITICAL: After successful checkout, clear the cart token to start a new session.
      await cartTokenManager?.saveCartToken(null);
      return newOrder;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }, [user, request, cartTokenManager]); // Updated dependency to cartTokenManager

  const getPaymentGateways:() => Promise<PaymentGateway[]> = useCallback(async (): Promise<PaymentGateway[]> => {
    try {
      const paymentGatewayResponse = await request<PaymentGateway[]>(
        'payment-gateways',
        'custom',
        'GET'
      );

      return paymentGatewayResponse;
    } catch (error) {
      console.error('Failed to get payment gateways:', error);
    }

    return [];

  }, [request]);


  return useMemo(() => ({
    request,
    getBusinesses,
    getAddresses,
    getCustomerAddresses,
    createCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    updateCustomerAddresses,
    createOrder,
    getCategories,
    getProducts,
    getOrders,
    getWooCommerceCart,
    sendWooCommerceCartUpdate,
    clearCart,
    reorder,
    sendWooCommerceCartBatch,
    updateShippingMethod,
    customerLogin,
    registerCustomer,
    getPaymentGateways,
    // 5. Removed loadCartToken and saveCartToken from the return object
  }),[
    request, getBusinesses, getAddresses, getCustomerAddresses, createCustomerAddress, updateCustomerAddress,
    deleteCustomerAddress, updateCustomerAddresses, createOrder, getCategories, getProducts,
    getOrders, getWooCommerceCart, sendWooCommerceCartUpdate, clearCart, reorder, sendWooCommerceCartBatch, updateShippingMethod,
    customerLogin, registerCustomer, getPaymentGateways
  ]);
}
