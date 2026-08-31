(() => {
  const dashboard = document.getElementById('view-dashboard');
  const grid = dashboard?.querySelector('.dashboard-grid');
  if (!dashboard || !grid || document.getElementById('dashboardAdminShortcuts')) return;

  const card = document.createElement('article');
  card.id = 'dashboardAdminShortcuts';
  card.className = 'dashboard-card dashboard-admin-shortcuts';
  card.innerHTML = `
    <div class="card-title-row">
      <div>
        <span class="eyebrow">Menu Admin</span>
        <h3>Akses Menu Lengkap</h3>
      </div>
    </div>
    <div class="dashboard-shortcut-grid">
      <button type="button" data-go="machines"><span class="dashboard-shortcut-icon">◉</span><strong>Mesin</strong><small>Kelola mesin</small></button>
      <button type="button" data-go="reports"><span class="dashboard-shortcut-icon">▥</span><strong>Laporan</strong><small>Omzet & transaksi</small></button>
      <button type="button" data-go="services"><span class="dashboard-shortcut-icon">◇</span><strong>Harga & Layanan</strong><small>Atur layanan</small></button>
      <button type="button" data-go="settings"><span class="dashboard-shortcut-icon">⚙</span><strong>Pengaturan</strong><small>Profil outlet</small></button>
    </div>`;
  grid.appendChild(card);

  if (!document.getElementById('dashboardShortcutStyles')) {
    const style = document.createElement('style');
    style.id = 'dashboardShortcutStyles';
    style.textContent = `
      .dashboard-admin-shortcuts{display:none;grid-column:1/-1;min-height:auto}
      .dashboard-shortcut-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}
      .dashboard-shortcut-grid button{border:1px solid var(--line);background:#fbfdff;border-radius:12px;padding:14px 10px;color:var(--text);text-align:left;cursor:pointer;min-width:0}
      .dashboard-shortcut-grid button:active{background:#eef5ff}
      .dashboard-shortcut-grid span,.dashboard-shortcut-grid strong,.dashboard-shortcut-grid small{display:block}
      .dashboard-shortcut-icon{font-size:20px;color:var(--blue);margin-bottom:9px}
      .dashboard-shortcut-grid strong{font-size:11px;line-height:1.25}
      .dashboard-shortcut-grid small{font-size:9px;color:var(--muted);margin-top:4px;line-height:1.35}
      @media(max-width:760px){
        .dashboard-admin-shortcuts{display:block}
        .dashboard-shortcut-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
        .dashboard-shortcut-grid button{padding:13px 11px}
      }`;
    document.head.appendChild(style);
  }
})();
