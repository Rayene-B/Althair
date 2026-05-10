const TOKEN_KEY = 'althair-auth-token';
const LEGACY_TOKEN_KEY = 'lifeos-auth-token';
const ACCOUNTS_KEY = 'althair-saved-accounts';

export function getAuthToken() {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  if (token && !localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return token;
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}

export function getSavedAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveAccountSession(user, token) {
  const accounts = getSavedAccounts().filter((account) => account.user.id !== user.id);
  const next = [...accounts, { user, token }];
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  return next;
}

export function removeAccountSession(userId) {
  const next = getSavedAccounts().filter((account) => account.user.id !== userId);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(next));
  return next;
}

export function switchAuthToken(token) {
  setAuthToken(token);
}

export async function signup(email, password, confirmPassword) {
  const data = await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, confirmPassword }),
  });
  setAuthToken(data.token);
  saveAccountSession(data.user, data.token);
  return data;
}

export async function login(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  saveAccountSession(data.user, data.token);
  return data;
}

export async function getCurrentUser() {
  const data = await request('/auth/me');
  return data.user;
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' }).catch(() => {});
  clearAuthToken();
}

export async function logoutToken(token) {
  await request('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {});
}

export async function loadUserData() {
  return request('/data');
}

export async function saveUserData(data) {
  return request('/data', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
