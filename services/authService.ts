/**
 * Auth service: Magic link authentication via backend + Resend
 */

const BACKEND_URL = import.meta.env.VITE_TELEGRAM_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'cryptopulse_session_token';
const EMAIL_KEY = 'cryptopulse_user_email';

export interface AuthState {
  isAuthenticated: boolean;
  email: string | null;
  loading: boolean;
}

/** Send magic link to email. Returns bypass token if special code/email used. */
export async function sendMagicLink(email: string): Promise<{ success: boolean; message: string; bypassToken?: string }> {
  const resp = await fetch(`${BACKEND_URL}/api/auth/send-link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.detail || data.message || 'Ошибка отправки');
  }

  // Bypass: backend returns token directly
  if (data.message === '__bypass__' && data.session_token) {
    return { success: true, message: '__bypass__', bypassToken: data.session_token };
  }

  return { success: data.success, message: data.message };
}

/** Verify magic link token and get session */
export async function verifyToken(token: string): Promise<{ success: boolean; email: string; sessionToken: string }> {
  const resp = await fetch(`${BACKEND_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.detail || data.message || 'Ссылка недействительна');
  }

  // Save session
  if (data.session_token) {
    localStorage.setItem(TOKEN_KEY, data.session_token);
    localStorage.setItem(EMAIL_KEY, data.email);
  }

  return { success: true, email: data.email, sessionToken: data.session_token };
}

/** Check if user is authenticated (validate stored token) */
export async function checkAuth(): Promise<AuthState> {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return { isAuthenticated: false, email: null, loading: false };
  }

  try {
    const resp = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json();

    if (data.authenticated) {
      return { isAuthenticated: true, email: data.email, loading: false };
    }

    // Token invalid — clear storage
    logout();
    return { isAuthenticated: false, email: null, loading: false };
  } catch {
    // Network error — use cached email as fallback (offline-first)
    const email = localStorage.getItem(EMAIL_KEY);
    if (email) {
      return { isAuthenticated: true, email, loading: false };
    }
    return { isAuthenticated: false, email: null, loading: false };
  }
}

/** Logout: clear session */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

/** Get stored session token (for API calls if needed) */
export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
