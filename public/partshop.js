import { createMotorPartsEditor } from './partshop-inline.js?v=20261124-photo30d';
import { formatRupiah, parseRupiah, bindRupiahInputs } from './partshop-currency.js?v=20261124-rupiah1';
const API_ENDPOINT='https://msvdxyicostwztisvbvl.supabase.co/functions/v1/second-partshop-api';
const PUBLIC_KEY='sb_publishable_ihIG0dcPUHF9egWHaRlfvQ_E_Bn8zBk';
const SESSION_NAME='second-partshop-session';
let sessionToken=sessionStorage.getItem(SESSION_NAME)||'';
async function api(action,data={}){
  const res=await fetch(API_ENDPOINT,{
    method:'POST',
    headers:{'Content-Type':'application/json','apikey':PUBLIC_KEY,...(sessionToken?{'Authorization':'Bearer '+sessionToken}:{})},
    body:JSON.stringify({action,...data}),
    cache:'no-store'
  });
  const json=await res.json().catch(()=>({error:'Gagal membaca respons server.'}));
  if(res.status===401 && action!=='login'){
    sessionToken='';sessionStorage.removeItem(SESSION_NAME);displayLogin('Sesi berakhir. Silakan masuk kembali.');
  }
  if(!res.ok)throw Error(json.error||'Permintaan gagal.');
  return json;
}
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const rupiah=new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0});
const money=n=>rupiah.format(Number(n)||0);
let motors=[],parts=[],selectedId=null,filter='all',query='',selectedYear='',modalType='',editingId=null,photoCache=new Map(),previewUrl=null;
const inlineParts=createMotorPartsEditor({bindRupiahInputs,parseRupiah});
let toastTimer;
function toast(message){const t=$('toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3800)}
function errText(error){return error?.message||String(error||'Terjadi kesalahan')}
function displayLogin(message=''){$('appView').hidden=true;$('loginView').hidden=false;$('loginError').textContent=message}
async function enterApp(){
  if(!sessionToken){displayLogin();return}
  await loadData();
  $('loginView').hidden=true;
  $('appView').hidden=false;
  $('accountText').textContent='starpointpart';
}
async function loadData(){
  const data=await api('load');
  motors=data.motors||[];
  parts=data.parts||[];
  render();
}
function photoElement(path,extra=''){
  return '<div class="photo-box '+extra+'" '+(path?'data-photo="'+esc(path)+'"':'')+'>'+(path?'':'▧')+'</div>';
}
async function hydratePhotos(){
  for(const element of document.querySelectorAll('[data-photo]')){
    const path=element.getAttribute('data-photo');if(!path)continue;
    const cached=photoCache.get(path);
    if(cached && Date.now()<cached.expires){element.innerHTML='<img alt="Foto produk" src="'+esc(cached.url)+'">';continue}
    try{
      const res=await api('photo',{path});
      if(res.url){photoCache.set(path,{url:res.url,expires:Date.now()+1500000});if(element.isConnected)element.innerHTML='<img alt="Foto produk" src="'+esc(res.url)+'">'}
    }catch(e){if(!sessionToken)return}
  }
}
function render(){
  document.body.dataset.view=filter;
  $('searchBox').placeholder=filter==='parts'?'Cari sparepart atau nama motor...':filter==='sold'?'Cari motor dalam arsip...':'Cari motor belum terjual...';
  const sold=motors.filter(m=>m.status==='sold').length;
  const capital=motors.reduce((sum,m)=>sum+Number(m.capital||0),0)+parts.reduce((sum,p)=>sum+Number(p.capital||0),0);
  const activeMotors=motors.filter(m=>m.status==='available');
  const archivedMotors=motors.filter(m=>m.status==='sold');
  const activeIds=new Set(activeMotors.map(m=>m.id));
  const stockParts=parts.filter(p=>activeIds.has(p.motorcycle_id));
  const unsoldParts=stockParts.filter(p=>p.status==='available');
  const installedParts=stockParts.filter(p=>p.status==='installed');
  const activeCapital=activeMotors.reduce((sum,m)=>sum+Number(m.capital||0),0)+
    stockParts.filter(p=>p.status!=='sold').reduce((sum,p)=>sum+Number(p.capital||0),0);
  $('statTotal').textContent=activeMotors.length;
  $('statSold').textContent=unsoldParts.length;
  $('statAvailable').textContent=installedParts.length;
  $('statCapital').textContent=money(activeCapital);
  const inArchive=filter==='sold';
  $('scopeLabel').textContent=inArchive?'Arsip Motor':'Belum Terjual';
  $('filterAll').textContent=inArchive?archivedMotors.length:activeMotors.length;
  $('listEyebrow').textContent=inArchive?'RIWAYAT PENJUALAN':'STOK AKTIF';
  $('listTitle').textContent=inArchive?'Arsip Motor Terjual':'Motor Belum Terjual';
  document.querySelectorAll('[data-nav]').forEach(el=>el.classList.toggle('active',el.dataset.nav===filter));
  const shownBase=filter==='sold'?archivedMotors:activeMotors;
  const yearEl=$('yearFilter'), years=[...new Set(shownBase.map(m=>m.model_year).filter(Boolean))].sort((a,b)=>b-a);
  if(selectedYear&&!years.includes(Number(selectedYear)))selectedYear='';
  yearEl.innerHTML='<option value="">Semua Tahun</option>'+years.map(y=>'<option value="'+y+'" '+(String(y)===selectedYear?'selected':'')+'>'+y+'</option>').join('');
  const visible=shownBase.filter(m=>{
    if(selectedYear&&String(m.model_year)!==selectedYear)return false;
    return (m.name+' '+(m.model_year||'')).toLowerCase().includes(query.toLowerCase());
  });
  if(!['parts','report'].includes(filter)&&!visible.some(m=>m.id===selectedId)){
    selectedId=visible[0]?.id||null;
  }
  $('motorList').innerHTML=visible.length?visible.map(m=>{
    const count=parts.filter(p=>p.motorcycle_id===m.id).length;
    return '<article class="motor-row '+(m.id===selectedId?'active':'')+'" data-open="'+esc(m.id)+'" tabindex="0" aria-label="Lihat detail '+esc(m.name)+'">'+
      '<div class="motor-main">'+photoElement(m.photo_path)+'<strong>'+esc(m.name)+'</strong></div>'+
      '<div class="motor-cell year">'+(m.model_year||'—')+'</div>'+
      '<div class="motor-cell money">'+money(m.capital)+'</div>'+
      '<div class="motor-cell status-cell"><span class="status '+esc(m.status)+'">'+(m.status==='sold'?'Terjual':'Belum Terjual')+'</span></div>'+
      '<div class="motor-cell count">'+count+'</div>'+
      '<div class="row-tools"><button class="icon-button" data-action="editMotor" data-id="'+esc(m.id)+'">Edit</button><button class="icon-button red" data-action="addPart" data-id="'+esc(m.id)+'">+ Tambah Part</button></div></article>';
  }).join(''):'<div class="empty">'+(inArchive?'Belum ada motor yang terjual di arsip.':'Tidak ada motor belum terjual yang cocok dengan pencarian.')+'</div>';

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
  const m=shownBase.find(x=>x.id===selectedId);
  if(!m){$('motorDetail').innerHTML='<div class="empty">'+(inArchive?'Pilih motor di arsip untuk melihat detail dan sparepart.':'Pilih motor belum terjual untuk melihat detail dan sparepart.')+'</div>';hydratePhotos();return}
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
    '<div class="part-cell status-cell"><span class="status '+esc(p.status)+'">'+({sold:'Fix Terjual',installed:'Terpasang',available:'Belum Terjual'}[p.status]||'Belum Terjual')+'</span></div>'+
    '<div class="part-actions"><button class="icon-button" data-action="editPart" data-id="'+esc(p.id)+'" title="Edit dan upload foto">Edit</button>'+
    '<button class="icon-button red" data-action="deletePart" data-id="'+esc(p.id)+'" title="Hapus part">×</button></div></div>';
}
function filterChange(next){filter=next;selectedYear='';query='';$('searchBox').value='';render()}
function openModal(type,id=null,motorId=null){
  inlineParts.cleanup();
  modalType=type;editingId=id;
  const motor=type==='motor'?motors.find(x=>x.id===id):null;
  const part=type==='part'?parts.find(x=>x.id===id):null;
  if(type==='part'&&!motors.length){toast('Tambahkan motor terlebih dahulu sebelum memasukkan sparepart.');return}
  if(type==='part'&&part)selectedId=part.motorcycle_id;
  if(type==='part'&&motorId)selectedId=motorId;
  const data=type==='motor'?motor:part;
  $('modalTitle').textContent=(id?'Edit ':'Tambah ')+(type==='motor'?'Motor':'Part Motor');
  $('formFields').innerHTML=type==='motor'?'<div class="form-grid">'+
    '<label class="span2">Nama motor *<input name="name" required maxlength="120" placeholder="Contoh: Kawasaki ZX-25RR 2025" value="'+esc(motor?.name||'')+'"></label>'+
    '<label>Tahun<input name="model_year" type="number" min="1950" max="2100" placeholder="Isi tahun" value="'+esc(motor?.model_year??'')+'"></label>'+
    '<label>Modal beli motor (Rp)<input name="capital" type="text" inputmode="numeric" data-rupiah required placeholder="Rp 0" value="'+esc(formatRupiah(motor?.capital??''))+'"></label>'+
    '<label>Status<select name="status"><option value="available" '+(motor?.status!=='sold'?'selected':'')+'>Belum Terjual</option><option value="sold" '+(motor?.status==='sold'?'selected':'')+'>Fix Terjual</option></select></label>'+
    '<label>Harga terjual motor (Rp)<input name="sale_price" type="text" inputmode="numeric" data-rupiah placeholder="Rp 0 (opsional)" value="'+esc(formatRupiah(motor?.sale_price??''))+'"></label>'+
    '<label class="span2">Upload foto motor<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label><div class="field-hint">JPG, PNG, atau WebP · maksimal 8 MB · otomatis dihapus setelah 30 hari.</div>'+
    '<label class="span2">Catatan<textarea name="notes" placeholder="Catatan tambahan">'+esc(motor?.notes||'')+'</textarea></label></div>':
    '<div class="form-grid"><label class="span2">Motor pemilik part *<select name="motorcycle_id" required>'+motors.map(m=>'<option value="'+esc(m.id)+'" '+(m.id===(part?.motorcycle_id||selectedId)?'selected':'')+'>'+esc(m.name)+'</option>').join('')+'</select></label>'+
    '<label class="span2">Nama sparepart *<input name="name" required maxlength="130" placeholder="Contoh: Kaliper Brembo GP4RS" value="'+esc(part?.name||'')+'"></label>'+
    '<label>Kondisi<select name="condition"><option value="Bekas" '+(part?.condition!=='Baru'?'selected':'')+'>Bekas</option><option value="Baru" '+(part?.condition==='Baru'?'selected':'')+'>Baru</option></select></label>'+
    '<label>Modal part (Rp)<input name="capital" type="text" inputmode="numeric" data-rupiah required placeholder="Rp 0" value="'+esc(formatRupiah(part?.capital??''))+'"></label>'+
    '<label>Status<select name="status"><option value="available" '+(!part||part.status==='available'?'selected':'')+'>Belum Terjual</option><option value="sold" '+(part?.status==='sold'?'selected':'')+'>Fix Terjual</option><option value="installed" '+(part?.status==='installed'?'selected':'')+'>Terpasang</option></select></label>'+
    '<label>Harga jual part (Rp)<input name="sale_price" type="text" inputmode="numeric" data-rupiah placeholder="Rp 0 (opsional)" value="'+esc(formatRupiah(part?.sale_price??''))+'"></label>'+
    '<label class="span2">Upload foto part<input type="file" name="photo" accept="image/jpeg,image/png,image/webp"></label><div class="field-hint">JPG, PNG, atau WebP · maksimal 8 MB · otomatis dihapus setelah 30 hari.</div>'+
    '<label class="span2">Catatan<textarea name="notes" placeholder="Catatan tambahan">'+esc(part?.notes||'')+'</textarea></label></div>';
  $('formFields').insertAdjacentHTML('beforeend','<div class="form-photo-preview" id="photoPreview" hidden></div>');
  $('modalBackdrop').hidden=false;$('editorForm').reset();releasePreview();
  if(type==='motor')inlineParts.mount($('formFields'),motor,parts,money);
  bindRupiahInputs($('editorForm'));
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
function closeModal(){releasePreview();inlineParts.cleanup();$('modalBackdrop').hidden=true;editingId=null}
async function uploadPhoto(file,type,id){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8388608)throw Error('Foto harus JPG, PNG, atau WebP maksimal 8MB.');
  const form=new FormData();
  form.append('type',type);
  form.append('id',id);
  form.append('file',file);
  const response=await fetch(API_ENDPOINT,{
    method:'POST',
    headers:{'apikey':PUBLIC_KEY,'Authorization':'Bearer '+sessionToken},
    body:form,
    cache:'no-store'
  });
  const data=await response.json().catch(()=>({error:'Upload gagal'}));
  if(!response.ok)throw Error(data.error||'Gagal mengunggah foto');
  return data.path;
}
async function submitForm(ev){
  ev.preventDefault();
  const submit=$('saveButton');submit.disabled=true;submit.textContent='Menyimpan...';
  try{
    const f=new FormData(ev.target);const type=modalType;
    const photo=ev.target.querySelector('input[name="photo"]').files?.[0];
    if(photo&&(photo.size>8388608||!['image/jpeg','image/png','image/webp'].includes(photo.type)))throw Error('Foto harus JPG/PNG/WebP dengan ukuran maksimal 8 MB.');
    const payload={name:String(f.get('name')||'').trim(),capital:parseRupiah(f.get('capital'),{required:true}),sale_price:parseRupiah(f.get('sale_price')),status:String(f.get('status')),notes:String(f.get('notes')||'').trim(),updated_at:new Date().toISOString()};
    if(!payload.name)throw Error('Nama tidak boleh kosong.');
    if(!Number.isFinite(payload.capital)||payload.capital<0)throw Error('Modal harus bernilai nol atau lebih.');
    if(payload.sale_price!==null&&(!Number.isFinite(payload.sale_price)||payload.sale_price<0))throw Error('Harga jual tidak valid.');
    if(payload.status==='sold'&&(!payload.sale_price||payload.sale_price<=0))throw Error('Isi harga jual sebelum menandai terjual.');
    if(type==='motor'){
      payload.model_year=f.get('model_year')?Number(f.get('model_year')):null;
    }else{
      payload.condition=String(f.get('condition'));
      payload.motorcycle_id=String(f.get('motorcycle_id')||selectedId||'');
      if(!motors.some(m=>m.id===payload.motorcycle_id))throw Error('Pilih motor pemilik sparepart.');
    }
    const additions=type==='motor'?inlineParts.collect():[];
    const saved=await api('save',{type,id:editingId||null,payload});
    const id=saved.id;
    if(type==='motor'){selectedId=id;editingId=id}
    else selectedId=payload.motorcycle_id;
    const issues=[];
    if(photo){
      try{
        await uploadPhoto(photo,type,id);
        ev.target.querySelector('input[name="photo"]').value='';
      }catch(e){issues.push('Foto motor/part: '+errText(e))}
    }
    for(const entry of additions){
      try{
        const savedPart=await api('save',{
          type:'part',
          id:entry.article.dataset.savedId||null,
          payload:{...entry.payload,motorcycle_id:id}
        });
        entry.article.dataset.savedId=savedPart.id;
        const remove=entry.article.querySelector('.inline-part-remove');
        remove.disabled=true;
        remove.textContent='Tersimpan';
        if(entry.photo){
          try{
            await uploadPhoto(entry.photo,'part',savedPart.id);
            entry.article.querySelector('.inline-part-photo').value='';
          }catch(e){issues.push('Foto '+entry.payload.name+': '+errText(e))}
        }
      }catch(e){issues.push('Part '+entry.payload.name+': '+errText(e))}
    }
    await loadData();
    if(issues.length){
      const box=$('inlinePartsError');
      if(box){box.hidden=false;box.textContent='Sebagian data belum berhasil: '+issues.join(' | ')+'. Tekan Simpan lagi untuk mencoba ulang.'}
      toast('Sebagian tersimpan. Periksa pesan pada bagian List Part Motor.');
    }else{
      closeModal();
      toast(type==='motor'?(additions.length?'Motor dan '+additions.length+' part berhasil disimpan.':'Motor berhasil disimpan.'):'Part berhasil disimpan.');
    }
  }catch(e){toast('Gagal menyimpan: '+errText(e))}
  finally{submit.disabled=false;submit.textContent='Simpan'}
}
async function deleteRecord(kind,id){
  const motor=motors.find(x=>x.id===id),part=parts.find(x=>x.id===id);
  const isMotor=kind==='motor';const record=isMotor?motor:part;
  if(!record)return;
  const prompt=isMotor?'Hapus motor "'+record.name+'" BESERTA seluruh daftar part di dalamnya?':'Hapus part "'+record.name+'"?';
  if(!confirm(prompt))return;
  try{await api('delete',{type:kind,id})}
  catch(e){toast('Gagal menghapus: '+errText(e));return}
  if(isMotor)selectedId=null;
  await loadData();toast('Data dihapus.');
}
function exportInventoryCSV(){
  const rows=[['Jenis','Motor','Tahun','Nama Item','Kondisi','Modal (Rp)','Harga Jual (Rp)','Status','Catatan']];
  for(const m of motors){
    rows.push(['Motor',m.name,m.model_year||'',m.name,'',m.capital??0,m.sale_price??'',m.status==='sold'?'Terjual':'Belum Terjual',m.notes||'']);
    for(const p of parts.filter(x=>x.motorcycle_id===m.id)){
      rows.push(['Part',m.name,m.model_year||'',p.name,p.condition||'',p.capital??0,p.sale_price??'',({sold:'Fix Terjual',installed:'Terpasang',available:'Belum Terjual'}[p.status]||p.status),p.notes||'']);
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
  ev.preventDefault();
  $('loginButton').disabled=true;
  $('loginError').textContent='';
  try{
    const username=$('loginUsername').value.trim().toLowerCase();
    const password=$('loginPassword').value;
    const data=await api('login',{username,password});
    sessionToken=data.token;
    sessionStorage.setItem(SESSION_NAME,sessionToken);
    $('loginPassword').value='';
    await enterApp();
  }catch(e){$('loginError').textContent=errText(e)}
  finally{$('loginButton').disabled=false}
});
$('togglePassword').onclick=()=>{const pass=$('loginPassword');pass.type=pass.type==='password'?'text':'password';$('togglePassword').textContent=pass.type==='password'?'Lihat':'Sembunyikan'};
const signOut=async()=>{try{await api('logout')}catch{}sessionToken='';sessionStorage.removeItem(SESSION_NAME);$('loginPassword').value='';displayLogin();};$('logoutButton').onclick=signOut;$('logoutTop').onclick=signOut;
$('addMotor').onclick=()=>openModal('motor');
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