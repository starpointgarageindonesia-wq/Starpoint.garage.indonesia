import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.1/+esm';

const db = createClient('https://msvdxyicostwztisvbvl.supabase.co','sb_publishable_ihIG0dcPUHF9egWHaRlfvQ_E_Bn8zBk', { auth:{autoRefreshToken:true,persistSession:true} });
const BUCKET='starpoint-partshop-private';
const PARTSHOP_EMAIL='starpointgarageindonesia+partshop@gmail.com';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const rupiah=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0});
const money=n=>rupiah.format(Number(n)||0);
let motors=[],parts=[],selectedId=null,filter='all',query='',selectedYear='',modalType='',editingId=null,photoCache=new Map(),previewUrl=null;
let toastTimer;
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3800)}
function errText(error){return error?.message||String(error||'Terjadi kesalahan')}
function displayLogin(message=''){$('appView').hidden=true;$('loginView').hidden=false;$('loginError').textContent=message}
async function enterApp(){
  const {data:{user},error}=await db.auth.getUser();
  if(error||!user){displayLogin();return}
  let access=await db.from('partshop_access').select('role,active').eq('user_id',user.id).maybeSingle();
  if((!access.data?.active||access.data.role!=='owner')&&user.email?.toLowerCase()===PARTSHOP_EMAIL){
    const result=await db.rpc('partshop_claim_access');
    if(!result.error&&result.data===true){
      access=await db.from('partshop_access').select('role,active').eq('user_id',user.id).maybeSingle();
    }
  }
  if(access.error||!access.data?.active||access.data.role!=='owner'){
    await db.auth.signOut();displayLogin('Akun belum mendapat izin Second Partshop. Pastikan konfirmasi email sudah selesai.');return;
  }
  $('loginView').hidden=true;$('appView').hidden=false;$('accountText').textContent=user.email?.startsWith('starpointpart@')?'starpointpart':(user.email||'Owner');
  await loadData();
}
async function loadData(){
  const [m,p]=await Promise.all([
    db.from('partshop_motorcycles').select('*').order('created_at',{ascending:false}),
    db.from('partshop_parts').select('*').order('created_at',{ascending:false})
  ]);
  if(m.error||p.error){toast('Gagal membaca data: '+errText(m.error||p.error));return}
  motors=m.data||[];parts=p.data||[];
  if(!motors.find(m=>m.id===selectedId))selectedId=motors[0]?.id||null;
  render();
}
function photoElement(path,extra=''){
  return '<div class="photo-box '+extra+'" '+(path?'data-photo="'+esc(path)+'"':'')+'>'+(path?'':'▧')+'</div>';
}
async function hydratePhotos(){
  for(const element of document.querySelectorAll('[data-photo]')){
    const path=element.getAttribute('data-photo');if(!path)continue;
    const cache=photoCache.get(path);
    if(cache&&Date.now()<cache.expires){element.innerHTML='<img alt="Foto produk" src="'+esc(cache.url)+'">';continue}
    const res=await db.storage.from(BUCKET).createSignedUrl(path,1800);
    if(!res.error&&res.data?.signedUrl){const url=res.data.signedUrl;photoCache.set(path,{url,expires:Date.now()+1500000});if(element.isConnected)element.innerHTML='<img alt="Foto produk" src="'+esc(url)+'">'}
  }
}
function render(){
  document.body.dataset.view=filter;
  $('searchBox').placeholder=filter==='parts'?'Cari sparepart atau nama motor...':'Cari nama motor atau tahun...';
  const sold=motors.filter(m=>m.status==='sold').length;
  const capital=motors.reduce((sum,m)=>sum+Number(m.capital||0),0)+parts.reduce((sum,p)=>sum+Number(p.capital||0),0);
  $('statTotal').textContent=motors.length;
  $('statSold').textContent=sold;
  $('statAvailable').textContent=motors.length-sold;
  $('statCapital').textContent=money(capital);
  $('filterAll').textContent=motors.length;
  $('filterAvailable').textContent=motors.length-sold;
  $('filterSold').textContent=sold;
  document.querySelectorAll('[data-filter]').forEach(el=>{
    const effective=['parts','motor','report'].includes(filter)?'all':filter;
    el.classList.toggle('selected',el.dataset.filter===effective);
  });
  document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===filter));
  const yearEl=$('yearFilter'), years=[...new Set(motors.map(m=>m.model_year).filter(Boolean))].sort((a,b)=>b-a);
  if(selectedYear&&!years.includes(Number(selectedYear)))selectedYear='';
  yearEl.innerHTML='<option value="">Semua Tahun</option>'+years.map(y=>'<option value="'+y+'" '+(String(y)===selectedYear?'selected':'')+'>'+y+'</option>').join('');
  const visible=motors.filter(m=>{
    if(filter==='sold'&&m.status!=='sold')return false;
    if(filter==='available'&&m.status!=='available')return false;
    if(selectedYear&&String(m.model_year)!==selectedYear)return false;
    return (m.name+' '+(m.model_year||'')).toLowerCase().includes(query.toLowerCase());
  });
  $('motorList').innerHTML=visible.length?visible.map(m=>{
    const count=parts.filter(p=>p.motorcycle_id===m.id).length;
    return '<article class="motor-row '+(m.id===selectedId?'active':'')+'" data-open="'+esc(m.id)+'" tabindex="0" aria-label="Lihat detail '+esc(m.name)+'">'+
      '<div class="motor-main">'+photoElement(m.photo_path)+'<strong>'+esc(m.name)+'</strong></div>'+
      '<div class="motor-cell year">'+(m.model_year||'—')+'</div>'+
      '<div class="motor-cell money">'+money(m.capital)+'</div>'+
      '<div class="motor-cell status-cell"><span class="status '+esc(m.status)+'">'+(m.status==='sold'?'Terjual':'Belum Terjual')+'</span></div>'+
      '<div class="motor-cell count">'+count+'</div>'+
      '<div class="row-tools"><button class="icon-button" data-action="editMotor" data-id="'+esc(m.id)+'">Edit</button><button class="icon-button red" data-action="addPart" data-id="'+esc(m.id)+'">+ Tambah Part</button></div></article>';
  }).join(''):'<div class="empty">Belum ada motor yang sesuai. Klik Tambah Motor untuk mengisi inventaris.</div>';

  if(filter==='report'){
    $('detailTitle').textContent='Laporan';
    const sales=motors.filter(m=>m.status==='sold').reduce((a,m)=>a+Number(m.sale_price||0),0)+parts.filter(p=>p.status==='sold').reduce((a,p)=>a+Number(p.sale_price||0),0);
    const soldMotorIds=new Set(motors.filter(m=>m.status==='sold').map(m=>m.id));
    const soldCapital=motors.filter(m=>m.status==='sold').reduce((a,m)=>a+Number(m.capital||0),0)+parts.filter(p=>p.status==='sold'||(p.status==='installed'&&soldMotorIds.has(p.motorcycle_id))).reduce((a,p)=>a+Number(p.capital||0),0);
    $('motorDetail').innerHTML='<div class="report-controls"><button class="btn primary small" data-action="exportCSV">↓ Ekspor Data (CSV)</button></div><div class="report-grid"><div class="report-box"><small>Total Modal Tercatat</small><strong>'+money(capital)+'</strong></div><div class="report-box"><small>Total Penjualan Tercatat</small><strong>'+money(sales)+'</strong></div><div class="report-box"><small>Selisih Penjualan - Modal Item Terjual</small><strong>'+money(sales-soldCapital)+'</strong></div><div class="report-box"><small>Motor / Part Terjual</small><strong>'+sold+' motor · '+parts.filter(p=>p.status==='sold').length+' part</strong></div><p class="report-note">Ringkasan ini mengikuti harga jual yang dicatat. Jangan menghitung part dua kali apabila modalnya sudah termasuk dalam modal motor.</p></div>';return;
  }
  if(filter==='parts'){
    $('detailTitle').textContent='Daftar Semua Part';
    const q=query.trim().toLowerCase();
    const matchingParts=parts.filter(p=>{
      const owner=motors.find(m=>m.id===p.motorcycle_id);
      return !q||(p.name+' '+(owner?.name||'')+' '+(owner?.model_year||'')).toLowerCase().includes(q);
    });
    $('motorDetail').innerHTML='<div class="detail-wrap"><div class="parts-title"><h3>Sparepart Tercatat ('+matchingParts.length+')</h3><button class="btn primary small" data-action="addPart" data-id="'+esc(selectedId||'')+'" '+(!selectedId?'disabled':'')+'>+ Tambah Part</button></div><div class="parts-table">'+renderPartHead()+(matchingParts.length?matchingParts.map(p=>renderPartRow(p,true)).join(''):'<div class="empty">Belum ada sparepart yang sesuai pencarian.</div>')+'</div></div>';hydratePhotos();return;
  }
  $('detailTitle').textContent='Detail Motor';
  const m=motors.find(x=>x.id===selectedId);
  if(!m){$('motorDetail').innerHTML='<div class="empty">Pilih atau tambahkan motor untuk melihat daftar part.</div>';hydratePhotos();return}
  const list=parts.filter(p=>p.motorcycle_id===m.id),partCapital=list.reduce((sum,p)=>sum+Number(p.capital||0),0);
  $('motorDetail').innerHTML='<div class="detail-wrap"><div class="hero-motor">'+photoElement(m.photo_path)+
    '<div class="detail-info"><strong>'+esc(m.name)+'</strong><div class="details-kv">Tahun: <b>'+(m.model_year||'—')+'</b></div>'+
    '<div class="details-kv">Modal Motor: <b>'+money(m.capital)+'</b></div>'+
    '<div class="details-kv">Modal Part: <b>'+money(partCapital)+'</b></div>'+
    '<div class="details-kv">Harga Jual: <b>'+(m.sale_price!==null?money(m.sale_price):'Belum tercatat')+'</b></div>'+
    '<div class="details-kv">Status: <span class="status '+esc(m.status)+'">'+(m.status==='sold'?'Terjual':'Belum Terjual')+'</span></div></div></div>'+
    '<div class="detail-controls"><button class="btn outline small" data-action="editMotor" data-id="'+esc(m.id)+'">✎ Edit / Upload Foto Motor</button>'+
    '<button class="btn danger small" data-action="deleteMotor" data-id="'+esc(m.id)+'">Hapus Motor</button></div>'+
    '<div class="divider"></div><div class="parts-title"><h3>List Part Motor ('+list.length+')</h3>'+
    '<button class="btn primary small" data-action="addPart" data-id="'+esc(m.id)+'">+ Tambah List Part</button></div>'+
    '<div class="parts-table">'+renderPartHead()+(list.length?list.map(p=>renderPartRow(p,false)).join(''):'<div class="empty">Belum ada part. Tambahkan sparepart beserta modal dan foto secara manual.</div>')+'</div></div>';
  hydratePhotos();
}
function renderPartHead(){
  return '<div class="part-table-header"><span>Nama Part</span><span>Kondisi</span><span>Modal</span><span>Status</span><span>Aksi</span></div>';
}
function renderPartRow(p,showMotor){
  const mot=motors.find(m=>m.id===p.motorcycle_id);
  return '<div class="part-row"><div class="part-name">'+photoElement(p.photo_path)+'<strong>'+esc(p.name)+(showMotor&&mot?'<small style="display:block;font-weight:400">'+esc(mot.name)+'</small>':'')+'</strong></div>'+
    '<div class="part-cell condition">'+esc(p.condition)+'</div><div class="part-cell cost">'+money(p.capital)+'</div>'+
    '<div class="part-cell status-cell"><span class="status '+esc(p.status)+'">'+({sold:'Terjual',installed:'Terpasang',available:'Belum Terjual'}[p.status]||'Belum Terjual')+'</span></div>'+
    '<div class="part-actions"><button class="icon-button" data-action="editPart" data-id="'+esc(p.id)+'" title="Edit dan upload foto">Edit</button>'+
    '<button class="icon-button red" data-action="deletePart" data-id="'+esc(p.id)+'" title="Hapus part">×</button></div></div>';
}
function filterChange(next){filter=next;render()}
function openModal(type,id=null,motorId=null){
  modalType=type;editingId=id;
  const motor=type==='motor'?motors.find(x=>x.id===id):null;
  const part=type==='part'?parts.find(x=>x.id===id):null;
  if(type==='part'&&!motors.length){toast('Tambahkan motor terlebih dahulu sebelum memasukkan sparepart.');return}
  if(type==='part'&&part)selectedId=part.motorcycle_id;
  if(type==='part'&&motorId)selectedId=motorId;
  const data=type==='motor'?motor:part;
  $('modalTitle').textContent=(id?'Edit ':'Tambah ')+(type==='motor'?'Motor':'Part Motor');
  const yearNow=new Date().getFullYear();
  $('formFields').innerHTML=type==='motor'?'<div class="form-grid">'+
    '<label class="span2">Nama motor *<input name="name" required maxlength="120" placeholder="Contoh: Kawasaki ZX-25RR 2025" value="'+esc(motor?.name||'')+'"></label>'+
    '<label>Tahun<input name="model_year" type="number" min="1950" max="2100" value="'+esc(motor?.model_year||yearNow)+'"></label>'+
    '<label>Modal beli motor (Rp)<input name="capital" type="number" required min="0" step="1" value="'+esc(motor?.capital??0)+'"></label>'+
    '<label>Status<select name="status"><option value="available" '+(motor?.status!=='sold'?'selected':'')+'>Belum Terjual</option><option value="sold" '+(motor?.status==='sold'?'selected':'')+'>Terjual</option></select></label>'+
    '<label>Harga terjual motor (Rp)<input name="sale_price" type="number" min="0" step="1" placeholder="Opsional" value="'+esc(motor?.sale_price??'')+'"></label>'+
    '<label class="span2">Upload foto motor<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label><div class="field-hint">JPG, PNG, atau WebP · maksimal 8 MB · bisa diganti saat edit.</div>'+
    '<label class="span2">Catatan<textarea name="notes" placeholder="Catatan tambahan">'+esc(motor?.notes||'')+'</textarea></label></div>':
    '<div class="form-grid"><label class="span2">Motor pemilik part *<select name="motorcycle_id" required>'+motors.map(m=>'<option value="'+esc(m.id)+'" '+(m.id===(part?.motorcycle_id||selectedId)?'selected':'')+'>'+esc(m.name)+'</option>').join('')+'</select></label>'+
    '<label class="span2">Nama sparepart *<input name="name" required maxlength="130" placeholder="Contoh: Kaliper Brembo GP4RS" value="'+esc(part?.name||'')+'"></label>'+
    '<label>Kondisi<select name="condition"><option value="Bekas" '+(part?.condition!=='Baru'?'selected':'')+'>Bekas</option><option value="Baru" '+(part?.condition==='Baru'?'selected':'')+'>Baru</option></select></label>'+
    '<label>Modal part (Rp)<input name="capital" type="number" required min="0" step="1" value="'+esc(part?.capital??0)+'"></label>'+
    '<label>Status<select name="status"><option value="available" '+(!part||part.status==='available'?'selected':'')+'>Belum Terjual</option><option value="sold" '+(part?.status==='sold'?'selected':'')+'>Terjual</option><option value="installed" '+(part?.status==='installed'?'selected':'')+'>Terpasang</option></select></label>'+
    '<label>Harga terjual part (Rp)<input name="sale_price" type="number" min="0" step="1" placeholder="Opsional" value="'+esc(part?.sale_price??'')+'"></label>'+
    '<label class="span2">Upload foto part<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label><div class="field-hint">JPG, PNG, atau WebP · maksimal 8 MB · bisa diganti saat edit.</div>'+
    '<label class="span2">Catatan<textarea name="notes" placeholder="Catatan tambahan">'+esc(part?.notes||'')+'</textarea></label></div>';
  $('formFields').insertAdjacentHTML('beforeend','<div class="form-photo-preview" id="photoPreview" hidden></div>');
  $('modalBackdrop').hidden=false;$('editorForm').reset();releasePreview();
  const inp=$('editorForm').querySelector('input[name="photo"]');
  inp.addEventListener('change',()=>{
    releasePreview();const file=inp.files?.[0],out=$('photoPreview');
    if(!file){out.hidden=true;out.innerHTML='';return}
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8388608){
      inp.value='';out.hidden=true;toast('Pilih foto JPG, PNG, atau WebP maksimal 8 MB.');return;
    }
    previewUrl=URL.createObjectURL(file);
    out.innerHTML='<img src="'+previewUrl+'" alt="Pratinjau foto"><div><strong>Pratinjau foto</strong><small>'+esc(file.name)+' · '+(file.size/1048576).toFixed(2)+' MB</small></div>';
    out.hidden=false;
  });
  $('editorForm').querySelector('[name="name"]').focus();
}
function releasePreview(){if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}}
function closeModal(){releasePreview();$('modalBackdrop').hidden=true;editingId=null}
async function uploadPhoto(file,kind,id){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Format harus JPG, PNG, atau WebP.');
  if(file.size>8388608)throw Error('Ukuran foto maksimal 8 MB.');
  const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
  const path=kind+'/'+id+'/'+crypto.randomUUID()+'.'+ext;
  const {error}=await db.storage.from(BUCKET).upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  return path;
}
async function submitForm(ev){
  ev.preventDefault();
  const submit=$('saveButton');submit.disabled=true;submit.textContent='Menyimpan...';
  try{
    const f=new FormData(ev.target);const type=modalType;
    const photo=ev.target.querySelector('input[name="photo"]').files?.[0];
    if(photo&&(photo.size>8388608||!['image/jpeg','image/png','image/webp'].includes(photo.type)))throw Error('Foto harus JPG/PNG/WebP dengan ukuran maksimal 8 MB.');
    const payload={name:String(f.get('name')||'').trim(),capital:Number(f.get('capital')||0),sale_price:f.get('sale_price')!==''?Number(f.get('sale_price')):null,status:String(f.get('status')),notes:String(f.get('notes')||'').trim(),updated_at:new Date().toISOString()};
    if(!payload.name)throw Error('Nama tidak boleh kosong.');
    if(!Number.isFinite(payload.capital)||payload.capital<0)throw Error('Modal harus bernilai nol atau lebih.');
    if(payload.sale_price!==null&&(!Number.isFinite(payload.sale_price)||payload.sale_price<0))throw Error('Harga jual tidak valid.');
    if(payload.status==='sold'&&(!payload.sale_price||payload.sale_price<=0))throw Error('Isi harga jual sebelum menandai terjual.');
    let table,oldPath;
    if(type==='motor'){
      table='partshop_motorcycles';payload.model_year=f.get('model_year')?Number(f.get('model_year')):null;
      if(editingId)oldPath=motors.find(x=>x.id===editingId)?.photo_path;
    }else{
      table='partshop_parts';payload.condition=String(f.get('condition'));
      payload.motorcycle_id=String(f.get('motorcycle_id')||selectedId||'');
      if(!motors.some(m=>m.id===payload.motorcycle_id))throw Error('Pilih motor pemilik sparepart.');
      if(editingId)oldPath=parts.find(x=>x.id===editingId)?.photo_path;
    }
    let result;
    if(editingId)result=await db.from(table).update(payload).eq('id',editingId).select('id').single();
    else result=await db.from(table).insert(payload).select('id').single();
    if(result.error)throw result.error;
    const id=result.data.id;
    if(type==='motor')selectedId=id;
    if(type==='part')selectedId=payload.motorcycle_id;
    let uploadIssue=null;
    if(photo){
      try{
        const path=await uploadPhoto(photo,type==='motor'?'motors':'parts',id);
        const up=await db.from(table).update({photo_path:path}).eq('id',id);
        if(up.error)throw up.error;
        if(oldPath)await db.storage.from(BUCKET).remove([oldPath]);
      }catch(e){uploadIssue=errText(e)}
    }
    closeModal();await loadData();toast(uploadIssue?'Data tersimpan, tetapi foto gagal: '+uploadIssue:'Data berhasil disimpan.');
  }catch(e){toast('Gagal menyimpan: '+errText(e))}
  finally{submit.disabled=false;submit.textContent='Simpan'}
}
async function deleteRecord(kind,id){
  const motor=motors.find(x=>x.id===id),part=parts.find(x=>x.id===id);
  const isMotor=kind==='motor';const record=isMotor?motor:part;
  if(!record)return;
  const prompt=isMotor?'Hapus motor "'+record.name+'" BESERTA seluruh daftar part di dalamnya?':'Hapus part "'+record.name+'"?';
  if(!confirm(prompt))return;
  const table=isMotor?'partshop_motorcycles':'partshop_parts';
  const {error}=await db.from(table).delete().eq('id',id);
  if(error){toast('Gagal menghapus: '+errText(error));return}
  const paths=isMotor?[record.photo_path,...parts.filter(p=>p.motorcycle_id===id).map(p=>p.photo_path)].filter(Boolean):[record.photo_path].filter(Boolean);
  if(paths.length)await db.storage.from(BUCKET).remove(paths);
  if(isMotor)selectedId=null;
  await loadData();toast('Data dihapus.');
}
function exportInventoryCSV(){
  const rows=[['Jenis','Motor','Tahun','Nama Item','Kondisi','Modal (Rp)','Harga Jual (Rp)','Status','Catatan']];
  for(const m of motors){
    rows.push(['Motor',m.name,m.model_year||'',m.name,'',m.capital??0,m.sale_price??'',m.status==='sold'?'Terjual':'Belum Terjual',m.notes||'']);
    for(const p of parts.filter(x=>x.motorcycle_id===m.id)){
      rows.push(['Part',m.name,m.model_year||'',p.name,p.condition||'',p.capital??0,p.sale_price??'',({sold:'Terjual',installed:'Terpasang',available:'Belum Terjual'}[p.status]||p.status),p.notes||'']);
    }
  }
  const csv='\uFEFFsep=;\r\n'+rows.map(row=>row.map(v=>{let value=String(v??'');if(/^[\s]*[=+@-]/.test(value))value="'"+value;return '"'+value.replace(/"/g,'""')+'"'}).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  const a=document.createElement('a');a.href=url;a.download='starpoint-second-partshop-'+new Date().toISOString().slice(0,10)+'.csv';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Data inventaris berhasil diekspor ke CSV.');
}
async function handleAction(el){
  const action=el.dataset.action,id=el.dataset.id;
  if(action==='editMotor')openModal('motor',id);
  if(action==='addPart')openModal('part',null,id);
  if(action==='editPart')openModal('part',id);
  if(action==='deleteMotor')await deleteRecord('motor',id);
  if(action==='deletePart')await deleteRecord('part',id);
  if(action==='exportCSV')exportInventoryCSV();
}
$('loginForm').addEventListener('submit',async ev=>{
  ev.preventDefault();$('loginButton').disabled=true;$('loginError').textContent='';
  const username=$('loginUsername').value.trim().toLowerCase(),password=$('loginPassword').value;
  const email=username==='starpointpart'?PARTSHOP_EMAIL:(username==='starpointgarage'?'starpointgarageindonesia@gmail.com':(username.includes('@')?username:null));
  if(!email){$('loginError').textContent='Username tidak dikenal.';$('loginButton').disabled=false;return}
  const {error}=await db.auth.signInWithPassword({email,password});
  if(error)$('loginError').textContent=username==='starpointpart'?'Login belum aktif atau password salah. Jika baru pertama kali, tekan Aktifkan login starpointpart.':'Login gagal. Periksa kredensial akun Owner.';
  else await enterApp();
  $('loginButton').disabled=false;
});
$('activatePartshop').addEventListener('click',async()=>{
  const status=$('activationStatus'),button=$('activatePartshop');
  status.textContent='';$('loginError').textContent='';
  if($('loginUsername').value.trim().toLowerCase()!=='starpointpart'){
    status.textContent='Isi username starpointpart untuk aktivasi khusus Partshop.';return;
  }
  const password=$('loginPassword').value;
  if(password.length<8){
    status.textContent='Isi password khusus Partshop minimal 8 karakter.';return;
  }
  button.disabled=true;button.textContent='Mengirim aktivasi...';
  try{
    const {data,error}=await db.auth.signUp({email:PARTSHOP_EMAIL,password});
    if(error)throw error;
    if(data?.session){await enterApp();return;}
    status.textContent='Permintaan aktivasi dikirim. Periksa email starpointgarageindonesia@gmail.com, klik konfirmasi, kemudian masuk kembali menggunakan username starpointpart dan password Partshop.';
  }catch(e){status.textContent='Aktivasi gagal: '+errText(e)}
  finally{button.disabled=false;button.textContent='Aktifkan login starpointpart'}
});
$('togglePassword').onclick=()=>{const pass=$('loginPassword');pass.type=pass.type==='password'?'text':'password';$('togglePassword').textContent=pass.type==='password'?'Lihat':'Sembunyikan'};
const signOut=async()=>{await db.auth.signOut();$('loginPassword').value='';displayLogin();};$('logoutButton').onclick=signOut;$('logoutTop').onclick=signOut;
$('addMotor').onclick=()=>openModal('motor');$('addMotorMobile').onclick=()=>openModal('motor');
$('searchBox').addEventListener('input',ev=>{query=ev.target.value;render()});
$('yearFilter').addEventListener('change',ev=>{selectedYear=ev.target.value;render()});
$('closeModal').onclick=closeModal;$('cancelModal').onclick=closeModal;
$('modalBackdrop').addEventListener('click',ev=>{if(ev.target===$('modalBackdrop'))closeModal()});
$('editorForm').addEventListener('submit',submitForm);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('modalBackdrop').hidden)closeModal();if(ev.key==='Enter'&&ev.target.matches('[data-open]')){selectedId=ev.target.dataset.open;if(filter==='motor')filter='all';render()}});
document.addEventListener('click',ev=>{
  const act=ev.target.closest('[data-action]');if(act){ev.stopPropagation();handleAction(act);return}
  const flt=ev.target.closest('[data-filter]');if(flt){filterChange(flt.dataset.filter);return}
  const nav=ev.target.closest('[data-nav]');if(nav){filterChange(nav.dataset.nav);return}
  const row=ev.target.closest('[data-open]');if(row){selectedId=row.dataset.open;if(filter==='motor')filter='all';render()}
});
enterApp().catch(e=>{displayLogin('Tidak dapat terhubung: '+errText(e))});