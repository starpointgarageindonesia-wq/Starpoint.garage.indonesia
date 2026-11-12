import {state,esc,today,unitName,statusName,partPurpose,partStatus,canEdit} from "./core.js";
const field=(label,name,v="",type="text",extra="",wide=false,hint="")=>'<div class="field'+(wide?' wide':'')+'"><label for="f-'+name+'">'+label+'</label><input id="f-'+name+'" name="'+name+'" type="'+type+'" value="'+esc(v??"")+'" '+extra+'>'+(hint?'<small class="hint">'+hint+'</small>':"")+'</div>';
const sel=(label,name,v="",entries=[],wide=false,hint="")=>'<div class="field'+(wide?' wide':'')+'"><label for="f-'+name+'">'+label+'</label><select id="f-'+name+'" name="'+name+'">'+entries.map(([key,text])=>'<option value="'+esc(key)+'"'+(String(v||"")===String(key)?" selected":"")+'>'+esc(text)+'</option>').join("")+'</select>'+(hint?'<small class="hint">'+hint+'</small>':"")+'</div>';
const text=(label,name,v="",wide=true,hint="")=>'<div class="field'+(wide?' wide':'')+'"><label for="f-'+name+'">'+label+'</label><textarea id="f-'+name+'" name="'+name+'" rows="3">'+esc(v??"")+'</textarea>'+(hint?'<small class="hint">'+hint+'</small>':"")+'</div>';
const cash=(l,n,v=0,wide=false,h="")=>field(l,n,v,"number",'min="0" step="1000" inputmode="decimal"',wide,h);
const dates=(l,n,v,wide=false)=>field(l,n,v||today(),"date","",wide);
const statuses=[["stock","Stok"],["work","Dalam PR"],["ready","Siap Jual"],["sold","Terjual"],["archived","Arsip"]];
const taskStatuses=[["todo","Belum dikerjakan"],["doing","Sedang dikerjakan"],["done","Selesai"]];
const partStatuses=[["planned","Rencana pembelian"],["purchased","Sudah dibeli"],["installed","Terpasang di motor"],["sold","Dijual sebagian / seluruhnya"]];
function motorFields(x){return [
 field("Merek motor *","brand",x.brand||"","text","required maxlength=100"),
 field("Model *","model",x.model||"","text","required maxlength=100"),
 field("Varian / tipe","variant",x.variant||"","text","maxlength=100"),
 field("Kode stok internal","unit_code",x.unit_code||"","text","maxlength=100"),
 field("Tahun","model_year",x.model_year||"","number",'min="1900" max="2100"'),
 field("Odometer (km)","odometer_km",x.odometer_km??"","number",'min="0" step="1"'),
 field("Nomor polisi","plate_no",x.plate_no||"","text","maxlength=60"),
 field("Nomor rangka","chassis_no",x.chassis_no||"","text","maxlength=100"),
 dates("Tanggal pembelian","purchase_date",x.purchase_date),
 sel("Status motor","status",x.status||"stock",statuses),
 cash("Harga beli motor (Rp) *","purchase_price",x.purchase_price||0),
 cash("Perkiraan harga jual motor (Rp)","target_sale_price",x.target_sale_price||0),
 cash("Harga jual aktual (jika terjual)","actual_sale_price",x.actual_sale_price??0),
 field("Tanggal terjual (jika terjual)","sold_date",x.sold_date||"","date",""),
 text("Catatan unit","notes",x.notes||"",true,"Kondisi awal, asal unit, kelengkapan surat, dan catatan lainnya.")
 ].join("")}
function taskFields(x){return [
 field("PR / pekerjaan *","title",x.title||"","text","required maxlength=250",true),
 sel("Prioritas","priority",x.priority||"normal",[["low","Rendah"],["normal","Normal"],["high","Tinggi"]]),
 sel("Status PR","status",x.status||"todo",taskStatuses),
 field("Target selesai (opsional)","due_date",x.due_date||"","date"),
 cash("Estimasi biaya PR (Rp)","estimated_cost",x.estimated_cost||0,false,"Referensi saja, tidak langsung menambah HPP."),
 cash("Biaya aktual (catatan)","actual_cost",x.actual_cost||0,false,"Catat pengeluaran sebenarnya di menu Pengeluaran agar masuk HPP."),
 text("Catatan pekerjaan","notes",x.notes||"")
 ].join("")}
function partFields(x){return [
 field("Nama sparepart *","name",x.name||"","text","required maxlength=250",true),
 field("Kode part / merek","part_code",x.part_code||"","text","maxlength=150"),
 sel("Peruntukan","purpose",x.purpose||"maintenance",[["maintenance","Dipakai / dipasang pada motor"],["resale","Akan dijual terpisah"]]),
 field("Jumlah pcs *","quantity",x.quantity??1,"number",'min="1" step="1" required'),
 sel("Status stok / pemasangan","status",x.status||"planned",partStatuses),
 cash("Harga beli per pcs (Rp)","unit_cost",x.unit_cost||0),
 cash("Perkiraan harga jual per pcs (Rp)","estimated_sale_price",x.estimated_sale_price||0,false,"Untuk sparepart yang dijual terpisah."),
 field("Jumlah sudah terjual (pcs)","qty_sold",x.qty_sold??0,"number",'min="0" step="1"'),
 cash("Harga jual aktual per pcs (Rp)","actual_sale_price",x.actual_sale_price||0),
 field("Tanggal beli (opsional)","purchase_date",x.purchase_date||"","date"),
 field("Tanggal terjual (opsional)","sold_date",x.sold_date||"","date"),
 text("Catatan sparepart","notes",x.notes||"",true,"Foto sparepart ditambahkan dari tabel setelah disimpan.")
 ].join("")}
function expenseFields(x){return [
 field("Nama pengeluaran *","title",x.title||"","text","required maxlength=250",true),
 sel("Kategori","category",x.category||"servis",[["servis","Servis"],["transport","Transport"],["pajak","Pajak / surat"],["administrasi","Administrasi"],["detail","Detailing"],["komisi","Komisi"],["lainnya","Lainnya"]]),
 dates("Tanggal transaksi","expense_date",x.expense_date),
 cash("Nominal (Rp) *","amount",x.amount??0),
 '<div class="field wide"><label class="field-row"><input type="checkbox" name="is_planned" '+(x.is_planned?"checked":"")+'><b>Masih rencana, belum dibayar</b></label><small class="hint">Pengeluaran rencana hanya masuk proyeksi; pengeluaran aktual masuk HPP dan arus kas.</small></div>',
 text("Catatan pengeluaran","notes",x.notes||"")
 ].join("")}
function capitalFields(x){return [
 field("Nama pemodal / partner *","person_name",x.person_name||"","text","required maxlength=200",true),
 sel("Jenis transaksi","entry_type",x.entry_type||"deposit",[["deposit","Setoran modal"],["withdrawal","Penarikan modal"]]),
 dates("Tanggal transaksi","entry_date",x.entry_date),
 cash("Nominal (Rp) *","amount",x.amount??0),
 text("Catatan transaksi","notes",x.notes||"")
 ].join("")}
export function formHtml(kind,id="",motorId=""){
 const defs={motor:{table:"motors",title:"Motor",fields:motorFields},task:{table:"tasks",title:"PR Pengerjaan",fields:taskFields},part:{table:"parts",title:"Sparepart",fields:partFields},expense:{table:"expenses",title:"Pengeluaran",fields:expenseFields},capital:{table:"capital",title:"Setoran / Penarikan",fields:capitalFields}};
 const d=defs[kind];if(!d)return "";const data=state.data[d.table].find(x=>x.id===id)||{};
 const title=(id?"Ubah ":"Tambah ")+d.title;
 return '<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">'+
 '<div class="modal-head"><div><span class="eyebrow">STARPOINT SHOWROOM</span><h2>'+esc(title)+'</h2></div><button class="close-modal" type="button" data-action="close-modal" aria-label="Tutup">×</button></div>'+
 '<form id="entityForm" class="modal-form" data-kind="'+kind+'" data-id="'+esc(id)+'" data-motor="'+esc(motorId||data.motor_id||"")+'">'+
 '<div class="form-grid">'+d.fields(data)+'</div>'+
 '<p id="formError" class="form-error"></p>'+
 '<div class="form-foot"><button type="button" class="btn" data-action="close-modal">Batal</button><button type="submit" class="btn btn-red" id="saveBtn">Simpan Data</button></div></form></div>';
}
