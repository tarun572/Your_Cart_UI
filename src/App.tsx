import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Grommet } from 'grommet';
import { store } from './store';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { CartProvider } from './components/CartProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage.tsx';
import RegisterSellerPage from './pages/RegisterSellerPage.tsx';
import ShopPage from './pages/ShopPage.tsx';
import CartPage from './pages/CartPage';

// Re-export hooks for easier access
export { useAuth } from './components/AuthProvider';
export { useCart } from './components/CartProvider';

export const grommetTheme = {
  global: {
    font: { family: "'Segoe UI', sans-serif" },
    colors: { brand: '#4f46e5' },
  },
};

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
