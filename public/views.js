import {state,esc,money,num,shortMoney,number,fmtDate,unitName,statusName,priorityName,taskName,partPurpose,partStatus,finance,metrics,ledger,canEdit,unitTasks,unitParts,unitExpenses,unitPhotos,partPhotos,photoSrc,photoForMotor,photoForPart} from "./core.js";
const eid=v=>esc(v||"");
const b=(text,act,id="",css="btn btn-sm")=>'<button class="'+css+'" data-action="'+act+'"'+(id?' data-id="'+eid(id)+'"':'')+(canEdit()||act.startsWith('export-')?'':' disabled')+'>'+text+'</button>';
const act=(name,id,text="Ubah")=>b(text,name,id,"btn btn-icon btn-sm");
const label=(s,c="stock")=>'<span class="badge-status '+eid(c)+'">'+esc(s)+'</span>';
const iconImg=(src,cl="thumb")=>src?'<img class="'+cl+'" src="'+eid(src)+'" alt="Foto unit" loading="lazy">':'<div class="'+cl+' thumb-placeholder">✦</div>';
const noData=(title,desc,action="",actionId="")=>'<div class="empty-state"><div class="empty-symbol">▤</div><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p>'+(action&&canEdit()?b(action,actionId,"","btn btn-red"):"")+'</div>';
const card=(title,body,extra="")=>'<div class="panel"><div class="panel-head"><h3>'+title+'</h3>'+extra+'</div>'+body+'</div>';
const box=(labelText,value,hint,style,icon)=>'<article class="stat '+(style||"")+'"><div class="stat-label">'+esc(labelText)+' <span class="icon">'+(icon||"●")+'</span></div><div class="value mono">'+value+'</div><div class="hint">'+esc(hint||"")+'</div></article>';
const header=(title,sub="",buttons="")=>'<div class="page-intro"><div><h1>'+title+'</h1><p>'+sub+'</p></div><div class="page-actions">'+buttons+'</div></div>';
export function renderPage(){
 const view=state.view, title={dashboard:"Ringkasan",motors:"Unit Motor",detail:"Detail Unit",parts:"Sparepart",cash:"Arus Kas",reports:"Laporan"}[view]||"Ringkasan";
 document.getElementById("pageTitle").textContent=title;
 document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===view||(view==="detail"&&x.dataset.nav==="motors")));
 document.getElementById("topAdd").hidden=!canEdit();
 const area=document.getElementById("contentArea");
 area.innerHTML=({dashboard:dashboard,motors:motors,detail:detail,parts:parts,cash:cash,reports:reports}[view]||dashboard)();
}
const cashStat=v=>v===null||v===undefined?'<span class="muted">Belum ada target</span>':'<span class="'+(v>=0?"positive":"negative")+'">'+money(v)+'</span>';
function dashboard(){
 const m=metrics(),recent=state.data.motors.slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))).slice(0,6);
 const active=state.data.motors.filter(x=>!["sold","archived"].includes(x.status));
 const pending=state.data.tasks.filter(t=>t.status!=="done");
 const taskBody=pending.length?pending.slice(0,5).map(t=>{const unit=state.data.motors.find(m=>m.id===t.motor_id);return '<div class="quick-row"><div><b>'+esc(t.title)+'</b><div class="subtext">'+esc(unitName(unit||{}))+' · '+esc(priorityName[t.priority]||"")+'</div></div>'+label(taskName[t.status],t.status==="done"?"done":"work")+'</div>'}).join(""):noData("Semua PR tercatat selesai","PR yang belum selesai akan muncul di sini.");
 const recentBody=recent.length?'<div class="table-wrap"><table><thead><tr><th>Motor</th><th>Harga beli</th><th>Target jual</th><th>Potensi laba</th><th>Status</th></tr></thead><tbody>'+recent.map(m=>unitRow(m,false)).join("")+'</tbody></table></div>':noData("Belum ada motor","Tambahkan unit motor pertama untuk mulai mencatat modal dan pembiayaan.","+ Tambah Unit","new-motor");
 return header("Overview Showroom","Pantau modal, kesiapan unit, dan potensi keuntungan dari pencatatan yang sebenarnya.",canEdit()?b("+ Catat Setoran Modal","new-capital","","btn")+" "+b("+ Tambah Motor","new-motor","","btn btn-red"):"")+
 '<div class="stat-grid">'+box("Unit Aktif",number(m.active),"Unit stok, PR, atau siap jual","red","◈")+box("Modal Tertanam",shortMoney(m.currentCapital),"Pembelian + biaya realisasi","gold","▣")+box("Potensi Laba",cashStat(m.expectedProfit),"Estimasi unit belum terjual","green","↗")+box("Laba Unit Terjual",cashStat(m.realizedProfit),"Hasil unit dengan status terjual","green","✓")+'</div>'+
 '<div class="section-grid">'+card("Kondisi Showroom",'<div class="panel-body">'+
 '<div class="progress-row"><div><b>'+m.active+' unit</b><div class="tiny">Unit aktif</div></div><div class="progress-track"><div class="progress-fill" style="width:'+Math.min(100,100*m.active/Math.max(1,m.total))+'%"></div></div></div>'+
 '<div class="progress-row"><div><b>'+m.sold+' unit</b><div class="tiny">Sudah terjual</div></div><div class="progress-track"><div class="progress-fill green" style="width:'+Math.min(100,100*m.sold/Math.max(1,m.total))+'%"></div></div></div>'+
 '<div class="progress-row"><div><b>'+m.pendingTasks+' PR</b><div class="tiny">Masih harus dikerjakan</div></div><button class="btn btn-sm" data-nav="motors">Lihat Unit</button></div>'+
 '<div class="mini-note">Estimasi laba menghitung target jual motor + estimasi hasil jual sparepart terpisah, dikurangi harga beli, sparepart, dan pengeluaran. PR tidak dihitung dua kali sebagai biaya.</div></div>')+
 card("Daftar PR Terdekat",'<div class="panel-body">'+taskBody+'</div>')+'</div>'+
 card("Motor Terbaru",recentBody,'<button class="btn btn-sm" data-nav="motors">Semua unit</button>')+
 '<div class="mini-note">Saldo kas yang tercatat saat ini: <b>'+money(m.cash)+'</b>. Saldo dihitung dari setoran, penarikan, pembelian motor, sparepart, pengeluaran, dan penjualan yang dicatat.</div>';
}
function unitRow(m,actions=true){
 const f=finance(m),cover=photoForMotor(m.id);
 return '<tr class="clickable" data-action="open-motor" data-id="'+eid(m.id)+'"><td><div class="unit-cell">'+iconImg(cover)+'<div><b>'+esc(unitName(m))+'</b><small>'+esc(m.unit_code||m.plate_no||("Tahun "+(m.model_year||"-")))+'</small></div></div></td><td class="mono">'+money(m.purchase_price)+'</td><td class="mono">'+money(m.status==="sold"?m.actual_sale_price:m.target_sale_price)+'</td><td class="mono">'+cashStat(m.status==="sold"?f.actualProfit:f.expectedProfit)+'</td><td>'+label(statusName[m.status]||m.status,m.status)+'</td>'+(actions?'<td><button class="btn btn-sm" data-action="open-motor" data-id="'+eid(m.id)+'">Detail</button></td>':"")+'</tr>';
}
function filteredMotors(){
 const s=state.search.toLowerCase().trim();
 return state.data.motors.filter(m=>(state.filter==="all"||m.status===state.filter)&&(!s||[unitName(m),m.unit_code,m.plate_no,m.chassis_no].join(" ").toLowerCase().includes(s))).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
}
function motors(){
 const arr=filteredMotors(),all=state.data.motors;
 const bar='<div class="toolbar"><input id="motorSearch" class="search-input" placeholder="Cari merek, tipe, kode unit, plat..." value="'+eid(state.search)+'" aria-label="Pencarian unit"><select class="select-filter" id="statusFilter">'+[["all","Semua status"],["stock","Stok"],["work","Dalam PR"],["ready","Siap jual"],["sold","Terjual"],["archived","Arsip"]].map(([v,s])=>'<option value="'+v+'"'+(state.filter===v?" selected":"")+'>'+s+'</option>').join("")+'</select></div>';
 return header("Unit Motor","Catat seluruh unit masuk, modal pembelian, status pengerjaan, dan perkiraan harga jual.",canEdit()?b("+ Tambah Motor","new-motor","","btn btn-red"):"")+
 '<div class="stat-grid">'+box("Total Motor",number(all.length),"Semua unit tercatat","","▦")+box("Dalam Pengerjaan",number(all.filter(m=>m.status==="work").length),"Unit memerlukan PR","red","⚙")+box("Siap Jual",number(all.filter(m=>m.status==="ready").length),"Unit sudah siap","green","✓")+box("Sudah Terjual",number(all.filter(m=>m.status==="sold").length),"Penjualan tercatat","gold","↗")+'</div>'+
 '<div class="panel">'+bar+(arr.length?'<div class="table-wrap"><table><thead><tr><th>Unit Motor</th><th>Harga Beli</th><th>Target / Terjual</th><th>Estimasi / Laba</th><th>Status</th><th></th></tr></thead><tbody>'+arr.map(m=>unitRow(m)).join("")+'</tbody></table></div>':noData("Tidak ada motor yang cocok","Ubah pencarian atau tambahkan motor baru.",all.length?null:"+ Tambah Motor",all.length?null:"new-motor"))+'</div>';
}
function detail(){
 const m=state.data.motors.find(x=>x.id===state.selected);
 if(!m){state.view="motors";return motors()}
 const f=finance(m);
 const nav='<div class="tabs">'+[["summary","Ringkasan"],["tasks","PR Pengerjaan"],["parts","Sparepart"],["expenses","Pengeluaran"],["photos","Foto"],["history","Riwayat"]].map(([key,name])=>'<button class="'+(state.detailTab===key?"active":"")+'" data-action="detail-tab" data-value="'+key+'">'+name+'</button>').join("")+'</div>';
 const info='<div class="detail-grid"><div>'+iconImg(photoForMotor(m.id),"detail-photo"+(photoForMotor(m.id)?"":" photo-placeholder"))+'</div><div class="panel"><div class="panel-head"><h3>Identitas Unit</h3></div><div class="panel-body"><div class="detail-meta">'+
 [['Kode stok',m.unit_code],['Tahun',m.model_year||"-"],['Odometer',m.odometer_km?number(m.odometer_km)+" km":"-"],['Nomor polisi',m.plate_no],['Nomor rangka',m.chassis_no],['Tanggal beli',fmtDate(m.purchase_date)]].map(x=>'<div><small>'+x[0]+'</small><b>'+esc(x[1]||"-")+'</b></div>').join("")+'</div></div></div></div>';
 const price='<div class="stat-grid">'+box("Harga Beli",shortMoney(m.purchase_price),"Modal pembelian unit","gold","▣")+box("HPP Realisasi",shortMoney(f.cost),"Harga beli + biaya aktual","red","⌁")+box("Target / Harga Jual",shortMoney(f.motorRevenue),m.status==="sold"?"Harga jual aktual":"Target jual motor","","↗")+box("Estimasi / Laba",cashStat(m.status==="sold"?f.actualProfit:f.expectedProfit),m.status==="sold"?"Setelah unit terjual":"Proyeksi termasuk biaya rencana","green","✓")+'</div>';
 const panels={summary:detailSummary(m,f),tasks:detailTasks(m),parts:detailParts(m),expenses:detailExpenses(m),photos:detailPhotos(m),history:detailHistory(m)};
 return '<div class="unit-hero"><div><button class="back-link" data-nav="motors">‹ Kembali ke daftar motor</button><h1>'+esc(unitName(m))+'</h1><div class="flex wrap"><span class="code">'+esc(m.unit_code||"Tanpa kode unit")+'</span>'+label(statusName[m.status]||m.status,m.status)+'</div></div><div class="page-actions">'+(canEdit()?b("+ Foto","upload-motor",m.id,"btn")+" "+b("Ubah Unit","edit-motor",m.id,"btn")+" "+(m.status==="sold"?"":b("Arsipkan Unit","archive-motor",m.id,"btn btn-danger")):"")+'</div></div>'+price+info+'<div class="panel">'+nav+panels[state.detailTab]+'</div>';
}
function detailSummary(m,f){
 return '<div class="panel-body"><div class="section-grid"><div><h3>Rincian Harga Pokok Penjualan (HPP)</h3>'+
 '<div class="quick-row"><span>Harga pembelian unit</span><b class="mono">'+money(m.purchase_price)+'</b></div>'+
 '<div class="quick-row"><span>Sparepart sudah dibeli</span><b class="mono">'+money(f.purchased)+'</b></div>'+
 '<div class="quick-row"><span>Pengeluaran aktual</span><b class="mono">'+money(f.realExpense)+'</b></div>'+
 '<div class="summary-total"><b>HPP Saat Ini</b><b>'+money(f.cost)+'</b></div>'+
 '<div class="quick-row"><span>Estimasi biaya belum dikeluarkan</span><b>'+money(f.plannedPart+f.planExpense)+'</b></div>'+
 '<div class="quick-row"><span>Estimasi pendapatan sparepart terpisah</span><b>'+money(f.resaleRevenue)+'</b></div>'+
 '<div class="summary-total '+(f.expectedProfit<0?"negative-bg":"")+'"><b>Proyeksi Laba Bersih Unit</b><b>'+cashStat(f.expectedProfit)+'</b></div></div>'+
 '<div><h3>PR & Keterangan</h3><div class="quick-row"><span>PR belum selesai</span><b>'+number(f.pendingTasks)+'</b></div><div class="quick-row"><span>Sparepart tercatat</span><b>'+unitParts(m.id).length+'</b></div><div class="quick-row"><span>Biaya tambahan</span><b>'+unitExpenses(m.id).length+'</b></div><div class="mini-note">'+esc(m.notes||"Belum ada catatan untuk motor ini.")+'</div><p class="tiny">Harga jual sparepart terpasang tidak ditambahkan ke pendapatan. Target jual terpisah hanya dihitung untuk sparepart berjenis &quot;Dijual Terpisah&quot;.</p></div></div></div>';
}
function detailTasks(m){
 const list=unitTasks(m.id).slice().sort((a,b)=>({todo:0,doing:1,done:2}[a.status]??3)-({todo:0,doing:1,done:2}[b.status]??3));
 const rows=list.length?list.map(t=>'<div class="item-card"><button class="status-icon '+(t.status==="done"?"done":"")+'" title="Ubah status PR" data-action="toggle-task" data-id="'+eid(t.id)+'"'+(canEdit()?"":" disabled")+'>'+(t.status==="done"?"✓":t.status==="doing"?"◐":"○")+'</button><div class="item-main"><strong>'+esc(t.title)+'</strong><small>'+label(taskName[t.status],t.status==="done"?"done":"work")+' · '+esc(priorityName[t.priority])+' · Target '+fmtDate(t.due_date)+'</small><small>'+esc(t.notes||"")+'</small><small>Estimasi biaya: <b>'+money(t.estimated_cost)+'</b></small></div><div class="actions-inline">'+(canEdit()?act("edit-task",t.id)+act("delete-task",t.id,"Hapus"):"")+'</div></div>').join(""):noData("Belum ada PR","Tambahkan pekerjaan yang perlu dikerjakan pada motor ini.");
 return '<div class="panel-head"><div><h3>Checklist Pekerjaan</h3><p class="panel-sub">Klik lingkaran untuk mengubah status. Biaya PR hanya referensi; transaksi dicatat di Pengeluaran.</p></div>'+(canEdit()?b("+ Tambah PR","new-task",m.id,"btn btn-red btn-sm"):"")+'</div><div class="panel-body">'+rows+'</div>';
}
function detailParts(m){
 const list=unitParts(m.id);
 const rows=list.length?'<div class="table-wrap"><table><thead><tr><th>Sparepart</th><th>Peruntukan</th><th>Qty</th><th>Beli / pcs</th><th>Estimasi Jual / pcs</th><th>Sudah Terjual</th><th>Status</th><th></th></tr></thead><tbody>'+list.map(p=>'<tr><td><div class="unit-cell">'+iconImg(photoForPart(p.id))+'<div><b>'+esc(p.name)+'</b><small>'+esc(p.part_code||"-")+'</small><button class="btn-smallink" data-action="upload-part" data-id="'+eid(p.id)+'">+ Foto</button></div></div></td><td>'+esc(partPurpose[p.purpose])+'</td><td>'+number(p.quantity)+'</td><td>'+money(p.unit_cost)+'</td><td>'+money(p.estimated_sale_price)+'</td><td>'+number(p.qty_sold)+'</td><td>'+label(partStatus[p.status],p.status==="sold"?"sold":"stock")+'</td><td>'+act("edit-part",p.id)+(canEdit()?act("delete-part",p.id,"Hapus"):"")+'</td></tr>').join("")+'</tbody></table></div>':noData("Belum ada sparepart","Catat pembelian, sparepart terpasang, atau komponen yang akan dijual terpisah.");
 const gallery=list.map(p=>{const photos=partPhotos(p.id);return photos.length?'<div style="margin:16px 22px"><b>'+esc(p.name)+'</b><div class="photo-grid" style="margin-top:9px">'+photos.map(photoCard).join("")+'</div></div>':""}).join("");
 return '<div class="panel-head"><div><h3>Sparepart & Harga</h3><p class="panel-sub">Per motor, termasuk sparepart terpasang dan komponen jual terpisah.</p></div>'+(canEdit()?b("+ Sparepart","new-part",m.id,"btn btn-red btn-sm"):"")+'</div>'+rows+gallery;
}
function detailExpenses(m){
 const list=unitExpenses(m.id);
 const rows=list.length?'<div class="table-wrap"><table><thead><tr><th>Pengeluaran</th><th>Kategori</th><th>Tanggal</th><th>Jenis</th><th>Jumlah</th><th></th></tr></thead><tbody>'+list.map(e=>'<tr><td><b>'+esc(e.title)+'</b><div class="tiny">'+esc(e.notes)+'</div></td><td>'+esc(e.category)+'</td><td>'+fmtDate(e.expense_date)+'</td><td>'+label(e.is_planned?"Rencana":"Realisasi",e.is_planned?"work":"done")+'</td><td class="mono">'+money(e.amount)+'</td><td>'+act("edit-expense",e.id)+(canEdit()?act("delete-expense",e.id,"Hapus"):"")+'</td></tr>').join("")+'</tbody></table></div>':noData("Belum ada pengeluaran","Catat biaya seperti balik nama, servis, pengangkutan, atau administrasi.");
 return '<div class="panel-head"><div><h3>Pengeluaran Unit</h3><p class="panel-sub">Biaya realisasi masuk HPP dan arus kas. Biaya rencana hanya masuk proyeksi.</p></div>'+(canEdit()?b("+ Catat Biaya","new-expense",m.id,"btn btn-red btn-sm"):"")+'</div>'+rows;
}
function photoCard(p){const src=photoSrc(p.storage_path);return '<div class="photo-card">'+(src?'<img src="'+eid(src)+'" alt="'+esc(p.caption||"Foto unit")+'" loading="lazy">':'<div class="photo-placeholder" style="height:120px">✦</div>')+'<div class="photo-caption"><span title="'+esc(p.caption)+'">'+esc(p.caption||"Foto")+'</span>'+(canEdit()?'<button data-action="delete-photo" data-id="'+eid(p.id)+'">Hapus</button>':"")+'</div></div>'}
function detailPhotos(m){
 const photos=unitPhotos(m.id);
 return '<div class="panel-head"><div><h3>Dokumentasi Motor</h3><p class="panel-sub">Unggah foto kondisi, detail body, odometer, dan dokumen visual yang relevan.</p></div>'+(canEdit()?b("+ Upload Foto","upload-motor",m.id,"btn btn-red btn-sm"):"")+'</div><div class="panel-body">'+(photos.length?'<div class="photo-grid">'+photos.map(photoCard).join("")+'</div>':noData("Belum ada foto motor","Gunakan tombol Upload Foto. Berkas tersimpan privat di Supabase."))+'</div>';
}

function detailHistory(m){
 if(state.access?.role!=="owner")return '<div class="panel-body">'+noData("Riwayat terbatas","Hanya Owner yang dapat melihat jejak perubahan data.")+'</div>';
 const all=(state.data.activity||[]).filter(a=>a.motor_id===m.id).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 const names={showroom_motorcycles:"Motor",showroom_tasks:"PR Pengerjaan",showroom_parts:"Sparepart",showroom_expenses:"Pengeluaran",showroom_photos:"Foto",showroom_capital:"Modal"};
 const changes={purchase_price:"Harga beli",target_sale_price:"Target jual",actual_sale_price:"Harga jual aktual",status:"Status",title:"Nama",amount:"Nominal",unit_cost:"Harga sparepart",estimated_sale_price:"Estimasi harga part",qty_sold:"Jumlah terjual",expense_date:"Tanggal biaya",purchase_date:"Tanggal beli",is_planned:"Jenis biaya",name:"Nama sparepart"};
 const cards=all.slice(0,90).map(a=>{
  const old=a.before_data||{},cur=a.after_data||{};
  const differences=Object.keys(changes).filter(k=>JSON.stringify(old[k]??null)!==JSON.stringify(cur[k]??null)).map(k=>'<div class="tiny"><b>'+changes[k]+':</b> '+esc(old[k]??"-")+' → '+esc(cur[k]??"-")+'</div>').slice(0,8).join("");
  const operation={INSERT:"Ditambahkan",UPDATE:"Diperbarui",DELETE:"Dihapus"}[a.operation]||a.operation;
  return '<div class="item-card"><div class="status-icon">↺</div><div class="item-main"><strong>'+esc(names[a.entity]||a.entity)+' · '+esc(operation)+'</strong><small>'+new Date(a.created_at).toLocaleString("id-ID")+'</small>'+(differences||'<small>Perubahan data telah dicatat di sistem.</small>')+'</div></div>'
 }).join("");
 return '<div class="panel-head"><div><h3>Jejak Perubahan</h3><p class="panel-sub">Rekam perubahan angka, status, dan informasi. Hanya terlihat oleh Owner.</p></div></div><div class="panel-body">'+(cards||noData("Belum ada aktivitas","Semua perubahan berikutnya akan tercatat otomatis."))+'</div>';
}

function parts(){
 const s=(state.partSearch||"").toLowerCase(),items=state.data.parts.filter(p=>(p.name+" "+p.part_code).toLowerCase().includes(s)).slice().sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 const total=items.filter(p=>p.status!=="planned").reduce((a,p)=>a+num(p.unit_cost)*num(p.quantity),0),revenue=items.filter(p=>p.purpose==="resale").reduce((a,p)=>a+num(p.estimated_sale_price)*(num(p.quantity)-num(p.qty_sold)),0);
 return header("Inventaris Sparepart","Semua sparepart dikelompokkan berdasarkan unit motor tempat pencatatannya.")+
 '<div class="stat-grid">'+box("Jumlah Jenis",number(state.data.parts.length),"Baris sparepart","","⚙")+box("Modal Sparepart",shortMoney(total),"Sudah dibeli","gold","▣")+box("Nilai Jual Potensial",shortMoney(revenue),"Stok sparepart untuk dijual","green","↗")+box("Komponen Terjual",number(state.data.parts.reduce((a,p)=>a+num(p.qty_sold),0)),"Total pcs","red","✓")+'</div>'+
 '<div class="panel"><div class="toolbar"><input id="partsSearch" class="search-input" placeholder="Cari nama / kode sparepart..." value="'+esc(state.partSearch)+'"></div>'+(items.length?'<div class="table-wrap"><table><thead><tr><th>Sparepart</th><th>Unit Motor</th><th>Status</th><th>Modal</th><th>Estimasi Jual</th><th>Aksi</th></tr></thead><tbody>'+items.map(p=>{const m=state.data.motors.find(x=>x.id===p.motor_id);return '<tr><td><div class="unit-cell">'+iconImg(photoForPart(p.id))+'<div><b>'+esc(p.name)+'</b><small>'+esc(partPurpose[p.purpose])+' · '+p.quantity+' pcs</small></div></div></td><td>'+esc(unitName(m||{}))+'</td><td>'+label(partStatus[p.status])+'</td><td>'+money(num(p.quantity)*num(p.unit_cost))+'</td><td>'+money(num(p.quantity)*num(p.estimated_sale_price))+'</td><td><button class="btn btn-sm" data-action="open-motor" data-id="'+eid(p.motor_id)+'">Lihat Motor</button></td></tr>'}).join("")+'</tbody></table></div>':noData("Belum ada sparepart","Tambahkan sparepart melalui halaman Detail Unit."))+'</div>';
}
function cash(){
 const rows=ledger(),m=metrics(),deposit=state.data.capital.filter(c=>c.entry_type==="deposit").reduce((a,c)=>a+num(c.amount),0);
 return header("Arus Kas","Riwayat transaksi masuk dan keluar dari seluruh pencatatan showroom.",(canEdit()?b("+ Setoran / Penarikan","new-capital","","btn btn-red"):"")+" "+b("Unduh CSV","export-cash","","btn"))+
 '<div class="stat-grid">'+box("Saldo Tercatat",cashStat(m.cash),"Setoran dan transaksi yang telah dicatat","green","▣")+box("Total Setoran",shortMoney(deposit),"Modal dari pemilik / partner","gold","↗")+box("Investasi Unit",shortMoney(m.currentCapital),"Modal tertanam unit aktif","red","▤")+box("Laba Terealisasi",cashStat(m.realizedProfit),"Dari unit terjual","green","✓")+'</div>'+
 '<div class="panel"><div class="panel-head"><h3>Buku Kas</h3><span class="tiny">'+rows.length+' transaksi</span></div>'+
 (rows.length?'<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Unit</th><th>Keterangan</th><th>Masuk</th><th>Keluar</th></tr></thead><tbody>'+rows.map(x=>'<tr><td>'+fmtDate(x.date)+'</td><td>'+esc(x.type)+'</td><td>'+esc(x.unit)+'</td><td>'+esc(x.memo)+'</td><td class="positive mono">'+(x.amount>0?money(x.amount):"-")+'</td><td class="negative mono">'+(x.amount<0?money(-x.amount):"-")+'</td></tr>').join("")+'</tbody></table></div>':noData("Buku kas masih kosong","Catat setoran modal atau pembelian motor terlebih dahulu."))+'</div><div class="mini-note">Saldo ini adalah saldo berdasarkan transaksi yang dicatat di aplikasi, bukan saldo bank otomatis. Perubahan harga dan transaksi lama akan memengaruhi laporan.</div>'+
 card("Setoran & Penarikan Modal",state.data.capital.length?'<div class="table-wrap"><table><thead><tr><th>Tanggal</th><th>Nama</th><th>Jenis</th><th>Jumlah</th><th>Aksi</th></tr></thead><tbody>'+state.data.capital.slice().sort((a,b)=>String(b.entry_date).localeCompare(String(a.entry_date))).map(c=>'<tr><td>'+fmtDate(c.entry_date)+'</td><td>'+esc(c.person_name)+'</td><td>'+label(c.entry_type==="deposit"?"Setoran":"Penarikan",c.entry_type==="deposit"?"done":"work")+'</td><td>'+money(c.amount)+'</td><td>'+(canEdit()?act("edit-capital",c.id)+act("delete-capital",c.id,"Hapus"):"")+'</td></tr>').join("")+'</tbody></table></div>':noData("Belum ada setoran","Catat modal dari setiap pemilik atau partner."),'');
}
function reports(){
 const m=metrics();const all=state.data.motors.slice().sort((a,b)=>String(a.created_at).localeCompare(String(b.created_at)));
 return header("Laporan Keuangan","Perbandingan HPP, target jual, proyeksi laba, dan realisasi penjualan per motor.",b("Unduh CSV","export-reports","","btn")+' <button class="btn" data-action="print-report">Cetak</button>')+
 '<div class="stat-grid">'+box("Nilai Modal Semua Unit",shortMoney(m.committed),"Harga beli + pengeluaran aktual","gold","▣")+box("Target Pendapatan Aktif",shortMoney(m.expectedSales),"Motor + sparepart terpisah","green","↗")+box("Proyeksi Laba Aktif",cashStat(m.expectedProfit),"Sudah mempertimbangkan biaya rencana","","⌁")+box("Laba Unit Terjual",cashStat(m.realizedProfit),"HPP realisasi vs hasil jual","green","✓")+'</div>'+
 '<div class="panel"><div class="panel-head"><h3>Laba/Rugi per Motor</h3><span class="tiny">Estimasi tidak sama dengan laba yang telah diterima</span></div>'+(all.length?'<div class="table-wrap"><table><thead><tr><th>Motor</th><th>Harga Beli</th><th>HPP Aktual</th><th>HPP Proyeksi</th><th>Target / Realisasi Penjualan</th><th>Laba Proyeksi / Aktual</th></tr></thead><tbody>'+all.map(x=>{const f=finance(x);return '<tr><td><b>'+esc(unitName(x))+'</b><div class="tiny">'+esc(statusName[x.status])+'</div></td><td>'+money(x.purchase_price)+'</td><td>'+money(f.cost)+'</td><td>'+money(f.expectedCost)+'</td><td>'+money(f.targetRevenue)+'</td><td>'+cashStat(x.status==="sold"?f.actualProfit:f.expectedProfit)+'</td></tr>'}).join("")+'</tbody></table></div>':noData("Belum ada data laporan","Buat unit pertama untuk mulai melihat laporan."))+'</div>'+
 '<div class="danger-note" style="margin-top:17px"><b>Metode perhitungan:</b> HPP = harga beli motor + sparepart yang sudah dibeli + pengeluaran aktual. HPP proyeksi menambahkan pengeluaran dan sparepart rencana. Sparepart untuk dijual terpisah dihitung sebagai tambahan pendapatan; sparepart yang terpasang tidak. Biaya pada daftar PR hanya informasi dan tidak otomatis dijumlahkan kembali.</div>';
}
