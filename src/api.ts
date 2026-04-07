/**
 * API Module - Centralized API calls for the application
 * All API endpoints are defined here
 */

import type { 
  User, 
  ApiKeyResult, 
  SellerRegistration, 
  SellerRegistrationResult,
  Product,
  CartItem 
} from './types';

const API_BASE_URL = 'http://localhost:3001';

/**
 * Login API - Validates user credentials and returns authentication token
 * @param userEmail - The user's email address
 * @param userRole - The user's role ('seller' or 'buyer')
 * @param userKey - The seller API key (required for sellers, optional for buyers)
 * @returns Login result with token and user data
 */
export async function loginUser(
  userEmail: string,
  userRole: 'seller' | 'buyer',
  userKey?: string
): Promise<{ valid: boolean; token: string; user_key?: string; message?: string; statusCode?: number; data?: any[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/login-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        user_email: userEmail,
        user_role: userRole,
        ...(userKey ? { user_key: userKey } : {}),
      }).toString(),
    });

    console.log('API Response Status:', response.status);

    const data = await response.json();
    console.log('API Raw Response:', data);
    
    // Add status code to response for easy access
    const result = {
      ...data,
      statusCode: response.status,
    };
    
    console.log('Final result with statusCode:', result);
    return result;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

/**
 * Validate Seller API Key (deprecated - use loginUser instead)
 * @param apiKey - The seller's API key to validate
 * @returns ApiKeyResult with validation status
 */
export async function validateSellerKey(apiKey: string): Promise<ApiKeyResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        user_key: apiKey,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ApiKeyResult = await response.json();
    return data;
  } catch (error) {
    console.error('Error validating seller key:', error);
    throw error;
  }
}

/**
 * Register Seller API - Creates a new seller account
 * @param sellerData - Seller registration information
 * @returns SellerRegistrationResult with API key and status
 */
export async function registerSeller(
  sellerData: SellerRegistration
): Promise<SellerRegistrationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/register-seller`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sellerData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SellerRegistrationResult = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering seller:', error);
    throw error;
  }
}

/**
 * Get All Products API
 * @returns Array of all products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Product[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Get Products by Seller API
 * @param sellerApiKey - The seller's API key
 * @returns Array of products for the seller
 */
export async function getSellerProducts(sellerApiKey: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/seller-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: sellerApiKey }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Product[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching seller products:', error);
    throw error;
  }
}

/**
 * Create Product API
 * @param product - Product data to create
 * @param sellerApiKey - The seller's API key for authentication
 * @returns The created product
 */
export async function createProduct(
  product: Omit<Product, 'id' | 'sellerApiKey'>,
  sellerApiKey: string
): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, apiKey: sellerApiKey }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Product = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update Product API
 * @param productId - ID of the product to update
 * @param product - Updated product data
 * @param sellerApiKey - The seller's API key for authentication
 * @returns The updated product
 */
export async function updateProduct(
  productId: number,
  product: Partial<Omit<Product, 'id' | 'sellerApiKey'>>,
  sellerApiKey: string
): Promise<Product> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...product, apiKey: sellerApiKey }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: Product = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Delete Product API
 * @param productId - ID of the product to delete
 * @param sellerApiKey - The seller's API key for authentication
 */
export async function deleteProduct(
  productId: number,
  sellerApiKey: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: sellerApiKey }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

/**
 * Checkout API - Process buyer checkout
 * @param cartItems - Array of cart items
 * @param buyerEmail - Email of the buyer
 * @returns Checkout result
 */
export async function checkout(
  cartItems: CartItem[],
  buyerEmail: string
): Promise<{ success: boolean; orderId: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cartItems, buyerEmail }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error during checkout:', error);
    throw error;
  }
}
