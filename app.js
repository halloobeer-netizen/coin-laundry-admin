const machines = [
  {id:1,type:"Mesin Cuci",capacity:"8 KG",status:"available",duration:35,note:""},
  {id:2,type:"Mesin Cuci",capacity:"10 KG",status:"available",duration:35,note:""},
  {id:3,type:"Mesin Cuci",capacity:"10 KG",status:"busy",duration:35,note:""},
  {id:4,type:"Mesin Cuci",capacity:"8 KG",status:"busy",duration:35,note:""},
  {id:5,type:"Dryer",capacity:"15 KG",status:"available",duration:30,note:""},
  {id:6,type:"Dryer",capacity:"15 KG",status:"busy",duration:30,note:""},
  {id:7,type:"Mesin Cuci",capacity:"8 KG",status:"available",duration:35,note:""},
  {id:8,type:"Mesin Cuci",capacity:"10 KG",status:"maintenance",duration:35,note:"Perlu pengecekan"}
];

let services = [
  {id:"wash-dry",name:"Cuci + Dryer",type:"Mesin Cuci",price:35000,unit:"7kg",duration:35,active:true,note:"Rp35.000 per maksimal 7 kg"},
  {id:"dry",name:"Dryer",type:"Dryer",price:15000,unit:"paket",duration:30,active:true,note:"Dryer saja"}
];

let transactions = [
  {time:"20:45",machine:3,weight:6,service:"Cuci + Dryer",payment:"QRIS",coins:1,total:35000,status:"Berjalan"},
  {time:"20:18",machine:6,weight:0,service:"Dryer",payment:"Cash",coins:1,total:15000,status:"Berjalan"},
  {time:"19:54",machine:4,weight:8,service:"Cuci + Dryer",payment:"Cash",coins:2,total:70000,status:"Berjalan"}
];


const nowSeed = Date.now();
const seedRemainingMinutes = {3:28,4:14,6:18};
machines.forEach(m=>{
  if(m.status==="busy"){
    const mins=seedRemainingMinutes[m.id] ?? (m.duration||35);
    m.finishAt = nowSeed + mins*60*1000;
  }
});

const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);


function formatRemaining(ms){
  if(ms<=0) return "00:00";
  const totalSec=Math.ceil(ms/1000);
  const min=Math.floor(totalSec/60);
  const sec=totalSec%60;
  return `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

function machineRemainingText(machine){
  if(machine.status!=="busy" || !machine.finishAt) return "-";
  return formatRemaining(machine.finishAt-Date.now());
}

function machineStatusText(machine){
  if(machine.status==="available") return "Tersedia";
  if(machine.status==="busy") return "Digunakan";
  if(machine.status==="completed") return "Selesai";
  return "Maintenance";
}

function renderMachines(){
  const grid=document.getElementById("machineGrid");
  if(!grid) return;
  grid.innerHTML=machines.map(m=>{
    const label=machineStatusText(m);
    const footer=m.status==="available"
      ? `<div><small>Status</small><strong>Siap Transaksi</strong></div><button class="machine-btn primary" data-machine="${m.id}">Transaksi</button>`
      : m.status==="busy"
      ? `<div><small>Sisa Waktu</small><strong data-countdown-machine="${m.id}">${machineRemainingText(m)}</strong></div><button class="machine-btn outline">Detail</button>`
      : m.status==="completed"
      ? `<div><small>Status</small><strong style="color:#6e55c7">Selesai</strong></div><button class="machine-btn primary" data-ready-completed="${m.id}">Tersedia Lagi</button>`
      : `<div><small>Status</small><strong style="color:#df4d54">Perlu Pengecekan</strong></div><button class="machine-btn disabled" disabled>Nonaktif</button>`;
    return `<article class="machine-card">
      <span class="status ${m.status}">● ${label}</span>
      <div class="machine-main">
        <div class="machine-icon">${m.type==="Dryer"?"◉":"◍"}</div>
        <div><h3>Mesin ${String(m.id).padStart(2,"0")}</h3><div class="meta">${m.type}<br><b>${m.capacity}</b></div></div>
      </div>
      <div class="machine-footer">${footer}</div>
    </article>`;
  }).join("");
  grid.querySelectorAll("[data-machine]").forEach(btn=>btn.onclick=()=>openTx(Number(btn.dataset.machine)));
  grid.querySelectorAll("[data-ready-completed]").forEach(btn=>btn.onclick=()=>setMachineStatus(Number(btn.dataset.readyCompleted),"available"));
}

function rowHtml(t, includeStatus=true){
  return `<tr>
    <td>${t.time}</td>
    <td><strong>Mesin ${String(t.machine).padStart(2,"0")}</strong></td>
    ${includeStatus?`<td>${t.weight?`${t.weight} kg`:"-"}</td>`:""}
    <td>${t.service}</td>
    <td>${t.payment}</td>
    <td>${t.coins}</td>
    <td><strong>${rupiah(t.total)}</strong></td>
    ${includeStatus?`<td><span class="badge">${t.status}</span></td>`:""}
  </tr>`;
}


function renderOperationMachines(){
  const grid=document.getElementById("operationMachineGrid");
  if(!grid) return;
  grid.innerHTML=machines.map(m=>{
    const label=machineStatusText(m);
    const footer=m.status==="available"
      ? `<div><small>Status</small><strong>Siap Transaksi</strong></div><button class="machine-btn primary" data-op-machine="${m.id}">Transaksi</button>`
      : m.status==="busy"
      ? `<div><small>Sisa Waktu</small><strong data-countdown-machine="${m.id}">${machineRemainingText(m)}</strong></div><button class="machine-btn outline">Detail</button>`
      : m.status==="completed"
      ? `<div><small>Status</small><strong style="color:#6e55c7">Selesai</strong></div><button class="machine-btn primary" data-op-ready="${m.id}">Tersedia Lagi</button>`
      : `<div><small>Status</small><strong style="color:#df4d54">Perlu Pengecekan</strong></div><button class="machine-btn disabled" disabled>Nonaktif</button>`;
    return `<article class="machine-card">
      <span class="status ${m.status}">● ${label}</span>
      <div class="machine-main">
        <div class="machine-icon">${m.type==="Dryer"?"◉":"◍"}</div>
        <div><h3>Mesin ${String(m.id).padStart(2,"0")}</h3><div class="meta">${m.type}<br><b>${m.capacity}</b></div></div>
      </div>
      <div class="machine-footer">${footer}</div>
    </article>`;
  }).join("");
  grid.querySelectorAll("[data-op-machine]").forEach(btn=>btn.onclick=()=>openTx(Number(btn.dataset.opMachine)));
  grid.querySelectorAll("[data-op-ready]").forEach(btn=>btn.onclick=()=>setMachineStatus(Number(btn.dataset.opReady),"available"));
}

function updateOperationSummary(){
  const available=machines.filter(m=>m.status==="available").length;
  const busy=machines.filter(m=>m.status==="busy").length;
  const maintenance=machines.filter(m=>m.status==="maintenance").length;
  const map={opAvailable:available,opBusy:busy,opMaintenance:maintenance,opTxCount:transactions.length};
  Object.entries(map).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
}

function renderOperationTransactions(){
  const table=document.getElementById("operationTransactionTable");
  if(!table) return;
  table.innerHTML=transactions.slice(0,6).map(t=>rowHtml(t,true)).join("");
}


function renderDashboardSummary(){
  const available=machines.filter(m=>m.status==="available").length;
  const busy=machines.filter(m=>m.status==="busy").length;
  const maintenance=machines.filter(m=>m.status==="maintenance").length;

  const pairs = {
    dashAvailable: available,
    dashBusy: busy,
    dashMaintenance: maintenance
  };
  Object.entries(pairs).forEach(([id,val])=>{
    const el=document.getElementById(id);
    if(el) el.textContent=val;
  });

  const list=document.getElementById("dashboardRecentList");
  if(list){
    const latest=transactions.slice(0,3);
    list.innerHTML=latest.length ? latest.map(t=>`
      <div class="dashboard-recent-item">
        <div>
          <strong>Mesin ${String(t.machine).padStart(2,"0")} · ${t.service}</strong>
          <span>${t.time} · ${t.payment}</span>
        </div>
        <b>${rupiah(t.total)}</b>
      </div>
    `).join("") : `<div class="empty-mini">Belum ada transaksi.</div>`;
  }
}

function renderTransactions(){
  const dashboardTable=document.getElementById("transactionTable");
  if(dashboardTable) dashboardTable.innerHTML=transactions.map(t=>rowHtml(t,true)).join("");
  updateStats();
  renderDashboardSummary();
  renderOperationMachines();
  updateOperationSummary();
  renderOperationTransactions();
  renderAllTransactions();
  renderReports();
}

function updateStats(){
  const total=transactions.reduce((a,b)=>a+b.total,0);
  const cash=transactions.filter(x=>x.payment==="Cash").reduce((a,b)=>a+b.total,0);
  const qris=transactions.filter(x=>x.payment==="QRIS").reduce((a,b)=>a+b.total,0);
  const coins=transactions.reduce((a,b)=>a+b.coins,0);
  document.getElementById("todayRevenue").textContent=rupiah(total);
  document.getElementById("cashRevenue").textContent=rupiah(cash);
  document.getElementById("qrisRevenue").textContent=rupiah(qris);
  document.getElementById("coinTotal").textContent=coins;
  document.getElementById("todayTxCount").textContent=`${transactions.length} transaksi`;
}

function renderAllTransactions(){
  const table=document.getElementById("allTransactionTable");
  if(!table) return;
  const search=(document.getElementById("txSearch")?.value||"").toLowerCase();
  const pay=document.getElementById("txPaymentFilter")?.value||"all";
  const status=document.getElementById("txStatusFilter")?.value||"all";
  const machine=document.getElementById("txMachineFilter")?.value||"all";
  const filtered=transactions.filter(t=>{
    const hay=`mesin ${t.machine} ${t.service} ${t.payment} ${t.status}`.toLowerCase();
    return (!search||hay.includes(search))
      && (pay==="all"||t.payment===pay)
      && (status==="all"||t.status===status)
      && (machine==="all"||String(t.machine)===machine);
  });
  table.innerHTML=filtered.length?filtered.map(t=>rowHtml(t,true)).join(""):`<tr><td colspan="8" style="text-align:center;color:#71809b;padding:28px">Tidak ada transaksi yang cocok.</td></tr>`;
}


let editingMachineId = null;

function machineStatusLabel(status){
  if(status==="available") return "Tersedia";
  if(status==="busy") return "Digunakan";
  if(status==="completed") return "Selesai";
  return "Maintenance";
}

function renderMachineAdmin(){
  const grid=document.getElementById("machineAdminGrid");
  if(!grid) return;

  const search=(document.getElementById("machineSearch")?.value||"").toLowerCase();
  const status=document.getElementById("machineStatusFilter")?.value||"all";
  const type=document.getElementById("machineTypeFilter")?.value||"all";

  const filtered=machines.filter(m=>{
    const hay=`mesin ${m.id} ${m.type} ${m.capacity} ${m.note||""}`.toLowerCase();
    return (!search || hay.includes(search))
      && (status==="all" || m.status===status)
      && (type==="all" || m.type===type);
  });

  grid.innerHTML=filtered.length ? filtered.map(m=>`
    <article class="machine-admin-card">
      <div class="machine-admin-top">
        <div class="machine-admin-title">
          <h3>Mesin ${String(m.id).padStart(2,"0")}</h3>
          <span>${m.type}</span>
        </div>
        <span class="status ${m.status}">● ${machineStatusLabel(m.status)}</span>
      </div>

      <div class="machine-admin-body">
        <div class="machine-admin-icon">${m.type==="Dryer"?"◉":"◍"}</div>
        <div class="machine-detail-list">
          <div class="machine-detail-row"><span>Kapasitas</span><strong>${m.capacity}</strong></div>
          <div class="machine-detail-row"><span>Durasi Default</span><strong>${m.duration||"-"} menit</strong></div>
          <div class="machine-detail-row"><span>Status</span><strong>${machineStatusLabel(m.status)}</strong></div>
          <div class="machine-detail-row"><span>Catatan</span><strong>${m.note||"-"}</strong></div>
        </div>
      </div>

      <div class="machine-admin-actions">
        <button class="edit-machine-btn" data-edit-machine="${m.id}">Edit</button>
        ${
          m.status==="busy"
          ? `<button class="finish-machine-btn" data-finish-machine="${m.id}">Tandai Selesai</button>`
          : m.status==="completed"
          ? `<button class="finish-machine-btn" data-ready-machine="${m.id}">Tersedia Lagi</button>`
          : m.status==="maintenance"
          ? `<button class="finish-machine-btn" data-ready-machine="${m.id}">Aktifkan</button>`
          : `<button class="maintenance-machine-btn" data-maintenance-machine="${m.id}">Maintenance</button>`
        }
      </div>
    </article>
  `).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>Tidak ada mesin</h3><p>Filter tidak menemukan data mesin yang cocok.</p></div>`;

  grid.querySelectorAll("[data-edit-machine]").forEach(btn=>btn.onclick=()=>openMachineModal(Number(btn.dataset.editMachine)));
  grid.querySelectorAll("[data-finish-machine]").forEach(btn=>btn.onclick=()=>setMachineStatus(Number(btn.dataset.finishMachine),"completed"));
  grid.querySelectorAll("[data-ready-machine]").forEach(btn=>btn.onclick=()=>setMachineStatus(Number(btn.dataset.readyMachine),"available"));
  grid.querySelectorAll("[data-maintenance-machine]").forEach(btn=>btn.onclick=()=>setMachineStatus(Number(btn.dataset.maintenanceMachine),"maintenance"));

  updateMachineAdminSummary();
}

function updateMachineAdminSummary(){
  const map={
    machineTotal:machines.length,
    machineAvailable:machines.filter(m=>m.status==="available").length,
    machineBusy:machines.filter(m=>m.status==="busy").length,
    machineMaintenance:machines.filter(m=>m.status==="maintenance").length
  };
  Object.entries(map).forEach(([id,val])=>{
    const el=document.getElementById(id);
    if(el) el.textContent=val;
  });
}

function setMachineStatus(id,status){
  const machine=machines.find(m=>m.id===id);
  if(!machine) return;
  machine.status=status;
  if(status!=="busy") delete machine.finishAt;
  if(status==="maintenance") machine.note=machine.note||"Maintenance";
  if(status==="completed") machine.note=machine.note||"Siklus selesai";
  renderMachines();
  renderOperationMachines();
  renderMachineAdmin();
  updateOperationSummary();
  renderDashboardSummary();
}

function openMachineModal(id=null){
  editingMachineId=id;
  const editing=id!==null;
  const machine=editing?machines.find(m=>m.id===id):null;

  document.getElementById("machineModalTitle").textContent=editing?"Edit Mesin":"Tambah Mesin";
  document.getElementById("machineNumberInput").value=editing?machine.id:(Math.max(0,...machines.map(m=>m.id))+1);
  document.getElementById("machineNumberInput").disabled=editing;
  document.getElementById("machineTypeInput").value=editing?machine.type:"Mesin Cuci";
  document.getElementById("machineCapacityInput").value=editing?machine.capacity:"8 KG";
  document.getElementById("machineStatusInput").value=editing?machine.status:"available";
  document.getElementById("machineDurationInput").value=editing?(machine.duration||35):35;
  document.getElementById("machineNoteInput").value=editing?(machine.note||""):"";
  document.getElementById("deleteMachineBtn").classList.toggle("hidden-inline",!editing);

  document.getElementById("machineBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeMachineModal(){
  document.getElementById("machineBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function saveMachine(){
  const id=Number(document.getElementById("machineNumberInput").value);
  const type=document.getElementById("machineTypeInput").value;
  const capacity=document.getElementById("machineCapacityInput").value.trim();
  const status=document.getElementById("machineStatusInput").value;
  const duration=Number(document.getElementById("machineDurationInput").value)||35;
  const note=document.getElementById("machineNoteInput").value.trim();

  if(!id || !capacity){
    alert("Nomor mesin dan kapasitas wajib diisi.");
    return;
  }

  if(editingMachineId!==null){
    const machine=machines.find(m=>m.id===editingMachineId);
    Object.assign(machine,{type,capacity,status,duration,note});
    if(status==="busy") machine.finishAt=Date.now()+duration*60*1000;
    else delete machine.finishAt;
  } else {
    if(machines.some(m=>m.id===id)){
      alert("Nomor mesin sudah digunakan.");
      return;
    }
    const newMachine={id,type,capacity,status,duration,note};
    if(status==="busy") newMachine.finishAt=Date.now()+duration*60*1000;
    machines.push(newMachine);
    machines.sort((a,b)=>a.id-b.id);
  }

  closeMachineModal();
  renderMachines();
  renderOperationMachines();
  renderMachineAdmin();
  updateOperationSummary();
  renderDashboardSummary();
}

function deleteMachine(){
  if(editingMachineId===null) return;
  const machine=machines.find(m=>m.id===editingMachineId);
  if(!machine) return;
  if(machine.status==="busy"){
    alert("Mesin yang sedang digunakan tidak bisa dihapus.");
    return;
  }
  if(!confirm(`Hapus Mesin ${String(machine.id).padStart(2,"0")}?`)) return;

  const idx=machines.findIndex(m=>m.id===editingMachineId);
  machines.splice(idx,1);
  closeMachineModal();
  renderMachines();
  renderOperationMachines();
  renderMachineAdmin();
  updateOperationSummary();
  renderDashboardSummary();
}


let editingServiceId = null;

function serviceUnitText(unit){
  if(unit==="kg") return "per kg";
  if(unit==="7kg") return "per 7 kg";
  return "per paket";
}

function renderServiceAdmin(){
  const grid=document.getElementById("serviceAdminGrid");
  if(!grid) return;

  const search=(document.getElementById("serviceSearch")?.value||"").toLowerCase();
  const type=document.getElementById("serviceTypeFilter")?.value||"all";
  const status=document.getElementById("serviceStatusFilter")?.value||"all";

  const filtered=services.filter(s=>{
    const hay=`${s.name} ${s.type} ${s.unit} ${s.note||""}`.toLowerCase();
    return (!search||hay.includes(search))
      && (type==="all"||s.type===type)
      && (status==="all"||(status==="active" ? s.active!==false : s.active===false));
  });

  grid.innerHTML=filtered.length ? filtered.map(s=>`
    <article class="service-card-admin">
      <div class="service-card-top">
        <div>
          <h3>${s.name}</h3>
          <p>${s.type}</p>
        </div>
        <span class="status ${s.active!==false ? "available":"inactive"}">● ${s.active!==false ? "Aktif":"Nonaktif"}</span>
      </div>

      <div class="service-price">${rupiah(s.price)}</div>
      <div class="service-unit">${serviceUnitText(s.unit)}</div>

      <div class="service-meta">
        <div class="service-meta-row"><span>Durasi</span><strong>${s.duration||"-"} menit</strong></div>
        <div class="service-meta-row"><span>Satuan</span><strong>${s.unit==="kg"?"Per Kg":s.unit==="7kg"?"Per 7 Kg":"Per Paket"}</strong></div>
        <div class="service-meta-row"><span>Catatan</span><strong>${s.note||"-"}</strong></div>
      </div>

      <div class="service-actions">
        <button class="edit-service-btn" data-edit-service="${s.id}">Edit</button>
        <button class="toggle-service-btn" data-toggle-service="${s.id}">${s.active!==false ? "Nonaktifkan":"Aktifkan"}</button>
      </div>
    </article>
  `).join("") : `<div class="empty-state" style="grid-column:1/-1"><h3>Tidak ada layanan</h3><p>Filter tidak menemukan layanan yang cocok.</p></div>`;

  grid.querySelectorAll("[data-edit-service]").forEach(btn=>btn.onclick=()=>openServiceModal(btn.dataset.editService));
  grid.querySelectorAll("[data-toggle-service]").forEach(btn=>btn.onclick=()=>toggleService(btn.dataset.toggleService));

  updateServiceSummary();
}

function updateServiceSummary(){
  const active=services.filter(s=>s.active!==false).length;
  const main=services.find(s=>s.id==="wash-dry");
  const dryer=services.find(s=>s.id==="dry");

  const map={
    serviceTotal:services.length,
    serviceActive:active,
    mainServicePrice:main?rupiah(main.price):"-",
    dryerServicePrice:dryer?rupiah(dryer.price):"-"
  };

  Object.entries(map).forEach(([id,val])=>{
    const el=document.getElementById(id);
    if(el) el.textContent=val;
  });
}

function openServiceModal(id=null){
  editingServiceId=id;
  const editing=id!==null;
  const s=editing?services.find(x=>x.id===id):null;

  document.getElementById("serviceModalTitle").textContent=editing?"Edit Layanan":"Tambah Layanan";
  document.getElementById("serviceNameInput").value=editing?s.name:"";
  document.getElementById("serviceTypeInput").value=editing?s.type:"Mesin Cuci";
  document.getElementById("servicePriceInput").value=editing?s.price:35000;
  document.getElementById("serviceUnitInput").value=editing?s.unit:"7kg";
  document.getElementById("serviceDurationInput").value=editing?(s.duration||35):35;
  document.getElementById("serviceActiveInput").value=editing?(s.active!==false?"active":"inactive"):"active";
  document.getElementById("serviceNoteInput").value=editing?(s.note||""):"";
  document.getElementById("deleteServiceBtn").classList.toggle("hidden-inline",!editing);

  document.getElementById("serviceBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeServiceModal(){
  document.getElementById("serviceBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function makeServiceId(name){
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || `service-${Date.now()}`;
}

function saveService(){
  const name=document.getElementById("serviceNameInput").value.trim();
  const type=document.getElementById("serviceTypeInput").value;
  const price=Number(document.getElementById("servicePriceInput").value)||0;
  const unit=document.getElementById("serviceUnitInput").value;
  const duration=Number(document.getElementById("serviceDurationInput").value)||35;
  const active=document.getElementById("serviceActiveInput").value==="active";
  const note=document.getElementById("serviceNoteInput").value.trim();

  if(!name || price<=0){
    alert("Nama layanan dan harga wajib diisi.");
    return;
  }

  if(editingServiceId!==null){
    const s=services.find(x=>x.id===editingServiceId);
    Object.assign(s,{name,type,price,unit,duration,active,note});
  } else {
    let id=makeServiceId(name);
    if(services.some(s=>s.id===id)) id=`${id}-${Date.now()}`;
    services.push({id,name,type,price,unit,duration,active,note});
  }

  closeServiceModal();
  renderServiceAdmin();
  renderTransactions();
}

function toggleService(id){
  const s=services.find(x=>x.id===id);
  if(!s) return;
  s.active=!(s.active!==false);
  renderServiceAdmin();
}

function deleteService(){
  if(editingServiceId===null) return;
  const s=services.find(x=>x.id===editingServiceId);
  if(!s) return;
  if(!confirm(`Hapus layanan "${s.name}"?`)) return;

  services=services.filter(x=>x.id!==editingServiceId);
  closeServiceModal();
  renderServiceAdmin();
}

function renderReports(){
  const total=transactions.reduce((a,b)=>a+b.total,0);
  const cash=transactions.filter(x=>x.payment==="Cash").reduce((a,b)=>a+b.total,0);
  const qris=transactions.filter(x=>x.payment==="QRIS").reduce((a,b)=>a+b.total,0);
  const cashPct=total?Math.round(cash/total*100):0;
  const qrisPct=total?100-cashPct:0;

  const ids={
    reportRevenue:rupiah(total),
    reportTxCount:String(transactions.length),
    reportCash:rupiah(cash),
    reportQris:rupiah(qris),
    cashPercentText:`${cashPct}%`,
    qrisPercentText:`${qrisPct}%`
  };
  Object.entries(ids).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
  const cashBar=document.getElementById("cashBar"), qrisBar=document.getElementById("qrisBar");
  if(cashBar)cashBar.style.width=`${cashPct}%`;
  if(qrisBar)qrisBar.style.width=`${qrisPct}%`;

  const usage={};
  machines.forEach(m=>usage[m.id]=0);
  transactions.forEach(t=>usage[t.machine]=(usage[t.machine]||0)+1);
  const max=Math.max(1,...Object.values(usage));
  const list=document.getElementById("machineUsageList");
  if(list) list.innerHTML=Object.entries(usage).map(([id,count])=>`
    <div class="usage-row">
      <span>Mesin ${String(id).padStart(2,"0")}</span>
      <div class="mini-track"><i style="width:${count/max*100}%"></i></div>
      <strong>${count}</strong>
    </div>`).join("");

  const reportTable=document.getElementById("reportTable");
  if(reportTable) reportTable.innerHTML=transactions.map(t=>rowHtml(t,false)).join("");
}

function exportCSV(){
  const rows=[["Waktu","Mesin","Berat","Layanan","Pembayaran","Koin","Total","Status"]];
  transactions.forEach(t=>rows.push([t.time,`Mesin ${String(t.machine).padStart(2,"0")}`,t.weight||"",t.service,t.payment,t.coins,t.total,t.status]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="laporan-coin-laundry.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function populateMachineSelect(selectedId=null){
  const sel=document.getElementById("machineSelect");
  const available=machines.filter(m=>m.status==="available");
  sel.innerHTML=available.map(m=>`<option value="${m.id}">Mesin ${String(m.id).padStart(2,"0")} — ${m.type}</option>`).join("");
  if(selectedId) sel.value=String(selectedId);
  updateServices();
}

function updateServices(){
  const machine=machines.find(m=>m.id===Number(document.getElementById("machineSelect").value));
  const sel=document.getElementById("serviceSelect");
  const opts=services.filter(s=>s.type===machine.type && s.active!==false);
  sel.innerHTML=opts.map(s=>`<option value="${s.id}">${s.name}</option>`).join("");
  updateSummary();
}

function calculateTotal(){
  const service=services.find(s=>s.id===document.getElementById("serviceSelect").value);
  const weight=Number(document.getElementById("weightInput").value)||0;
  if(service.unit==="kg") return service.price*weight;
  if(service.unit==="7kg") return service.price*Math.max(1,Math.ceil(weight/7));
  return service.price;
}

function updatePaymentUI(){
  const payment=document.getElementById("paymentSelect").value;
  const isCash=payment==="Cash";
  document.getElementById("cashReceivedLabel").style.display=isCash?"block":"none";
  document.getElementById("changeLabel").style.display=isCash?"block":"none";
  document.getElementById("qrisConfirmBox").classList.toggle("hidden-inline", isCash);
  updateSummary();
}

function updateSummary(){
  const machineId=Number(document.getElementById("machineSelect").value);
  const machine=machines.find(m=>m.id===machineId);
  if(!machine) return;
  const total=calculateTotal();
  const payment=document.getElementById("paymentSelect").value;
  const weight=Number(document.getElementById("weightInput").value)||0;
  const cashReceived=Number(document.getElementById("cashReceivedInput").value)||0;
  const change=Math.max(cashReceived-total,0);
  const selectedService=services.find(s=>s.id===document.getElementById("serviceSelect").value);
  if(selectedService && selectedService.unit==="7kg"){
    document.getElementById("coinInput").value=Math.max(1,Math.ceil(weight/7));
  }
  document.getElementById("totalInput").value=rupiah(total);
  document.getElementById("changeInput").value=rupiah(change);
  document.getElementById("sumMachine").textContent=`Mesin ${String(machineId).padStart(2,"0")}`;
  const selectedServiceForSummary=services.find(s=>s.id===document.getElementById("serviceSelect").value);
  document.getElementById("sumWeight").textContent=machine.type==="Dryer"?"Paket":selectedServiceForSummary?.unit==="7kg"?`${weight} kg · ${Math.max(1,Math.ceil(weight/7))} paket`:`${weight} kg`;
  document.getElementById("sumPayment").textContent=payment;
  document.getElementById("sumTotal").textContent=rupiah(total);
  validateTransaction();
}

function validateTransaction(){
  const payment=document.getElementById("paymentSelect").value;
  const total=calculateTotal();
  const cashReceived=Number(document.getElementById("cashReceivedInput").value)||0;
  const qrisOK=document.getElementById("qrisConfirmed").checked;
  const valid = payment==="Cash" ? cashReceived>=total : qrisOK;
  const btn=document.getElementById("saveTx");
  btn.disabled=!valid;
  btn.classList.toggle("invalid",!valid);
}

function resetTransactionForm(){
  document.getElementById("weightInput").value=5;
  document.getElementById("paymentSelect").value="Cash";
  document.getElementById("cashReceivedInput").value="";
  document.getElementById("qrisConfirmed").checked=false;
  document.getElementById("coinInput").value=1;
  document.getElementById("customerInput").value="";
}

function openTx(machineId=null){
  resetTransactionForm();
  populateMachineSelect(machineId);
  updatePaymentUI();
  document.getElementById("txBackdrop").classList.remove("hidden");
  document.body.classList.add("modal-open");
}

["serviceSelect","weightInput","cashReceivedInput","coinInput"].forEach(id=>{
  document.getElementById(id).addEventListener("input",updateSummary);
});
document.getElementById("machineSelect").addEventListener("change",updateServices);
document.getElementById("paymentSelect").addEventListener("change",updatePaymentUI);
document.getElementById("qrisConfirmed").addEventListener("change",validateTransaction);

document.getElementById("coinMinus").onclick=()=>{
  const input=document.getElementById("coinInput");
  input.value=Math.max(1,(Number(input.value)||1)-1);
  updateSummary();
};
document.getElementById("coinPlus").onclick=()=>{
  const input=document.getElementById("coinInput");
  input.value=(Number(input.value)||1)+1;
  updateSummary();
};

document.getElementById("saveTx").onclick=()=>{
  const machineId=Number(document.getElementById("machineSelect").value);
  const machine=machines.find(m=>m.id===machineId);
  const service=services.find(s=>s.id===document.getElementById("serviceSelect").value);
  const weight=Number(document.getElementById("weightInput").value)||0;
  const payment=document.getElementById("paymentSelect").value;
  const coins=Number(document.getElementById("coinInput").value)||1;
  const total=calculateTotal();
  const now=new Date().toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
  transactions.unshift({time:now,machine:machineId,weight:machine.type==="Dryer"?0:weight,service:service.name,payment,coins,total,status:"Berjalan"});
  machine.status="busy";
  const durationMin = machine.duration || (service.type==="Dryer"?30:35);
  machine.finishAt = Date.now() + durationMin*60*1000;
  document.getElementById("txBackdrop").classList.add("hidden");
  document.body.classList.remove("modal-open");
  document.getElementById("successText").innerHTML=`Transaksi <b>${service.name}</b> dengan pembayaran <b>${payment}</b> sebesar <b>${rupiah(total)}</b> telah dicatat. Serahkan <b>${coins} koin/token</b> kepada pelanggan untuk Mesin ${String(machineId).padStart(2,"0")}.`;
  document.getElementById("successBackdrop").classList.remove("hidden");
  renderMachines(); renderTransactions();
};

document.getElementById("closeTx").onclick=()=>{document.getElementById("txBackdrop").classList.add("hidden");document.body.classList.remove("modal-open");};
document.getElementById("doneBtn").onclick=()=>document.getElementById("successBackdrop").classList.add("hidden");
document.getElementById("newTransactionTop").onclick=()=>openTx();
document.getElementById("newTransactionHero").onclick=()=>openTx();
document.getElementById("mobileNewTx").onclick=()=>openTx();
document.getElementById("newTransactionTransactions").onclick=()=>openTx();
document.getElementById("newTransactionOperations").onclick=()=>openTx();

document.getElementById("txSearch").addEventListener("input",renderAllTransactions);
document.getElementById("txPaymentFilter").addEventListener("change",renderAllTransactions);
document.getElementById("txStatusFilter").addEventListener("change",renderAllTransactions);
document.getElementById("txMachineFilter").addEventListener("change",renderAllTransactions);
document.getElementById("resetTxFilter").onclick=()=>{
  document.getElementById("txSearch").value="";
  document.getElementById("txPaymentFilter").value="all";
  document.getElementById("txStatusFilter").value="all";
  document.getElementById("txMachineFilter").value="all";
  renderAllTransactions();
};
document.getElementById("exportReportBtn").onclick=exportCSV;

function showView(view, updateHash=true){
  document.querySelectorAll(".app-view").forEach(v=>{
    v.classList.remove("active-view");
    v.classList.add("hidden-view");
  });
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));

  let target=null;

  if(view==="dashboard"){
    target=document.getElementById("view-dashboard");
    renderDashboardSummary();
  } else if(view==="operations"){
    target=document.getElementById("view-operations");
    renderOperationMachines();
    updateOperationSummary();
    renderOperationTransactions();
  } else if(view==="transactions"){
    target=document.getElementById("view-transactions");
    renderAllTransactions();
  } else if(view==="reports"){
    target=document.getElementById("view-reports");
    renderReports();
  } else if(view==="machines"){
    target=document.getElementById("view-machines");
    renderMachineAdmin();
  } else if(view==="services"){
    target=document.getElementById("view-services");
    renderServiceAdmin();
  } else {
    target=document.getElementById("view-placeholder");
    document.getElementById("placeholderTitle").textContent={
      settings:"Pengaturan"
    }[view]||"Menu";
  }

  if(target){
    target.classList.remove("hidden-view");
    target.classList.add("active-view");
  }

  const nav=document.querySelector(`.nav-item[data-view="${view}"]`);
  if(nav)nav.classList.add("active");

  if(updateHash && location.hash !== `#${view}`){
    history.pushState(null,"",`#${view}`);
  }

  window.scrollTo({top:0,behavior:"auto"});
}


document.querySelectorAll("[data-go]").forEach(btn=>{
  btn.addEventListener("click",()=>showView(btn.dataset.go));
});

window.addEventListener("hashchange",()=>{
  const view=(location.hash||"#dashboard").slice(1);
  showView(view,false);
});

document.querySelectorAll(".nav-item[data-view]").forEach(btn=>{
  btn.addEventListener("click",()=>showView(btn.dataset.view));
});


document.querySelectorAll("[data-mobile-view]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    showView(btn.dataset.mobileView);
    document.querySelectorAll("[data-mobile-view]").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
  });
});



document.getElementById("addServiceBtn").onclick=()=>openServiceModal();
document.getElementById("closeServiceModal").onclick=closeServiceModal;
document.getElementById("saveServiceBtn").onclick=saveService;
document.getElementById("deleteServiceBtn").onclick=deleteService;
document.getElementById("serviceSearch").addEventListener("input",renderServiceAdmin);
document.getElementById("serviceTypeFilter").addEventListener("change",renderServiceAdmin);
document.getElementById("serviceStatusFilter").addEventListener("change",renderServiceAdmin);
document.getElementById("resetServiceFilter").onclick=()=>{
  document.getElementById("serviceSearch").value="";
  document.getElementById("serviceTypeFilter").value="all";
  document.getElementById("serviceStatusFilter").value="all";
  renderServiceAdmin();
};
document.getElementById("serviceBackdrop").addEventListener("click",(e)=>{
  if(e.target.id==="serviceBackdrop") closeServiceModal();
});

document.getElementById("addMachineBtn").onclick=()=>openMachineModal();
document.getElementById("closeMachineModal").onclick=closeMachineModal;
document.getElementById("saveMachineBtn").onclick=saveMachine;
document.getElementById("deleteMachineBtn").onclick=deleteMachine;
document.getElementById("machineSearch").addEventListener("input",renderMachineAdmin);
document.getElementById("machineStatusFilter").addEventListener("change",renderMachineAdmin);
document.getElementById("machineTypeFilter").addEventListener("change",renderMachineAdmin);
document.getElementById("resetMachineFilter").onclick=()=>{
  document.getElementById("machineSearch").value="";
  document.getElementById("machineStatusFilter").value="all";
  document.getElementById("machineTypeFilter").value="all";
  renderMachineAdmin();
};
document.getElementById("machineBackdrop").addEventListener("click",(e)=>{
  if(e.target.id==="machineBackdrop") closeMachineModal();
});

document.getElementById("txBackdrop").addEventListener("click",(e)=>{
  if(e.target.id==="txBackdrop"){
    document.getElementById("txBackdrop").classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
});


function updateCountdowns(){
  let changed=false;

  machines.forEach(machine=>{
    if(machine.status==="busy" && machine.finishAt){
      const remaining=machine.finishAt-Date.now();
      if(remaining<=0){
        machine.status="completed";
        delete machine.finishAt;
        machine.note=machine.note||"Siklus selesai";
        changed=true;

        const tx=transactions.find(t=>t.machine===machine.id && t.status==="Berjalan");
        if(tx) tx.status="Selesai";
      }
    }
  });

  document.querySelectorAll("[data-countdown-machine]").forEach(el=>{
    const id=Number(el.dataset.countdownMachine);
    const machine=machines.find(m=>m.id===id);
    if(machine && machine.status==="busy" && machine.finishAt){
      el.textContent=machineRemainingText(machine);
    }
  });

  if(changed){
    renderMachines();
    renderOperationMachines();
    renderMachineAdmin();
    renderTransactions();
    updateOperationSummary();
    renderDashboardSummary();
  }
}

function updateClock(){
  const d=new Date();
  const tm=d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});
  document.getElementById("clock").textContent=tm;
  document.getElementById("shiftClock").textContent=tm;
  document.getElementById("dateText").textContent=d.toLocaleDateString("id-ID",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
}
setInterval(updateClock,1000);updateClock();
setInterval(updateCountdowns,1000);
renderMachines();renderTransactions();renderMachineAdmin();renderServiceAdmin();updateCountdowns();showView((location.hash||"#dashboard").slice(1),false);
