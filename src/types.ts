export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  desc: string;
  stock: number;
  seller: string;
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
  isVerified?: boolean;
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
