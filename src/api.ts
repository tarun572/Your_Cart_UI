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
): Promise<{ status: string; message: string; data: any[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/registeration-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        user_email: sellerData.email,
        user_name: sellerData.fullName,
        user_role: 'seller',
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Registration response:', data);
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
 * Get Products by User Email API
 * @param userEmail - The user's email address
 * @returns Array of products
 */
export async function getProductsByEmail(userEmail: string): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: userEmail }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log('✅ API Response:', apiResponse);

    // Extract data array from response
    if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
      console.warn('⚠️ No data array in response');
      return [];
    }

    console.log(`📦 Found ${apiResponse.data.length} products`);

    // Transform API response to Product interface
    const products: Product[] = apiResponse.data.map((item: any, index: number) => {
      const product: Product = {
        id: item.product_id || Date.now() + index, // Use timestamp + index for unique ID
        name: item.Product_Name?.toString() || 'Unknown Product',
        price: parseFloat(item.Product_Price) || 0,
        category: item.PC?.toString() || 'Uncategorized',
        desc: item.PD?.toString() || '',
        stock: item.DAF ? parseInt(item.DAF.toString(), 10) : 0,
        image: item.Image?.toString() || '',
        seller: item.seller_email?.toString() || 'Unknown Seller',
        sellerApiKey: item.user_key?.toString() || item.seller_email?.toString() || '',
      };
      console.log(`✅ Transformed product ${index}:`, product);
      return product;
    });

    console.log('🎉 All products transformed:', products);
    return products;
  } catch (error) {
    console.error('Error fetching products by email:', error);
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
 * Insert Product API - Creates a new product with FormData for image upload
 * @param formData - FormData containing product information and image
 * @param sellerApiKey - The seller's API key for authentication
 * @param userEmail - The seller's email
 * @returns Response with product creation status and data
 */
export async function insertProduct(
  formData: FormData,
  sellerApiKey: string,
  userEmail: string
): Promise<{ status: string; message: string; data: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Product creation response:', data);
    return data;
  } catch (error) {
    console.error('Error inserting product:', error);
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
 * Delete Product API - Delete product by email and API key
 * @param userEmail - The seller's email
 * @param sellerApiKey - The seller's API key
 * @param productName - The product name to identify which product to delete
 * @returns Response with deletion status
 */
export async function deleteProduct(
  userEmail: string,
  sellerApiKey: string,
  productName: string
): Promise<{ status: string; message: string }> {
  try {
    const formData = new FormData();
    formData.append('user_email', userEmail);
    formData.append('user_key', sellerApiKey);
    formData.append('product_name', productName);

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'DELETE',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Product deletion response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    throw error;
  }
}

/**
 * Edit Product API - Update existing product
 * Endpoint: PUT /edit-api/:productId
 * @param productId - ID of the product to edit
 * @param userEmail - The seller's email
 * @param userKey - The seller's API key
 * @param productData - Updated product data
 * @returns Response with updated product status
 */
export async function editProductApi(
  productId: number | string,
  userEmail: string,
  userKey: string,
  productData: {
    name: string;
    price: number;
    category: string;
    desc: string;
    stock: number;
    image?: File;
  }
): Promise<{ status: string; message: string; data?: any }> {
  try {
    const formData = new FormData();
    formData.append('user_email', userEmail);
    formData.append('name', productData.name);
    formData.append('price', productData.price.toString());
    formData.append('category', productData.category);
    formData.append('desc', productData.desc);
    formData.append('stock', productData.stock.toString());
    
    if (productData.image) {
      formData.append('image', productData.image);
    }

    const response = await fetch(`${API_BASE_URL}/edit-api/${productId}`, {
      method: 'PUT',
      headers: {
        'user_key': userKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Product edit response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error editing product:', error);
    throw error;
  }
}

/**
 * Delete Product API - Delete product using dedicated endpoint
 * Endpoint: DELETE /delete-api/:productId
 * @param productId - ID of the product to delete
 * @param userEmail - The seller's email
 * @param userKey - The seller's API key
 * @returns Response with deletion status
 */
export async function deleteProductApi(
  productId: number | string,
  userEmail: string,
  userKey: string
): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/delete-api/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'user_key': userKey,
      },
      body: JSON.stringify({
        user_email: userEmail,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Product delete API response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error deleting product via API:', error);
    throw error;
  }
}
/*
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
