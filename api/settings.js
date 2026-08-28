const { getSql, sendError } = require('./_db');

const DEFAULTS = {
  outlet_name: 'Clean Wash Laundry',
  branch_name: 'Outlet Merdeka',
  address: '',
  phone: '',
  whatsapp: '',
  cashier_name: 'Admin 01',
  receipt_footer: 'Terima kasih telah menggunakan layanan kami.',
  currency: 'IDR',
  token_label: 'Koin / Token'
};

module.exports = async function handler(req, res) {
  try {
    const sql = getSql();

    if (req.method === 'GET') {
      const rows = await sql`SELECT value FROM app_settings WHERE key='outlet' LIMIT 1`;
      const value = rows.length ? rows[0].value : DEFAULTS;
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ...DEFAULTS, ...value });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = req.body || {};
      const value = {
        outlet_name: String(body.outlet_name || DEFAULTS.outlet_name).trim(),
        branch_name: String(body.branch_name || DEFAULTS.branch_name).trim(),
        address: String(body.address || '').trim(),
        phone: String(body.phone || '').trim(),
        whatsapp: String(body.whatsapp || '').trim(),
        cashier_name: String(body.cashier_name || DEFAULTS.cashier_name).trim(),
        receipt_footer: String(body.receipt_footer || DEFAULTS.receipt_footer).trim(),
        currency: 'IDR',
        token_label: String(body.token_label || DEFAULTS.token_label).trim()
      };
      if (!value.outlet_name || !value.branch_name) {
        return res.status(400).json({ error: 'Nama outlet dan nama cabang wajib diisi' });
      }
      const rows = await sql`INSERT INTO app_settings (key,value,updated_at)
        VALUES ('outlet',${JSON.stringify(value)}::jsonb,now())
        ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=now()
        RETURNING value`;
      return res.status(200).json(rows[0].value);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return sendError(res, error);
  }
};
