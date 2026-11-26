// Financial projections for Second Partshop. Pure calculation, never modifies inventory.
const amount=value=>{
  const n=Number(value??0);
  return Number.isFinite(n)&&n>=0?n:0;
};
const target=value=>{
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);
  return Number.isFinite(n)&&n>0?n:null;
};
export function calculatePartshopFinancials(motors=[],parts=[]){
  const rows=motors.map(m=>{
    const related=parts.filter(p=>p.motorcycle_id===m.id);
    const targetMotor=target(m.sale_price);
    const pricedParts=related.filter(p=>target(p.sale_price)!==null);
    const partRevenue=pricedParts.reduce((t,p)=>t+target(p.sale_price),0);
    const motorCapital=amount(m.capital);
    const partsCapital=related.reduce((t,p)=>t+amount(p.capital),0);
    const soldParts=related.filter(p=>p.status==='sold');
    return {
      id:m.id,name:m.name||'Motor tanpa nama',year:m.model_year||null,status:m.status,
      motorCapital,partsCapital,totalCapital:motorCapital+partsCapital,
      targetMotor,partRevenue,
      partsCount:related.length,partsPriced:pricedParts.length,
      missingParts:related.length-pricedParts.length,
      soldPartRevenue:soldParts.reduce((t,p)=>t+(target(p.sale_price)||0),0),
      soldPartCount:soldParts.length,
      realizedMotor:m.status==='sold'?(targetMotor||0):0
    };
  });
  const recordedMotorIds=new Set(motors.map(m=>m.id));
  const orphanParts=parts.filter(p=>!recordedMotorIds.has(p.motorcycle_id));
  const motorCapital=motors.reduce((t,m)=>t+amount(m.capital),0);
  const partCapital=parts.reduce((t,p)=>t+amount(p.capital),0);
  const pricedMotors=motors.filter(m=>target(m.sale_price)!==null);
  const pricedParts=parts.filter(p=>target(p.sale_price)!==null);
  const motorRevenue=pricedMotors.reduce((t,m)=>t+target(m.sale_price),0);
  const partsRevenue=pricedParts.reduce((t,p)=>t+target(p.sale_price),0);
  const soldMotorRevenue=motors.filter(m=>m.status==='sold').reduce((t,m)=>t+(target(m.sale_price)||0),0);
  const soldPartsRevenue=parts.filter(p=>p.status==='sold').reduce((t,p)=>t+(target(p.sale_price)||0),0);
  const motorComplete=motors.length>0&&pricedMotors.length===motors.length;
  const partComplete=parts.length>0&&pricedParts.length===parts.length;
  return {
    rows,orphanPartCount:orphanParts.length,
    motorCount:motors.length,partCount:parts.length,
    activeMotorCount:motors.filter(m=>m.status!=='sold').length,
    soldMotorCount:motors.filter(m=>m.status==='sold').length,
    pricedMotorCount:pricedMotors.length,pricedPartCount:pricedParts.length,
    missingMotorCount:motors.length-pricedMotors.length,
    missingPartCount:parts.length-pricedParts.length,
    motorCapital,partCapital,totalCapital:motorCapital+partCapital,
    motorRevenue,partsRevenue,combinedKnownRevenue:motorRevenue+partsRevenue,
    soldMotorRevenue,soldPartsRevenue,actualRevenue:soldMotorRevenue+soldPartsRevenue,
    motorComplete,partComplete,
    combinedComplete:motorComplete&&partComplete,
    combinedDifference:motorComplete&&partComplete?motorRevenue+partsRevenue-motorCapital-partCapital:null,
  };
}

export function renderPartshopFinancials(model,money,esc){
  const e=v=>esc(String(v??''));
  const price=(v,known)=>known?e(money(v)):'Belum diisi';
  const pricedLabel=(done,total,unit)=>total===0?'Belum ada '+unit:done+' dari '+total+' '+unit+' sudah punya harga jual';
  const pct=(done,total)=>total>0?Math.min(100,Math.max(0,Math.round(100*done/total))):0;
  const financialCard=(label,value,footnote,mark='')=>
    '<article class="finance-kpi'+(mark?' finance-kpi-'+mark:'')+'"><div class="finance-kpi-label">'+label+'</div><strong>'+value+'</strong><p>'+footnote+'</p></article>';
  const scenario=(title,sub,value,done,total,summary,kind)=>{
    const complete=total>0&&done===total;
    const progress=pct(done,total);
    return '<article class="finance-scenario finance-scenario-'+kind+'">'+
      '<div class="finance-scenario-heading"><div class="finance-eyebrow">SKENARIO PENJUALAN</div><h3>'+title+'</h3><p>'+sub+'</p></div>'+
      '<div class="finance-scenario-value'+(done===0?' finance-blank':'')+'">'+value+'</div>'+
      '<div class="finance-scenario-coverage"><span>'+e(summary)+'</span><b>'+progress+'%</b></div>'+
      '<div class="finance-progress" role="progressbar" aria-valuenow="'+progress+'" aria-valuemin="0" aria-valuemax="100" aria-label="Kelengkapan harga jual"><span style="width:'+progress+'%"></span></div>'+
      '<div class="finance-scenario-foot">'+(complete?'Harga jual seluruh item sudah diisi.':'Total ini belum merupakan estimasi akhir karena masih ada harga kosong.')+'</div>'+
      '<button type="button" class="finance-edit-link" data-action="'+(kind==='parts'?'navigateParts':'navigateMotor')+'">'+(kind==='parts'?'Isi / edit harga sparepart':'Isi / edit harga jual motor')+' <span aria-hidden="true">›</span></button>'+
    '</article>';
  };
  const motorRows=model.rows.map(m=>{
    const motorTarget=m.targetMotor===null?'Belum diisi':e(money(m.targetMotor));
    const priceParts=m.partsPriced===0?'Belum diisi':e(money(m.partRevenue));
    return '<div class="finance-motor-row">'+
      '<div class="finance-motor-name"><strong>'+e(m.name)+'</strong><span>'+e(m.year||'Tahun belum diisi')+' · '+(m.status==='sold'?'Terjual':'Belum Terjual')+'</span></div>'+
      '<div class="finance-metric"><small>Modal Motor</small><b>'+e(money(m.motorCapital))+'</b></div>'+
      '<div class="finance-metric"><small>Harga Jual Motor</small><b'+(m.targetMotor===null?' class="finance-muted"':'')+'>'+motorTarget+'</b></div>'+
      '<div class="finance-metric"><small>Harga Semua Part Terisi</small><b'+(m.partsPriced===0?' class="finance-muted"':'')+'>'+priceParts+'</b><span>'+m.partsPriced+'/'+m.partsCount+' harga part</span></div>'+
      '<button type="button" class="finance-edit-motor" data-action="editMotor" data-id="'+e(m.id)+'">Edit Motor</button>'+
    '</div>';
  }).join('');
  return '<div class="finance-page">'+
    '<header class="finance-heading"><div class="finance-eyebrow">SECOND PARTSHOP · KEUANGAN</div><h1>Ringkasan &amp; Proyeksi Penjualan</h1>'+
      '<p>Perhitungan otomatis dari modal dan harga jual yang kamu isi. Semua angka mengikuti data yang tersimpan, tanpa perkiraan harga buatan.</p></header>'+
    '<div class="finance-kpi-grid">'+
      financialCard('Total Modal Tercatat',e(money(model.totalCapital)),'Motor '+e(money(model.motorCapital))+' · Sparepart '+e(money(model.partCapital)),'capital')+
      financialCard('Target Jual Motor',price(model.motorRevenue,model.pricedMotorCount>0),pricedLabel(model.pricedMotorCount,model.motorCount,'motor'),'motor')+
      financialCard('Target Jual Semua Part',price(model.partsRevenue,model.pricedPartCount>0),pricedLabel(model.pricedPartCount,model.partCount,'sparepart'),'parts')+
      financialCard('Penjualan Sudah Fix',e(money(model.actualRevenue)),'Motor terjual '+e(money(model.soldMotorRevenue))+' · Part terjual '+e(money(model.soldPartsRevenue)),'realized')+
    '</div>'+
    '<div class="finance-scenarios">'+
      scenario('Jika Motor Terjual','Total nilai jual motor, sesuai harga target atau transaksi yang dicatat.',price(model.motorRevenue,model.pricedMotorCount>0),model.pricedMotorCount,model.motorCount,pricedLabel(model.pricedMotorCount,model.motorCount,'motor'),'motor')+
      scenario('Jika Semua Sparepart Terjual','Akumulasi harga jual seluruh sparepart, termasuk yang masih terpasang.',price(model.partsRevenue,model.pricedPartCount>0),model.pricedPartCount,model.partCount,pricedLabel(model.pricedPartCount,model.partCount,'sparepart'),'parts')+
    '</div>'+
    '<section class="finance-combined">'+
      '<div><div class="finance-eyebrow">SIMULASI GABUNGAN</div><h3>Motor + Sparepart</h3>'+
      '<p>Akumulasi harga yang sudah diisi, bukan omzet pasti atau laba bersih. Jangan hitung dua kali sparepart yang sudah termasuk dalam harga jual motor.</p></div>'+
      '<div class="finance-combined-value"><strong>'+price(model.combinedKnownRevenue,model.pricedMotorCount+model.pricedPartCount>0)+'</strong>'+
      '<span>'+(model.combinedComplete?'Semua harga sudah terisi':'Masih ada '+(model.missingMotorCount+model.missingPartCount)+' harga belum diisi')+'</span></div>'+
    '</section>'+
    '<section class="finance-breakdown"><div class="finance-breakdown-head"><div><div class="finance-eyebrow">PER MOTOR</div><h3>Perbandingan Nilai Penjualan</h3></div><span>'+model.motorCount+' motor tercatat</span></div>'+
      (model.rows.length?motorRows:'<div class="finance-no-data">Belum ada motor yang tercatat. Tambahkan melalui menu List Motor.</div>')+
    '</section>'+
    '<p class="finance-disclaimer">Angka proyeksi belum memperhitungkan biaya transaksi, servis, ongkir, pajak, dan perubahan harga. Modal sparepart tambahan dihitung terpisah; jangan memasukkannya dua kali apabila sudah termasuk modal pembelian motor.</p>'+
  '</div>';
}
