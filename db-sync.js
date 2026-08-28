(() => {
  let dbReady = false;
  const completingMachines = new Set();
  let settingsState = {
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

  async function api(url, options = {}) {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `API ${response.status}`);
    return data;
  }

  const mapMachine = (m) => ({
    id: Number(m.id), type: m.type, capacity: `${Number(m.capacity_kg)} KG`, status: m.status,
    duration: Number(m.duration_minutes), note: m.note || '', finishAt: m.finish_at ? new Date(m.finish_at).getTime() : undefined,
  });
  const mapService = (s) => ({
    id: s.id, name: s.name, type: s.machine_type, price: Number(s.price),
    unit: s.unit === 'package' && Number(s.package_weight_kg) === 7 ? '7kg' : (s.unit === 'package' ? 'paket' : 'kg'),
    duration: Number(s.duration_minutes), active: s.is_active !== false, note: s.note || '',
  });
  const mapTransaction = (t) => {
    const d = new Date(t.created_at || t.started_at || Date.now());
    return { id: Number(t.id), time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      machine: Number(t.machine_id), weight: Number(t.weight_kg || 0), service: t.service_name || t.service_id,
      payment: t.payment_method, coins: Number(t.coin_count), total: Number(t.total_amount),
      status: t.status === 'completed' ? 'Selesai' : t.status === 'cancelled' ? 'Dibatalkan' : 'Berjalan' };
  };

  async function reloadDb() {
    const data = await api('/api/bootstrap');
    machines.splice(0, machines.length, ...(data.machines || []).map(mapMachine));
    services.splice(0, services.length, ...(data.services || []).map(mapService));
    transactions.splice(0, transactions.length, ...(data.transactions || []).map(mapTransaction));
    dbReady = true;
    renderMachines(); renderTransactions(); renderMachineAdmin(); renderServiceAdmin(); updateCountdowns();
  }

  async function persistCompletion(id) {
    if (!dbReady || completingMachines.has(id)) return;
    completingMachines.add(id);
    try {
      await api('/api/machines', { method: 'PATCH', body: JSON.stringify({ id, status: 'completed' }) });
      await reloadDb();
    } catch (err) {
      console.warn(`Gagal menyimpan selesai Mesin ${id}:`, err.message);
    } finally {
      completingMachines.delete(id);
    }
  }

  const localSetMachineStatus = setMachineStatus;
  setMachineStatus = async function(id, status) {
    if (!dbReady) return localSetMachineStatus(id, status);
    const machine = machines.find(m => m.id === id); if (!machine) return;
    try {
      if (status === 'available' && machine.status === 'completed') {
        await api('/api/machines', { method: 'PATCH', body: JSON.stringify({ id, status: 'completed', note: machine.note || null }) });
      }
      await api('/api/machines', { method: 'PATCH', body: JSON.stringify({ id, status, note: machine.note || null }) });
      await reloadDb();
    }
    catch (err) { alert(`Gagal menyimpan status mesin: ${err.message}`); }
  };

  const localSaveMachine = saveMachine;
  saveMachine = async function() {
    if (!dbReady) return localSaveMachine();
    const id = Number(document.getElementById('machineNumberInput').value);
    const type = document.getElementById('machineTypeInput').value;
    const capacity_kg = Number(document.getElementById('machineCapacityInput').value.trim().replace(/[^0-9.]/g, ''));
    const status = document.getElementById('machineStatusInput').value;
    const duration_minutes = Number(document.getElementById('machineDurationInput').value) || 35;
    const note = document.getElementById('machineNoteInput').value.trim() || null;
    if (!id || !capacity_kg) return alert('Nomor mesin dan kapasitas wajib diisi.');
    try {
      await api('/api/machines', { method: editingMachineId !== null ? 'PATCH' : 'POST', body: JSON.stringify({ id, type, capacity_kg, status, duration_minutes, note }) });
      closeMachineModal(); await reloadDb();
    } catch (err) { alert(`Gagal menyimpan mesin: ${err.message}`); }
  };
  document.getElementById('saveMachineBtn').onclick = saveMachine;

  const localDeleteMachine = deleteMachine;
  deleteMachine = async function() {
    if (!dbReady) return localDeleteMachine();
    if (editingMachineId === null) return;
    const machine = machines.find(m => m.id === editingMachineId); if (!machine) return;
    if (machine.status === 'busy') return alert('Mesin yang sedang digunakan tidak bisa dihapus.');
    if (!confirm(`Hapus Mesin ${String(machine.id).padStart(2, '0')}?`)) return;
    try { await api(`/api/machines?id=${machine.id}`, { method: 'DELETE' }); closeMachineModal(); await reloadDb(); }
    catch (err) { alert(`Gagal menghapus mesin: ${err.message}`); }
  };
  document.getElementById('deleteMachineBtn').onclick = deleteMachine;

  const localSaveService = saveService;
  saveService = async function() {
    if (!dbReady) return localSaveService();
    const name = document.getElementById('serviceNameInput').value.trim();
    const machine_type = document.getElementById('serviceTypeInput').value;
    const price = Number(document.getElementById('servicePriceInput').value) || 0;
    const uiUnit = document.getElementById('serviceUnitInput').value;
    const duration_minutes = Number(document.getElementById('serviceDurationInput').value) || 35;
    const is_active = document.getElementById('serviceActiveInput').value === 'active';
    const note = document.getElementById('serviceNoteInput').value.trim() || null;
    if (!name || price <= 0) return alert('Nama layanan dan harga wajib diisi.');
    const id = editingServiceId !== null ? editingServiceId : makeServiceId(name);
    try {
      await api('/api/services', { method: editingServiceId !== null ? 'PATCH' : 'POST',
        body: JSON.stringify({ id, name, machine_type, price, unit: uiUnit === 'kg' ? 'kg' : 'package',
          package_weight_kg: uiUnit === '7kg' ? 7 : null, duration_minutes, is_active, note }) });
      closeServiceModal(); await reloadDb();
    } catch (err) { alert(`Gagal menyimpan layanan: ${err.message}`); }
  };
  document.getElementById('saveServiceBtn').onclick = saveService;

  const localToggleService = toggleService;
  toggleService = async function(id) {
    if (!dbReady) return localToggleService(id);
    const s = services.find(x => x.id === id); if (!s) return;
    try { await api('/api/services', { method: 'PATCH', body: JSON.stringify({ id, is_active: !(s.active !== false) }) }); await reloadDb(); }
    catch (err) { alert(`Gagal mengubah layanan: ${err.message}`); }
  };

  const localDeleteService = deleteService;
  deleteService = async function() {
    if (!dbReady) return localDeleteService();
    if (editingServiceId === null) return;
    const s = services.find(x => x.id === editingServiceId); if (!s) return;
    if (!confirm(`Hapus layanan "${s.name}"?`)) return;
    try { await api(`/api/services?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' }); closeServiceModal(); await reloadDb(); }
    catch (err) { alert(`Gagal menghapus layanan: ${err.message}`); }
  };
  document.getElementById('deleteServiceBtn').onclick = deleteService;

  document.getElementById('saveTx').onclick = async () => {
    if (!dbReady) return alert('Database belum siap. Coba beberapa detik lagi.');
    const machineId = Number(document.getElementById('machineSelect').value);
    const machine = machines.find(m => m.id === machineId);
    const service = services.find(s => s.id === document.getElementById('serviceSelect').value);
    const weight = Number(document.getElementById('weightInput').value) || 0;
    const payment = document.getElementById('paymentSelect').value;
    const coins = Number(document.getElementById('coinInput').value) || 1;
    const total = calculateTotal();
    const cash = payment === 'Cash' ? (Number(document.getElementById('cashReceivedInput').value) || 0) : null;
    try {
      await api('/api/transactions', { method: 'POST', body: JSON.stringify({ machine_id: machineId, service_id: service.id,
        customer_note: document.getElementById('customerInput').value.trim() || null,
        weight_kg: machine.type === 'Dryer' ? null : weight,
        package_count: service.unit === '7kg' ? Math.max(1, Math.ceil(weight / 7)) : 1,
        payment_method: payment, cash_received: cash, coin_count: coins, total_amount: total,
        duration_minutes: machine.duration || service.duration || 35 }) });
      document.getElementById('txBackdrop').classList.add('hidden'); document.body.classList.remove('modal-open');
      document.getElementById('successText').innerHTML = `Transaksi <b>${service.name}</b> dengan pembayaran <b>${payment}</b> sebesar <b>${rupiah(total)}</b> telah dicatat. Serahkan <b>${coins} koin/token</b> kepada pelanggan untuk Mesin ${String(machineId).padStart(2, '0')}.`;
      document.getElementById('successBackdrop').classList.remove('hidden');
      await reloadDb();
    } catch (err) { alert(`Gagal menyimpan transaksi: ${err.message}`); }
  };

  function injectSettingsUI() {
    const view = document.getElementById('view-settings');
    if (!view) return;
    view.innerHTML = `
      <div class="page-head">
        <div>
          <span class="eyebrow">Pengaturan</span>
          <h1>Pengaturan Outlet</h1>
          <p>Kelola identitas outlet, kontak, kasir, dan preferensi dasar aplikasi.</p>
        </div>
        <button id="saveSettingsBtn" class="hero-action">Simpan Perubahan</button>
      </div>
      <div class="settings-grid">
        <section class="settings-card">
          <div class="settings-card-head"><div><h3>Profil Outlet</h3><p>Informasi yang tampil di aplikasi dan nantinya dapat digunakan pada struk.</p></div></div>
          <div class="settings-form-grid">
            <label>Nama Outlet<input id="settingOutletName" type="text" placeholder="Clean Wash Laundry"></label>
            <label>Nama Cabang<input id="settingBranchName" type="text" placeholder="Outlet Merdeka"></label>
            <label class="full">Alamat<textarea id="settingAddress" rows="3" placeholder="Alamat outlet"></textarea></label>
            <label>No. Telepon<input id="settingPhone" type="text" placeholder="08xxxxxxxxxx"></label>
            <label>WhatsApp<input id="settingWhatsapp" type="text" placeholder="62xxxxxxxxxx"></label>
          </div>
        </section>
        <section class="settings-card">
          <div class="settings-card-head"><div><h3>Operasional</h3><p>Identitas kasir dan penamaan token untuk kebutuhan outlet.</p></div></div>
          <div class="settings-form-grid">
            <label>Nama Kasir / Admin<input id="settingCashierName" type="text" placeholder="Admin 01"></label>
            <label>Nama Koin / Token<input id="settingTokenLabel" type="text" placeholder="Koin / Token"></label>
            <label class="full">Footer Struk<textarea id="settingReceiptFooter" rows="3" placeholder="Terima kasih..."></textarea></label>
          </div>
        </section>
        <section class="settings-card settings-preview-card">
          <div class="settings-card-head"><div><h3>Preview Identitas</h3><p>Perubahan nama outlet dan cabang akan langsung diterapkan setelah disimpan.</p></div></div>
          <div class="settings-preview">
            <div class="brand-mark">🧺</div>
            <div><strong id="settingsPreviewOutlet">Clean Wash Laundry</strong><span id="settingsPreviewBranch">Outlet Merdeka</span></div>
          </div>
          <div id="settingsSaveState" class="settings-save-state">Data tersimpan permanen di Neon.</div>
        </section>
      </div>`;

    if (!document.getElementById('settingsInjectedStyle')) {
      const style = document.createElement('style');
      style.id = 'settingsInjectedStyle';
      style.textContent = `
        .settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}.settings-card{background:#fff;border:1px solid #e6ebf2;border-radius:18px;padding:22px;box-shadow:0 6px 20px rgba(24,52,93,.05)}.settings-card-head h3{margin:0 0 5px;font-size:18px}.settings-card-head p{margin:0 0 20px;color:#71809b;font-size:13px}.settings-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.settings-form-grid label{display:flex;flex-direction:column;gap:7px;font-size:13px;font-weight:700;color:#26354d}.settings-form-grid .full{grid-column:1/-1}.settings-form-grid input,.settings-form-grid textarea{width:100%;box-sizing:border-box;border:1px solid #dce3ee;border-radius:11px;padding:12px 13px;font:inherit;color:#1e2d45;background:#fbfcfe;outline:none}.settings-form-grid input:focus,.settings-form-grid textarea:focus{border-color:#315e9d;background:#fff}.settings-preview-card{grid-column:1/-1}.settings-preview{display:flex;align-items:center;gap:14px;padding:18px;border-radius:14px;background:#f7f9fc;border:1px solid #e8edf4}.settings-preview strong,.settings-preview span{display:block}.settings-preview span{font-size:13px;color:#71809b;margin-top:4px}.settings-save-state{margin-top:14px;font-size:12px;color:#60708c}.settings-save-state.saving{color:#9b6c15}.settings-save-state.success{color:#16845b}.settings-save-state.error{color:#c33f4c}@media(max-width:850px){.settings-grid,.settings-form-grid{grid-template-columns:1fr}.settings-form-grid .full,.settings-preview-card{grid-column:auto}}`;
      document.head.appendChild(style);
    }

    document.getElementById('saveSettingsBtn').onclick = saveSettings;
    ['settingOutletName','settingBranchName'].forEach(id => document.getElementById(id)?.addEventListener('input', updateSettingsPreview));
    fillSettingsForm();
  }

  function fillSettingsForm() {
    const map = {
      settingOutletName: settingsState.outlet_name,
      settingBranchName: settingsState.branch_name,
      settingAddress: settingsState.address,
      settingPhone: settingsState.phone,
      settingWhatsapp: settingsState.whatsapp,
      settingCashierName: settingsState.cashier_name,
      settingTokenLabel: settingsState.token_label,
      settingReceiptFooter: settingsState.receipt_footer
    };
    Object.entries(map).forEach(([id,val]) => { const el=document.getElementById(id); if(el) el.value=val || ''; });
    updateSettingsPreview();
  }

  function updateSettingsPreview() {
    const outlet = document.getElementById('settingOutletName')?.value || settingsState.outlet_name;
    const branch = document.getElementById('settingBranchName')?.value || settingsState.branch_name;
    const a=document.getElementById('settingsPreviewOutlet'); if(a) a.textContent=outlet;
    const b=document.getElementById('settingsPreviewBranch'); if(b) b.textContent=branch;
  }

  function applySettings() {
    const topOutlet = document.querySelector('.topbar .outlet strong');
    const topBranch = document.querySelector('.topbar .outlet div span');
    const brandName = document.querySelector('.sidebar .brand strong');
    const cashier = document.querySelector('.support-card span');
    if (topOutlet) topOutlet.textContent = settingsState.outlet_name;
    if (topBranch) topBranch.textContent = settingsState.branch_name;
    if (brandName) brandName.textContent = settingsState.outlet_name.replace(/\s+(Laundry|Coin Laundry)$/i,'') || settingsState.outlet_name;
    if (cashier) cashier.textContent = `Kasir: ${settingsState.cashier_name}`;
    document.title = `${settingsState.outlet_name} Admin`;
    fillSettingsForm();
  }

  async function loadSettings() {
    try {
      settingsState = { ...settingsState, ...(await api('/api/settings')) };
      applySettings();
    } catch (err) {
      console.warn('Pengaturan outlet belum dapat dimuat:', err.message);
    }
  }

  async function saveSettings() {
    const state = document.getElementById('settingsSaveState');
    const btn = document.getElementById('saveSettingsBtn');
    const payload = {
      outlet_name: document.getElementById('settingOutletName').value.trim(),
      branch_name: document.getElementById('settingBranchName').value.trim(),
      address: document.getElementById('settingAddress').value.trim(),
      phone: document.getElementById('settingPhone').value.trim(),
      whatsapp: document.getElementById('settingWhatsapp').value.trim(),
      cashier_name: document.getElementById('settingCashierName').value.trim(),
      token_label: document.getElementById('settingTokenLabel').value.trim(),
      receipt_footer: document.getElementById('settingReceiptFooter').value.trim()
    };
    if (!payload.outlet_name || !payload.branch_name) return alert('Nama outlet dan nama cabang wajib diisi.');
    try {
      if(btn) btn.disabled=true;
      if(state){ state.className='settings-save-state saving'; state.textContent='Menyimpan ke Neon...'; }
      settingsState = { ...settingsState, ...(await api('/api/settings', { method:'PUT', body:JSON.stringify(payload) })) };
      applySettings();
      if(state){ state.className='settings-save-state success'; state.textContent='✓ Pengaturan berhasil disimpan permanen.'; }
    } catch(err) {
      if(state){ state.className='settings-save-state error'; state.textContent=`Gagal menyimpan: ${err.message}`; }
      alert(`Gagal menyimpan pengaturan: ${err.message}`);
    } finally {
      if(btn) btn.disabled=false;
    }
  }

  injectSettingsUI();
  const localShowView = showView;
  showView = function(view, updateHash=true) {
    if (view !== 'settings') return localShowView(view, updateHash);
    document.querySelectorAll('.app-view').forEach(v=>{ v.classList.remove('active-view'); v.classList.add('hidden-view'); });
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    const target=document.getElementById('view-settings');
    if(target){ target.classList.remove('hidden-view'); target.classList.add('active-view'); fillSettingsForm(); }
    document.querySelector('.nav-item[data-view="settings"]')?.classList.add('active');
    if(updateHash && location.hash !== '#settings') history.pushState(null,'','#settings');
    window.scrollTo({top:0,behavior:'auto'});
  };

  setInterval(() => {
    if (!dbReady) return;
    const now = Date.now();
    machines.forEach(machine => {
      const runningTx = transactions.some(t => t.machine === machine.id && t.status === 'Berjalan');
      const timerExpired = machine.status === 'busy' && machine.finishAt && machine.finishAt <= now;
      const locallyCompleted = machine.status === 'completed' && runningTx;
      if (timerExpired || locallyCompleted) persistCompletion(machine.id);
    });
  }, 500);

  reloadDb().catch(err => console.warn('Neon belum terhubung:', err.message));
  loadSettings();
})();
