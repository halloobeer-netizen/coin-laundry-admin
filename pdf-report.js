(() => {
  let reportTransactions = [];
  let reportPeriodLabel = 'Semua Data';
  let reportRefreshToken = 0;

  function rupiahPdf(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  async function apiJson(url) {
    const response = await fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `API ${response.status}`);
    return data;
  }

  function mapReportTransaction(t) {
    const d = new Date(t.created_at || t.started_at || Date.now());
    return {
      id: Number(t.id), createdAt: d,
      time: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      dateText: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      machine: Number(t.machine_id), weight: Number(t.weight_kg || 0),
      service: t.service_name || t.service_id || '-', payment: t.payment_method || '-',
      coins: Number(t.coin_count || 0), total: Number(t.total_amount || 0),
      status: t.status === 'completed' ? 'Selesai' : t.status === 'cancelled' ? 'Dibatalkan' : 'Berjalan'
    };
  }

  function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function endOfDay(d) { const x = new Date(d); x.setHours(23,59,59,999); return x; }

  function getPeriodRange() {
    const mode = document.getElementById('reportPeriodFilter')?.value || 'all';
    const now = new Date();
    let start = null, end = null, label = 'Semua Data';
    if (mode === 'today') {
      start = startOfDay(now); end = endOfDay(now); label = 'Hari Ini';
    } else if (mode === '7days') {
      start = startOfDay(now); start.setDate(start.getDate()-6); end = endOfDay(now); label = '7 Hari Terakhir';
    } else if (mode === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
      end = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59,999);
      label = now.toLocaleDateString('id-ID',{month:'long',year:'numeric'});
    } else if (mode === 'custom') {
      const fromValue = document.getElementById('reportDateFrom')?.value;
      const toValue = document.getElementById('reportDateTo')?.value;
      if (fromValue) start = startOfDay(new Date(`${fromValue}T00:00:00`));
      if (toValue) end = endOfDay(new Date(`${toValue}T00:00:00`));
      if (start && end) label = `${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`;
      else if (start) label = `Mulai ${start.toLocaleDateString('id-ID')}`;
      else if (end) label = `Sampai ${end.toLocaleDateString('id-ID')}`;
      else label = 'Rentang Tanggal';
    }
    return {start,end,label};
  }

  function filterTransactions(items) {
    const {start,end,label} = getPeriodRange();
    reportPeriodLabel = label;
    return items.filter(t => (!start || t.createdAt >= start) && (!end || t.createdAt <= end));
  }

  function renderFilteredReport(items) {
    reportTransactions = items;
    const total = items.reduce((a,b)=>a+Number(b.total||0),0);
    const cash = items.filter(x=>x.payment==='Cash').reduce((a,b)=>a+Number(b.total||0),0);
    const qris = items.filter(x=>x.payment==='QRIS').reduce((a,b)=>a+Number(b.total||0),0);
    const cashPct = total ? Math.round(cash/total*100) : 0;
    const qrisPct = total ? 100-cashPct : 0;
    const values = {reportRevenue:rupiahPdf(total),reportTxCount:String(items.length),reportCash:rupiahPdf(cash),reportQris:rupiahPdf(qris),cashPercentText:`${cashPct}%`,qrisPercentText:`${qrisPct}%`};
    Object.entries(values).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
    const cashBar=document.getElementById('cashBar'), qrisBar=document.getElementById('qrisBar');
    if(cashBar)cashBar.style.width=`${cashPct}%`; if(qrisBar)qrisBar.style.width=`${qrisPct}%`;

    const usage={};
    if(typeof machines!=='undefined') machines.forEach(m=>usage[m.id]=0);
    items.forEach(t=>usage[t.machine]=(usage[t.machine]||0)+1);
    const max=Math.max(1,...Object.values(usage));
    const usageList=document.getElementById('machineUsageList');
    if(usageList) usageList.innerHTML=Object.entries(usage).map(([id,count])=>`<div class="usage-row"><span>Mesin ${String(id).padStart(2,'0')}</span><div class="mini-track"><i style="width:${count/max*100}%"></i></div><strong>${count}</strong></div>`).join('');

    const table=document.getElementById('reportTable');
    if(table) table.innerHTML=items.length ? items.map(t=>typeof rowHtml==='function'?rowHtml(t,false):`<tr><td>${t.time}</td><td>Mesin ${String(t.machine).padStart(2,'0')}</td><td>${t.service}</td><td>${t.payment}</td><td>${t.coins}</td><td>${rupiahPdf(t.total)}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:#71809b;padding:28px">Tidak ada transaksi pada periode ini.</td></tr>';
    const periodText=document.getElementById('reportPeriodText');
    if(periodText)periodText.textContent=`Periode laporan: ${reportPeriodLabel} · ${items.length} transaksi`;
  }

  async function refreshFilteredReport() {
    const token=++reportRefreshToken;
    const state=document.getElementById('reportPeriodState');
    if(state)state.textContent='Memuat data...';
    try {
      const data=await apiJson('/api/bootstrap');
      if(token!==reportRefreshToken)return;
      renderFilteredReport(filterTransactions((data.transactions||[]).map(mapReportTransaction)));
      if(state)state.textContent='Data laporan diperbarui dari Neon.';
    } catch(err) { if(state)state.textContent=`Gagal memuat laporan: ${err.message}`; }
  }

  function safeFilePart(value) { return String(value||'laporan').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'laporan'; }

  function exportFilteredCSV() {
    const rows=[['Tanggal','Waktu','Mesin','Berat','Layanan','Pembayaran','Koin','Total','Status']];
    reportTransactions.forEach(t=>rows.push([t.dateText,t.time,`Mesin ${String(t.machine).padStart(2,'0')}`,t.weight||'',t.service,t.payment,t.coins,t.total,t.status]));
    const csv=rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`laporan-${safeFilePart(reportPeriodLabel)}-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  async function getOutletIdentity() {
    try {
      const data=await apiJson('/api/settings');
      return {outlet:data.outlet_name||'Clean Wash Laundry',branch:data.branch_name||'Outlet',address:data.address||'',phone:data.phone||'',whatsapp:data.whatsapp||'',cashier:data.cashier_name||'Admin 01'};
    } catch(_) {
      return {outlet:document.querySelector('.outlet div strong')?.textContent?.trim()||'Clean Wash Laundry',branch:document.querySelector('.outlet div span')?.textContent?.trim()||'Outlet',address:'',phone:'',whatsapp:'',cashier:'Admin 01'};
    }
  }

  async function exportReportPDF() {
    if(!window.jspdf?.jsPDF){alert('Modul PDF belum siap. Silakan refresh halaman lalu coba lagi.');return;}
    const {jsPDF}=window.jspdf;
    const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
    const identity=await getOutletIdentity();
    const {outlet,branch,address,phone,whatsapp,cashier}=identity;
    const now=new Date(), data=reportTransactions;
    const total=data.reduce((s,t)=>s+Number(t.total||0),0);
    const cash=data.filter(t=>t.payment==='Cash').reduce((s,t)=>s+Number(t.total||0),0);
    const qris=data.filter(t=>t.payment==='QRIS').reduce((s,t)=>s+Number(t.total||0),0);
    const coins=data.reduce((s,t)=>s+Number(t.coins||0),0);

    doc.setFontSize(18); doc.text('Laporan Operasional Coin Laundry',14,16);
    doc.setFontSize(12); doc.setFont(undefined,'bold'); doc.text(outlet,14,24); doc.setFont(undefined,'normal');
    doc.setFontSize(10); doc.text(branch,14,30);
    let identityY=36;
    if(address){const lines=doc.splitTextToSize(`Alamat: ${address}`,150);doc.text(lines,14,identityY);identityY+=lines.length*5;}
    if(phone||whatsapp){doc.text([phone?`Telp: ${phone}`:'',whatsapp?`WhatsApp: ${whatsapp}`:''].filter(Boolean).join('   |   '),14,identityY);identityY+=5;}
    doc.text(`Kasir/Admin: ${cashier}`,14,identityY);identityY+=5;
    doc.text(`Periode: ${reportPeriodLabel}`,14,identityY);identityY+=5;
    doc.text(`Dicetak: ${now.toLocaleString('id-ID')}`,14,identityY);

    const summaryY=Math.max(59,identityY+9);
    doc.text(`Total transaksi: ${data.length}`,14,summaryY); doc.text(`Total omzet: ${rupiahPdf(total)}`,70,summaryY); doc.text(`Cash: ${rupiahPdf(cash)}`,145,summaryY); doc.text(`QRIS: ${rupiahPdf(qris)}`,210,summaryY); doc.text(`Koin/Token: ${coins}`,14,summaryY+6);
    const rows=data.map((t,i)=>[i+1,t.dateText,t.time,`Mesin ${String(t.machine).padStart(2,'0')}`,t.weight?`${t.weight} kg`:'-',t.service||'-',t.payment||'-',t.coins??0,rupiahPdf(t.total),t.status||'-']);
    doc.autoTable({startY:summaryY+13,head:[['No','Tanggal','Waktu','Mesin','Berat','Layanan','Pembayaran','Koin','Total','Status']],body:rows.length?rows:[['-','-','-','-','-','Tidak ada transaksi pada periode ini','-','-','-','-']],styles:{fontSize:7.5,cellPadding:2.1},headStyles:{fontStyle:'bold'},columnStyles:{0:{cellWidth:9},1:{cellWidth:24},2:{cellWidth:17},3:{cellWidth:22},4:{cellWidth:17},7:{cellWidth:13},8:{cellWidth:28},9:{cellWidth:20}},didDrawPage:()=>{doc.setFontSize(8);doc.text(`Halaman ${doc.internal.getNumberOfPages()}`,275,200,{align:'right'});}});
    doc.save(`laporan-${safeFilePart(branch)}-${safeFilePart(reportPeriodLabel)}-${now.toISOString().slice(0,10)}.pdf`);
  }

  function installPdfButton() {
    const csvBtn=document.getElementById('exportReportBtn');
    if(!csvBtn||document.getElementById('exportPdfBtn'))return;
    const wrapper=document.createElement('div');wrapper.style.display='flex';wrapper.style.gap='10px';wrapper.style.flexWrap='wrap';csvBtn.parentNode.insertBefore(wrapper,csvBtn);wrapper.appendChild(csvBtn);
    const pdfBtn=document.createElement('button');pdfBtn.id='exportPdfBtn';pdfBtn.className='hero-action';pdfBtn.type='button';pdfBtn.textContent='Download PDF';pdfBtn.addEventListener('click',exportReportPDF);wrapper.appendChild(pdfBtn);
  }

  function installReportFilter() {
    const reportView=document.getElementById('view-reports');
    const stats=reportView?.querySelector('.report-stats');
    if(!reportView||!stats||document.getElementById('reportPeriodFilter'))return;
    const bar=document.createElement('div');bar.id='reportPeriodBar';bar.innerHTML=`<div class="report-period-main"><label>Periode<select id="reportPeriodFilter"><option value="all">Semua Data</option><option value="today">Hari Ini</option><option value="7days">7 Hari Terakhir</option><option value="month">Bulan Ini</option><option value="custom">Rentang Tanggal</option></select></label><div id="reportCustomDates" class="report-custom-dates" style="display:none"><label>Dari<input id="reportDateFrom" type="date"></label><label>Sampai<input id="reportDateTo" type="date"></label></div></div><div class="report-period-info"><strong id="reportPeriodText">Periode laporan: Semua Data</strong><span id="reportPeriodState">Data laporan diperbarui dari Neon.</span></div>`;
    stats.parentNode.insertBefore(bar,stats);
    const style=document.createElement('style');style.textContent=`#reportPeriodBar{display:flex;justify-content:space-between;gap:16px;align-items:end;background:#fff;border:1px solid #e5eaf2;border-radius:16px;padding:16px 18px;margin:0 0 18px;box-shadow:0 5px 18px rgba(24,52,93,.04)}.report-period-main,.report-custom-dates{display:flex;gap:12px;align-items:end;flex-wrap:wrap}.report-period-main label,.report-custom-dates label{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#52627d}#reportPeriodFilter,#reportDateFrom,#reportDateTo{border:1px solid #dbe2ec;border-radius:10px;padding:10px 12px;background:#fbfcfe;font:inherit;color:#243650;min-height:40px}.report-period-info{text-align:right}.report-period-info strong,.report-period-info span{display:block}.report-period-info strong{font-size:13px;color:#26354d}.report-period-info span{font-size:11px;color:#7a879d;margin-top:4px}@media(max-width:760px){#reportPeriodBar{align-items:stretch;flex-direction:column}.report-period-info{text-align:left}.report-period-main,.report-custom-dates{width:100%}.report-period-main>label{width:100%}#reportPeriodFilter{width:100%}}`;document.head.appendChild(style);
    const period=document.getElementById('reportPeriodFilter'),custom=document.getElementById('reportCustomDates');
    period.addEventListener('change',()=>{custom.style.display=period.value==='custom'?'flex':'none';refreshFilteredReport();});
    document.getElementById('reportDateFrom').addEventListener('change',refreshFilteredReport);document.getElementById('reportDateTo').addEventListener('change',refreshFilteredReport);
    const csvBtn=document.getElementById('exportReportBtn');if(csvBtn)csvBtn.onclick=exportFilteredCSV;
    try{renderReports=refreshFilteredReport;}catch(_){}
    refreshFilteredReport();
  }

  function keepSingleTransactionButton() {
    ['newTransactionHero','newTransactionOperations','newTransactionTransactions','mobileNewTx'].forEach(id=>{
      const el=document.getElementById(id);
      if(el) el.style.display='none';
    });
  }

  function install(){keepSingleTransactionButton();installPdfButton();installReportFilter();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();