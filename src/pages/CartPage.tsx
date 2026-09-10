import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text } from 'grommet';
import { useAuth, useCart } from '../App';
import AppHeader from '../components/AppHeader';
import * as api from '../api';
import type { Product, User } from '../types';

const PLACEHOLDER = 'https://placehold.co/400x300/e0e7ff/4f46e5?text=Product';

function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

export default function CartPage() {
  const { user: maybeUser, logout } = useAuth();
  const user = maybeUser as User;
  const { cart, setCart } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [done, setDone]         = useState(false);

  useEffect(() => {
    api.getProductsByEmail(user.email)
      .then(data => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [user.email]);

  function changeQty(id: number, delta: number) {
    const prod = products.find(p => String(p.id) === String(id));
    setCart(prev => prev.reduce<typeof prev>((acc, item) => {
      if (item.id !== id) return [...acc, item];
      const newQty = item.qty + delta;
      if (newQty < 1) return acc;
      if (prod && newQty > prod.stock) return [...acc, item];
      return [...acc, { ...item, qty: newQty }];
    }, []));
  }

  function checkout() {
    setCart([]);
    setDone(true);
  }

  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((sum, item) => {
    const p = products.find(prod => String(prod.id) === String(item.id));
    return p ? sum + p.price * item.qty : sum;
  }, 0);

  function handleLogout() { logout(); navigate('/login'); }

  /* ── Success screen ── */
  if (done) {
    return (
      <Box style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <AppHeader user={user} cartCount={0} onLogout={handleLogout} />
        <Box className="login-screen">
          <Box className="login-card" style={{ textAlign: 'center', maxWidth: 400 }}>
            <Text size="4xl">🎉</Text>
            <Text size="large" weight="bold" color="#10b981" margin={{ top: 'small' }}>
              Order Placed!
            </Text>
            <Text color="#64748b" size="small" margin={{ vertical: 'small' }}>
              Thank you for shopping with Your Cart. Your order is being processed.
            </Text>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/shop')}>
              ← Back to Shop
            </button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader user={user} cartCount={cartCount} onLogout={handleLogout} />

      <div style={{ "maxWidth": "1200px", padding: '2rem 1.5rem' }}>
        {/* Page title */}
        <div className="cart-page-header">
          <button className="btn-back" onClick={() => navigate('/shop')}>← Continue Shopping</button>
          
        </div>

        {loading ? (
          <Box direction="row" align="center" gap="small" justify="center">
            <Spinner /><Text color="#64748b">Loading…</Text>
          </Box>
        ) : cart.length === 0 ? (
          <Box className="cart-page-empty">
            <Text size="3xl">🛍️</Text>
            <Text size="large" weight="bold" margin={{ top: 'small' }}>Your cart is empty</Text>
            <Text color="#64748b" size="small">Go add some products!</Text>
            <button className="btn-primary" style={{ marginTop: '1.25rem', width: 'auto', padding: '10px 28px' }} onClick={() => navigate('/shop')}>
              Browse Products
            </button>
          </Box>
        ) : (
          <div className="cart-page-layout">
            <Text size="xlarge" weight="bold">🛒 Cart</Text>
            {/* Items list */}
            <div className="cart-page-items">

              {cart.map(item => {
                const prod = products.find(p => String(p.id) === String(item.id));
                if (!prod) return null;
                const lineTotal = prod.price * item.qty;
                return (
                  <div key={item.id} className="cart-page-item">
                    <img
                      className="cart-page-item-img"
                      src={prod.image || PLACEHOLDER}
                      alt={prod.name}
                      onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                    />
                    <div className="cart-page-item-info">
                      <Text weight="bold" size="medium">{prod.name}</Text>
                      <Text size="xsmall" color="#64748b">{prod.category} · 🏪 {prod.seller}</Text>
                      <Text size="small" color="#4f46e5" weight="bold" margin={{ top: 'xsmall' }}>
                        ₹{prod.price.toLocaleString('en-IN')} each
                      </Text>
                    </div>
                    <div className="cart-page-item-right">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => changeQty(item.id, -1)}>−</button>
                        <span className="qty-val">{item.qty}</span>
                        <button className="qty-btn" onClick={() => changeQty(item.id, +1)}>+</button>
                      </div>
                      <Text weight="bold" color="#1e293b">
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </Text>
                      <button className="btn-delete" style={{ marginTop: '.5rem', padding: '4px 12px' }}
                        onClick={() => setCart(prev => prev.filter(c => c.id !== item.id))}>
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="cart-page-summary">
              <Text weight="bold" size="large" margin={{ bottom: 'small' }}>Order Summary</Text>
              <div className="cart-summary-row">
                <Text color="#64748b">Items ({cartCount})</Text>
                <Text>₹{total.toLocaleString('en-IN')}</Text>
              </div>
              <div className="cart-summary-row">
                <Text color="#64748b">Delivery</Text>
                <Text color="#10b981" weight="bold">FREE</Text>
              </div>
              <hr className="cart-summary-divider" />
              <div className="cart-summary-row">
                <Text weight="bold" size="medium">Total</Text>
                <Text weight="bold" size="large" color="#4f46e5">₹{total.toLocaleString('en-IN')}</Text>
              </div>
              <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={checkout}>
                Proceed to Checkout →
              </button>
            </div>
          </div>
        )}
      </div>
    </Box>
  );
}
