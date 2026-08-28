const { getSql, sendError } = require('./_db');

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'POST') {
      const { id, type, capacity_kg, status='available', duration_minutes=35, note=null } = req.body || {};
      if (!id || !type || !capacity_kg) return res.status(400).json({ error: 'Data mesin belum lengkap' });
      const finishAt = status === 'busy' ? new Date(Date.now() + Number(duration_minutes)*60000).toISOString() : null;
      const rows = await sql`INSERT INTO machines (id,type,capacity_kg,status,duration_minutes,note,finish_at)
        VALUES (${id},${type},${capacity_kg},${status},${duration_minutes},${note},${finishAt}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PATCH') {
      const { id, type, capacity_kg, status, duration_minutes, note } = req.body || {};
      if (!id) return res.status(400).json({ error: 'ID mesin wajib ada' });
      const currentRows = await sql`SELECT * FROM machines WHERE id=${id}`;
      if (!currentRows.length) return res.status(404).json({ error: 'Mesin tidak ditemukan' });
      const current = currentRows[0];
      const nextStatus = status ?? current.status;
      const nextDuration = duration_minutes ?? current.duration_minutes;
      const finishAt = nextStatus === 'busy'
        ? (current.status === 'busy' && current.finish_at ? current.finish_at : new Date(Date.now() + Number(nextDuration)*60000).toISOString())
        : null;
      const rows = await sql`UPDATE machines SET
        type=${type ?? current.type}, capacity_kg=${capacity_kg ?? current.capacity_kg},
        status=${nextStatus}, duration_minutes=${nextDuration}, note=${note !== undefined ? note : current.note},
        finish_at=${finishAt}, updated_at=now() WHERE id=${id} RETURNING *`;
      if (nextStatus === 'completed') {
        await sql`UPDATE transactions SET status='completed', completed_at=COALESCE(completed_at,now())
                  WHERE machine_id=${id} AND status='running'`;
      }
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id);
      if (!id) return res.status(400).json({ error: 'ID mesin wajib ada' });
      const running = await sql`SELECT 1 FROM transactions WHERE machine_id=${id} AND status='running' LIMIT 1`;
      if (running.length) return res.status(409).json({ error: 'Mesin masih memiliki transaksi berjalan' });
      await sql`DELETE FROM machines WHERE id=${id}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return sendError(res, error);
  }
};
