/**
 * Session and Token Management Utilities
 * Handles token storage, retrieval, and expiration
 */

const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY_KEY = 'user_key';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const TOKEN_EXPIRY_HOURS = 24; // Token expires after 24 hours

/**
 * Store authentication token in localStorage
 * @param token - The authentication token
 * @param expiryHours - Token expiry time in hours (default: 24)
 */
export function storeToken(token: string, expiryHours: number = TOKEN_EXPIRY_HOURS): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  
  // Calculate expiry time
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + expiryHours);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
}

/**
 * Retrieve authentication token from localStorage
 * @returns The stored token or null if not found or expired
 */
export function getToken(): string | null {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  // Check if token has expired
  if (token && expiry) {
    const expiryDate = new Date(expiry);
    if (new Date() > expiryDate) {
      // Token has expired, clear it
      clearToken();
      return null;
    }
    return token;
  }

  return token || null;
}

/**
 * Store user key (seller API key) in localStorage
 * @param userKey - The user/seller key
 */
export function storeUserKey(userKey: string): void {
  localStorage.setItem(USER_KEY_KEY, userKey);
}

/**
 * Retrieve user key from localStorage
 * @returns The stored user key or null if not found
 */
export function getUserKey(): string | null {
  return localStorage.getItem(USER_KEY_KEY);
}

/**
 * Clear all authentication data from localStorage
 */
export function clearToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

/**
 * Check if token is still valid (not expired)
 * @returns True if token is valid, false if expired or not found
 */
export function isTokenValid(): boolean {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return false;

  const expiryDate = new Date(expiry);
  return new Date() <= expiryDate;
}

/**
 * Get remaining time until token expiry
 * @returns Remaining time in milliseconds, or -1 if token is expired or not found
 */
export function getTokenExpiryTime(): number {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiry) return -1;

  const expiryDate = new Date(expiry);
  const now = new Date();
  const remainingTime = expiryDate.getTime() - now.getTime();

  return remainingTime > 0 ? remainingTime : -1;
}

/**
 * Refresh token expiry time (extend session)
 * @param additionalHours - Additional hours to add to expiry (default: 24)
 */
export function refreshTokenExpiry(additionalHours: number = TOKEN_EXPIRY_HOURS): void {
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + additionalHours);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toISOString());
}
