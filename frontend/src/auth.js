const TOKEN_STORAGE_KEY = "product_support_token";
const USER_STORAGE_KEY = "product_support_user";

// In production (Vercel), VITE_API_BASE_URL points to the Render backend.
// In local dev, Vite proxy rewrites /api → localhost:5000.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || "";
}

export function getStoredUser() {
  const data = localStorage.getItem(USER_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setStoredSession(token, user) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  if (user) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export async function loginWithCredentials(identifier, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  setStoredSession(data.token, data.user);
  return data;
}

export async function registerWithCredentials({ name, username, email, password, role = "user" }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username, email, password, role }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  setStoredSession(data.token, data.user);
  return data;
}

export async function loginWithDemo(role = "admin") {
  const res = await fetch(`${API_BASE}/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Demo login failed");
  }

  setStoredSession(data.token, data.user);
  return data;
}

export async function checkSession() {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      clearStoredSession();
      return null;
    }

    const data = await res.json();
    setStoredSession(token, data.user);
    return data.user;
  } catch {
    return getStoredUser();
  }
}

export function logout() {
  clearStoredSession();
}
