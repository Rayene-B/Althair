import { createServer } from 'node:http';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DB_PATH = join(DATA_DIR, 'althair-db.json');
const LEGACY_DB_PATH = join(DATA_DIR, 'lifeos-db.json');
const PORT = Number(process.env.LIFEOS_API_PORT || 8787);

const defaultCategories = {
  Work: '#62d7ff',
  Study: '#c7ff2e',
  Health: '#ff5fa2',
  Personal: '#a78bfa',
  Finance: '#fbbf24',
  Social: '#34d399',
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function seedData() {
  return {
    categories: defaultCategories,
    events: [],
    tasks: [],
    goals: [],
    studyDeck: {
      settings: {
        studyMinutes: 25,
        breakMinutes: 5,
      },
      tasks: [],
      sessions: [],
    },
  };
}

function normaliseStudyDeck(studyDeck = {}) {
  return {
    settings: {
      studyMinutes: Number(studyDeck.settings?.studyMinutes) || 25,
      breakMinutes: Number(studyDeck.settings?.breakMinutes) || 5,
    },
    tasks: Array.isArray(studyDeck.tasks) ? studyDeck.tasks : [],
    sessions: Array.isArray(studyDeck.sessions) ? studyDeck.sessions : [],
  };
}

function emptyDb() {
  return {
    users: [],
    sessions: [],
    userData: {},
  };
}

function ensureDb() {
  mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(DB_PATH) && existsSync(LEGACY_DB_PATH)) {
    writeFileSync(DB_PATH, readFileSync(LEGACY_DB_PATH));
  }
  if (!existsSync(DB_PATH)) {
    writeFileSync(DB_PATH, JSON.stringify(emptyDb(), null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(readFileSync(DB_PATH, 'utf8').replace(/^\uFEFF/, ''));
}

function writeDb(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function json(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(data));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, user) {
  const attempted = hashPassword(password, user.passwordSalt).hash;
  return timingSafeEqual(Buffer.from(attempted, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

function getToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function getSessionUser(req, db) {
  const token = getToken(req);
  if (!token) return null;
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createSession(db, user) {
  const token = randomBytes(32).toString('hex');
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  return token;
}

function sendSignupEmail(email) {
  // Real email delivery requires SMTP credentials or an email provider API.
  // Configure that later server-side; never expose email credentials in React.
  console.log(`Signup email queued for ${email}: Sign up successful!`);
}

async function route(req, res) {
  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && url.pathname === '/api/auth/signup') {
    const { email, password, confirmPassword } = await parseBody(req);
    const normalisedEmail = String(email || '').trim().toLowerCase();

    if (!normalisedEmail || !password || password.length < 8) {
      return json(res, 400, { message: 'Use a valid email and a password with at least 8 characters.' });
    }
    if (password !== confirmPassword) {
      return json(res, 400, { message: 'Passwords do not match.' });
    }
    if (db.users.some((user) => user.email === normalisedEmail)) {
      return json(res, 409, { message: 'An account already exists for this email.' });
    }

    const passwordRecord = hashPassword(password);
    const user = {
      id: randomBytes(12).toString('hex'),
      email: normalisedEmail,
      passwordHash: passwordRecord.hash,
      passwordSalt: passwordRecord.salt,
      createdAt: new Date().toISOString(),
    };

    db.users.push(user);
    db.userData[user.id] = seedData();
    const token = createSession(db, user);
    writeDb(db);
    sendSignupEmail(normalisedEmail);
    return json(res, 201, { token, user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/login') {
    const { email, password } = await parseBody(req);
    const user = db.users.find((item) => item.email === String(email || '').trim().toLowerCase());
    if (!user || !verifyPassword(password || '', user)) {
      return json(res, 401, { message: 'Email or password is incorrect.' });
    }
    const token = createSession(db, user);
    writeDb(db);
    return json(res, 200, { token, user: publicUser(user) });
  }

  if (req.method === 'GET' && url.pathname === '/api/auth/me') {
    const user = getSessionUser(req, db);
    if (!user) return json(res, 401, { message: 'Not signed in.' });
    return json(res, 200, { user: publicUser(user) });
  }

  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    const token = getToken(req);
    db.sessions = db.sessions.filter((session) => session.token !== token);
    writeDb(db);
    return json(res, 200, { ok: true });
  }

  if (url.pathname === '/api/data') {
    const user = getSessionUser(req, db);
    if (!user) return json(res, 401, { message: 'Not signed in.' });

    if (req.method === 'GET') {
      db.userData[user.id] ||= seedData();
      writeDb(db);
      return json(res, 200, db.userData[user.id]);
    }

    if (req.method === 'PUT') {
      const body = await parseBody(req);
      db.userData[user.id] = {
        events: Array.isArray(body.events) ? body.events : [],
        tasks: Array.isArray(body.tasks) ? body.tasks : [],
        goals: Array.isArray(body.goals) ? body.goals : [],
        categories: body.categories && typeof body.categories === 'object' ? body.categories : defaultCategories,
        studyDeck: normaliseStudyDeck(body.studyDeck),
      };
      writeDb(db);
      return json(res, 200, db.userData[user.id]);
    }
  }

  return json(res, 404, { message: 'Not found.' });
}

const server = createServer((req, res) => {
  route(req, res).catch((error) => {
    console.error(error);
    json(res, 500, { message: 'Server error.' });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Althair API running at http://127.0.0.1:${PORT}`);
});
