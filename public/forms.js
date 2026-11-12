import {state,esc,today} from "./core.js";
const field=(label,name,value="",type="text",opts="",wide=false)=>'<label class="field'+(wide?' wide':'')+'"><span>'+label+'</span><input id="f-'+name+'" name="'+name+'" type="'+type+'" value="'+esc(value??"")+'" '+opts+'></label>';
const select=(label,name,value,choices,wide=false)=>'<label class="field'+(wide?' wide':'')+'"><span>'+label+'</span><select id="f-'+name+'" name="'+name+'">'+choices.map(([v,l])=>'<option value="'+esc(v)+'"'+(String(value??"")===String(v)?" selected":"")+'>'+esc(l)+'</option>').join("")+'</select></label>';
const notes=(label,name,value="",wide=true)=>'<label class="field'+(wide?' wide':'')+'"><span>'+label+'</span><textarea id="f-'+name+'" name="'+name+'" rows="2">'+esc(value)+'</textarea></label>';
const price=(label,name,value=0,wide=false)=>field(label,name,value??0,"number",'min="0" step="1" inputmode="numeric"',wide);
const date=(label,name,value)=>field(label,name,value||today(),"date");
const motorcycleStatuses=[["stock","Stok"],["work","Dalam PR"],["ready","Siap jual"],["sold","Terjual"],["archived","Arsip"]];
function motorFields(x){
 return '<div class="form-section-title">Data motor</div><div class="form-grid">'+
 field("Merek *","brand",x.brand,"text",'required maxlength="100" placeholder="Kawasaki"')+
 field("Model *","model",x.model,"text",'required maxlength="100" placeholder="ZX-25RR"')+
 price("Harga beli *","purchase_price",x.purchase_price)+
 price("Target jual","target_sale_price",x.target_sale_price)+
 '</div><div class="form-grid motor-date-status">'+
 date("Tanggal beli","purchase_date",x.purchase_date)+
 select("Status","status",x.status||"stock",motorcycleStatuses)+
 '</div>'+
 '<div id="saleFields" class="form-grid sale-fields" '+(x.status==="sold"?"":"hidden")+'>'+
 price("Harga terjual","actual_sale_price",x.actual_sale_price??0)+
 field("Tanggal terjual","sold_date",x.sold_date||"","date")+
 '</div>'+
 '<details class="more-fields"'+(x.model_year||x.odometer_km||x.plate_no||x.chassis_no||x.variant||x.unit_code||x.notes?' open':'')+'><summary>Detail lainnya</summary><div class="form-grid">'+
 field("Varian","variant",x.variant||"","text",'maxlength="100"')+
 field("Tahun","model_year",x.model_year??"","number",'min="1900" max="2100"')+
 field("Odometer (km)","odometer_km",x.odometer_km??"","number",'min="0" step="1"')+
 field("Nomor polisi","plate_no",x.plate_no||"","text",'maxlength="60"')+
 field("Kode stok","unit_code",x.unit_code||"","text",'maxlength="100"')+
 field("Nomor rangka","chassis_no",x.chassis_no||"","text",'maxlength="100"')+
 notes("Catatan motor","notes",x.notes||"")+
 '</div></details>';
}
function taskFields(x){
 return '<div class="form-grid">'+
 field("Pekerjaan *","title",x.title||"","text",'required maxlength="250" placeholder="Contoh: Ganti ban depan"',true)+
 select("Status","status",x.status||"todo",[["todo","Belum"],["doing","Dikerjakan"],["done","Selesai"]])+
 select("Prioritas","priority",x.priority||"normal",[["low","Rendah"],["normal","Normal"],["high","Penting"]])+
 field("Target selesai","due_date",x.due_date||"","date")+
 price("Estimasi biaya","estimated_cost",x.estimated_cost||0)+
 '<div class="field"><span>Biaya aktual</span><input id="f-actual_cost" name="actual_cost" type="number" min="0" step="1" value="'+esc(x.actual_cost??0)+'"></div>'+
 notes("Catatan","notes",x.notes||"")+'</div>';
}
function partFields(x){
 return '<div class="form-grid">'+
 field("Nama sparepart *","name",x.name||"","text",'required maxlength="250"',true)+
 field("Jumlah *","quantity",x.quantity??1,"number",'required min="1" step="1"')+
 select("Jenis","purpose",x.purpose||"maintenance",[["maintenance","Untuk motor"],["resale","Dijual terpisah"]])+
 price("Harga beli / pcs","unit_cost",x.unit_cost)+
 price("Estimasi jual / pcs","estimated_sale_price",x.estimated_sale_price)+
 select("Status","status",x.status||"planned",[["planned","Rencana"],["purchased","Dibeli"],["installed","Terpasang"],["sold","Terjual"]])+
 field("Jumlah terjual","qty_sold",x.qty_sold??0,"number",'min="0" step="1"')+
 price("Harga jual aktual / pcs","actual_sale_price",x.actual_sale_price)+
 field("Tanggal beli","purchase_date",x.purchase_date||"","date")+
 field("Tanggal terjual","sold_date",x.sold_date||"","date")+
 field("Kode / merek","part_code",x.part_code||"","text",'maxlength="150"',true)+
 notes("Catatan","notes",x.notes||"")+'</div>';
}
function expenseFields(x){
 return '<div class="form-grid">'+
 field("Untuk apa? *","title",x.title||"","text",'required maxlength="250"',true)+
 price("Jumlah biaya *","amount",x.amount??0)+
 date("Tanggal","expense_date",x.expense_date)+
 select("Kategori","category",x.category||"servis",[["servis","Servis"],["transport","Transport"],["pajak","Pajak / surat"],["administrasi","Administrasi"],["detail","Detailing"],["komisi","Komisi"],["lainnya","Lainnya"]])+
 '<label class="check-field"><input type="checkbox" name="is_planned"'+(x.is_planned?" checked":"")+'><span>Masih rencana (belum dibayar)</span></label>'+
 notes("Catatan","notes",x.notes||"")+'</div>';
}
function capitalFields(x){
 return '<div class="form-grid">'+
 field("Nama pemodal *","person_name",x.person_name||"","text",'required maxlength="200"',true)+
 price("Jumlah *","amount",x.amount??0)+
 select("Jenis","entry_type",x.entry_type||"deposit",[["deposit","Setoran"],["withdrawal","Penarikan"]])+
 date("Tanggal","entry_date",x.entry_date)+
 notes("Catatan","notes",x.notes||"")+'</div>';
}
export function inlinePartRow(i){
 const id="inpart-"+i;
 const inp=(k,label,t,opts="",val="")=>'<label class="field"><span>'+label+'</span><input id="'+id+'-'+k+'" data-part-field="'+k+'" type="'+t+'" value="'+esc(val)+'" '+opts+'></label>';
 const pick=(k,label,choices)=>'<label class="field"><span>'+label+'</span><select data-part-field="'+k+'">'+choices.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join("")+'</select></label>';
 return '<div class="inline-part-card" data-inline-part>'+
  '<div class="inline-part-head"><span>Sparepart</span><button type="button" data-action="remove-inline-part" class="text-danger">Hapus</button></div>'+
  '<div class="form-grid">'+
   inp("name","Nama *","text",'placeholder="Nama sparepart" required maxlength="250"')+
   inp("quantity","Jumlah","number",'min="1" step="1" required',"1")+
   inp("unit_cost","Harga beli / pcs","number",'min="0" step="1" inputmode="numeric"',"0")+
   inp("estimated_sale_price","Estimasi jual / pcs","number",'min="0" step="1" inputmode="numeric"',"0")+
   pick("purpose","Jenis",[["maintenance","Untuk motor"],["resale","Dijual terpisah"]])+
   pick("status","Status",[["planned","Rencana"],["purchased","Dibeli"],["installed","Terpasang"]])+
  '</div><details class="more-fields compact"><summary>Detail lainnya</summary><div class="form-grid">'+
  inp("part_code","Kode / merek","text",'maxlength="150"')+
  '<label class="field wide"><span>Catatan</span><textarea data-part-field="notes" rows="2"></textarea></label></div></details>'+
 '</div>';
}
export function inlineTaskRow(index){
 const id="task-inline-"+index;
 return '<div class="inline-part-card inline-task-card" data-inline-task>'+
  '<div class="inline-part-head"><label class="task-row-check"><input data-task-field="done" type="checkbox"><span>PR selesai</span></label>'+
  '<button type="button" data-action="remove-inline-task" class="text-danger">Hapus</button></div>'+
  '<div class="form-grid">'+
  '<label class="field wide"><span>Pekerjaan *</span><input id="'+id+'-title" data-task-field="title" type="text" maxlength="250" required placeholder="Contoh: Ganti kampas rem"></label>'+
  '<label class="field"><span>Estimasi biaya</span><input data-task-field="estimated_cost" type="number" min="0" step="1" value="0" inputmode="numeric"></label>'+
  '<label class="field"><span>Prioritas</span><select data-task-field="priority"><option value="normal">Normal</option><option value="high">Penting</option><option value="low">Rendah</option></select></label>'+
  '</div><details class="more-fields compact"><summary>Catatan</summary>'+
  '<label class="field wide"><span>Catatan PR</span><textarea data-task-field="notes" rows="2"></textarea></label>'+
  '</details></div>';
}
function taskSection(){
 return '<section class="inline-parts-section inline-tasks-section">'+
 '<div class="inline-parts-header"><h3>PR motor</h3><button type="button" class="btn btn-outline btn-sm" data-action="add-inline-task">+ Tambah PR</button></div>'+
 '<div id="inlineTasksList" class="inline-parts-list"></div>'+
 '<div id="inlineTasksEmpty" class="inline-parts-empty">Belum ada PR</div>'+
 '</section>';
}
function partSection(){
 return '<section class="inline-parts-section">'+
 '<div class="inline-parts-header"><h3>Sparepart</h3><button type="button" class="btn btn-outline btn-sm" data-action="add-inline-part">+ Tambah sparepart</button></div>'+
 '<div id="inlinePartsList" class="inline-parts-list"></div>'+
 '<div id="inlinePartsEmpty" class="inline-parts-empty">Belum ada sparepart</div>'+
 '<div id="inlinePartsSummary" class="inline-parts-summary" hidden><span>Rencana <b id="inlinePartsPlanned">Rp0</b></span><span>Dibeli <b id="inlinePartsBought">Rp0</b></span></div>'+
 '</section>';
}
export function formHtml(kind,id="",motorId=""){
 const defs={motor:{table:"motors",name:"Motor",fields:motorFields},task:{table:"tasks",name:"PR",fields:taskFields},part:{table:"parts",name:"Sparepart",fields:partFields},expense:{table:"expenses",name:"Biaya",fields:expenseFields},capital:{table:"capital",name:"Modal",fields:capitalFields}};
 const d=defs[kind];if(!d)return "";
 const x=state.data[d.table].find(item=>item.id===id)||{};
 const title=(id?"Ubah ":"Tambah ")+d.name;
 return '<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'">'+
 '<div class="modal-head"><h2>'+title+'</h2><button type="button" class="close-modal" data-action="close-modal" aria-label="Tutup">×</button></div>'+
 '<form id="entityForm" class="modal-form" data-kind="'+kind+'" data-id="'+esc(id)+'" data-motor="'+esc(motorId||x.motor_id||"")+'">'+
  d.fields(x)+(kind==="motor"?taskSection()+partSection():"")+
 '<p id="formError" class="form-error" role="alert"></p>'+
 '<div class="form-foot"><button type="submit" class="btn btn-red" id="saveBtn">Simpan</button></div>'+
 '</form></div>';
}
