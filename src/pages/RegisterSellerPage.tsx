import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Text } from 'grommet';
import AppHeader from '../components/AppHeader';
import * as mockApi from '../mockApi';
import type { SellerRegistration } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

interface FormState extends SellerRegistration { confirmPassword: string; }

const EMPTY: FormState = {
  fullName: '', email: '', businessName: '', phone: '',
  password: '', confirmPassword: '',
};

export default function RegisterSellerPage() {
  const navigate = useNavigate();
  const [form, setForm]         = useState<FormState>(EMPTY);
  const [errors, setErrors]     = useState<Partial<FormState>>({});
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState<{ apiKey: string; message: string } | null>(null);

  function set<K extends keyof FormState>(field: K, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim())             e.fullName        = 'Full name is required.';
    if (!EMAIL_RE.test(form.email))        e.email           = 'Enter a valid email address.';
    if (!form.businessName.trim())         e.businessName    = 'Business name is required.';
    if (!PHONE_RE.test(form.phone))        e.phone           = 'Enter a valid 10-digit Indian mobile number.';
    if (form.password.length < 8)          e.password        = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await mockApi.registerSeller({
        fullName:     form.fullName,
        email:        form.email,
        businessName: form.businessName,
        phone:        form.phone,
        password:     form.password,
      });
      if (result.success) {
        setSuccess({ apiKey: result.apiKey, message: result.message });
      } else {
        setErrors({ fullName: result.message });
      }
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
              <Text size="xsmall" weight="bold" color="#64748b">YOUR SELLER API KEY</Text>
              <code className="key-code">{success.apiKey}</code>
              <Text size="xsmall" color="#94a3b8">
                Keep this key safe. You'll need it every time you log in as a Seller.
              </Text>
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

        {/* Business Name */}
        <Box className="form-group">
          <label>Business Name *</label>
          <input
            type="text"
            placeholder="e.g. Tarun Electronics"
            value={form.businessName}
            onChange={e => set('businessName', e.target.value)}
          />
          {errors.businessName && <span className="field-error">{errors.businessName}</span>}
        </Box>

        {/* Phone */}
        <Box className="form-group">
          <label>Mobile Number *</label>
          <input
            type="tel"
            placeholder="e.g. 9876543210"
            maxLength={10}
            value={form.phone}
            onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </Box>

        {/* Password row */}
        <Box className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Box className="form-group">
            <label>Password *</label>
            <input
              type="password"
              placeholder="Min 8 chars"
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </Box>
          <Box className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </Box>
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
