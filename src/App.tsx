import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Grommet, Box } from 'grommet';
import { store } from './store';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { CartProvider, useCart } from './components/CartProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';
import LoginPage from './pages/LoginPage.tsx';
import RegisterSellerPage from './pages/RegisterSellerPage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import CartPage from './pages/CartPage';
import type { CartItem } from './types';

// Re-export hooks for easier access
export { useAuth } from './components/AuthProvider';
export { useCart } from './components/CartProvider';

export const grommetTheme = {
  global: {
    font: { family: "'Segoe UI', sans-serif" },
    colors: { brand: '#4f46e5' },
  },
};

/**
 * Main App Layout - Includes chatbot on protected pages
 */
function AppLayout() {
  const { user } = useAuth();
  const { cart } = useCart();

  return (
    <Box>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-seller" element={<RegisterSellerPage />} />
        <Route path="/shop" element={<ProtectedRoute><ShopPage /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Chatbot - Only show on protected routes */}
      {user && (
        <Chatbot
          userRole={user.role as 'buyer' | 'seller'}
          cartCount={(cart as CartItem[]).reduce((sum: number, c: CartItem) => sum + c.qty, 0)}
        />
      )}
    </Box>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Grommet theme={grommetTheme} full>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AuthProvider>
            <CartProvider>
              <AppLayout />
            </CartProvider>
          </AuthProvider>
        </BrowserRouter>
      </Grommet>
    </Provider>
  );
}
