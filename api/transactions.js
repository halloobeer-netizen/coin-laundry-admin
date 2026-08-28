const { getSql, sendError } = require('./_db');
const { requireAuth } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  if (!requireAuth(req, res)) return;
  try {
    const sql=getSql();
    const b=req.body||{};
    if (!b.machine_id || !b.service_id || !b.payment_method || b.total_amount == null) {
      return res.status(400).json({ error:'Data transaksi belum lengkap' });
    }

    const machineRows=await sql`SELECT * FROM machines WHERE id=${b.machine_id}`;
    if (!machineRows.length) return res.status(404).json({error:'Mesin tidak ditemukan'});

    const machine=machineRows[0];
    if (machine.status !== 'available') return res.status(409).json({error:'Mesin tidak tersedia'});

    const duration=Number(b.duration_minutes || machine.duration_minutes || 35);
    const finishAt=new Date(Date.now()+duration*60000).toISOString();
    const cashReceived=b.cash_received==null?null:Number(b.cash_received);
    const change=cashReceived==null?null:Math.max(cashReceived-Number(b.total_amount),0);

    const results = await sql.transaction([
      sql`INSERT INTO transactions
        (machine_id,service_id,customer_note,weight_kg,package_count,payment_method,cash_received,change_amount,coin_count,total_amount,status,finish_at)
        VALUES (${b.machine_id},${b.service_id},${b.customer_note??null},${b.weight_kg??null},${b.package_count||1},${b.payment_method},${cashReceived},${change},${b.coin_count||1},${b.total_amount},'running',${finishAt}) RETURNING *`,
      sql`UPDATE machines SET status='busy', finish_at=${finishAt}, updated_at=now() WHERE id=${b.machine_id} RETURNING *`
    ]);

    const insertedRows = results?.[0] || [];
    const result = insertedRows[0];
    if (!result) return res.status(500).json({ error:'Transaksi gagal dibuat' });

    return res.status(201).json(result);
  } catch(error){ return sendError(res,error); }
};
