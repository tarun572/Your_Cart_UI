import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Grommet } from 'grommet';
import { store } from './store';
import type { User } from './types';
import type { CartItem } from './types';
import LoginPage from './pages/LoginPage.tsx';
import RegisterSellerPage from './pages/RegisterSellerPage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import CartPage from './pages/CartPage';

export const grommetTheme = {
  global: {
    font: { family: "'Segoe UI', sans-serif" },
    colors: { brand: '#4f46e5' },
  },
};

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// ── Cart Context ──────────────────────────────────────────────────────────────
interface CartCtx {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const CartContext = createContext<CartCtx | null>(null);

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, login: (u) => setUser(u), logout: () => setUser(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage when a buyer logs in (or clear on logout)
  useEffect(() => {
    if (user?.role === 'buyer' && user.email) {
      try {
        const saved = localStorage.getItem(`cart_${user.email}`);
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      }
    } else {
      setCart([]);
    }
  }, [user?.email]);

  // Persist cart to localStorage on every change (buyers only)
  useEffect(() => {
    if (user?.role === 'buyer' && user.email) {
      localStorage.setItem(`cart_${user.email}`, JSON.stringify(cart));
    }
  }, [cart, user?.email, user?.role]);

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Provider store={store}>
      <Grommet theme={grommetTheme} full>
        <BrowserRouter>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register-seller" element={<RegisterSellerPage />} />
                <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
                <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </Grommet>
    </Provider>
  );
}
