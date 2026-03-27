import { useState, useCallback, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Text, Button, Image, Layer, Meter,
} from 'grommet';
import { Close, Cart, Tag as TagIcon } from 'grommet-icons';
import { useAuth, useCart } from '../App';
import AppHeader from '../components/AppHeader';
import * as mockApi from '../mockApi';
import type { Product, User } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────
const PLACEHOLDER = 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Product';
const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Books',
  'Sports', 'Toys', 'Beauty', 'Grocery',
];

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <Box className="toast"><Text>{message}</Text></Box>;
}



// ── Product Detail Layer ──────────────────────────────────────────────────────
interface ProductDetailLayerProps {
  product: Product;
  user: User;
  onClose: () => void;
  onAddToCart: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
}

function ProductDetailLayer({
  product, user, onClose, onAddToCart, onEdit, onDelete, deleting,
}: ProductDetailLayerProps) {
  const isMySelling = user.role === 'seller' && product.sellerApiKey === user.apiKey;
  const stockPct = Math.min(product.stock, 100);

  return (
    <Layer onEsc={onClose} onClickOutside={onClose} modal position="center" animation="fadeIn">
      <Box width={{ max: '640px', min: '320px' }} round="small" overflow="hidden" elevation="large">
        {/* Image header */}
        <Box height="260px" background="light-2" style={{ position: 'relative' }}>
          <Image
            src={product.image || PLACEHOLDER}
            alt={product.name}
            fit="cover"
            fill
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
          <Box style={{ position: 'absolute', top: 12, right: 12 }}>
            <Button
              icon={<Close size="small" />}
              onClick={onClose}
              plain
              style={{
                background: 'rgba(0,0,0,0.5)', color: '#fff',
                borderRadius: '50%', padding: 6, lineHeight: 0,
              }}
            />
          </Box>
          <Box style={{ position: 'absolute', bottom: 12, left: 12 }}>
            <Box pad={{ horizontal: 'small', vertical: 'xsmall' }} background="#4f46e5" round="full">
              <Text size="xsmall" weight="bold" color="white">{product.category}</Text>
            </Box>
          </Box>
        </Box>

        {/* Body */}
        <Box pad="medium" gap="small" background="white">
          <Text size="xlarge" weight="bold" color="#1e293b">{product.name}</Text>

          <Box direction="row" align="center" gap="small">
            <Text size="xxlarge" weight="bold" color="#4f46e5">
              ₹{product.price.toLocaleString('en-IN')}
            </Text>
            <Box
              pad={{ horizontal: 'small', vertical: 'xsmall' }}
              round="full"
              background={product.stock > 0 ? '#dcfce7' : '#fee2e2'}
            >
              <Text size="xsmall" weight="bold" color={product.stock > 0 ? '#16a34a' : '#dc2626'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Text>
            </Box>
          </Box>

          <Box gap="xsmall">
            <Text size="xsmall" color="#64748b">Stock level</Text>
            <Meter
              values={[{ value: stockPct, color: stockPct > 30 ? '#10b981' : '#f59e0b' }]}
              max={100} size="full" thickness="small" round
            />
          </Box>

          {product.desc && (
            <Text size="small" color="#475569" style={{ lineHeight: '1.6' }}>{product.desc}</Text>
          )}

          <Box direction="row" align="center" gap="xsmall">
            <TagIcon size="small" color="#94a3b8" />
            <Text size="xsmall" color="#94a3b8">Sold by {product.seller}</Text>
          </Box>

          <Box direction="row" gap="small" margin={{ top: 'small' }}>
            {user.role === 'buyer' && (
              <Button
                primary
                icon={<Cart size="small" />}
                label="Add to Cart"
                onClick={() => { onAddToCart(product.id); onClose(); }}
                style={{ background: '#4f46e5', border: 'none', borderRadius: 8, flex: 1 }}
                disabled={product.stock === 0}
              />
            )}
            {isMySelling && (
              <>
                <Button
                  label="✏️ Edit"
                  onClick={() => { onEdit(product.id); onClose(); }}
                  style={{ background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: 8, flex: 1 }}
                />
                <Button
                  label={deleting ? 'Deleting…' : '🗑 Delete'}
                  disabled={deleting}
                  onClick={() => { onDelete(product.id); onClose(); }}
                  style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, flex: 1 }}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Layer>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────
interface ProductModalProps {
  editProduct: Product | null;
  onClose: () => void;
  onSubmit: (form: Omit<Product, 'id' | 'seller' | 'sellerApiKey'>) => Promise<void>;
}

function ProductModal({ editProduct, onClose, onSubmit }: ProductModalProps) {
  const [form, setForm] = useState({
    name:     editProduct?.name     ?? '',
    price:    editProduct?.price?.toString()  ?? '',
    category: editProduct?.category ?? '',
    image:    editProduct?.image    ?? '',
    desc:     editProduct?.desc     ?? '',
    stock:    editProduct?.stock?.toString()  ?? '',
  });
  const [imagePreview, setImagePreview] = useState(editProduct?.image ?? '');
  const [submitting, setSubmitting]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      set('image', result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.price || !form.category || !form.stock) {
      alert('Please fill all required fields (Name, Price, Category, Stock).');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(), price: parseFloat(form.price),
        category: form.category, image: form.image,
        desc: form.desc, stock: parseInt(form.stock, 10),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box className="modal-overlay" tag="div">
      <Box className="modal" tag="div" width={"50%"}>
        <Box className="modal-header" direction="row" align="center" justify="between" tag="div" >
          <Text weight="bold" size="large">{editProduct ? '✏️ Edit Product' : '➕ Add New Product'}</Text>
          <button className="modal-close" onClick={onClose}>✕</button>
        </Box>

        <Box className="modal-body" tag="div">
          <Box className="form-row" tag="div">
            <Box className="form-group" tag="div">
              <label>Product Name *</label>
              <input type="text" placeholder="e.g. Wireless Headphones"
                value={form.name} onChange={e => set('name', e.target.value)} />
            </Box>
            <Box className="form-group" tag="div">
              <label>Price (₹) *</label>
              <input type="number" placeholder="e.g. 1999" min="1"
                value={form.price} onChange={e => set('price', e.target.value)} />
            </Box>
          </Box>

          <Box className="form-row" tag="div">
            <Box className="form-group" tag="div">
              <label>Category *</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="">— Select —</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Box>
            <Box className="form-group" tag="div">
              <label>Stock Quantity *</label>
              <input type="number" placeholder="e.g. 50" min="1"
                value={form.stock} onChange={e => set('stock', e.target.value)} />
            </Box>
          </Box>

          <Box className="form-group" tag="div">
            <label>Description</label>
            <textarea placeholder="Brief description…" value={form.desc}
              onChange={e => set('desc', e.target.value)} />
          </Box>

          <Box className="form-group" tag="div">
            <label>Product Image (local file)</label>
            <Box className="image-upload-area" tag="div">
              {imagePreview ? (
                <Box className="image-preview" tag="div">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" className="btn-remove-img"
                    onClick={() => { set('image', ''); setImagePreview(''); }}>
                    ✕ Remove
                  </button>
                </Box>
              ) : (
                <Box className="image-placeholder" tag="div" onClick={() => fileRef.current?.click()}>
                  <Text size="3xl">📁</Text>
                  <Text weight="bold" size="small">Click to upload image</Text>
                  <Text size="xsmall" color="#64748b">PNG, JPG, WEBP supported</Text>
                </Box>
              )}
              <input ref={fileRef} type="file" accept="image/*"
                style={{ display: 'none' }} onChange={handleFileChange} />
              {imagePreview && (
                <button type="button" className="btn-change-img"
                  onClick={() => fileRef.current?.click()}>
                  Change Image
                </button>
              )}
            </Box>
          </Box>
        </Box>

        <Box className="modal-footer" direction="row" justify="end" gap="small" tag="div">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Spinner /> Saving…</> : 'Submit Product'}
          </button>
        </Box>
      </Box>
    </Box>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  user: User;
  onAddToCart: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  deleting: boolean;
  onClick: (p: Product) => void;
}

function ProductCard({ product, user, onAddToCart, onEdit, onDelete, deleting, onClick }: ProductCardProps) {
  const isMySelling = user.role === 'seller' && product.sellerApiKey === user.apiKey;

  return (
    <Box className="product-card">
      {/* Clickable top → opens detail layer */}
      <Box
        className="product-card-clickable"
        onClick={() => onClick(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && onClick(product)}
        aria-label={`View details for ${product.name}`}
      >
        <img
          className="product-img"
          src={product.image || PLACEHOLDER}
          alt={product.name}
          onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
        />
        <Box className="product-body" tag="Box">
          <Text className="product-category">{product.category}</Text>
          <Text className="product-name" weight="bold">{product.name}</Text>
          <Text className="product-desc" size="small" color="#64748b">{product.desc}</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box className="product-body product-card-footer">
        <Box className="product-footer" direction="row" align="center" justify="between" tag="Box">
          <Text className="product-price" weight="bold" color="#4f46e5">
            ₹{product.price.toLocaleString('en-IN')}
          </Text>
          {user.role === 'buyer' && (
            <button className="btn-cart" onClick={() => onAddToCart(product.id)}>Add to Cart</button>
          )}
        </Box>
        <Text className="seller-tag" size="xsmall" color="#64748b">🏪 {product.seller}</Text>
        {isMySelling && (
          <Box className="seller-actions" direction="row" gap="small" tag="Box">
            <button className="btn-edit" onClick={() => onEdit(product.id)}>Edit</button>
            <button className="btn-delete" onClick={() => onDelete(product.id)} disabled={deleting}>
              {deleting ? <Spinner /> : 'Delete'}
            </button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ── Shop Page ─────────────────────────────────────────────────────────────────
export default function ShopPage() {
  // ProtectedRoute guarantees user is non-null on this page
  const { user: maybeUser, logout } = useAuth();
  const user = maybeUser as User;
  const { cart, setCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts]           = useState<Product[]>([]);
  const [productsLoading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editingId, setEditingId]         = useState<number | null>(null);
  const [toast, setToast]                 = useState('');
  const [deletingId, setDeletingId]       = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetch = (user.role === 'seller' && user.apiKey)
      ? mockApi.getProductsByApiKey(user.apiKey)
      : mockApi.getProducts();
    fetch
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.role, user.apiKey]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleLogout() { logout(); navigate('/login'); }

  function openProductModal(id: number | null = null) { setEditingId(id); setModalOpen(true); }
  function closeProductModal() { setModalOpen(false); setEditingId(null); }

  async function handleSubmitProduct(form: Omit<Product, 'id' | 'seller' | 'sellerApiKey'>) {
    if (editingId !== null) {
      const updated = await mockApi.updateProduct(editingId, form);
      setProducts(prev => prev.map(p => p.id === editingId ? updated : p));
      showToast('Product updated!');
    } else {
      const created = await mockApi.createProduct({ ...form, seller: user.name, sellerApiKey: user.apiKey ?? '' });
      // Sellers only see their own products, so always add to list
      setProducts(prev => [...prev, created]);
      showToast('Product added!');
    }
    closeProductModal();
  }

  async function handleDeleteProduct(id: number) {
    setDeletingId(id);
    try {
      await mockApi.removeProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => prev.filter(c => c.id !== id));
      showToast('Product deleted!');
    } finally {
      setDeletingId(null);
    }
  }

  const addToCart = useCallback((id: number) => {
    const prod = products.find(p => p.id === id);
    if (!prod || prod.stock < 1) { showToast('Out of stock!'); return; }
    setCart(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing) {
        if (existing.qty >= prod.stock) { showToast('No more stock available!'); return prev; }
        showToast('Added another to cart!');
        return prev.map(c => c.id === id ? { ...c, qty: c.qty + 1 } : c);
      }
      showToast('Added to cart!');
      return [...prev, { id, qty: 1 }];
    });
  }, [products]);

  const cartCount   = cart.reduce((sum, c) => sum + c.qty, 0);
  const editProduct = editingId !== null ? products.find(p => p.id === editingId) ?? null : null;

  // Buyers see all products; sellers see only their own listings (matched by API key)
  const displayedProducts = (user.role === 'seller' && user.apiKey)
    ? products.filter(p => p.sellerApiKey === user.apiKey)
    : products;

  return (
    <Box fill direction="column" tag="div">
      <AppHeader user={user} cartCount={cartCount} onLogout={handleLogout} />

      <Box className="container" tag="main">
        {/* Seller panel */}
        {user.role === 'seller' && (
          <div className="seller-panel">
            <div className="seller-panel-info">
              <p className="seller-panel-title">🛠️ Seller Admin Panel</p>
              <p className="seller-panel-desc">
                Manage your product listings — add, edit, or remove items from the store.
              </p>
            </div>
            <button className="btn-add-product" onClick={() => openProductModal()}>
              <span className="plus">＋</span> Add New Product
            </button>
          </div>
        )}

        <Text className="section-title" weight="bold" size="large" tag="div">
          {user.role === 'seller' ? '📦 Your Products' : '🛒 Products'}
        </Text>

        {productsLoading ? (
          <Box className="loading-products" direction="row" align="center" gap="small" tag="div">
            <Spinner />
            <Text color="#64748b">Loading products…</Text>
          </Box>
        ) : (
          <Box className="products-grid" direction='row'>
            {displayedProducts.length === 0 ? (
              <Box className="empty-products" align="center" tag="div">
                <Text size="3xl">📦</Text>
                <Text color="#64748b">
                  {user.role === 'seller' ? 'You have no products listed yet.' : 'No products available.'}
                </Text>
              </Box>
            ) : (
              displayedProducts.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  user={user}
                  onAddToCart={addToCart}
                  onEdit={openProductModal}
                  onDelete={handleDeleteProduct}
                  deleting={deletingId === p.id}
                  onClick={setDetailProduct}
                />
              ))
            )}
          </Box>
        )}
      </Box>

      {modalOpen && (
        <ProductModal
          editProduct={editProduct}
          onClose={closeProductModal}
          onSubmit={handleSubmitProduct}
        />
      )}

      {detailProduct && (
        <ProductDetailLayer
          product={detailProduct}
          user={user}
          onClose={() => setDetailProduct(null)}
          onAddToCart={id => { addToCart(id); setDetailProduct(null); }}
          onEdit={id => { openProductModal(id); setDetailProduct(null); }}
          onDelete={id => { handleDeleteProduct(id); setDetailProduct(null); }}
          deleting={deletingId === detailProduct.id}
        />
      )}

      <Toast message={toast} />
    </Box>
  );
}
