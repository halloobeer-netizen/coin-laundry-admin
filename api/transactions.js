const { getSql, sendError } = require('./_db');
const { requireAuth } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });
  if (!requireAuth(req, res)) return;

  try {
    const sql = getSql();
    const b = req.body || {};

    if (!b.machine_id || !b.service_id || !b.payment_method) {
      return res.status(400).json({ error:'Data transaksi belum lengkap' });
    }

    if (!['Cash', 'QRIS'].includes(b.payment_method)) {
      return res.status(400).json({ error:'Metode pembayaran tidak valid' });
    }

    const machineRows = await sql`SELECT * FROM machines WHERE id=${b.machine_id}`;
    if (!machineRows.length) return res.status(404).json({ error:'Mesin tidak ditemukan' });

    const machine = machineRows[0];
    if (machine.status !== 'available') {
      return res.status(409).json({ error:'Mesin tidak tersedia' });
    }

    const serviceRows = await sql`SELECT * FROM services WHERE id=${b.service_id}`;
    if (!serviceRows.length) return res.status(404).json({ error:'Layanan tidak ditemukan' });

    const service = serviceRows[0];
    if (service.is_active === false) {
      return res.status(409).json({ error:'Layanan sedang tidak aktif' });
    }
    if (service.machine_type !== machine.type) {
      return res.status(400).json({ error:'Layanan tidak sesuai dengan jenis mesin' });
    }

    const price = Number(service.price);
    const duration = Number(service.duration_minutes || machine.duration_minutes || 35);
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(duration) || duration <= 0) {
      return res.status(500).json({ error:'Konfigurasi layanan tidak valid' });
    }

    const rawWeight = b.weight_kg == null ? null : Number(b.weight_kg);
    let weight = rawWeight;
    let packageCount = 1;
    let coinCount = 1;
    let totalAmount = price;

    if (service.unit === 'kg') {
      if (!Number.isFinite(rawWeight) || rawWeight <= 0) {
        return res.status(400).json({ error:'Berat laundry wajib lebih dari 0 kg' });
      }
      totalAmount = price * rawWeight;
    } else if (service.unit === 'package' && Number(service.package_weight_kg) > 0) {
      const packageWeight = Number(service.package_weight_kg);
      if (!Number.isFinite(rawWeight) || rawWeight <= 0) {
        return res.status(400).json({ error:'Berat laundry wajib lebih dari 0 kg' });
      }
      packageCount = Math.max(1, Math.ceil(rawWeight / packageWeight));
      coinCount = packageCount;
      totalAmount = price * packageCount;
    } else {
      weight = machine.type === 'Dryer' ? null : rawWeight;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(500).json({ error:'Total transaksi tidak valid' });
    }

    let cashReceived = null;
    let change = null;
    if (b.payment_method === 'Cash') {
      cashReceived = Number(b.cash_received);
      if (!Number.isFinite(cashReceived) || cashReceived < totalAmount) {
        return res.status(400).json({ error:'Uang diterima kurang dari total transaksi' });
      }
      change = cashReceived - totalAmount;
    }

    const finishAt = new Date(Date.now() + duration * 60000).toISOString();

    const results = await sql.transaction([
      sql`INSERT INTO transactions
        (machine_id,service_id,customer_note,weight_kg,package_count,payment_method,cash_received,change_amount,coin_count,total_amount,status,finish_at)
        VALUES (${b.machine_id},${service.id},${b.customer_note??null},${weight},${packageCount},${b.payment_method},${cashReceived},${change},${coinCount},${totalAmount},'running',${finishAt}) RETURNING *`,
      sql`UPDATE machines SET status='busy', finish_at=${finishAt}, updated_at=now() WHERE id=${b.machine_id} RETURNING *`
    ]);

    const insertedRows = results?.[0] || [];
    const result = insertedRows[0];
    if (!result) return res.status(500).json({ error:'Transaksi gagal dibuat' });

    return res.status(201).json(result);
  } catch(error) {
    return sendError(res, error);
  }
};
