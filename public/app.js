import {db,state,tables,canEdit,memberAccess,loadAll,subscribe,unsubscribe,store,remove,uploadPhotos,deletePhoto,today,finance,ledger,money,num,unitName} from "./core.js";
import {renderPage} from "./views.js";
import {formHtml} from "./forms.js";
const $=sel=>document.querySelector(sel);
let loading=false,toastTimer,refreshTimer,lastLoad=0;
const knownKind={motor:"motors",task:"tasks",part:"parts",expense:"expenses",capital:"capital"};
function notice(message,isError=false){
 const t=$("#toast");t.textContent=message;t.className="toast show"+(isError?" error":"");
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.className="toast",4200);
}
function setSync(ok){$("#syncStatus").textContent=ok?"Tersinkron real-time":"Menyambungkan sinkronisasi...";}
async function reload(silent=false){
 if(loading)return;
 loading=true;try{await loadAll();lastLoad=Date.now();renderPage();if(!silent)notice("Data pembukuan diperbarui.");}
 catch(err){console.error(err);if(!silent)notice("Gagal memuat data: "+err.message,true);}
 finally{loading=false;}
}
async function granted(user){
 await memberAccess(user);
 $("#authView").hidden=true;$("#appView").hidden=false;
 $("#userEmail").textContent=user.email||"Akun internal";
 $("#userRole").textContent=state.access.role==="owner"?"Owner":state.access.role==="editor"?"Editor":"Viewer";
 await reload(true);
 subscribe(()=>reload(true),setSync);
 if(refreshTimer)clearInterval(refreshTimer);
 refreshTimer=setInterval(()=>{if(!document.hidden&&Date.now()-lastLoad>45000)reload(true)},48000);
}
function locked(error=""){
 unsubscribe();
 if(refreshTimer)clearInterval(refreshTimer);
 $("#authView").hidden=false;$("#appView").hidden=true;
 $("#authError").textContent=error;
 $("#sidebar").classList.remove("open");
 state.authUser=null;state.access=null;
 state.data={motors:[],tasks:[],parts:[],expenses:[],capital:[],photos:[],activity:[]};
 state.photoUrls.clear();
}
async function initialize(){
 try{
  const {data,error}=await db.auth.getUser();
  if(error||!data?.user){locked();return}
  await granted(data.user);
 }catch(e){console.error(e);locked(e.message||"Tidak dapat menghubungi server.")}
}
$("#loginForm").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget,btn=$("#loginButton");
 btn.disabled=true;btn.textContent="Memeriksa akses...";$("#authError").textContent="";
 try{
  const {data,error}=await db.auth.signInWithPassword({email:form.elements.namedItem("email").value.trim(),password:form.elements.namedItem("password").value});
  if(error)throw Error("Email atau kata sandi tidak cocok.");
  await granted(data.user);
  form.reset();
 }catch(err){
  $("#authError").textContent=err.message||"Gagal masuk.";
  if(state.access===null)await db.auth.signOut();
 }finally{btn.disabled=false;btn.textContent="Masuk ke Pembukuan";}
});
db.auth.onAuthStateChange((event)=>{
 if(event==="SIGNED_OUT"&&state.authUser)locked();
});
function nav(page){
 state.view=page;
 if(page==="motors"){state.selected=null;state.detailTab="summary"}
 $("#sidebar").classList.remove("open");
 renderPage();
 window.scrollTo({top:0,behavior:"auto"});
}
function openMotor(id){
 if(!state.data.motors.some(x=>x.id===id)){notice("Unit tidak ditemukan.",true);return}
 state.selected=id;state.view="detail";state.detailTab="summary";nav("detail");
}
function showForm(kind,id="",motor=""){
 if(!canEdit()){notice("Akun tidak punya izin mengedit.",true);return}
 const root=$("#modalRoot");root.innerHTML=formHtml(kind,id,motor);root.hidden=false;document.body.classList.add("modal-open");
 const focus=root.querySelector("input:not([type=hidden])");if(focus)focus.focus();
}
function closeModal(){const root=$("#modalRoot");root.hidden=true;root.innerHTML="";document.body.classList.remove("modal-open");}
async function saveRecord(form){
 const kind=form.dataset.kind,id=form.dataset.id||null,motor=form.dataset.motor||state.selected||null;
 const f=new FormData(form),g=k=>String(f.get(k)||"").trim(),c=k=>num(f.get(k)),optional=k=>g(k)||null;
 let table="",row={};
 if(kind==="motor"){
  if(!g("brand")||!g("model"))throw Error("Merek dan model wajib diisi.");
  if(g("status")==="sold"&&(!(c("actual_sale_price")>0)||!g("sold_date")))throw Error("Motor terjual wajib memiliki harga jual aktual dan tanggal penjualan.");
  table=tables.motors;
  row={brand:g("brand"),model:g("model"),variant:g("variant"),unit_code:g("unit_code"),model_year:optional("model_year")?c("model_year"):null,odometer_km:optional("odometer_km")?c("odometer_km"):null,plate_no:g("plate_no"),chassis_no:g("chassis_no"),purchase_date:g("purchase_date")||today(),purchase_price:c("purchase_price"),target_sale_price:c("target_sale_price"),status:g("status"),actual_sale_price:g("status")==="sold"?c("actual_sale_price"):null,sold_date:g("status")==="sold"?g("sold_date"):null,notes:g("notes")};
 }else if(kind==="task"){
  if(!motor)throw Error("Motor tidak terpilih.");
  if(!g("title"))throw Error("Nama PR wajib diisi.");
  table=tables.tasks;row={motor_id:motor,title:g("title"),notes:g("notes"),priority:g("priority"),status:g("status"),due_date:optional("due_date"),estimated_cost:c("estimated_cost"),actual_cost:c("actual_cost")};
 }else if(kind==="part"){
  if(!motor)throw Error("Motor tidak terpilih.");
  if(!g("name"))throw Error("Nama sparepart wajib diisi.");
  const qty=c("quantity"),sold=c("qty_sold");
  if(qty<1||sold>qty)throw Error("Jumlah terjual tidak boleh lebih dari stok.");
  if(sold>0&&g("purpose")!=="resale")throw Error("Pilih 'Dijual Terpisah' jika sparepart telah dijual.");
  if(sold>0&&c("actual_sale_price")<=0)throw Error("Isi harga jual aktual untuk sparepart yang sudah terjual.");
  if(sold>0&&g("status")==="planned")throw Error("Sparepart yang sudah terjual tidak boleh berstatus rencana pembelian.");
  table=tables.parts;
  row={motor_id:motor,name:g("name"),part_code:g("part_code"),quantity:qty,unit_cost:c("unit_cost"),estimated_sale_price:c("estimated_sale_price"),actual_sale_price:c("actual_sale_price"),qty_sold:sold,purpose:g("purpose"),status:g("status"),purchase_date:optional("purchase_date"),sold_date:optional("sold_date"),notes:g("notes")};
  if(sold>0&&!row.sold_date)throw Error("Tanggal penjualan sparepart wajib diisi jika sudah terjual.");
 }else if(kind==="expense"){
  if(!motor)throw Error("Motor tidak terpilih.");
  if(!g("title"))throw Error("Nama biaya wajib diisi.");
  table=tables.expenses;row={motor_id:motor,title:g("title"),category:g("category"),expense_date:g("expense_date")||today(),amount:c("amount"),is_planned:f.has("is_planned"),notes:g("notes")};
 }else if(kind==="capital"){
  if(!g("person_name")||c("amount")<=0)throw Error("Isi nama pemodal dan nominal lebih besar dari nol.");
  table=tables.capital;row={person_name:g("person_name"),entry_type:g("entry_type"),entry_date:g("entry_date")||today(),amount:c("amount"),notes:g("notes")};
 }else throw Error("Jenis pencatatan tidak diketahui.");
 const result=await store(table,row,id);
 closeModal();
 if(kind==="motor"){state.selected=result.id;state.view="detail";state.detailTab="summary"}
 await reload(true);
 notice("Data berhasil disimpan.");
}
$("#modalRoot").addEventListener("submit",async e=>{
 if(e.target.id!=="entityForm")return;
 e.preventDefault();
 const btn=$("#saveBtn"),err=$("#formError");btn.disabled=true;btn.textContent="Menyimpan...";err.textContent="";
 try{await saveRecord(e.target)}
 catch(ex){err.textContent=ex.message||"Tidak dapat menyimpan.";btn.disabled=false;btn.textContent="Simpan Data";}
});
async function erase(kind,id){
 const key=knownKind[kind];if(!key||!canEdit())return;
 const extra=kind==="motor"?" Semua PR, sparepart, dan biaya terkait akan ikut terhapus.":"";
 if(!window.confirm("Hapus data "+kind+" ini secara permanen?"+extra))return;
 const table=tables[key];
 try{
  if(kind==="motor"){
   const partIds=state.data.parts.filter(p=>p.motor_id===id).map(p=>p.id);
   const paths=state.data.photos.filter(p=>p.motor_id===id||partIds.includes(p.part_id)).map(p=>p.storage_path);
   if(paths.length){const {error}=await db.storage.from("showroom-private").remove(paths);if(error)throw Error(error.message)}
  } else if(kind==="part"){
   const paths=state.data.photos.filter(p=>p.part_id===id).map(p=>p.storage_path);
   if(paths.length){const {error}=await db.storage.from("showroom-private").remove(paths);if(error)throw Error(error.message)}
  }
  await remove(table,id);
  if(kind==="motor"){state.view="motors";state.selected=null;}
  await reload(true);notice("Data berhasil dihapus.");
 }catch(ex){notice("Gagal menghapus: "+ex.message,true)}
}
function csvCell(x){
 const v=String(x??"");
 const safe=/^[=+\-@]/.test(v)&&!/^-[0-9]+(\.[0-9]+)?$/.test(v)?"'"+v:v;
 return '"'+safe.replace(/"/g,'""')+'"';
}
function exportCSV(file,headers,rows){
 const csv="\ufeff"+[headers,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const a=document.createElement("a");a.href=url;a.download=file;a.style.display="none";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);notice("Laporan CSV disiapkan.");
}
function doExport(kind){
 if(kind==="cash"){
  exportCSV("arus-kas-starpoint-showroom.csv",["Tanggal","Jenis","Unit","Keterangan","Masuk","Keluar"],ledger().map(x=>[x.date,x.type,x.unit,x.memo,x.amount>0?x.amount:0,x.amount<0?-x.amount:0]));
 }else{
  exportCSV("laporan-unit-starpoint-showroom.csv",["Unit","Kode Stok","Status","Tanggal Beli","Harga Beli","HPP Aktual","HPP Proyeksi","Harga Motor / Target","Pendapatan Sparepart","Proyeksi Laba / Laba Aktual"],state.data.motors.map(m=>{const f=finance(m);return[unitName(m),m.unit_code,m.status,m.purchase_date,m.purchase_price,f.cost,f.expectedCost,f.motorRevenue,f.resaleRevenue,m.status==="sold"?f.actualProfit:f.expectedProfit]}));
 }
}
document.addEventListener("click",async e=>{
 const target=e.target.closest("[data-action],[data-nav]");
 if(!target)return;
 if(target.dataset.action){
  e.preventDefault();
  const what=target.dataset.action,id=target.dataset.id||"";
  try{
   if(what==="menu"){$("#sidebar").classList.toggle("open");return}
   if(what==="close-modal"){closeModal();return}
   if(what==="logout"){await db.auth.signOut();locked();return}
   if(what==="open-motor"){openMotor(id);return}
   if(what==="detail-tab"){state.detailTab=target.dataset.value;renderPage();return}
   if(what==="new-motor"){showForm("motor");return}
   if(what==="archive-motor"){if(state.data.motors.some(m=>m.id===id&&m.status==="sold"))throw Error("Motor terjual tetap disimpan dalam laporan dan tidak dapat diarsipkan.");if(window.confirm("Arsipkan motor ini? Riwayat dan biayanya tetap tersimpan.")){await store(tables.motors,{status:"archived"},id);await reload(true);notice("Unit berhasil diarsipkan.")}return}
   if(what==="edit-motor"){showForm("motor",id);return}
   for(const kind of ["task","part","expense","capital"]){
    if(what==="new-"+kind){showForm(kind,"",id||state.selected);return}
    if(what==="edit-"+kind){showForm(kind,id);return}
   }
   if(what.startsWith("delete-")){
    const kind=what.slice("delete-".length);
    if(kind==="photo"){
     if(window.confirm("Hapus foto ini?")){await deletePhoto(id);await reload(true);notice("Foto dihapus.")}
    }else await erase(kind,id);
    return;
   }
   if(what==="toggle-task"){
    const t=state.data.tasks.find(x=>x.id===id);if(!t||!canEdit())return;
    const status={todo:"doing",doing:"done",done:"todo"}[t.status];
    await store(tables.tasks,{status},id);await reload(true);notice("Status PR diperbarui.");return;
   }
   if(what==="upload-motor"||what==="upload-part"){
    if(!canEdit()){notice("Tidak mempunyai izin unggah.",true);return}
    state.photosTarget={type:what==="upload-motor"?"motor":"part",id};
    $("#photoPicker").value="";$("#photoPicker").click();return;
   }
   if(what==="export-cash"){doExport("cash");return}
   if(what==="export-reports"){doExport("report");return}
   if(what==="print-report"){window.print();return}
  }catch(ex){notice(ex.message||"Terjadi kesalahan.",true)}
 }else if(target.dataset.nav){
  e.preventDefault();nav(target.dataset.nav);
 }
});
$("#photoPicker").addEventListener("change",async e=>{
 const files=Array.from(e.target.files||[]),target=state.photosTarget;
 if(!target||!files.length)return;
 notice("Mengunggah "+files.length+" foto...");
 try{
  const out=await uploadPhotos(files,target.type,target.id);
  await reload(true);
  if(out.problems.length)notice(out.count+" foto tersimpan. Gagal: "+out.problems.join("; ").slice(0,190),true);
  else notice(out.count+" foto berhasil disimpan.");
 }catch(ex){notice("Gagal unggah foto: "+ex.message,true)}
});
document.addEventListener("input",e=>{
 if(e.target.id==="motorSearch"||e.target.id==="partsSearch"){
  const id=e.target.id,pos=e.target.selectionStart;
  if(id==="motorSearch")state.search=e.target.value;else state.partSearch=e.target.value;
  renderPage();
  const element=document.getElementById(id);if(element){element.focus();try{element.setSelectionRange(pos,pos)}catch(_){}}
 }
});
document.addEventListener("change",e=>{if(e.target.id==="statusFilter"){state.filter=e.target.value;renderPage()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
$("#modalRoot").addEventListener("click",e=>{if(e.target.id==="modalRoot")closeModal()});
document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.authUser&&Date.now()-lastLoad>20000)reload(true)});
initialize();
