import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Text } from 'grommet';
import { useAuth } from '../App';
import AppHeader from '../components/AppHeader';
import { loginUser } from '../api';
import { authActions } from '../store';
import type { User } from '../types';
import type { AppDispatch } from '../store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

export default function LoginPage() {
  const { login } = useAuth();
  const dispatch = useDispatch() as unknown as AppDispatch;
  const navigate = useNavigate();

  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState<'seller' | 'buyer' | ''>('');
  const [apiKey, setApiKey] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [keyErr, setKeyErr]     = useState('');
  const [loading, setLoading]   = useState(false);

  function validateEmail(val: string): string {
    if (!val.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(val)) return 'Please enter a valid email address.';
    return '';
  }

  async function handleLogin(loginEmail = email, loginRole = role, loginApiKey = apiKey) {
    const eErr = validateEmail(loginEmail);
    setEmailErr(eErr);
    if (eErr) return;
    if (!loginRole) { alert('Please select a role.'); return; }

    if (loginRole === 'seller') {
      if (!loginApiKey.trim()) {
        setKeyErr('API key is required to access the Seller portal.'); 
        return; 
      }
    }

    // Set loading state in Redux
    dispatch(authActions.setLoading(true));
    setLoading(true);
    setKeyErr('');
    setEmailErr('');

    try {
      // Call login API from api.ts
      const loginResult = await loginUser(
        loginEmail,
        loginRole,
        loginRole === 'seller' ? loginApiKey : undefined
      );

      // Check if response status is 200
      if (loginResult.statusCode === 200) {
        // API returns data as an array, extract from data[0]
        const userData = (loginResult as any).data?.[0];
        
        if (!userData) {
          setKeyErr('Invalid API response structure');
          dispatch(authActions.setError('Invalid response from server'));
          setLoading(false);
          dispatch(authActions.setLoading(false));
          return;
        }

        const token = userData.token || '';
        if (!token) {
          setKeyErr('Login succeeded but no authentication token was returned.');
        }
        
        const name = userData.user_name || loginEmail.split('@')[0].replace(/[._-]/g, ' ');
        const user: User = { 
          email: userData.user_email || loginEmail,
          name, 
          role: userData.user_role || loginRole,
          ...(loginRole === 'seller' ? { apiKey: userData.user_key } : {})
        };

        // Dispatch user, token, user_key, and status code to Redux store
        dispatch(authActions.setUser({
          user,
          token: token,
          userKey: userData.user_key,
          statusCode: loginResult.statusCode,
        }));

        // Also call the context login for backward compatibility
        login(user);

        // Navigate to shop on successful login (status 200)
        navigate('/shop');
      } else {
        // Response status is not 200
        const errorMsg = loginResult.message || `Login failed with status ${loginResult.statusCode}. Please try again.`;
        setKeyErr(errorMsg);
        dispatch(authActions.setError(errorMsg));
        dispatch(authActions.setStatusCode(loginResult.statusCode || 400));
        setLoading(false);
        dispatch(authActions.setLoading(false));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login verification failed. Please try again.';
      setKeyErr(errorMsg);
      dispatch(authActions.setError(errorMsg));
      setLoading(false);
      dispatch(authActions.setLoading(false));
    }
  }

  function handleSubmit() {
    return handleLogin();
  }

  function handleGuestLogin() {
    setEmail('guest@gmail.com');
    setRole('buyer');
    setApiKey('');
    return handleLogin('guest@gmail.com', 'buyer');
  }

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader />

      <Box className="login-screen">
        <Box className="login-card" style={{ width: '100%', maxWidth: '400px' }}>
        <Text as="h2" size="xlarge" weight="bold">Welcome to Your Cart</Text>
        <Text color="#64748b" size="small" margin={{ bottom: 'medium' }}>
          Sign in and choose your role to continue.
        </Text>

        {/* Email */}
        <Box className="form-group">
          <label>Your Email Address</label>
          <input
            type="email"
            placeholder="e.g. tarun.dubey@example.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
            onBlur={() => setEmailErr(validateEmail(email))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          {emailErr && <span className="field-error">{emailErr}</span>}
        </Box>

        {/* Role selector */}
        <Box className="form-group">
          <label>Select Role</label>
          <Box className="role-selector" direction='row'>
            <Box
              direction="column" align="center"
              className={`role-card ${role === 'seller' ? 'active' : ''}`}
              onClick={() => { setRole('seller'); setKeyErr(''); }}
            >
              <span className="icon">🏪</span>
              <span className="title">Seller</span>
              <span className="desc">List &amp; manage products</span>
            </Box>
            <Box
              direction="column" align="center"
              className={`role-card ${role === 'buyer' ? 'active' : ''}`}
              onClick={() => setRole('buyer')}
            >
              <span className="icon">🛍️</span>
              <span className="title">Buyer</span>
              <span className="desc">Browse &amp; buy products</span>
            </Box>
          </Box>
        </Box>

        {/* Seller API key – only appears when Seller is selected */}
        {role === 'seller' && (
          <Box className="form-group api-key-group">
            <label>
              Seller API Key
              <span className="api-key-hint">
                Demo key: <code>ECART-SELLER-2026</code>
              </span>
            </label>
            <input
              type="password"
              placeholder="Enter your seller API key…"
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setKeyErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoComplete="off"
            />
            {keyErr && <span className="field-error">{keyErr}</span>}

            {/* ── Register as Seller button ── */}
            <Box margin={{ top: 'small' }}>
              <Link to="/register-seller" className="btn-register-seller">
                📋 Register as Seller
              </Link>
            </Box>
          </Box>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <><Spinner /> Verifying…</> : 'Enter Your Cart →'}
        </button>
        <button className="btn-guest" onClick={handleGuestLogin} disabled={loading}>
          Continue as Guest
        </button>
        </Box>
      </Box>
    </Box>
  );
}
