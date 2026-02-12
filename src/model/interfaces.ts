export interface RequestConfig {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export interface BusinessInfo {
  name: string;
  phoneNumber: string;
  email: string;
  logoUrl: string;
  doesDelivery: boolean;
  doesPickup: boolean;
  address: string;
  openingHours: any;
}


export interface OpeningSlot {
  open?: string;
  close?: string;
  display: string;
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type OpeningHours = Record<DayOfWeek, OpeningSlot[]>;

export interface Business {
  id: number;
  name: string;
  home_url: string;
  api_base: string;
  cuisines: [];
  primary_badge: string;
  is_verified: boolean;
  priority: number;
  logo: string;
  cover_image: string;
  description: string;
  phoneNumber: string;
  email: string;
  map_location: {
    address: string;
    lat: number;
    lng: number;
    zoom: number;
    place_id: string;
    street_number: string;
    street_name: string;
    street_name_short: string;
    city: string;
    state: string;
    post_code: string;
    country: string;
    country_short: string;
  },
  what_three_words: string;
  does_delivery: boolean;
  does_pickup: boolean;
  openingHours: OpeningHours;
}

export type Businesses = Business[];

export interface FoodBusiness {
  id: string;
  name: string;
  type: string;
  rating: number;
  imageUrl: string;
}

export interface InitialAppConfig {
  appType: 'single' | 'multi' | 'empty';
  mainBusiness?: BusinessInfo;
  businesses?: Business[];
  message?: string; // For error/empty cases
}

export interface JwtAuthResponse {
  token: string;
  user_display_name: string;
  user_email: string;
  user_nicename: string;
}

export interface CartTokenManager {
  loadCartToken: () => Promise<string | null>;
  saveCartToken: (token: string | null) => Promise<void>;
  // The getter allows the API service to read the token without being a state dependency
  getCartTokenValue: () => string | null;
}

export interface Address {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string; // Only exists on billing_address
  phone?: string;
}

export interface Addresses {
  success: boolean;
  user_id: string;
  addresses: Address[];
}

export interface Category {
  id: number;
  name: string;
}

export type Categories = Category[];

export interface CheckoutPayload {
  billing_address: Address;
  shipping_address: Address | null;
  payment_method: string; // e.g., 'cod'
}

export interface Customer {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url: string;
  billing: Address;
  shipping: Address;

  // Additional data often found on WooCommerce customer endpoints
  is_paying_customer: boolean;
  role: string;
  last_activity?: string;
}

export interface Image {
  alt: string;
  id: number;
  name: string;
  sizes: string;
  src: string;
  srcset: string;
  thumbnail: string;
}

export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface Product {
  id: number;
  name: string;
  short_description: string;
  description: string;
  price: string;
  images: Image[],
  acf: {
    business: FoodBusiness;
    configurable_options: [
      {
        option_name: string;
        default_included: boolean;
      }
    ]
  }
  categories?: Category[];
}

export interface Prices {
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
  price: string;
  regular_price: string;
  sale_price: string;
  price_range: string | null;
}

export interface LineItemPrices extends Prices {
  raw_prices: {
    precision: number;
    price: string;
    regular_price: string;
    sale_price: string;
  };
}

export interface Products {
  success: boolean;
  products: Product[];
}

// --- LINE ITEM (Reused for consistency) ---
export interface LineItem {
  id: number;
  key: string;
  name: string;
  prices: Prices;
  quantity: number;
  sku: string;
  totals: {
    line_subtotal: string,
    line_subtotal_tax: string,
    line_total: string,
    line_total_tax: string,
    currency_code: string,
    currency_symbol: string,
    currency_minor_unit: number,
    currency_decimal_separator: string,
    currency_thousand_separator: string,
    currency_prefix: string
  }
}

// --- ORDER INTERFACES (Reused) ---
interface MetaData {
  key: string;
  value: string;
}
interface ShippingLine {
  id: number;
  method_title: string;
  total: number;
}
export interface Order {
  order_id: number;
  status: string;
  order_key: string;
  order_number: string;
  customer_note: string;
  customer_id: number;
  billing_address: Address;
  shipping_address: Address;
  payment_method: string;
  payment_result: PaymentResult;
}

export interface Orders {
  success: boolean;
  orders: Order[];
}

export interface PaymentResult {
  payment_status: string;
  payment_details: [
    key: string,
    value: string
  ];
  redirect_url: string;
}


// --- NEW WOOCOMMERCE STORE API CART INTERFACES ---

export interface StoreApiAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email?: string; // Only exists on billing_address
  phone?: string; // Can be on both, but optional
}

export interface StoreApiShippingRate {
  rate_id: string;
  name: string;
  description: string;
  price: string;
  taxes: string;
  instance_id: number;
  method_id: string;
  meta_data: any[];
  selected: boolean;
}

export interface StoreApiShippingRates {
  shipping_rates: StoreApiShippingRate[];
}

export interface StoreApiTaxLine {
  name: string;
  price: string;
  rate: string;
}

export interface StoreApiTotals {
  currency_code: string;
  currency_decimal_separator: string;
  currency_minor_unit: number;
  currency_prefix: string;
  currency_suffix: string;
  currency_symbol: string;
  currency_thousand_separator: string;
  tax_lines: StoreApiTaxLine[];
  total_discount: string;
  total_discount_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_items: string;
  total_items_tax: string;
  total_price: string;
  total_shipping: string | null;
  total_shipping_tax: string | null;
  total_tax: string;
}

/**
 * The core Cart object returned by the WooCommerce Store API (/wc/store/v1/cart).
 */
export interface StoreApiCart {
  cartToken?: string | null;
  billing_address: StoreApiAddress;
  coupons: any[];
  cross_sells: any[];
  errors: any[];
  extensions: Record<string, any>;
  fees: any[];
  has_calculated_shipping: boolean;
  items: LineItem[]; // Reusing the existing LineItem interface
  items_count: number;
  items_weight: number;
  needs_payment: boolean;
  needs_shipping: boolean;
  payment_methods: any[];
  payment_requirements: string[];
  shipping_address: StoreApiAddress;
  shipping_rates: StoreApiShippingRates[];
  totals: StoreApiTotals;
}

interface StoredCartData {
  cart: StoreApiCart | null;
  cartToken: string | null; // This will be the definitive token
}

/**
 * Converts a price from minor units (e.g., pence, cents) to a major unit display string.
 *
 * @param {object} priceData - An object containing the price and currency details from the API.
 * @returns {string} The formatted price string (e.g., "£5.50").
 */
export const displayPrice = (
    price_value: string,
    currency_prefix: string,
    currency_minor_unit: number,
    currency_decimal_separator: string
  ) => {

  // Safety check for essential data
  if (!price_value || currency_minor_unit === undefined) {
    // Return a default or error string if key data is missing
    return 'Price N/A';
  }

  // Calculate the conversion factor (e.g., 10^2 = 100)
  const divisor = Math.pow(10, currency_minor_unit);

  // Convert the string minor unit price to a number and divide
  const majorUnitPrice = parseFloat(price_value) / divisor;

  // Create a standard decimal string (e.g., '5.50')
  const priceString = majorUnitPrice.toFixed(currency_minor_unit);

  // Replace the default '.' with the specified decimal separator (if needed)
  // Note: For GBP, the decimal separator is '.' so this step might seem redundant
  // but is necessary for currencies using a comma (',') as the decimal.
  let formattedPrice = priceString.replace('.', currency_decimal_separator);

  // Prepend the currency prefix (symbol)
  formattedPrice = `${currency_prefix}${formattedPrice}`;

  return formattedPrice;
};

// Export the new structure as the generic 'Cart'
export type Cart = StoreApiCart;
