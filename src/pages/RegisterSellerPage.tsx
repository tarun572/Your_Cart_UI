import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Text } from 'grommet';
import AppHeader from '../components/AppHeader';
import { registerSeller } from '../api';
import { authActions } from '../store';
import type { SellerRegistration } from '../types';
import type { AppDispatch } from '../store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

interface FormState extends SellerRegistration { confirmPassword: string; }

const EMPTY: FormState = {
  fullName: '', 
  email: '',
  userRole: 'seller',
  confirmPassword: '',
};

export default function RegisterSellerPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [errors, setErrors]     = useState<Partial<FormState>>({});
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<{ userKey: string; message: string; userName: string } | null>(null);

  function set<K extends keyof FormState>(field: K, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim())             e.fullName        = 'Full name is required.';
    if (!EMAIL_RE.test(form.email))        e.email           = 'Enter a valid email address.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await registerSeller({
        fullName:     form.fullName,
        email:        form.email,
        userRole:     'seller',
      });
      
      console.log('Registration result:', result);
      
      if (result.status === 'Success' && result.data && result.data.length > 0) {
        const userData = result.data[0];
        const { user_key, user_name, user_email, token } = userData;
        
        // Store the user key in Redux store
        dispatch(authActions.setUser({
          user: {
            email: user_email,
            name: user_name,
            role: 'seller',
            apiKey: user_key,
          },
          token: token,
          userKey: user_key,
        }));
        
        setSuccess({
          userKey: user_key,
          message: result.message,
          userName: user_name,
        });
      } else {
        setErrors({ fullName: result.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ fullName: error instanceof Error ? error.message : 'An error occurred during registration' });
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <Box style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <AppHeader />
        <Box className="login-screen">
        <Box className="login-card" style={{ width: '100%', maxWidth: '400px' }}>
          <Box className="register-success">
            <Text size="3xl">🎉</Text>
            <Text size="large" weight="bold" color="#10b981">Registration Successful!</Text>
            <Text size="small" color="#475569" margin={{ vertical: 'small' }}>
              {success.message}
            </Text>
            <Box className="api-key-reveal">
              <Text size="xsmall" weight="bold" color="#64748b">SELLER NAME</Text>
              <code className="key-code">{success.userName}</code>
              <Box style={{ backgroundColor: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '1rem', marginTop: '1.25rem' }}>
                <Text size="xsmall" weight="bold" color="#10b981" style={{ marginBottom: '0.5rem' }}>✓ API KEY SENT TO EMAIL</Text>
                <Text size="xsmall" color="#64748b">
                  Your seller API key has been securely sent to your registered email. Check your inbox to retrieve your unique API key for login and product management.
                </Text>
              </Box>
            </Box>
            <button className="btn-primary" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/login')}>
              Go to Login →
            </button>
          </Box>
        </Box>
        </Box>
      </Box>
    );
  }

  /* ── Registration form ── */
  return (
    <Box style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader />
      <Box className="login-screen">
      <Box className="login-card" style={{ width: '100%', maxWidth: '460px' }}>
        {/* Header */}
        <Box direction="row" align="center" gap="small" margin={{ bottom: 'small' }}>
          <Text size="xlarge">🏪</Text>
          <Box>
            <Text size="large" weight="bold">Register as Seller</Text>
            <Text size="small" color="#64748b">Create your Your Cart seller account</Text>
          </Box>
        </Box>

        {/* Full name */}
        <Box className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            placeholder="e.g. Tarun Dubey"
            value={form.fullName}
            onChange={e => set('fullName', e.target.value)}
          />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </Box>

        {/* Email */}
        <Box className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            placeholder="e.g. tarun@mybusiness.com"
            value={form.email}
            onChange={e => set('email', e.target.value)}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </Box>

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <><Spinner /> Registering…</> : '🏪 Create Seller Account'}
        </button>

        <Box align="center" margin={{ top: 'small' }}>
          <Text size="small" color="#64748b">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>Sign in</Link>
          </Text>
        </Box>
      </Box>
      </Box>
    </Box>
  );
}
