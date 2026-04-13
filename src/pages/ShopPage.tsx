import { useState, useCallback, useEffect, useRef, ChangeEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Text, Button, Image, Layer, Meter,
} from 'grommet';
import { Close, Cart, Tag as TagIcon } from 'grommet-icons';
import { useAuth, useCart } from '../App';
import AppHeader from '../components/AppHeader';
import * as mockApi from '../mockApi';
import * as api from '../api';
import type { Product, User } from '../types';
import type { RootState, AppDispatch } from '../store';
import { productsActions } from '../store';

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const isMySelling = user.role === 'seller' && product.seller === user.email;
  const stockPct = Math.min(product.stock, 100);
  
  // Get all images - combine main image and additional images
  const allImages = product.images && product.images.length > 0 
    ? product.images 
    : [product.image || PLACEHOLDER];
  
  const currentImage = allImages[selectedImageIndex] || PLACEHOLDER;
console.log("333333:", product);
  return (
    <Layer onEsc={onClose} onClickOutside={onClose} modal position="center" animation="fadeIn">
      <Box width={{ max: '640px', min: '320px' }} round="small" overflow="hidden" elevation="large">
        {/* Image gallery header */}
        <Box height="260px" background="light-2" style={{ position: 'relative' }}>
          <Image
            src={currentImage}
            alt={`${product.name} - Image ${selectedImageIndex + 1}`}
            fit="cover"
            fill
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).src = PLACEHOLDER;
            }}
          />
          
          {/* Close button */}
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
          
          {/* Category badge */}
          <Box style={{ position: 'absolute', bottom: 12, left: 12 }}>
            <Box pad={{ horizontal: 'small', vertical: 'xsmall' }} background="#4f46e5" round="full">
              <Text size="xsmall" weight="bold" color="white">{product.category}</Text>
            </Box>
          </Box>

          {/* Image counter */}
          {allImages.length > 1 && (
            <Box style={{ position: 'absolute', bottom: 12, right: 12 }}>
              <Box pad={{ horizontal: 'small', vertical: 'xsmall' }} background="rgba(0,0,0,0.7)" round="full">
                <Text size="xsmall" weight="bold" color="white">
                  {selectedImageIndex + 1} / {allImages.length}
                </Text>
              </Box>
            </Box>
          )}

          {/* Previous button */}
          {allImages.length > 1 && (
            <Box
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedImageIndex(prev => (prev - 1 + allImages.length) % allImages.length)}
              pad="small"
              background="rgba(0,0,0,0.5)"
              round="full"
            >
              <Text weight="bold" color="white" style={{ fontSize: '18px' }}>‹</Text>
            </Box>
          )}

          {/* Next button */}
          {allImages.length > 1 && (
            <Box
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedImageIndex(prev => (prev + 1) % allImages.length)}
              pad="small"
              background="rgba(0,0,0,0.5)"
              round="full"
            >
              <Text weight="bold" color="white" style={{ fontSize: '18px' }}>›</Text>
            </Box>
          )}
        </Box>

        {/* Thumbnail carousel (if multiple images) */}
        {allImages.length > 1 && (
          <Box
            direction="row"
            overflow={{ horizontal: 'auto' }}
            gap="xsmall"
            pad="small"
            background="#f8f9fa"
            style={{ scrollBehavior: 'smooth' }}
          >
            {allImages.map((img, index) => (
              <Box
                key={index}
                height="60px"
                width="60px"
                onClick={() => setSelectedImageIndex(index)}
                style={{
                  cursor: 'pointer',
                  flexShrink: 0,
                  border: selectedImageIndex === index ? '3px solid #4f46e5' : '2px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                />
              </Box>
            ))}
          </Box>
        )}

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
  onSubmit: (form: {
    name: string;
    price: number;
    category: string;
    desc: string;
    stock: number;
    image: File | string;
    images?: (File | string)[]; // Multiple images
    apiKey: string;
  }) => Promise<void>;
}

function ProductModal({ editProduct, onClose, onSubmit }: ProductModalProps) {
  const [form, setForm] = useState({
    name: editProduct?.name ?? '',
    price: editProduct?.price?.toString() ?? '',
    category: editProduct?.category ?? '',
    desc: editProduct?.desc ?? '',
    stock: editProduct?.stock?.toString() ?? '',
    apiKey: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(editProduct?.image ?? '');
  const [additionalImages, setAdditionalImages] = useState<(File | string)[]>(editProduct?.images ?? []);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>(
    editProduct?.images?.filter(img => typeof img === 'string') ?? []
  );
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof typeof form>(field: K, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the file for upload
    setImageFile(file);

    // Create preview for display
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleMultipleFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newImages: (File | string)[] = [...additionalImages];
    const newPreviews: string[] = [...additionalPreviews];

    Array.from(files).forEach(file => {
      newImages.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = ev => {
        const result = ev.target?.result as string;
        newPreviews.push(result);
        setAdditionalPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setAdditionalImages(newImages);
  }

  function removeAdditionalImage(index: number) {
    setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    setAdditionalPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.price || !form.category || !form.stock || !form.apiKey.trim()) {
      alert('Please fill all required fields (Name, Price, Category, Stock, Seller Key).');
      return;
    }
    if (!imageFile && !imagePreview && !editProduct) {
      alert('Please upload a product image.');
      return;
    }
    setSubmitting(true);
    try {
      const imageData: File | string = imageFile || imagePreview || '';
      const submitForm = {
        name: form.name.trim(),
        price: parseFloat(form.price),
        category: form.category,
        image: imageData,
        images: additionalImages.length > 0 ? additionalImages : undefined, // Include additional images
        desc: form.desc,
        stock: parseInt(form.stock, 10),
        apiKey: form.apiKey.trim(),
      };
      await onSubmit(submitForm);
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
            <label>Seller Key (API Key) *</label>
            <input type="text" placeholder="Enter your seller API key"
              value={form.apiKey} onChange={e => set('apiKey', e.target.value)} />
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
                    onClick={() => { setImageFile(null); setImagePreview(''); }}>
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

          <Box className="form-group" tag="div">
            <label>Additional Product Images (Gallery)</label>
            <Box className="image-upload-area" tag="div">
              {additionalPreviews.length > 0 ? (
                <Box tag="div" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                  {additionalPreviews.map((preview, idx) => (
                    <Box key={idx} style={{ position: 'relative' }}>
                      <img src={preview} alt={`Additional ${idx + 1}`} style={{ 
                        width: '100%', 
                        height: '80px', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #ddd'
                      }} />
                      <button type="button" onClick={() => removeAdditionalImage(idx)} style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>✕</button>
                    </Box>
                  ))}
                  <Box onClick={() => multiFileRef.current?.click()} style={{
                    width: '100%',
                    height: '80px',
                    border: '2px dashed #4f46e5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: '#f3f4f6'
                  }}>
                    <Text size="2xl" style={{ color: '#4f46e5' }}>+</Text>
                  </Box>
                </Box>
              ) : (
                <Box onClick={() => multiFileRef.current?.click()} className="image-placeholder" tag="div">
                  <Text size="3xl">🖼️</Text>
                  <Text weight="bold" size="small">Click to add more images</Text>
                  <Text size="xsmall" color="#64748b">Make your product stand out with multiple photos</Text>
                </Box>
              )}
              <input ref={multiFileRef} type="file" accept="image/*" multiple
                style={{ display: 'none' }} onChange={handleMultipleFilesChange} />
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

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const { items: products, loading: productsLoading } = useSelector(
    (state: RootState) => state.products
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  useEffect(() => {
    dispatch(productsActions.setProductsLoading(true));
    const userEmail = user.email || '';
    
    console.log('📍 useEffect triggered, fetching products for email:', userEmail);
    
    // Fetch products using real API with user email
    api.getProductsByEmail(userEmail)
      .then(data => {
        console.log('✅ Products fetched from API:', data);
        console.log('📊 Total products:', data.length);
        dispatch(productsActions.setProducts(data));
        dispatch(productsActions.setProductsLoading(false));
      })
      .catch((error) => {
        console.error('❌ Error loading products:', error);
        dispatch(productsActions.setProductsError(error instanceof Error ? error.message : 'Failed to load products'));
        dispatch(productsActions.setProductsLoading(false));
      });
  }, [user.email, dispatch]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  function handleLogout() { logout(); navigate('/login'); }

  function openProductModal(id: number | null = null) { setEditingId(id); setModalOpen(true); }
  function closeProductModal() { setModalOpen(false); setEditingId(null); }

  async function handleSubmitProduct(form: {
    name: string;
    price: number;
    category: string;
    desc: string;
    stock: number;
    image: File | string;
    apiKey: string;
  }) {
    try {
      console.log('📋 handleSubmitProduct called with:', form);
      console.log('🔍 editingId:', editingId, ', user.apiKey:', user.apiKey, ', user.email:', user.email);
      
      if (editingId !== null) {
        console.log('✏️ Editing existing product:', editingId);
        
        const userKey: string = form.apiKey || user.apiKey || '';
        const userEmail: string = user.email || '';
        
        if (!userKey || !userEmail) {
          console.error('❌ Missing seller info for edit:', { userKey, userEmail });
          showToast('Seller information is missing! Please provide seller key.');
          return;
        }

        // Prepare product data for edit
        const productData = {
          name: form.name,
          price: form.price,
          category: form.category,
          desc: form.desc,
          stock: form.stock,
          image: undefined as File | undefined,
        };

        // Handle image if it's a File object
        if (typeof form.image === 'object' && form.image instanceof File) {
          productData.image = form.image;
        }

        console.log('🔑 Using edit credentials:', { userKey: userKey.substring(0, 10) + '...', userEmail });
        const response = await api.editProductApi(editingId, userEmail, userKey, productData);
        
        if (response.status === 'Success' || response.status === 'success') {
          console.log('✅ Product edit success');
          // Update the local product with new data
          const updated: Product = {
            id: editingId,
            name: form.name,
            price: form.price,
            category: form.category,
            desc: form.desc,
            stock: form.stock,
            image: form.image as string,
            seller: user.email,
            sellerApiKey: userKey,
          };
          dispatch(productsActions.updateProduct(updated));
          showToast('✅ Product updated!');
        } else {
          console.error('❌ API returned error:', response.message);
          showToast('❌ ' + (response.message || 'Failed to update product'));
          return;
        }
      } else {
        console.log('➕ Creating new product');
        // Create new product using real API
        
        // Get user_key from form input (seller provides it)
        const userKey: string = form.apiKey;
        const userEmail: string = user.email || '';
        
        if (!userKey || !userEmail) {
          console.error('❌ Missing seller info:', { userKey, userEmail });
          showToast('Seller information is missing! Please check seller key and login again.');
          return;
        }

        console.log('🔑 Using credentials from form:', { userKey: userKey.substring(0, 10) + '...', userEmail });
        console.log('📦 Building FormData...');
        const formData = new FormData();
        formData.append('user_email', userEmail);
        formData.append('user_key', userKey);
        formData.append('name', form.name);
        formData.append('price', form.price.toString());
        formData.append('category', form.category);
        formData.append('desc', form.desc || '');
        formData.append('stock', form.stock.toString());

        // Handle image upload
        if (typeof form.image !== 'string') {
          console.log('🖼️ Image is a File object:', form.image);
          // It's a File object
          formData.append('image', form.image);
        } else if (form.image.startsWith('data:')) {
          console.log('🖼️ Image is base64, converting to Blob...');
          // Convert base64 to Blob
          const base64Data = form.image.split(',')[1];
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          formData.append('image', blob, 'product-image.jpg');
        } else {
          console.warn('⚠️ Image is neither File nor base64:', form.image);
        }

        console.log('🚀 Calling api.insertProduct with user_key header...');
        console.log('📤 Request headers will include:', { user_key: userKey.substring(0, 10) + '...' });
        const response = await api.insertProduct(formData, userKey, userEmail);
        console.log('✅ API Response:', response);

        // Check if API returned success
        if (response.status !== 'Success' || !response.data) {
          console.error('❌ API returned error:', response.message);
          showToast(response.message || 'Failed to add product');
          return;
        }

        console.log('🎉 Product created successfully, creating Redux entry...');
        // Create product object from response
        const created: Product = {
          id: response.data.product_id || Date.now(),
          name: response.data.name,
          price: response.data.price,
          category: response.data.category,
          image: response.data.image,
          desc: response.data.desc || '',
          stock: response.data.stock,
          seller: response.data.seller,
          sellerApiKey: userKey,

        };

        dispatch(productsActions.addProduct(created));
        showToast('Product added!');
      }
      closeProductModal();
    } catch (error) {
      console.error('❌ Error submitting product:', error);
      showToast('Error saving product. Please try again.');
    }
  }

  async function handleDeleteProduct(id: number) {
    setDeletingId(id);
    try {
      const product = products.find(p => p.id === id);
      console.log("products @@@@@" , products);
      if (!product) {
        showToast('Product not found');
        return;
      }

      const userKey = user.apiKey || '';
      const userEmail = user.email || '';

      if (!userKey || !userEmail) {
        console.error('❌ Missing seller info for delete:', { userKey, userEmail });
        showToast('Seller information is missing! Please login again.');
        return;
      }

      console.log('🗑️ Deleting product:', product.name);
      const response = await api.deleteProductApi(id, userEmail, userKey);
      
      if (response.status === 'Success' || response.status === 'success') {
        console.log('✅ Product deleted via API');
        dispatch(productsActions.removeProduct(id));
        setCart(prev => prev.filter(c => c.id !== id));
        showToast('✅ Product deleted!');
      } else {
        showToast('❌ ' + (response.message || 'Failed to delete product'));
      }
    } catch (error) {
      console.error('❌ Error deleting product:', error);
      showToast('Error deleting product. Please try again.');
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

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);
  const editProduct = editingId !== null ? products.find(p => p.id === editingId) ?? null : null;

  // Buyers see all products; sellers see only their own listings (matched by seller email)
  const displayedProducts = Array.isArray(products) 
    ? (user.role === 'seller')
      ? (products.filter(p => p.seller === user.email) || [])
      : products
    : [];

  console.log('📋 Products state:', { 
    isArray: Array.isArray(products),
    totalProducts: Array.isArray(products) ? products.length : 0,
    userRole: user.role,
    userEmail: user.email,
    displayedCount: displayedProducts.length,
    displayedProducts,
  });

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
