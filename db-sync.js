(() => {
  let dbReady = false;
  const completingMachines = new Set();

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
      // Jika admin menekan "Tersedia Lagi" setelah timer selesai lokal,
      // selesaikan transaksi di database lebih dulu agar riwayat konsisten.
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

  // Menjaga status selesai tetap persisten walaupun halaman dibiarkan terbuka.
  // Ini juga menangkap kondisi ketika app.js sudah mengubah status menjadi completed secara lokal.
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
})();
