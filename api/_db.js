const { neon } = require('@neondatabase/serverless');

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL belum dikonfigurasi di Vercel');
  }
  return neon(process.env.DATABASE_URL);
}

function sendError(res, error, status = 500) {
  console.error(error);
  res.status(status).json({ error: error.message || 'Internal server error' });
}

module.exports = { getSql, sendError };
