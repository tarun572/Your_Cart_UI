import { describe, expect, test } from '@jest/globals';
import {
  createProduct,
  getProducts,
  getProductsByApiKey,
  getProductsBySeller,
  registerSeller,
  removeProduct,
  updateProduct,
  validateSellerKey,
} from '../src/mockApi';

describe('mock API behavior', () => {
  test('validates known seller keys and trims input', async () => {
    await expect(validateSellerKey(' ECART-SELLER-2026 ')).resolves.toEqual({ valid: true });
    await expect(validateSellerKey('invalid-key')).resolves.toEqual({ valid: false });
  });

  test('rejects incomplete seller registration', async () => {
    await expect(registerSeller({
      email: '',
      fullName: 'Seller',
      userRole: 'seller',
    })).resolves.toMatchObject({
      success: false,
      apiKey: '',
    });
  });

  test('registers a complete seller', async () => {
    await expect(registerSeller({
      email: 'seller@example.com',
      fullName: 'Test Seller',
      businessName: 'Test Store',
      phone: '1234567890',
      password: 'password',
      userRole: 'seller',
    })).resolves.toMatchObject({
      success: true,
      apiKey: 'ECART-SELLER-2026',
    });
  });

  test('returns product copies and an empty result for unknown filters', async () => {
    const products = await getProducts();
    const unknownSeller = await getProductsBySeller('Unknown Store');
    const unknownKey = await getProductsByApiKey('unknown-key');

    expect(products.length).toBeGreaterThan(0);
    expect(unknownSeller).toEqual([]);
    expect(unknownKey).toEqual([]);
  });

  test('filters products by seller key and seller name', async () => {
    const byKey = await getProductsByApiKey('ECART-SELLER-2026');
    const bySeller = await getProductsBySeller('Demo Store');

    expect(byKey.length).toBeGreaterThan(0);
    expect(byKey.every(product => product.sellerApiKey === 'ECART-SELLER-2026')).toBe(true);
    expect(bySeller.length).toBeGreaterThan(0);
  });

  test('creates a product with a generated id', async () => {
    const product = await createProduct({
      name: 'Test Product',
      price: 25,
      category: 'Test',
      image: '',
      desc: '',
      stock: 1,
      seller: 'Test Store',
      sellerApiKey: 'ECART-SELLER-2026',
    });

    expect(product.id).toEqual(expect.any(Number));
    expect(product.name).toBe('Test Product');

    await expect(updateProduct(product.id, { stock: 4 })).resolves.toMatchObject({ stock: 4 });
    await expect(updateProduct(-1, { stock: 4 })).rejects.toThrow('Product -1 not found');

    await expect(removeProduct(product.id)).resolves.toBeUndefined();
  });
});