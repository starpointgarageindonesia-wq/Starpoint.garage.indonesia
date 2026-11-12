import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.113.0/+esm";
export const db=createClient("https://msvdxyicostwztisvbvl.supabase.co", "sb_publishable_ihIG0dcPUHF9egWHaRlfvQ_E_Bn8zBk", {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
export const tables={motors:"showroom_motorcycles",tasks:"showroom_tasks",parts:"showroom_parts",expenses:"showroom_expenses",capital:"showroom_capital",photos:"showroom_photos"};
export const state={authUser:null,access:null,view:"dashboard",selected:null,detailTab:"summary",search:"",filter:"all",partSearch:"",photosTarget:null,loading:false,online:false,channel:null,data:{motors:[],tasks:[],parts:[],expenses:[],capital:[],photos:[]},photoUrls:new Map()};
export const formatIDR=new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0});
export const num=v=>Number(v)||0;
export const money=v=>formatIDR.format(num(v));
export const number=v=>new Intl.NumberFormat("id-ID").format(num(v));
export const shortMoney=v=>{const n=num(v);return Math.abs(n)>=1e9?"Rp"+(n/1e9).toLocaleString("id-ID",{maximumFractionDigits:2})+" M":Math.abs(n)>=1e6?"Rp"+(n/1e6).toLocaleString("id-ID",{maximumFractionDigits:2})+" jt":money(n)};
export const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
export const fmtDate=v=>{if(!v)return "-";const d=new Date(String(v).slice(0,10)+"T12:00:00");return Number.isNaN(d.getTime())?"-":d.toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})};
export const unitName=m=>[m.brand,m.model,m.variant].filter(Boolean).join(" ")||"Unit tanpa nama";
export const statusName={stock:"Stok",work:"Dalam PR",ready:"Siap Jual",sold:"Terjual",archived:"Arsip"};
export const priorityName={low:"Rendah",normal:"Normal",high:"Tinggi"};
export const taskName={todo:"Belum",doing:"Dikerjakan",done:"Selesai"};
export const partPurpose={maintenance:"Untuk Motor",resale:"Dijual Terpisah"};
export const partStatus={planned:"Rencana",purchased:"Sudah Dibeli",installed:"Terpasang",sold:"Terjual"};
export const canEdit=()=>["owner","editor"].includes(state.access?.role);
export const accessRole=()=>state.access?.role==="owner"?"Owner":state.access?.role==="editor"?"Editor":"Viewer";
export const unitParts=id=>state.data.parts.filter(p=>p.motor_id===id);
export const unitTasks=id=>state.data.tasks.filter(t=>t.motor_id===id);
export const unitExpenses=id=>state.data.expenses.filter(e=>e.motor_id===id);
export const unitPhotos=id=>state.data.photos.filter(p=>p.motor_id===id);
export const partPhotos=id=>state.data.photos.filter(p=>p.part_id===id);
export function finance(m){
  const parts=unitParts(m.id),expenses=unitExpenses(m.id);
  const purchased=parts.filter(p=>p.status!=="planned").reduce((a,p)=>a+num(p.unit_cost)*num(p.quantity),0);
  const plannedPart=parts.filter(p=>p.status==="planned").reduce((a,p)=>a+num(p.unit_cost)*num(p.quantity),0);
  const realExpense=expenses.filter(e=>!e.is_planned).reduce((a,e)=>a+num(e.amount),0);
  const planExpense=expenses.filter(e=>e.is_planned).reduce((a,e)=>a+num(e.amount),0);
  const expenseTotal=realExpense+planExpense;
  const cost=num(m.purchase_price)+purchased+realExpense;
  const expectedCost=cost+plannedPart+planExpense;
  const resaleRevenue=parts.filter(p=>p.purpose==="resale").reduce((a,p)=>a+num(p.qty_sold)*num(p.actual_sale_price)+(num(p.quantity)-num(p.qty_sold))*num(p.estimated_sale_price),0);
  const actualPartsRevenue=parts.filter(p=>p.purpose==="resale").reduce((a,p)=>a+num(p.qty_sold)*num(p.actual_sale_price),0);
  const motorRevenue=m.status==="sold"?num(m.actual_sale_price):num(m.target_sale_price);
  const targetRevenue=motorRevenue+resaleRevenue;
  const expectedProfit=targetRevenue-expectedCost;
  const sold=m.status==="sold";
  const actualProfit=sold?(num(m.actual_sale_price)+actualPartsRevenue-cost):null;
  const pendingTasks=unitTasks(m.id).filter(t=>t.status!=="done").length;
  return {purchased,plannedPart,realExpense,planExpense,expenseTotal,cost,expectedCost,resaleRevenue,actualPartsRevenue,motorRevenue,targetRevenue,expectedProfit,actualProfit,pendingTasks};
}
export function metrics(){
 const all=state.data.motors,active=all.filter(m=>m.status!=="sold"&&m.status!=="archived");
 const sold=all.filter(m=>m.status==="sold");
 return {
   active:active.length,sold:sold.length,total:all.length,
   committed:all.reduce((s,m)=>s+finance(m).cost,0),
   currentCapital:active.reduce((s,m)=>s+finance(m).cost,0),
   expectedSales:active.reduce((s,m)=>s+finance(m).targetRevenue,0),
   expectedProfit:active.reduce((s,m)=>s+finance(m).expectedProfit,0),
   realizedProfit:sold.reduce((s,m)=>s+finance(m).actualProfit,0),
   pendingTasks:state.data.tasks.filter(t=>t.status!=="done").length,
   cash:ledger().reduce((s,row)=>s+row.amount,0)
 };
}
export function ledger(){
 const out=[];
 for(const c of state.data.capital)out.push({date:c.entry_date,type:c.entry_type==="deposit"?"Setoran modal":"Penarikan modal",unit:"-",memo:c.person_name+(c.notes?" · "+c.notes:""),amount:(c.entry_type==="deposit"?1:-1)*num(c.amount),id:c.id});
 for(const m of state.data.motors){
   out.push({date:m.purchase_date,type:"Pembelian motor",unit:unitName(m),memo:m.unit_code||"",amount:-num(m.purchase_price),id:m.id});
   if(m.status==="sold"&&m.actual_sale_price)out.push({date:m.sold_date||m.purchase_date,type:"Penjualan motor",unit:unitName(m),memo:"Harga jual aktual",amount:num(m.actual_sale_price),id:m.id+"sold"});
 }
 for(const p of state.data.parts){
   const motor=state.data.motors.find(m=>m.id===p.motor_id);
   if(p.status!=="planned")out.push({date:p.purchase_date||motor?.purchase_date||today(),type:"Pembelian sparepart",unit:unitName(motor||{}),memo:p.name,amount:-num(p.quantity)*num(p.unit_cost),id:p.id});
   if(p.qty_sold>0)out.push({date:p.sold_date||today(),type:"Penjualan sparepart",unit:unitName(motor||{}),memo:p.name+" · "+p.qty_sold+" pcs",amount:num(p.qty_sold)*num(p.actual_sale_price),id:p.id+"sold"});
 }
 for(const e of state.data.expenses)if(!e.is_planned){const m=state.data.motors.find(x=>x.id===e.motor_id);out.push({date:e.expense_date,type:"Pengeluaran · "+e.category,unit:unitName(m||{}),memo:e.title,amount:-num(e.amount),id:e.id})}
 return out.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
export async function loadAll(){
 const jobs=Object.entries(tables).map(async([key,table])=>{
  let arr=[],start=0,done=false;
  while(!done){
    const {data,error}=await db.from(table).select("*").range(start,start+999);
    if(error)throw Error(table+": "+error.message);
    arr.push(...(data||[])); done=!data||data.length<1000;start+=1000;
    if(start>10000)done=true;
  }
  return [key,arr];
 });
 const fetched=await Promise.all(jobs);for(const [key,items] of fetched)state.data[key]=items;
 await loadPhotoUrls();
}
export async function loadPhotoUrls(){
 const pending=state.data.photos.filter(p=>p.storage_path&&!state.photoUrls.has(p.storage_path));
 await Promise.all(pending.map(async p=>{
  try{const {data,error}=await db.storage.from("showroom-private").createSignedUrl(p.storage_path,3600);
    if(!error&&data?.signedUrl)state.photoUrls.set(p.storage_path,{url:data.signedUrl,expires:Date.now()+3000000});
  }catch(_){}
 }));
 for(const [path,o] of state.photoUrls)if(o.expires<Date.now())state.photoUrls.delete(path);
}
export const photoSrc=path=>state.photoUrls.get(path)?.url||"";
export const photoForMotor=id=>{const p=unitPhotos(id)[0];return p?photoSrc(p.storage_path):""};
export const photoForPart=id=>{const p=partPhotos(id)[0];return p?photoSrc(p.storage_path):""};
export async function memberAccess(user){
 const {data,error}=await db.from("showroom_access").select("user_id,role,active").eq("user_id",user.id).maybeSingle();
 if(error)throw new Error(error.message);
 if(!data?.active)throw new Error("Akun ini belum mendapatkan izin pembukuan showroom. Gunakan akun Owner.");
 state.access=data;state.authUser=user;
}
export async function store(table,payload,id){
 if(!canEdit())throw Error("Akses hanya baca.");
 let query=id?db.from(table).update(payload).eq("id",id):db.from(table).insert(payload);
 const {data,error}=await query.select("id").single();if(error)throw Error(error.message);
 return data;
}
export async function remove(table,id){if(!canEdit())throw Error("Akses hanya baca.");const {error}=await db.from(table).delete().eq("id",id);if(error)throw Error(error.message)}
async function jpegify(file){
 if(!file.type.startsWith("image/"))throw Error("Pilih berkas foto.");
 const url=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error("Foto tidak bisa dibaca."));i.src=url;});
  const ratio=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
  canvas.getContext("2d",{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",0.85));
  if(!blob||blob.size>10000000)throw Error("Foto terlalu besar. Maksimum 10 MB.");
  return blob;
 }finally{URL.revokeObjectURL(url)}
}
export async function uploadPhotos(files,targetType,id){
 if(!canEdit())throw Error("Hanya Editor/Owner yang boleh mengunggah.");
 if(!["motor","part"].includes(targetType)||!id)throw Error("Target foto tidak valid.");
 let count=0;const problems=[];
 for(const file of files){
  let path="";
  try{
   const blob=await jpegify(file);
   path=targetType+"/"+id+"/"+crypto.randomUUID()+".jpg";
   const {error:e}=await db.storage.from("showroom-private").upload(path,blob,{contentType:"image/jpeg",cacheControl:"3600",upsert:false});if(e)throw Error(e.message);
   const row={storage_path:path,caption:file.name.slice(0,120)};row[targetType==="motor"?"motor_id":"part_id"]=id;
   const {error:dbError}=await db.from("showroom_photos").insert(row);
   if(dbError){await db.storage.from("showroom-private").remove([path]);throw Error(dbError.message)}
   count++;
  }catch(e){problems.push(file.name+": "+e.message)}
 }
 return {count,problems};
}
export async function deletePhoto(id){
 if(!canEdit())throw Error("Akses hanya baca.");
 const p=state.data.photos.find(x=>x.id===id);if(!p)return;
 const {error:e}=await db.storage.from("showroom-private").remove([p.storage_path]);if(e)throw Error(e.message);
 await remove("showroom_photos",id);state.photoUrls.delete(p.storage_path);
}
let realtimeTimer=null;
export function subscribe(onChange,onStatus){
 if(state.channel){db.removeChannel(state.channel);state.channel=null}
 let channel=db.channel("showroom-bookkeeping-"+Math.random().toString(36).slice(2));
 for(const t of Object.values(tables))channel=channel.on("postgres_changes",{event:"*",schema:"public",table:t},()=>{
  if(realtimeTimer)clearTimeout(realtimeTimer);
  realtimeTimer=setTimeout(onChange,650);
 });
 state.channel=channel.subscribe(status=>{state.online=status==="SUBSCRIBED";if(onStatus)onStatus(state.online);});
}
export function unsubscribe(){if(state.channel)db.removeChannel(state.channel);state.channel=null;state.online=false}
