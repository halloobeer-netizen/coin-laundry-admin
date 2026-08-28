const crypto = require('crypto');

const COOKIE_NAME = 'cw_session';
const MAX_AGE = 60 * 60 * 12;

function isConfigured() {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET);
}

function safeEqual(a, b) {
  const aa = crypto.createHash('sha256').update(String(a ?? '')).digest();
  const bb = crypto.createHash('sha256').update(String(b ?? '')).digest();
  return crypto.timingSafeEqual(aa, bb);
}

function sign(value) {
  return crypto.createHmac('sha256', process.env.AUTH_SECRET).update(value).digest('base64url');
}

function createSession(username) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function parseCookies(req) {
  return String(req.headers.cookie || '').split(';').reduce((out, item) => {
    const i = item.indexOf('=');
    if (i > -1) out[item.slice(0, i).trim()] = decodeURIComponent(item.slice(i + 1).trim());
    return out;
  }, {});
}

function verifySession(req) {
  if (!isConfigured()) return { authenticated: false, username: null };
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return { authenticated: false, username: null };
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return { authenticated: false, username: null };
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.username || !data.exp || Number(data.exp) <= Date.now()) return { authenticated: false, username: null };
    return { authenticated: true, username: data.username };
  } catch (_) {
    return { authenticated: false, username: null };
  }
}

function setSessionCookie(res, username) {
  const token = createSession(username);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function requireAuth(req, res) {
  if (!isConfigured()) return true;
  const session = verifySession(req);
  if (session.authenticated) return true;
  res.status(401).json({ error: 'Sesi login tidak valid atau sudah berakhir' });
  return false;
}

module.exports = { isConfigured, safeEqual, verifySession, setSessionCookie, clearSessionCookie, requireAuth };
