import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Text } from 'grommet';
import { useAuth } from '../App';
import AppHeader from '../components/AppHeader';
import * as mockApi from '../mockApi';
import type { User } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

export default function LoginPage() {
  const { login } = useAuth();
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

  async function handleSubmit() {
    const eErr = validateEmail(email);
    setEmailErr(eErr);
    if (eErr) return;
    if (!role) { alert('Please select a role.'); return; }

    if (role === 'seller') {
      if (!apiKey.trim()) { setKeyErr('API key is required to access the Seller portal.'); return; }
      setLoading(true);
      setKeyErr('');
      try {
        const { valid } = await mockApi.validateSellerKey(apiKey);
        if (!valid) { setKeyErr('Invalid API key. Access denied.'); setLoading(false); return; }
      } catch {
        setKeyErr('Verification failed. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    const name = email.split('@')[0].replace(/[._-]/g, ' ');
    const user: User = { email, name, role, ...(role === 'seller' ? { apiKey } : {}) };
    login(user);
    navigate('/shop');
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
        </Box>
      </Box>
    </Box>
  );
}
