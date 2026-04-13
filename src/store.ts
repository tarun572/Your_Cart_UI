/**
 * Redux Store Configuration
 * Manages authentication state and API loading states
 */

import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User, Product } from './types';

/**
 * Auth Slice - Manages user authentication state
 */
interface AuthState {
  user: User | null;
  token: string | null;
  userKey: string | null; // Seller API key/user key
  statusCode: number | null; // HTTP response status code
  loading: boolean;
  error: string | null;
}

const initialAuthState: AuthState = {
  user: null,
  token: localStorage.getItem('auth_token') || null,
  userKey: localStorage.getItem('user_key') || null,
  statusCode: null,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    // Set user and token after successful login
    setUser: (state, action: PayloadAction<{ user: User; token: string; userKey?: string; statusCode?: number }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.userKey = action.payload.userKey || null;
      state.statusCode = action.payload.statusCode || 200;
      state.error = null;
      state.loading = false;

      // Store all authentication data in localStorage
      console.log('Saving to localStorage:', action.payload);
      
      // Store token
      if (action.payload.token) {
        localStorage.setItem('auth_token', action.payload.token);
        console.log('✓ Token saved:', action.payload.token.substring(0, 20) + '...');
      }
      
      // Store user email
      if (action.payload.user?.email) {
        localStorage.setItem('user_email', action.payload.user.email);
        console.log('✓ User email saved:', action.payload.user.email);
      }
      
      // Store user role
      if (action.payload.user?.role) {
        localStorage.setItem('user_role', action.payload.user.role);
        console.log('✓ User role saved:', action.payload.user.role);
      }
      
      // Store user key (if seller)
      if (action.payload.userKey) {
        localStorage.setItem('user_key', action.payload.userKey);
        console.log('✓ User key saved:', action.payload.userKey);
      }
    },
    // Clear user on logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.userKey = null;
      state.statusCode = null;
      state.error = null;
      state.loading = false;

      // Clear all auth-related data from localStorage
      console.log('Clearing localStorage:');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_key');
      console.log('✓ All auth data cleared from localStorage');
    },
    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Set error message
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    // Clear error message
    clearError: (state) => {
      state.error = null;
    },
    // Set status code
    setStatusCode: (state, action: PayloadAction<number>) => {
      state.statusCode = action.payload;
    },
    // Restore user from localStorage (for session persistence)
    restoreSession: (state) => {
      const token = localStorage.getItem('auth_token');
      const userKey = localStorage.getItem('user_key');
      if (token) {
        state.token = token;
        state.userKey = userKey;
      }
    },
  },
});

/**
 * Cart Slice - Manages shopping cart state
 */
import type { CartItem } from './types';

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalPrice: number;
}

const initialCartState: CartState = {
  items: [],
  loading: false,
  error: null,
  totalPrice: 0,
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    // Set cart items
    setCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    // Add item to cart
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find((item: CartItem) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.qty += action.payload.qty;
      } else {
        state.items.push(action.payload);
      }
    },
    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item: CartItem) => item.id !== action.payload);
    },
    // Update item quantity
    updateItemQty: (state, action: PayloadAction<{ id: number; qty: number }>) => {
      const item = state.items.find((i: CartItem) => i.id === action.payload.id);
      if (item) {
        item.qty = action.payload.qty;
      }
    },
    // Clear cart
    clearCart: (state) => {
      state.items = [];
      state.totalPrice = 0;
    },
    // Set cart loading
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Set cart error
    setCartError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

/**
 * Products Slice - Manages products state
 */
interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialProductsState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

export const productsSlice = createSlice({
  name: 'products',
  initialState: initialProductsState,
  reducers: {
    // Set all products
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.error = null;
    },
    // Add a new product
    addProduct: (state, action: PayloadAction<Product>) => {
      state.items.push(action.payload);
    },
    // Update an existing product
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.items.findIndex((p: Product) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    // Remove a product
    removeProduct: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((p: Product) => p.id !== action.payload);
    },
    // Set loading state
    setProductsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    // Set error
    setProductsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

/**
 * Configure Redux Store
 */
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    products: productsSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export actions
export const authActions = authSlice.actions;
export const cartActions = cartSlice.actions;
export const productsActions = productsSlice.actions;
