import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import type { CartItem } from '../types';

interface CartCtx {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const CartContext = createContext<CartCtx | null>(null);

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [hydratedCartKey, setHydratedCartKey] = useState<string | null>(null);

  // Load cart from localStorage when a buyer logs in (or clear on logout)
  useEffect(() => {
    const cartKey = user?.role === 'buyer' && user.email
      ? `cart_${user.email}`
      : null;

    setHydratedCartKey(null);

    if (cartKey) {
      try {
        const saved = localStorage.getItem(cartKey);
        setCart(saved ? JSON.parse(saved) : []);
      } catch {
        setCart([]);
      }
      setHydratedCartKey(cartKey);
    } else {
      setCart([]);
    }
  }, [user?.email, user?.role]);

  // Persist cart to localStorage on every change (buyers only)
  useEffect(() => {
    const cartKey = user?.role === 'buyer' && user.email
      ? `cart_${user.email}`
      : null;

    if (cartKey && hydratedCartKey === cartKey) {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, hydratedCartKey, user?.email, user?.role]);

  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
}
