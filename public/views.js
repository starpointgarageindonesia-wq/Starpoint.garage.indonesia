import {state,esc,money,num,shortMoney,number,fmtDate,unitName,statusName,priorityName,taskName,partPurpose,partStatus,finance,metrics,ledger,canEdit,unitTasks,unitParts,unitExpenses,unitPhotos,partPhotos,photoSrc,photoForMotor,photoForPart} from "./core.js";
const id=v=>esc(v||"");
const btn=(text,action,item="",style="btn btn-outline btn-sm")=>'<button class="'+style+'" data-action="'+action+'"'+(item?' data-id="'+id(item)+'"':'')+(canEdit()||action.startsWith("export-")?'':' disabled')+'>'+text+'</button>';
const link=(text,view)=>'<button class="text-link" data-nav="'+view+'">'+text+'</button>';
const empty=(s)=>'<div class="empty-state">'+esc(s)+'</div>';
const pill=(s,style="stock")=>'<span class="badge-status '+id(style)+'">'+esc(s||"-")+'</span>';
const photo=(src,cls="thumb")=>src?'<img class="'+cls+'" src="'+id(src)+'" alt="Foto motor" loading="lazy">':'<div class="'+cls+' thumb-placeholder">◈</div>';
const mVal=(v)=>v===null||v===undefined?'<span class="muted">Belum diisi</span>':'<span class="'+(v<0?"negative":"positive")+'">'+money(v)+'</span>';
const title=(name,sub="",actions="")=>'<header class="page-intro"><div><h1>'+name+'</h1>'+(sub?'<p>'+sub+'</p>':"")+'</div>'+(actions?'<div class="page-actions">'+actions+'</div>':"")+'</header>';
const panel=(name,body,actions="")=>'<section class="panel"><div class="panel-head"><h3>'+name+'</h3>'+actions+'</div>'+body+'</section>';
const stat=(label,value)=>'<div class="stat"><span class="stat-label">'+label+'</span><strong class="value mono">'+value+'</strong></div>';
const records=(heading,body,action="")=>panel(heading,body,action);
const table=(head,rows,emptyText)=>rows.length?'<div class="table-wrap"><table><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>':empty(emptyText);
export function renderPage(){
 const labels={dashboard:"Ringkasan",motors:"Motor",detail:"Motor",parts:"Sparepart",cash:"Keuangan",reports:"Laporan"};
 document.getElementById("pageTitle").textContent=labels[state.view]||"Ringkasan";
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===state.view||(state.view==="detail"&&x.dataset.nav==="motors")));
 const top=document.getElementById("topAdd");if(top)top.hidden=true;
 const views={dashboard, motors, detail, parts, cash, reports};
 document.getElementById("contentArea").innerHTML=(views[state.view]||dashboard)();
}
function dashboard(){
 const m=metrics();
 const latest=state.data.motors.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,7);
 const todo=state.data.tasks.filter(t=>t.status!=="done").slice(0,6);
 const unitRows=latest.map(m=>{const f=finance(m);return '<tr class="clickable" data-action="open-motor" data-id="'+id(m.id)+'"><td><div class="unit-cell">'+photo(photoForMotor(m.id))+'<div><strong>'+esc(unitName(m))+'</strong><small>'+esc(m.unit_code||m.model_year||"")+'</small></div></div></td><td class="mono">'+money(m.purchase_price)+'</td><td>'+pill(statusName[m.status],m.status)+'</td><td class="mono">'+mVal(m.status==="sold"?f.actualProfit:f.expectedProfit)+'</td></tr>'});
 const todoRows=todo.map(t=>{const motor=state.data.motors.find(m=>m.id===t.motor_id);return '<button class="task-shortcut" data-action="open-motor" data-id="'+id(t.motor_id)+'"><span><strong>'+esc(t.title)+'</strong><small>'+esc(unitName(motor||{}))+'</small></span>'+pill(taskName[t.status],t.status==="doing"?"work":"stock")+'</button>'}).join("");
 return title("Ringkasan","",canEdit()?btn("+ Motor","new-motor","","btn btn-red"):"")+
 '<div class="stat-grid">'+stat("Motor aktif",number(m.active))+stat("Modal tertanam",shortMoney(m.currentCapital))+stat("Perkiraan laba",mVal(m.expectedProfit))+stat("PR belum selesai",number(m.pendingTasks))+'</div>'+
 '<div class="overview-grid">'+
 records("Motor terbaru",table(["Motor","Harga beli","Status","Laba"],unitRows,"Belum ada motor."),link("Semua motor","motors"))+
 records("PR berjalan",'<div class="shortcut-list">'+(todoRows||empty("Belum ada PR."))+'</div>')+
 '</div>';
}
function filteredMotors(){
 const q=state.search.trim().toLowerCase();
 return state.data.motors.filter(m=>(state.filter==="all"||m.status===state.filter)&&(!q||[unitName(m),m.unit_code,m.plate_no,m.chassis_no].join(" ").toLowerCase().includes(q)))
 .slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
}
function motors(){
 const arr=filteredMotors();
 const controls='<div class="toolbar"><input id="motorSearch" class="search-input" type="search" placeholder="Cari motor..." aria-label="Cari motor" value="'+id(state.search)+'"><select id="statusFilter" class="select-filter" aria-label="Filter status">'+[["all","Semua status"],["stock","Stok"],["work","Dalam PR"],["ready","Siap jual"],["sold","Terjual"],["archived","Arsip"]].map(([key,name])=>'<option value="'+key+'"'+(state.filter===key?" selected":"")+'>'+name+'</option>').join("")+'</select></div>';
 const rows=arr.map(m=>{
  const f=finance(m),name=unitName(m),value=m.status==="sold"?f.actualProfit:f.expectedProfit;
  return '<div class="swipe-motor" data-swipe-motor data-id="'+id(m.id)+'">'+
    '<div class="swipe-behind swipe-behind-delete" aria-hidden="true">Hapus</div>'+
    '<div class="swipe-behind swipe-behind-edit" aria-hidden="true">Edit</div>'+
    '<button type="button" class="swipe-surface" data-action="open-motor" data-id="'+id(m.id)+'" aria-label="Buka '+esc(name)+'. Geser kiri untuk edit, geser kanan untuk hapus.">'+
      '<span class="swipe-motor-name">'+photo(photoForMotor(m.id))+'<span><strong>'+esc(name)+'</strong><small>'+esc([m.model_year,m.plate_no].filter(Boolean).join(" · ")||m.unit_code||"")+'</small></span></span>'+
      '<span class="swipe-motor-state">'+pill(statusName[m.status],m.status)+'</span>'+
      '<span class="swipe-motor-price"><small>Harga beli</small><strong>'+money(m.purchase_price)+'</strong></span>'+
      '<span class="swipe-motor-price"><small>Target / terjual</small><strong>'+money(m.status==="sold"?m.actual_sale_price:m.target_sale_price)+'</strong></span>'+
      '<span class="swipe-motor-profit"><small>Laba</small><strong>'+mVal(value)+'</strong></span>'+
    '</button></div>';
 }).join("");
 return title("Motor","",canEdit()?btn("+ Motor","new-motor","","btn btn-red"):"")+
 '<section class="panel">'+controls+
 (arr.length?'<div class="swipe-unit-list"><div class="swipe-help">Geser kiri untuk edit · kanan untuk hapus</div>'+rows+'</div>':empty("Tidak ada motor."))+
 '</section>';
}
function detail(){
 const m=state.data.motors.find(x=>x.id===state.selected);
 if(!m)return motors();
 const f=finance(m),tabs=[["summary","Ringkasan"],["tasks","PR"],["parts","Sparepart"],["expenses","Biaya"],["photos","Foto"],["history","Riwayat"]];
 const sections={summary:detailSummary,tasks:detailTasks,parts:detailParts,expenses:detailExpenses,photos:detailPhotos,history:detailHistory};
 const cover=photoForMotor(m.id);
 return '<div class="backline">'+link("Motor","motors")+'<span>/</span><span>'+esc(m.unit_code||unitName(m))+'</span></div>'+
 title(esc(unitName(m)),pill(statusName[m.status],m.status),canEdit()?btn("Ubah motor","edit-motor",m.id):"")+
 '<div class="unit-summary"><div class="unit-summary-image">'+photo(cover,"detail-photo"+(cover?"":" photo-placeholder"))+'</div><div class="unit-summary-values">'+
 stat("Harga beli",money(m.purchase_price))+stat("Total modal",money(f.cost))+
 stat(m.status==="sold"?"Harga terjual":"Target jual",money(m.status==="sold"?m.actual_sale_price:m.target_sale_price))+
 stat("Laba "+(m.status==="sold"?"aktual":"perkiraan"),mVal(m.status==="sold"?f.actualProfit:f.expectedProfit))+
 '</div></div>'+
 '<div class="panel detail-panel"><div class="tabs" role="tablist">'+tabs.map(([k,name])=>'<button role="tab" aria-selected="'+(k===state.detailTab)+'" class="'+(k===state.detailTab?"active":"")+'" data-action="detail-tab" data-value="'+k+'">'+name+'</button>').join("")+'</div>'+
 (sections[state.detailTab]||detailSummary)(m,f)+'</div>';
}
function detailSummary(m,f){
 const fields=[
 ["Kode stok",m.unit_code],["Tahun",m.model_year],["Odometer",m.odometer_km?number(m.odometer_km)+" km":null],
 ["Nomor polisi",m.plate_no],["Nomor rangka",m.chassis_no],["Tanggal beli",fmtDate(m.purchase_date)]
 ];
 const breakdown=[
 ["Harga beli",m.purchase_price],["Sparepart dibeli",f.purchased],["Biaya aktual",f.realExpense],
 ["Biaya rencana",f.plannedPart+f.planExpense]
 ];
 return '<div class="detail-columns"><div><h3>Informasi motor</h3><dl class="info-list">'+fields.map(([key,value])=>'<div><dt>'+key+'</dt><dd>'+esc(value||"-")+'</dd></div>').join("")+'</dl>'+(m.notes?'<p class="unit-note">'+esc(m.notes)+'</p>':"")+'</div>'+
 '<div><h3>Rincian modal</h3><dl class="info-list">'+breakdown.map(([key,value])=>'<div><dt>'+key+'</dt><dd class="mono">'+money(value)+'</dd></div>').join("")+
 '<div class="emphasis"><dt>Proyeksi HPP</dt><dd class="mono">'+money(f.expectedCost)+'</dd></div></dl></div></div>';
}
function detailTasks(m){
 const rows=unitTasks(m.id).slice().sort((a,b)=>({todo:0,doing:1,done:2}[a.status]??3)-({todo:0,doing:1,done:2}[b.status]??3)).map(t=>
  '<div class="record-row"><button class="task-check '+(t.status==="done"?"checked":"")+'" data-action="toggle-task" data-id="'+id(t.id)+'" aria-label="Centang PR '+esc(t.title)+'"'+(canEdit()?"":" disabled")+'>'+(t.status==="done"?"✓":t.status==="doing"?"◐":"○")+'</button>'+
  '<div class="record-main"><strong>'+esc(t.title)+'</strong><small>'+pill(taskName[t.status],t.status==="done"?"ready":"stock")+' · '+esc(priorityName[t.priority])+(t.due_date?' · '+fmtDate(t.due_date):"")+'</small>'+(t.notes?'<small>'+esc(t.notes)+'</small>':"")+'</div>'+
  '<div class="record-price mono">'+money(t.estimated_cost)+'</div><div class="record-actions">'+btn("Ubah","edit-task",t.id)+btn("Hapus","delete-task",t.id,"btn btn-text-danger btn-sm")+'</div></div>'
 ).join("");
 return '<div class="panel-head inside"><h3>PR motor</h3>'+(canEdit()?btn("+ PR","new-task",m.id,"btn btn-red btn-sm"):"")+'</div><div class="records">'+(rows||empty("Belum ada PR."))+'</div>';
}
function detailParts(m){
 const list=unitParts(m.id);
 const rows=list.map(p=>'<div class="record-row">'+photo(photoForPart(p.id))+
 '<div class="record-main"><strong>'+esc(p.name)+'</strong><small>'+number(p.quantity)+' pcs · '+esc(partStatus[p.status])+' · '+esc(partPurpose[p.purpose])+'</small>'+
 (partPhotos(p.id).length?'<div class="record-gallery">'+partPhotos(p.id).map(ph=>'<img src="'+id(photoSrc(ph.storage_path))+'" alt="Foto sparepart" loading="lazy">').join("")+'</div>':"")+'</div>'+
 '<div class="record-price mono"><strong>'+money(p.unit_cost)+'</strong><small>Est. jual '+money(p.estimated_sale_price)+'</small></div>'+
 '<div class="record-actions">'+(canEdit()?btn("+ Foto","upload-part",p.id)+btn("Ubah","edit-part",p.id)+btn("Hapus","delete-part",p.id,"btn btn-text-danger btn-sm"):"")+'</div></div>').join("");
 return '<div class="panel-head inside"><h3>Sparepart</h3>'+(canEdit()?btn("+ Sparepart","new-part",m.id,"btn btn-red btn-sm"):"")+'</div>'+
 '<div class="records">'+(rows||empty("Belum ada sparepart."))+'</div>';
}
function detailExpenses(m){
 const rows=unitExpenses(m.id).map(e=>'<div class="record-row"><div class="record-main"><strong>'+esc(e.title)+'</strong><small>'+esc(e.category)+' · '+fmtDate(e.expense_date)+' · '+(e.is_planned?"Rencana":"Dibayar")+'</small></div><strong class="record-price mono">'+money(e.amount)+'</strong><div class="record-actions">'+(canEdit()?btn("Ubah","edit-expense",e.id)+btn("Hapus","delete-expense",e.id,"btn btn-text-danger btn-sm"):"")+'</div></div>').join("");
 return '<div class="panel-head inside"><h3>Biaya motor</h3>'+(canEdit()?btn("+ Biaya","new-expense",m.id,"btn btn-red btn-sm"):"")+'</div><div class="records">'+(rows||empty("Belum ada biaya."))+'</div>';
}
function photoCard(p){
 const src=photoSrc(p.storage_path);
 return '<div class="photo-card">'+(src?'<img src="'+id(src)+'" alt="'+esc(p.caption||"Foto motor")+'" loading="lazy">':'<div class="thumb-placeholder">Foto</div>')+
 '<div class="photo-caption"><span>'+esc(p.caption||"Foto")+'</span>'+(canEdit()?btn("Hapus","delete-photo",p.id,"btn btn-text-danger btn-sm"):"")+'</div></div>';
}
function detailPhotos(m){
 const photos=unitPhotos(m.id);
 return '<div class="panel-head inside"><h3>Foto motor</h3>'+(canEdit()?btn("+ Foto","upload-motor",m.id,"btn btn-red btn-sm"):"")+'</div>'+
 '<div class="panel-body">'+(photos.length?'<div class="photo-grid">'+photos.map(photoCard).join("")+'</div>':empty("Belum ada foto."))+'</div>';
}
function detailHistory(m){
 const arr=(state.data.activity||[]).filter(a=>a.motor_id===m.id).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,80);
 const names={showroom_motorcycles:"Motor",showroom_tasks:"PR",showroom_parts:"Sparepart",showroom_expenses:"Biaya",showroom_photos:"Foto"};
 return '<div class="panel-head inside"><h3>Riwayat perubahan</h3></div><div class="records">'+(arr.length?arr.map(a=>'<div class="record-row"><div class="record-main"><strong>'+esc(names[a.entity]||a.entity)+' '+({INSERT:"ditambah",UPDATE:"diubah",DELETE:"dihapus"}[a.operation]||"")+'</strong><small>'+new Date(a.created_at).toLocaleString("id-ID")+'</small></div></div>').join(""):empty("Belum ada riwayat."))+'</div>';
}
function parts(){
 const q=state.partSearch.trim().toLowerCase();
 const list=state.data.parts.filter(p=>(p.name+" "+p.part_code).toLowerCase().includes(q));
 const rows=list.map(p=>{const m=state.data.motors.find(x=>x.id===p.motor_id);return '<tr class="clickable" data-action="open-motor-part" data-id="'+id(p.motor_id)+'"><td><div class="unit-cell">'+photo(photoForPart(p.id))+'<div><strong>'+esc(p.name)+'</strong><small>'+esc(partPurpose[p.purpose])+'</small></div></div></td><td>'+esc(unitName(m||{}))+'</td><td>'+number(p.quantity)+'</td><td>'+pill(partStatus[p.status],p.status==="sold"?"sold":"stock")+'</td><td class="mono">'+money(num(p.quantity)*num(p.unit_cost))+'</td><td class="mono">'+money(p.estimated_sale_price)+'</td></tr>'});
 return title("Sparepart")+'<section class="panel"><div class="toolbar"><input id="partsSearch" class="search-input" type="search" placeholder="Cari sparepart..." aria-label="Cari sparepart" value="'+id(state.partSearch)+'"></div>'+
 table(["Sparepart","Motor","Jumlah","Status","Total modal","Est. jual / pcs"],rows,"Belum ada sparepart.")+'</section>';
}
function cash(){
 const m=metrics(),tx=ledger();
 const rows=tx.map(x=>'<tr><td>'+fmtDate(x.date)+'</td><td>'+esc(x.type)+'</td><td>'+esc(x.unit)+'</td><td class="mono '+(x.amount>=0?"positive":"negative")+'">'+(x.amount>=0?"+":"−")+money(Math.abs(x.amount))+'</td></tr>');
 const capitals=state.data.capital.map(c=>'<div class="record-row"><div class="record-main"><strong>'+esc(c.person_name)+'</strong><small>'+fmtDate(c.entry_date)+' · '+(c.entry_type==="deposit"?"Setoran":"Penarikan")+'</small></div><strong class="record-price mono">'+money(c.amount)+'</strong><div class="record-actions">'+(canEdit()?btn("Ubah","edit-capital",c.id)+btn("Hapus","delete-capital",c.id,"btn btn-text-danger btn-sm"):"")+'</div></div>').join("");
 return title("Keuangan","",canEdit()?btn("+ Modal","new-capital","","btn btn-red"):"")+
 '<div class="stat-grid three">'+stat("Saldo tercatat",mVal(m.cash))+stat("Modal motor aktif",money(m.currentCapital))+stat("Laba terjual",mVal(m.realizedProfit))+'</div>'+
 records("Setoran dan penarikan",'<div class="records">'+(capitals||empty("Belum ada transaksi modal."))+'</div>')+
 records("Arus kas",table(["Tanggal","Transaksi","Motor","Nominal"],rows,"Belum ada transaksi."),btn("Unduh CSV","export-cash"))+
 '<div class="page-tail">'+link("Buka laporan laba / rugi","reports")+'</div>';
}
function reports(){
 const all=state.data.motors,m=metrics();
 const rows=all.map(x=>{const f=finance(x);return '<tr><td><strong>'+esc(unitName(x))+'</strong><small>'+esc(statusName[x.status])+'</small></td><td class="mono">'+money(f.cost)+'</td><td class="mono">'+money(f.expectedCost)+'</td><td class="mono">'+money(f.targetRevenue)+'</td><td class="mono">'+mVal(x.status==="sold"?f.actualProfit:f.expectedProfit)+'</td></tr>'});
 return '<div class="backline">'+link("Keuangan","cash")+'<span>/</span><span>Laporan</span></div>'+
 title("Laporan","",btn("Unduh CSV","export-reports"))+
 '<div class="stat-grid three">'+stat("Total modal",money(m.committed))+stat("Potensi laba",mVal(m.expectedProfit))+stat("Laba terjual",mVal(m.realizedProfit))+'</div>'+
 records("Laba / rugi per motor",table(["Motor","Modal aktual","Modal + rencana","Perkiraan pendapatan","Laba"],rows,"Belum ada motor."))+
 '<p class="footnote">Perkiraan laba memakai target jual dan estimasi biaya. Laba aktual memakai angka penjualan yang tercatat.</p>';
}
