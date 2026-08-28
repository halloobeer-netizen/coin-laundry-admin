const { getSql, sendError } = require('./_db');

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();
    if (req.method === 'POST') {
      const b=req.body||{};
      if (!b.id || !b.name || !b.machine_type || b.price == null) return res.status(400).json({ error:'Data layanan belum lengkap' });
      const rows=await sql`INSERT INTO services (id,name,machine_type,price,unit,package_weight_kg,duration_minutes,is_active,note)
        VALUES (${b.id},${b.name},${b.machine_type},${b.price},${b.unit||'package'},${b.package_weight_kg??null},${b.duration_minutes||35},${b.is_active!==false},${b.note??null}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    if (req.method === 'PATCH') {
      const b=req.body||{};
      if (!b.id) return res.status(400).json({ error:'ID layanan wajib ada' });
      const old=await sql`SELECT * FROM services WHERE id=${b.id}`;
      if (!old.length) return res.status(404).json({ error:'Layanan tidak ditemukan' });
      const s=old[0];
      const rows=await sql`UPDATE services SET name=${b.name??s.name}, machine_type=${b.machine_type??s.machine_type},
        price=${b.price??s.price}, unit=${b.unit??s.unit}, package_weight_kg=${b.package_weight_kg!==undefined?b.package_weight_kg:s.package_weight_kg},
        duration_minutes=${b.duration_minutes??s.duration_minutes}, is_active=${b.is_active!==undefined?b.is_active:s.is_active},
        note=${b.note!==undefined?b.note:s.note}, updated_at=now() WHERE id=${b.id} RETURNING *`;
      return res.status(200).json(rows[0]);
    }
    if (req.method === 'DELETE') {
      const id=req.query.id;
      if (!id) return res.status(400).json({ error:'ID layanan wajib ada' });
      const used=await sql`SELECT 1 FROM transactions WHERE service_id=${id} LIMIT 1`;
      if (used.length) return res.status(409).json({ error:'Layanan sudah dipakai transaksi; nonaktifkan saja agar riwayat tetap aman' });
      await sql`DELETE FROM services WHERE id=${id}`;
      return res.status(200).json({ok:true});
    }
    return res.status(405).json({ error:'Method not allowed' });
  } catch(error){ return sendError(res,error); }
};
