import { Box, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';

interface AppHeaderProps {
  user?: User;
  cartCount?: number;
  onLogout?: () => void;
}

export default function AppHeader({ user, cartCount = 0, onLogout }: AppHeaderProps) {
  const navigate = useNavigate();
  return (
    <Box tag="nav" className="navbar" direction="row" align="center" justify="between">
      <button
        className="logo"
        type="button"
        aria-label="Your Cart home"
        onClick={() => user && navigate('/shop')}
      >
        <img src="/your-cart-icon.svg" alt="Your Cart" />
        <span>Your <span>Cart</span></span>
      </button>

      {user && (
        <Box direction="row" align="center" gap="small">
          <Box direction="row" align="center" gap="xsmall" className="user-badge">
            <Text className="user-name" size="small" weight="bold" color="#fff">{user.name}</Text>
            <Text className={`role-pill ${user.role}`} size="xsmall">
              {user.role === 'seller' ? 'Seller' : 'Buyer'}
            </Text>
          </Box>

          {user.role === 'buyer' && (
            <button className="cart-btn" onClick={() => navigate('/cart')} title="View Cart">
              🛒
              <span className="cart-badge">{cartCount}</span>
            </button>
          )}

          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </Box>
      )}
    </Box>
  );
}
