const { getSql, sendError } = require('./_db');
const { requireAuth } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAuth(req, res)) return;
  try {
    const sql = getSql();
    await sql`UPDATE machines SET status='completed', finish_at=NULL, updated_at=now()
              WHERE status='busy' AND finish_at IS NOT NULL AND finish_at <= now()`;
    await sql`UPDATE transactions SET status='completed', completed_at=COALESCE(completed_at, now())
              WHERE status='running' AND finish_at IS NOT NULL AND finish_at <= now()`;

    const machines = await sql`SELECT * FROM machines ORDER BY id`;
    const services = await sql`SELECT * FROM services ORDER BY created_at, id`;
    const transactions = await sql`
      SELECT t.*, s.name AS service_name
      FROM transactions t
      LEFT JOIN services s ON s.id=t.service_id
      ORDER BY t.created_at DESC
      LIMIT 1000`;

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ machines, services, transactions });
  } catch (error) {
    return sendError(res, error);
  }
};
