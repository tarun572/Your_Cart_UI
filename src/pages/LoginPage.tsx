import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Text } from 'grommet';
import { useAuth } from '../App';
import AppHeader from '../components/AppHeader';
import { loginUser, sendBuyerOtp, verifyBuyerOtp } from '../api';
import { authActions } from '../store';
import type { User } from '../types';
import type { AppDispatch } from '../store';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_LENGTH = 4;
const OTP_DURATION_SECONDS = 5 * 60; // must match OTP_EXPIRY_MINUTES on the server

function Spinner() {
  return <span className="spinner" aria-label="Loading…" />;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
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
  // True when /login-api told us this buyer email exists but has never
  // completed OTP verification (or doesn't exist yet). Shows a
  // "Register / Verify Email" button instead of auto-sending the OTP.
  const [needsRegistration, setNeedsRegistration] = useState(false);

  // ── OTP verification state (buyers only) ──
  const [step, setStep]           = useState<'credentials' | 'otp'>('credentials');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpErr, setOtpErr]       = useState('');
  const [verifying, setVerifying] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [step, secondsLeft]);

  function validateEmail(val: string): string {
    if (!val.trim()) return 'Email is required.';
    if (!EMAIL_RE.test(val)) return 'Please enter a valid email address.';
    return '';
  }

  /** Common success path shared by direct login and OTP verification. */
  function completeLogin(userData: any, loginEmail: string, loginRole: 'seller' | 'buyer') {
    const token = userData.token || '';
    if (!token) {
      setKeyErr('Login succeeded but no authentication token was returned.');
    }

    const name = userData.user_name || loginEmail.split('@')[0].replace(/[._-]/g, ' ');
    const user: User = {
      email: userData.user_email || loginEmail,
      name,
      role: userData.user_role || loginRole,
      isVerified: userData.is_verified,
      ...(loginRole === 'seller' ? { apiKey: userData.user_key } : {}),
    };

    dispatch(authActions.setUser({
      user,
      token,
      userKey: userData.user_key,
      statusCode: 200,
    }));

    login(user);
    navigate('/shop');
  }

  async function handleLogin(loginEmail = email, loginRole = role, loginApiKey = apiKey) {
    const eErr = validateEmail(loginEmail);
    setEmailErr(eErr);
    if (eErr) return;
    if (!loginRole) { alert('Please select a role.'); return; }

    if (loginRole === 'seller' && !loginApiKey.trim()) {
      setKeyErr('API key is required to access the Seller portal.');
      return;
    }

    dispatch(authActions.setLoading(true));
    setLoading(true);
    setKeyErr('');
    setEmailErr('');
    setNeedsRegistration(false);

    try {
      const loginResult = await loginUser(
        loginEmail,
        loginRole,
        loginRole === 'seller' ? loginApiKey : undefined
      );

      if (loginResult.statusCode === 200) {
        const userData = (loginResult as any).data?.[0];
        if (!userData) {
          setKeyErr('Invalid API response structure');
          dispatch(authActions.setError('Invalid response from server'));
        } else {
          completeLogin(userData, loginEmail, loginRole as 'seller' | 'buyer');
        }
        setLoading(false);
        dispatch(authActions.setLoading(false));
        return;
      }

      // Buyer emails that have never completed OTP verification land here.
      // Show the "not verified" message with a Register button instead of
      // silently sending the OTP — the user has to opt in by clicking it.
      const needsVerification = loginRole === 'buyer' && (loginResult as any).requires_verification;
      if (needsVerification) {
        setKeyErr('This email is not registered/verified yet. Please register your email to continue.');
        setNeedsRegistration(true);
        setLoading(false);
        dispatch(authActions.setLoading(false));
        return;
      }

      const errorMsg = loginResult.message || `Login failed with status ${loginResult.statusCode}. Please try again.`;
      setKeyErr(errorMsg);
      dispatch(authActions.setError(errorMsg));
      dispatch(authActions.setStatusCode(loginResult.statusCode || 400));
      setLoading(false);
      dispatch(authActions.setLoading(false));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Login verification failed. Please try again.';
      setKeyErr(errorMsg);
      dispatch(authActions.setError(errorMsg));
      setLoading(false);
      dispatch(authActions.setLoading(false));
    }
  }

  /** Requests a fresh 4 digit OTP and switches the UI into verification mode. */
  async function handleSendOtp(targetEmail = email) {
    const eErr = validateEmail(targetEmail);
    setEmailErr(eErr);
    if (eErr) return;

    setSendingOtp(true);
    setKeyErr('');
    setOtpErr('');
    setNeedsRegistration(false);

    try {
      const result = await sendBuyerOtp(targetEmail);

      if (result.status === 'Success') {
        setStep('otp');
        setOtpDigits(Array(OTP_LENGTH).fill(''));
        setSecondsLeft(OTP_DURATION_SECONDS);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 0);
      } else {
        setKeyErr(result.message || 'Could not send verification code. Please try again.');
      }
    } catch (error) {
      setKeyErr(error instanceof Error ? error.message : 'Could not send verification code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  }

  function handleOtpDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtpDigits(prev => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    setOtpErr('');
    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyOtp();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtpDigits(next);
    otpInputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleVerifyOtp() {
    const otp = otpDigits.join('');
    if (otp.length !== OTP_LENGTH) {
      setOtpErr(`Please enter the ${OTP_LENGTH} digit code.`);
      return;
    }
    if (secondsLeft <= 0) {
      setOtpErr('This code has expired. Please request a new one.');
      return;
    }

    setVerifying(true);
    setOtpErr('');

    try {
      const result = await verifyBuyerOtp(email, otp);
      const userData = (result as any).data?.[0];

      if (result.statusCode === 200 && userData) {
        completeLogin(userData, email, 'buyer');
      } else {
        setOtpErr(result.message || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      setOtpErr(error instanceof Error ? error.message : 'Could not verify code. Please try again.');
    } finally {
      setVerifying(false);
    }
  }

  function handleChangeEmail() {
    setStep('credentials');
    setOtpDigits(Array(OTP_LENGTH).fill(''));
    setOtpErr('');
    setSecondsLeft(0);
    setNeedsRegistration(false);
    setKeyErr('');
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

  const otpBusy = verifying || sendingOtp;

  return (
    <Box style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <AppHeader />

      <Box className="login-screen">
        <Box className="login-card" style={{ width: '100%', maxWidth: '400px' }}>

        {step === 'credentials' && (
          <>
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
                onChange={e => { setEmail(e.target.value); setEmailErr(''); setKeyErr(''); setNeedsRegistration(false); }}
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
                  onClick={() => { setRole('seller'); setKeyErr(''); setNeedsRegistration(false); }}
                >
                  <span className="icon">🏪</span>
                  <span className="title">Seller</span>
                  <span className="desc">List &amp; manage products</span>
                </Box>
                <Box
                  direction="column" align="center"
                  className={`role-card ${role === 'buyer' ? 'active' : ''}`}
                  onClick={() => { setRole('buyer'); setKeyErr(''); setNeedsRegistration(false); }}
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

            {role === 'buyer' && needsRegistration && (
              <Box className="not-verified-box" margin={{ bottom: 'medium' }}>
                <Text size="small" weight="bold" color="#b91c1c">Email not verified</Text>
                <Text size="small" color="#7f1d1d" margin={{ top: 'xsmall', bottom: 'small' }}>
                  {keyErr || 'This email is not registered/verified yet. Please register your email to continue.'}
                </Text>
                <button
                  className="btn-primary"
                  onClick={() => handleSendOtp(email)}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? <><Spinner /> Sending code…</> : '✉️ Register Email & Send OTP'}
                </button>
              </Box>
            )}

            {role === 'buyer' && keyErr && !needsRegistration && (
              <span className="field-error" style={{ display: 'block', marginBottom: '0.75rem' }}>{keyErr}</span>
            )}

            {role === 'buyer' && !needsRegistration && (
              <Text size="xsmall" color="#64748b" margin={{ bottom: 'small' }}>
                First time here? We'll email you a 4 digit code to verify it's really you.
              </Text>
            )}

            {!(role === 'buyer' && needsRegistration) && (
              <>
                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? <><Spinner /> Verifying…</> : 'Enter Your Cart →'}
                </button>
                <button className="btn-guest" onClick={handleGuestLogin} disabled={loading}>
                  Continue as Guest
                </button>
              </>
            )}
          </>
        )}

        {step === 'otp' && (
          <Box className="otp-step">
            <Text as="h2" size="xlarge" weight="bold">Verify your email</Text>
            <Text color="#64748b" size="small" margin={{ bottom: 'medium' }}>
              We sent a {OTP_LENGTH} digit code to <strong>{email}</strong>. Enter it below to continue.
            </Text>

            <Box className="otp-input-group" direction="row" gap="small" justify="center" margin={{ vertical: 'medium' }}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpInputRefs.current[i] = el; }}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpDigitChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  onPaste={handleOtpPaste}
                  disabled={otpBusy}
                  autoFocus={i === 0}
                />
              ))}
            </Box>

            {otpErr && <span className="field-error" style={{ display: 'block', textAlign: 'center', marginBottom: '0.75rem' }}>{otpErr}</span>}

            <Box align="center" margin={{ bottom: 'small' }}>
              <Text size="small" color={secondsLeft > 0 ? '#64748b' : '#dc2626'}>
                {secondsLeft > 0
                  ? `Code expires in ${formatTime(secondsLeft)}`
                  : 'Code expired.'}
              </Text>
            </Box>

            <button className="btn-primary" onClick={handleVerifyOtp} disabled={otpBusy}>
              {verifying ? <><Spinner /> Verifying…</> : 'Verify & Continue →'}
            </button>

            <button
              className="btn-guest"
              onClick={() => handleSendOtp(email)}
              disabled={otpBusy || secondsLeft > 0}
            >
              {sendingOtp ? <><Spinner /> Sending…</> : secondsLeft > 0 ? 'Resend code available after it expires' : 'Resend code'}
            </button>

            <Box align="center" margin={{ top: 'small' }}>
              <Text size="small" color="#64748b">
                Wrong email?{' '}
                <a onClick={handleChangeEmail} style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>
                  Change it
                </a>
              </Text>
            </Box>
          </Box>
        )}

        </Box>
      </Box>
    </Box>
  );
}