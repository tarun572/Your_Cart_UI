import {
  clearToken,
  getToken,
  getTokenExpiryTime,
  getUserKey,
  isTokenValid,
  refreshTokenExpiry,
  storeToken,
  storeUserKey,
} from '../src/sessionManager';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

describe('sessionManager', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  test('stores and retrieves a token and seller key', () => {
    storeToken('token-123');
    storeUserKey('seller-key-123');

    expect(getToken()).toBe('token-123');
    expect(getUserKey()).toBe('seller-key-123');
    expect(isTokenValid()).toBe(true);
    expect(getTokenExpiryTime()).toBeGreaterThan(0);
  });

  test('clears expired tokens automatically', () => {
    storeToken('expired-token', -1);

    expect(getToken()).toBeNull();
    expect(isTokenValid()).toBe(false);
    expect(getTokenExpiryTime()).toBe(-1);
  });

  test('handles token and validity checks when expiry metadata is absent', () => {
    expect(getToken()).toBeNull();
    expect(isTokenValid()).toBe(false);
    expect(getTokenExpiryTime()).toBe(-1);

    localStorage.setItem('auth_token', 'token-without-expiry');

    expect(getToken()).toBe('token-without-expiry');
    expect(isTokenValid()).toBe(false);
    expect(getTokenExpiryTime()).toBe(-1);
  });

  test('refreshes an existing session expiry', () => {
    storeToken('token-123', 1);
    const previousExpiry = localStorage.getItem('token_expiry');

    refreshTokenExpiry(24);

    expect(localStorage.getItem('token_expiry')).not.toBe(previousExpiry);
    expect(getTokenExpiryTime()).toBeGreaterThan(0);

    refreshTokenExpiry();
    expect(getTokenExpiryTime()).toBeGreaterThan(0);
  });

  test('returns -1 for expired expiry metadata', () => {
    localStorage.setItem('token_expiry', new Date(Date.now() - 1000).toISOString());

    expect(getTokenExpiryTime()).toBe(-1);
  });

  test('clears all session data', () => {
    storeToken('token-123');
    storeUserKey('seller-key-123');

    clearToken();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_key')).toBeNull();
    expect(localStorage.getItem('token_expiry')).toBeNull();
  });
});
