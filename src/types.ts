export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  /** base64 data URL (local upload) or https URL */
  image: string;
  /** Array of image URLs for product gallery */
  images?: string[];
  desc: string;
  stock: number;
  seller: string;
  /** The API key of the seller who owns this product */
  sellerApiKey: string;
}

export interface CartItem {
  id: number;
  qty: number;
}

export interface User {
  email: string;
  name: string;
  role: 'seller' | 'buyer';
  apiKey?: string;
}

export interface ApiKeyResult {
  valid: boolean;
}

export interface LoginResult {
  valid: boolean;
  token: string;
  user_key?: string;
  message?: string;
}

export interface SellerRegistration {
  fullName: string;
  email: string;
  userRole: 'seller',
  businessName?: string;
  phone?: string;
  password?: string;
}

export interface SellerRegistrationResult {
  success: boolean;
  apiKey: string;
  message: string;
}
