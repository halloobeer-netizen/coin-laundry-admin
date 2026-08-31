(() => {
  const originalFetch = window.fetch.bind(window);
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const uid = () => Math.max(1, ...state.transactions.map(t => Number(t.id) || 0)) + 1;
  const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  }));

  const state = {
    settings: {
      outlet_name: 'Clean Wash Laundry — DEMO',
      branch_name: 'JAGAVRE LABS Demo Outlet',
      address: 'Data dan transaksi pada halaman ini hanya untuk demonstrasi.',
      phone: '08xx-xxxx-xxxx',
      whatsapp: '62xx-xxxx-xxxx',
      cashier_name: 'Demo Admin',
      receipt_footer: 'DEMO JAGAVRE LABS — bukan transaksi produksi.',
      currency: 'IDR',
      token_label: 'Koin / Token'
    },
    machines: [
      { id:1, type:'Mesin Cuci', capacity_kg:10, status:'available', duration_minutes:35, note:'', finish_at:null },
      { id:2, type:'Mesin Cuci', capacity_kg:10, status:'busy', duration_minutes:35, note:'Pelanggan A', finish_at:iso(now + 22*60*1000) },
      { id:3, type:'Mesin Cuci', capacity_kg:14, status:'available', duration_minutes:40, note:'', finish_at:null },
      { id:4, type:'Mesin Cuci', capacity_kg:14, status:'completed', duration_minutes:40, note:'Menunggu diambil', finish_at:null },
      { id:5, type:'Dryer', capacity_kg:10, status:'available', duration_minutes:30, note:'', finish_at:null },
      { id:6, type:'Dryer', capacity_kg:10, status:'busy', duration_minutes:30, note:'Pelanggan B', finish_at:iso(now + 14*60*1000) },
      { id:7, type:'Dryer', capacity_kg:14, status:'maintenance', duration_minutes:35, note:'Pengecekan rutin', finish_at:null },
      { id:8, type:'Dryer', capacity_kg:14, status:'available', duration_minutes:35, note:'', finish_at:null }
    ],
    services: [
      { id:'cuci-dryer-7kg', name:'Cuci + Dryer', machine_type:'Mesin Cuci', price:35000, unit:'package', package_weight_kg:7, duration_minutes:35, is_active:true, note:'Rp35.000 per maksimal 7 kg', created_at:iso(now-86400000*30) },
      { id:'dryer-paket', name:'Dryer', machine_type:'Dryer', price:20000, unit:'package', package_weight_kg:null, duration_minutes:30, is_active:true, note:'Paket dryer', created_at:iso(now-86400000*29) },
      { id:'cuci-express', name:'Cuci Express', machine_type:'Mesin Cuci', price:12000, unit:'kg', package_weight_kg:null, duration_minutes:30, is_active:false, note:'Contoh layanan nonaktif', created_at:iso(now-86400000*20) }
    ],
    transactions: []
  };

  function addSeedTx(id, minutesAgo, machine, serviceId, weight, payment, coins, total, status = 'completed') {
    const service = state.services.find(s => s.id === serviceId);
    const created = now - minutesAgo * 60000;
    state.transactions.push({
      id, machine_id:machine, service_id:serviceId, service_name:service?.name || serviceId,
      customer_note:'Data Demo', weight_kg:weight, package_count:Math.max(1, Math.ceil((weight || 0)/7)),
      payment_method:payment, cash_received: payment === 'Cash' ? total + 15000 : null,
      change_amount:payment === 'Cash' ? 15000 : 0, coin_count:coins, total_amount:total,
      duration_minutes:35, started_at:iso(created), finish_at:null, status,
      completed_at:status === 'completed' ? iso(created + 35*60000) : null, created_at:iso(created)
    });
  }

  addSeedTx(1, 55, 1, 'cuci-dryer-7kg', 6, 'Cash', 1, 35000);
  addSeedTx(2, 48, 3, 'cuci-dryer-7kg', 12, 'QRIS', 2, 70000);
  addSeedTx(3, 36, 5, 'dryer-paket', null, 'Cash', 1, 20000);
  addSeedTx(4, 25, 8, 'dryer-paket', null, 'QRIS', 1, 20000);
  addSeedTx(5, 8, 2, 'cuci-dryer-7kg', 7, 'Cash', 1, 35000, 'running');
  addSeedTx(6, 5, 6, 'dryer-paket', null, 'QRIS', 1, 20000, 'running');

  function completeExpired() {
    const current = Date.now();
    state.machines.forEach(m => {
      if (m.status === 'busy' && m.finish_at && new Date(m.finish_at).getTime() <= current) {
        m.status = 'completed'; m.finish_at = null;
      }
    });
    state.transactions.forEach(t => {
      if (t.status === 'running' && t.finish_at && new Date(t.finish_at).getTime() <= current) {
        t.status = 'completed'; t.completed_at = iso(current);
      }
    });
  }

  const parseBody = async (input, options) => {
    const raw = options?.body ?? (input instanceof Request ? await input.clone().text() : null);
    if (!raw) return {};
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return {}; }
  };

  window.fetch = async function demoFetch(input, options = {}) {
    const requestUrl = input instanceof Request ? input.url : String(input);
    const url = new URL(requestUrl, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return originalFetch(input, options);

    const method = String(options.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const body = await parseBody(input, options);
    completeExpired();

    if (url.pathname === '/api/auth') {
      if (method === 'GET') return json({ configured:true, authenticated:true, username:'demo' });
      if (method === 'POST') return json({ ok:true, username:'demo' });
      if (method === 'DELETE') return json({ ok:true });
    }

    if (url.pathname === '/api/bootstrap' && method === 'GET') {
      return json({ machines:state.machines, services:state.services, transactions:[...state.transactions].sort((a,b) => new Date(b.created_at)-new Date(a.created_at)) });
    }

    if (url.pathname === '/api/settings') {
      if (method === 'GET') return json(state.settings);
      if (method === 'PUT' || method === 'PATCH') {
        state.settings = { ...state.settings, ...body, currency:'IDR' };
        return json(state.settings);
      }
    }

    if (url.pathname === '/api/machines') {
      if (method === 'POST') {
        if (state.machines.some(m => Number(m.id) === Number(body.id))) return json({ error:'Nomor mesin sudah digunakan' }, 409);
        const machine = { id:Number(body.id), type:body.type, capacity_kg:Number(body.capacity_kg), status:body.status || 'available', duration_minutes:Number(body.duration_minutes)||35, note:body.note||'', finish_at:null };
        state.machines.push(machine); state.machines.sort((a,b)=>a.id-b.id); return json(machine, 201);
      }
      if (method === 'PATCH') {
        const machine = state.machines.find(m => Number(m.id) === Number(body.id));
        if (!machine) return json({ error:'Mesin tidak ditemukan' }, 404);
        Object.assign(machine, {
          type: body.type ?? machine.type,
          capacity_kg: body.capacity_kg != null ? Number(body.capacity_kg) : machine.capacity_kg,
          status: body.status ?? machine.status,
          duration_minutes: body.duration_minutes != null ? Number(body.duration_minutes) : machine.duration_minutes,
          note: body.note ?? machine.note
        });
        if (machine.status !== 'busy') machine.finish_at = null;
        return json(machine);
      }
      if (method === 'DELETE') {
        const id = Number(url.searchParams.get('id'));
        const machine = state.machines.find(m => m.id === id);
        if (!machine) return json({ error:'Mesin tidak ditemukan' }, 404);
        if (machine.status === 'busy') return json({ error:'Mesin sedang digunakan' }, 409);
        state.machines = state.machines.filter(m => m.id !== id); return json({ ok:true });
      }
    }

    if (url.pathname === '/api/services') {
      if (method === 'POST') {
        if (state.services.some(s => s.id === body.id)) return json({ error:'ID layanan sudah digunakan' }, 409);
        const service = { ...body, price:Number(body.price), duration_minutes:Number(body.duration_minutes)||35, package_weight_kg:body.package_weight_kg == null ? null : Number(body.package_weight_kg), is_active:body.is_active !== false, created_at:iso(Date.now()) };
        state.services.push(service); return json(service, 201);
      }
      if (method === 'PATCH') {
        const service = state.services.find(s => s.id === body.id);
        if (!service) return json({ error:'Layanan tidak ditemukan' }, 404);
        Object.assign(service, body);
        if (body.price != null) service.price = Number(body.price);
        if (body.duration_minutes != null) service.duration_minutes = Number(body.duration_minutes);
        return json(service);
      }
      if (method === 'DELETE') {
        const id = url.searchParams.get('id');
        if (state.transactions.some(t => t.service_id === id)) return json({ error:'Layanan sudah dipakai transaksi dan tidak bisa dihapus' }, 409);
        state.services = state.services.filter(s => s.id !== id); return json({ ok:true });
      }
    }

    if (url.pathname === '/api/transactions' && method === 'POST') {
      const machine = state.machines.find(m => m.id === Number(body.machine_id));
      const service = state.services.find(s => s.id === body.service_id);
      if (!machine || machine.status !== 'available') return json({ error:'Mesin tidak tersedia' }, 409);
      if (!service || service.is_active === false) return json({ error:'Layanan tidak aktif' }, 400);
      if (service.machine_type && service.machine_type !== machine.type) return json({ error:'Layanan tidak sesuai jenis mesin' }, 400);

      const weight = body.weight_kg == null ? null : Number(body.weight_kg);
      let packages = 1;
      let total = Number(service.price);
      if (service.unit === 'kg') {
        if (!(weight > 0)) return json({ error:'Berat wajib diisi' }, 400);
        total = Number(service.price) * weight;
      } else if (Number(service.package_weight_kg) > 0) {
        if (!(weight > 0)) return json({ error:'Berat wajib diisi' }, 400);
        packages = Math.max(1, Math.ceil(weight / Number(service.package_weight_kg)));
        total = Number(service.price) * packages;
      }
      if (body.payment_method === 'Cash' && Number(body.cash_received) < total) return json({ error:'Uang diterima kurang' }, 400);

      const duration = Number(machine.duration_minutes || service.duration_minutes || 35);
      const tx = {
        id:uid(), machine_id:machine.id, service_id:service.id, service_name:service.name,
        customer_note:body.customer_note || 'Demo Client', weight_kg:weight, package_count:packages,
        payment_method:body.payment_method, cash_received:body.payment_method === 'Cash' ? Number(body.cash_received) : null,
        change_amount:body.payment_method === 'Cash' ? Number(body.cash_received)-total : 0,
        coin_count:packages, total_amount:total, duration_minutes:duration,
        started_at:iso(Date.now()), finish_at:iso(Date.now()+duration*60000), status:'running', completed_at:null, created_at:iso(Date.now())
      };
      state.transactions.push(tx);
      machine.status = 'busy'; machine.finish_at = tx.finish_at; machine.note = body.customer_note || 'Demo Client';
      return json(tx, 201);
    }

    return json({ error:'Demo endpoint tidak tersedia' }, 404);
  };

  function addDemoUi() {
    const style = document.createElement('style');
    style.textContent = `.demo-ribbon{position:fixed;right:14px;top:14px;z-index:99998;background:#0d1734;color:#fff;border-radius:999px;padding:9px 13px;font:800 11px/1 Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(13,23,52,.2)}.demo-ribbon small{font-weight:500;opacity:.75;margin-left:6px}`;
    document.head.appendChild(style);
    const badge = document.createElement('div');
    badge.className = 'demo-ribbon';
    badge.innerHTML = 'DEMO — JAGAVRE LABS <small>data reset saat refresh</small>';
    document.body.appendChild(badge);
    document.title = 'DEMO — Clean Wash Coin Laundry Admin';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addDemoUi);
  else addDemoUi();
})();
