const { isConfigured, safeEqual, verifySession, setSessionCookie, clearSessionCookie } = require('./_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    const session = verifySession(req);
    return res.status(200).json({ configured: isConfigured(), authenticated: session.authenticated, username: session.username });
  }

  if (req.method === 'POST') {
    if (!isConfigured()) return res.status(503).json({ error: 'Login admin belum dikonfigurasi di Vercel' });
    const { username, password } = req.body || {};
    const ok = safeEqual(username, process.env.ADMIN_USERNAME) && safeEqual(password, process.env.ADMIN_PASSWORD);
    if (!ok) return res.status(401).json({ error: 'Username atau password salah' });
    setSessionCookie(res, process.env.ADMIN_USERNAME);
    return res.status(200).json({ ok: true, username: process.env.ADMIN_USERNAME });
  }

  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
