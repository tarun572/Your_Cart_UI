import { beforeEach, describe, expect, test } from '@jest/globals';
import { authActions, cartActions, productsActions, store } from '../src/store';

describe('Redux application store', () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(authActions.logout());
    store.dispatch(cartActions.clearCart());
    store.dispatch(productsActions.setProducts([]));
  });

  test('stores seller authentication data and clears it on logout', () => {
    const user = {
      email: 'seller@example.com',
      name: 'Seller',
      role: 'seller' as const,
      apiKey: 'seller-key',
    };

    store.dispatch(authActions.setUser({
      user,
      token: 'token-123',
      userKey: 'seller-key',
      statusCode: 200,
    }));

    expect(store.getState().auth.user).toEqual(user);
    expect(localStorage.getItem('auth_token')).toBe('token-123');
    expect(localStorage.getItem('user_key')).toBe('seller-key');

    store.dispatch(authActions.logout());

    expect(store.getState().auth.user).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  test('handles auth loading, errors, status, and session restoration', () => {
    store.dispatch(authActions.setLoading(true));
    expect(store.getState().auth.loading).toBe(true);

    store.dispatch(authActions.setError('Login failed'));
    expect(store.getState().auth.error).toBe('Login failed');
    expect(store.getState().auth.loading).toBe(false);

    store.dispatch(authActions.clearError());
    store.dispatch(authActions.setStatusCode(401));
    expect(store.getState().auth.error).toBeNull();
    expect(store.getState().auth.statusCode).toBe(401);

    localStorage.setItem('auth_token', 'restored-token');
    localStorage.setItem('user_key', 'restored-key');
    store.dispatch(authActions.restoreSession());
    expect(store.getState().auth.token).toBe('restored-token');
    expect(store.getState().auth.userKey).toBe('restored-key');

    localStorage.clear();
    store.dispatch(authActions.restoreSession());
    expect(store.getState().auth.token).toBe('restored-token');
  });

  test('handles authentication payloads without optional persisted values', () => {
    store.dispatch(authActions.setUser({
      user: { email: '', name: '', role: '' as 'buyer' },
      token: '',
    }));

    expect(store.getState().auth.token).toBe('');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_email')).toBeNull();
    expect(localStorage.getItem('user_key')).toBeNull();
  });

  test('merges duplicate cart items and updates quantity', () => {
    const item = {
      id: 10,
      name: 'Bottle',
      price: 10,
      qty: 1,
      image: '',
      seller: 'Store',
    };

    store.dispatch(cartActions.clearCart());
    store.dispatch(cartActions.addToCart(item));
    store.dispatch(cartActions.addToCart({ ...item, qty: 2 }));
    store.dispatch(cartActions.updateItemQty({ id: 10, qty: 5 }));
    store.dispatch(cartActions.updateItemQty({ id: 999, qty: 5 }));
    store.dispatch(cartActions.setCartLoading(true));
    store.dispatch(cartActions.setCartError('Cart error'));
    store.dispatch(cartActions.removeFromCart(999));

    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.items[0].qty).toBe(5);
    expect(store.getState().cart.loading).toBe(true);
    expect(store.getState().cart.error).toBe('Cart error');

    store.dispatch(cartActions.setCart([{ id: 11, qty: 2 }]));
    store.dispatch(cartActions.clearCart());
    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().cart.totalPrice).toBe(0);
  });

  test('adds, updates, and removes products', () => {
    const product = {
      id: 20,
      name: 'Headphones',
      price: 100,
      category: 'Electronics',
      image: '',
      desc: '',
      stock: 2,
      seller: 'Store',
      sellerApiKey: 'seller-key',
    };

    store.dispatch(productsActions.setProducts([]));
    store.dispatch(productsActions.addProduct(product));
    store.dispatch(productsActions.updateProduct({ ...product, stock: 3 }));
    expect(store.getState().products.items[0].stock).toBe(3);

    store.dispatch(productsActions.removeProduct(20));
    expect(store.getState().products.items).toHaveLength(0);

    store.dispatch(productsActions.updateProduct({ ...product, stock: 9 }));
    store.dispatch(productsActions.setProductsLoading(true));
    store.dispatch(productsActions.setProductsError('Products error'));
    expect(store.getState().products.loading).toBe(false);
    expect(store.getState().products.error).toBe('Products error');
  });
});