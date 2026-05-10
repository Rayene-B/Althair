const TOKEN_KEY = 'althair-auth-token';
const LEGACY_TOKEN_KEY = 'lifeos-auth-token';
const ACCOUNTS_KEY = 'althair-saved-accounts';
const LOCAL_USERS_KEY = 'althair-local-users';
const LOCAL_SESSIONS_KEY = 'althair-local-sessions';
const LOCAL_DATA_KEY = 'althair-local-user-data';

const defaultCategories = {
  Work: '#62d7ff',
  Study: '#c7ff2e',
  Health: '#ff5fa2',
  Personal: '#a78bfa',
  Finance: '#fbbf24',
  Social: '#34d399',
};

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
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function shouldUseLocalFallback(error) {
  return error?.status === 404 || error?.status === 405 || error instanceof TypeError;
}

function readLocalJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createLocalSeedData() {
  return {
    categories: defaultCategories,
    events: [],
    tasks: [],
    goals: [],
  };
}

async function hashLocalPassword(password) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function publicLocalUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    localOnly: true,
  };
}

function createLocalSession(userId) {
  const token = `local:${crypto.randomUUID()}`;
  const sessions = readLocalJson(LOCAL_SESSIONS_KEY, []);
  writeLocalJson(LOCAL_SESSIONS_KEY, [
    ...sessions.filter((session) => session.userId !== userId),
    {
      token,
      userId,
      createdAt: new Date().toISOString(),
    },
  ]);
  return token;
}

function getLocalUserFromToken(token = getAuthToken()) {
  if (!token?.startsWith('local:')) return null;
  const sessions = readLocalJson(LOCAL_SESSIONS_KEY, []);
  const session = sessions.find((item) => item.token === token);
  if (!session) return null;
  const users = readLocalJson(LOCAL_USERS_KEY, []);
  return users.find((user) => user.id === session.userId) || null;
}

async function localSignup(email, password, confirmPassword) {
  const normalisedEmail = String(email || '').trim().toLowerCase();
  if (!normalisedEmail || !password || password.length < 8) {
    throw new Error('Use a valid email and a password with at least 8 characters.');
  }
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  const users = readLocalJson(LOCAL_USERS_KEY, []);
  if (users.some((user) => user.email === normalisedEmail)) {
    throw new Error('An account already exists for this email.');
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalisedEmail,
    passwordHash: await hashLocalPassword(password),
    createdAt: new Date().toISOString(),
  };
  writeLocalJson(LOCAL_USERS_KEY, [...users, user]);

  const allData = readLocalJson(LOCAL_DATA_KEY, {});
  writeLocalJson(LOCAL_DATA_KEY, {
    ...allData,
    [user.id]: createLocalSeedData(),
  });

  const token = createLocalSession(user.id);
  return { token, user: publicLocalUser(user) };
}

async function localLogin(email, password) {
  const normalisedEmail = String(email || '').trim().toLowerCase();
  const users = readLocalJson(LOCAL_USERS_KEY, []);
  const user = users.find((item) => item.email === normalisedEmail);
  if (!user) {
    throw new Error('No deployed account exists for this email on this browser. Create the account once on this deployed version.');
  }
  if (user.passwordHash !== (await hashLocalPassword(password || ''))) {
    throw new Error('Password is incorrect for this browser-local account.');
  }

  const token = createLocalSession(user.id);
  return { token, user: publicLocalUser(user) };
}

async function localResetPassword(email, password) {
  const normalisedEmail = String(email || '').trim().toLowerCase();
  if (!normalisedEmail || !password || password.length < 8) {
    throw new Error('Use a valid email and a password with at least 8 characters.');
  }

  const users = readLocalJson(LOCAL_USERS_KEY, []);
  const user = users.find((item) => item.email === normalisedEmail);
  if (!user) {
    return localSignup(normalisedEmail, password, password);
  }

  const passwordHash = await hashLocalPassword(password);
  const nextUsers = users.map((item) =>
    item.id === user.id
      ? {
          ...item,
          passwordHash,
        }
      : item,
  );
  writeLocalJson(LOCAL_USERS_KEY, nextUsers);

  const token = createLocalSession(user.id);
  return { token, user: publicLocalUser(user) };
}

function loadLocalUserData() {
  const user = getLocalUserFromToken();
  if (!user) throw new Error('Not signed in.');
  const allData = readLocalJson(LOCAL_DATA_KEY, {});
  const data = allData[user.id] || createLocalSeedData();
  writeLocalJson(LOCAL_DATA_KEY, {
    ...allData,
    [user.id]: data,
  });
  return data;
}

function saveLocalUserData(data) {
  const user = getLocalUserFromToken();
  if (!user) throw new Error('Not signed in.');
  const allData = readLocalJson(LOCAL_DATA_KEY, {});
  const nextData = {
    events: Array.isArray(data.events) ? data.events : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    goals: Array.isArray(data.goals) ? data.goals : [],
    categories: data.categories && typeof data.categories === 'object' ? data.categories : defaultCategories,
  };
  writeLocalJson(LOCAL_DATA_KEY, {
    ...allData,
    [user.id]: nextData,
  });
  return nextData;
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
  let data;
  try {
    data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, confirmPassword }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    data = await localSignup(email, password, confirmPassword);
  }
  setAuthToken(data.token);
  saveAccountSession(data.user, data.token);
  return data;
}

export async function login(email, password) {
  let data;
  try {
    data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    data = await localLogin(email, password);
  }
  setAuthToken(data.token);
  saveAccountSession(data.user, data.token);
  return data;
}

export async function resetLocalPassword(email, password) {
  const data = await localResetPassword(email, password);
  setAuthToken(data.token);
  saveAccountSession(data.user, data.token);
  return data;
}

export async function getCurrentUser() {
  const localUser = getLocalUserFromToken();
  if (localUser) return publicLocalUser(localUser);

  try {
    const data = await request('/auth/me');
    return data.user;
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    throw new Error('Not signed in.');
  }
}

export async function logout() {
  const token = getAuthToken();
  await request('/auth/logout', { method: 'POST' }).catch(() => {});
  if (token?.startsWith('local:')) {
    const sessions = readLocalJson(LOCAL_SESSIONS_KEY, []);
    writeLocalJson(LOCAL_SESSIONS_KEY, sessions.filter((session) => session.token !== token));
  }
  clearAuthToken();
}

export async function logoutToken(token) {
  await request('/auth/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {});
  if (token?.startsWith('local:')) {
    const sessions = readLocalJson(LOCAL_SESSIONS_KEY, []);
    writeLocalJson(LOCAL_SESSIONS_KEY, sessions.filter((session) => session.token !== token));
  }
}

export async function loadUserData() {
  if (getAuthToken()?.startsWith('local:')) return loadLocalUserData();
  try {
    return await request('/data');
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return loadLocalUserData();
  }
}

export async function saveUserData(data) {
  if (getAuthToken()?.startsWith('local:')) return saveLocalUserData(data);
  try {
    return await request('/data', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return saveLocalUserData(data);
  }
}
