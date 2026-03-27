/**
 * mockApi.ts
 * Simulates a REST API with artificial network delays.
 * The correct seller API key is:  ECART-SELLER-2026
 */
import type { Product, ApiKeyResult, SellerRegistration, SellerRegistrationResult } from './types';

// ── In-memory "database" ───────────────────────────────────────────────────────────
let db: Product[] = [
  {
    id: 1001,
    name: 'Wireless Headphones',
    price: 1999,
    category: 'Electronics',
    image: 'https://picsum.photos/seed/headphones/400/300',
    desc: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    stock: 25,
    seller: 'Demo Store',
    sellerApiKey: 'ECART-SELLER-2026',
  },
  {
    id: 1002,
    name: 'Running Sneakers',
    price: 2499,
    category: 'Fashion',
    image: 'https://picsum.photos/seed/sneakers/400/300',
    desc: 'Lightweight and breathable running shoes for everyday performance',
    stock: 40,
    seller: 'Demo Store',
    sellerApiKey: 'ECART-SELLER-2026',
  },
  {
    id: 1003,
    name: 'Stainless Steel Bottle',
    price: 599,
    category: 'Home & Kitchen',
    image: 'https://picsum.photos/seed/bottle/400/300',
    desc: '1-litre insulated bottle, keeps drinks cold for 24 h or hot for 12 h',
    stock: 60,
    seller: 'Demo Store',
    sellerApiKey: 'ECART-SELLER-2026',
  },
    {
    id: 1003,
    name: 'Stainless Steel Bottle',
    price: 599,
    category: 'Home & Kitchen',
    image: 'https://picsum.photos/seed/bottle/400/300',
    desc: '1-litre insulated bottle, keeps drinks cold for 24 h or hot for 12 h',
    stock: 60,
    seller: 'Demo Store',
    sellerApiKey: 'ECART-SELLER-2026',
  },

    {
    id: 1003,
    name: 'Stainless Steel Bottle',
    price: 599,
    category: 'Home & Kitchen',
    image: 'https://picsum.photos/seed/bottle/400/300',
    desc: '1-litre insulated bottle, keeps drinks cold for 24 h or hot for 12 h',
    stock: 60,
    seller: 'Demo Store',
    sellerApiKey: 'ECART-SELLER-2025',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────
const VALID_SELLER_KEYS = new Set(['ECART-SELLER-2026', 'ECART-SELLER-2025']);
const delay = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

// ── Auth ──────────────────────────────────────────────────────────────────
/** POST /api/auth/seller-key  – validate the seller API key */
export async function validateSellerKey(key: string): Promise<ApiKeyResult> {
  await delay(700);
  return { valid: VALID_SELLER_KEYS.has(key.trim()) };
}

/** POST /api/auth/register-seller – register a new seller account */
export async function registerSeller(
  data: SellerRegistration,
): Promise<SellerRegistrationResult> {
  await delay(900);
  // Mock: validate basic fields then return the demo API key
  if (!data.email || !data.fullName || !data.businessName || !data.phone || !data.password) {
    return { success: false, apiKey: '', message: 'All fields are required.' };
  }
  return {
    success: true,
    apiKey: 'ECART-SELLER-2026',
    message: `Welcome, ${data.fullName}! Your seller account is ready. Use your API key to log in.`,
  };
}

// ── Products ─────────────────────────────────────────────────────────────────
/** GET /api/products */
export async function getProducts(): Promise<Product[]> {
  await delay(500);
  return db.map(p => ({ ...p }));
}

/** GET /api/products?seller=:name */
export async function getProductsBySeller(sellerName: string): Promise<Product[]> {
  await delay(500);
  return db.filter(p => p.seller === sellerName).map(p => ({ ...p }));
}

/** GET /api/products?apiKey=:key  – filter by the seller's API key */
export async function getProductsByApiKey(apiKey: string): Promise<Product[]> {
  await delay(500);
  return db.filter(p => p.sellerApiKey === apiKey).map(p => ({ ...p }));
}

/** POST /api/products */
export async function createProduct(
  product: Omit<Product, 'id'>,
): Promise<Product> {
  await delay(500);
  const newProduct: Product = { id: Date.now(), ...product };
  db = [...db, newProduct];
  return { ...newProduct };
}

/** PUT /api/products/:id */
export async function updateProduct(
  id: number,
  updates: Partial<Omit<Product, 'id'>>,
): Promise<Product> {
  await delay(400);
  const idx = db.findIndex(p => p.id === id);
  if (idx === -1) throw new Error(`Product ${id} not found`);
  db[idx] = { ...db[idx], ...updates };
  return { ...db[idx] };
}

/** DELETE /api/products/:id */
export async function removeProduct(id: number): Promise<void> {
  await delay(300);
  db = db.filter(p => p.id !== id);
}
