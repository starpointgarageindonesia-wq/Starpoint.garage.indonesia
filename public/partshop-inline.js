export function createMotorPartsEditor({bindRupiahInputs,parseRupiah}){
  const activeUrls=new Set();
  let sequence=0;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function cleanup(){
    for(const url of activeUrls)URL.revokeObjectURL(url);
    activeUrls.clear();
  }
  function add(){
    const list=document.getElementById('inlinePartRows');
    if(!list)return;
    sequence++;
    const article=document.createElement('article');
    article.className='inline-part-card';
    article.innerHTML=
      '<div class="inline-part-top"><strong>Part '+sequence+'</strong><button type="button" class="inline-part-remove" aria-label="Hapus part dari formulir">Hapus</button></div>'+
      '<div class="inline-part-fields">'+
      '<label class="span2">Nama Part *<input class="inline-part-name" type="text" required maxlength="130" placeholder="Contoh: Kaliper Brembo GP4RS"></label>'+
      '<label>Modal Part (Rp)<input class="inline-part-capital" type="text" inputmode="numeric" data-rupiah required placeholder="Rp 0"></label>'+
      '<label>Harga Jual (Rp)<input class="inline-part-price" type="text" inputmode="numeric" data-rupiah placeholder="Rp 0 (opsional)"></label>'+
      '<label>Kondisi<select class="inline-part-condition"><option value="Bekas">Bekas</option><option value="Baru">Baru</option></select></label>'+
      '<label>Status<select class="inline-part-status"><option value="available">Belum Terjual</option><option value="sold">Fix Terjual</option><option value="installed">Terpasang</option></select></label>'+
      '<label class="span2">Upload Foto Part<input class="inline-part-photo" type="file" accept="image/jpeg,image/png,image/webp"></label>'+
      '</div><div class="inline-part-preview" hidden></div>';
    list.appendChild(article);
    bindRupiahInputs(article);
    const remove=article.querySelector('.inline-part-remove');
    remove.addEventListener('click',()=>{
      if(article.dataset.savedId)return;
      const url=article.dataset.previewUrl;
      if(url){URL.revokeObjectURL(url);activeUrls.delete(url)}
      article.remove();
      renumber();
    });
    const input=article.querySelector('.inline-part-photo');
    input.addEventListener('change',()=>{
      const preview=article.querySelector('.inline-part-preview');
      const old=article.dataset.previewUrl;
      if(old){URL.revokeObjectURL(old);activeUrls.delete(old);delete article.dataset.previewUrl}
      const file=input.files?.[0];
      if(!file){preview.hidden=true;preview.replaceChildren();return}
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8388608||file.size===0){
        input.value='';preview.hidden=true;preview.replaceChildren();
        alert('Foto part harus JPG, PNG, atau WebP maksimal 8 MB.');
        return;
      }
      const url=URL.createObjectURL(file);activeUrls.add(url);article.dataset.previewUrl=url;
      const image=document.createElement('img');image.src=url;image.alt='Pratinjau foto part';
      const caption=document.createElement('small');caption.textContent=file.name;
      preview.replaceChildren(image,caption);preview.hidden=false;
    });
    const status=article.querySelector('.inline-part-status');
    status.addEventListener('change',()=>{
      const price=article.querySelector('.inline-part-price');
      price.required=status.value==='sold';
      price.placeholder=price.required?'Rp (wajib untuk Fix Terjual)':'Rp 0 (opsional)';
    });
    article.querySelector('.inline-part-name').focus();
  }
  function renumber(){
    document.querySelectorAll('#inlinePartRows .inline-part-card').forEach((article,index)=>{
      article.querySelector('.inline-part-top strong').textContent='Part '+(index+1);
    });
  }
  function mount(target,motor,savedParts,money){
    cleanup();sequence=0;
    const existing=(motor?savedParts.filter(x=>x.motorcycle_id===motor.id):[]);
    const existingHtml=existing.length?'<div class="inline-existing"><strong>'+existing.length+' part sudah tersimpan</strong>'+
      existing.map(p=>'<div class="inline-existing-row"><span>'+esc(p.name)+'</span><span>'+(p.sale_price==null?'Belum diisi':money(p.sale_price))+'</span><span class="status '+esc(p.status)+'">'+(p.status==='sold'?'Fix Terjual':p.status==='installed'?'Terpasang':'Belum Terjual')+'</span></div>').join('')+
      '</div>':'';
    target.insertAdjacentHTML('beforeend',
      '<section class="inline-parts-section" aria-label="Daftar part motor">'+
      '<div class="inline-parts-heading"><div><h3>List Part Motor</h3><p>Tambahkan part beserta foto, modal, harga jual, dan statusnya.</p></div>'+
      '<button class="btn primary small" id="addInlinePart" type="button">+ Tambah Part</button></div>'+
      existingHtml+'<div id="inlinePartRows" class="inline-part-rows"></div>'+
      '<div id="inlinePartsError" class="inline-parts-error" hidden role="alert"></div></section>');
    document.getElementById('addInlinePart').addEventListener('click',add);
  }
  function collect(){
    const rows=[...document.querySelectorAll('#inlinePartRows .inline-part-card')];
    return rows.map((article,i)=>{
      const field=s=>article.querySelector(s);
      const name=field('.inline-part-name').value.trim();
      let capital,price;
      try{
        capital=parseRupiah(field('.inline-part-capital').value,{required:true});
        price=parseRupiah(field('.inline-part-price').value);
      }catch{throw Error('Modal atau harga jual Part '+(i+1)+' belum valid.');}
      const status=field('.inline-part-status').value;
      const condition=field('.inline-part-condition').value;
      const photo=field('.inline-part-photo').files?.[0]||null;
      const idx=i+1;
      if(!name){field('.inline-part-name').focus();throw Error('Nama Part '+idx+' wajib diisi.')}
      if(!Number.isSafeInteger(capital)||capital<0)throw Error('Modal Part '+idx+' tidak valid.');
      if(price!==null&&(!Number.isSafeInteger(price)||price<0))throw Error('Harga jual Part '+idx+' tidak valid.');
      if(status==='sold'&&(price===null||price<=0)){field('.inline-part-price').focus();throw Error('Isi harga jual Part '+idx+' untuk Fix Terjual.')}
      if(photo&&(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>8388608||!photo.size))throw Error('Foto Part '+idx+' tidak valid.');
      return {article,photo,payload:{name,capital,sale_price:price,status,condition,notes:''}};
    });
  }
  return {mount,collect,cleanup};
}
