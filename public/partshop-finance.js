// Pure finance projections for Second Partshop. Never writes or changes inventory data.
const num=x=>{const v=Number(x??0);return Number.isFinite(v)&&v>=0?v:0};
const quote=x=>{if(x===null||x===undefined||x==='')return null;const v=Number(x);return Number.isFinite(v)&&v>0?v:null};
export function calculatePartshopFinancials(motors=[],parts=[]){
  const rows=motors.map(m=>{
    const owned=parts.filter(p=>p.motorcycle_id===m.id);
    const quotedParts=owned.filter(p=>quote(p.sale_price)!==null);
    const soldParts=owned.filter(p=>p.status==='sold');
    const motorTarget=quote(m.sale_price);
    const partsTarget=quotedParts.reduce((n,p)=>n+num(p.sale_price),0);
    const motorCost=num(m.capital);
    const addedPartsCost=owned.reduce((n,p)=>n+num(p.capital),0);
    const invested=motorCost+addedPartsCost;
    return {
      id:m.id,name:m.name||'Motor tanpa nama',year:m.model_year??null,status:m.status,
      motorCost,addedPartsCost,invested,
      motorTarget,partsTarget,partsCount:owned.length,
      partPricesFilled:quotedParts.length,partPricesMissing:owned.length-quotedParts.length,
      soldPartsCount:soldParts.length,
      realizedMotor:m.status==='sold'?(motorTarget??0):0,
      realizedParts:soldParts.reduce((n,p)=>n+(quote(p.sale_price)??0),0),
      motorDifference:motorTarget===null?null:motorTarget-invested,
      partDifference:quotedParts.length===0?null:partsTarget-invested
    };
  });
  return {
    rows,motorCount:motors.length,partCount:parts.length,
    capitalMotor:motors.reduce((n,m)=>n+num(m.capital),0),
    capitalPart:parts.reduce((n,p)=>n+num(p.capital),0),
    totalInvested:motors.reduce((n,m)=>n+num(m.capital),0)+parts.reduce((n,p)=>n+num(p.capital),0),
    realizedSales:rows.reduce((n,r)=>n+r.realizedMotor+r.realizedParts,0)
  };
}
export function renderPartshopFinancials(summary,money,escapeHtml,selectedMotorId){
  const e=v=>escapeHtml(String(v??''));
  const cash=v=>e(money(v));
  const rows=summary.rows;
  const row=rows.find(r=>r.id===selectedMotorId)||rows.find(r=>r.status!=='sold')||rows[0]||null;
  const allMotorOptions=rows.map(r=>'<option value="'+e(r.id)+'"'+(row&&row.id===r.id?' selected':'')+'>'+e(r.name)+(r.year?' · '+e(r.year):'')+'</option>').join('');
  const selector=rows.length>1?
    '<label class="fin-v2-select-label" for="financeMotorPicker">Pilih motor yang dihitung<select id="financeMotorPicker">'+allMotorOptions+'</select></label>':
    '<span class="fin-v2-motor-label">'+(row?e(row.name)+(row.year?' · '+e(row.year):''):'Belum ada motor')+'</span>';
  if(!row){
    return '<div class="fin-v2"><div class="fin-v2-head"><div><span class="fin-v2-kicker">STARPOINT SECOND PARTSHOP</span><h1>Dashboard Keuangan</h1><p>Perbandingan hasil jual motor utuh dan sparepart.</p></div></div>'+
      '<section class="fin-v2-empty"><strong>Belum ada motor untuk dihitung.</strong><p>Tambahkan motor di menu List Motor dan masukkan harga jualnya.</p>'+
      '<button type="button" data-action="navigateMotor" class="fin-v2-button">Buka List Motor</button></section></div>';
  }
  const mark=(val,kind)=>val===null?'<span class="fin-v2-neutral">Belum diisi</span>':
    '<span class="fin-v2-diff '+(val<0?'fin-v2-negative':'fin-v2-positive')+'">'+(val<0?'−':'+')+cash(Math.abs(val))+'</span>';
  const scenario=(type,title,subtitle,total,completeness,totalItems,difference,isComplete)=>{
    const isParts=type==='parts';
    const countText=isParts?
      completeness+' dari '+totalItems+' harga sparepart terisi':
      completeness+' dari 1 harga jual motor terisi';
    const percent=totalItems?Math.round(100*completeness/totalItems):0;
    const noValue=!completeness;
    return '<article class="fin-v2-scenario fin-v2-'+type+'">'+
      '<div class="fin-v2-scenario-title"><span class="fin-v2-eyebrow">'+(isParts?'SKENARIO 02':'SKENARIO 01')+'</span><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+
      '<div class="fin-v2-price-caption">TOTAL NILAI JUAL</div><div class="fin-v2-price'+(noValue?' fin-v2-price-blank':'')+'">'+(noValue?'Belum diisi':cash(total))+'</div>'+
      '<div class="fin-v2-cost-row"><span>Modal motor + modal tambahan part</span><strong>'+cash(row.invested)+'</strong></div>'+
      '<div class="fin-v2-cost-row fin-v2-cost-strong"><span>'+(!isComplete?'Selisih sementara':'Potensi selisih bruto')+'</span><strong>'+mark(difference,type)+'</strong></div>'+
      '<div class="fin-v2-progress-head"><span>'+countText+'</span><b>'+percent+'%</b></div>'+
      '<div class="fin-v2-progress" role="progressbar" aria-label="Kelengkapan harga jual" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100"><span style="width:'+percent+'%"></span></div>'+
      '<p class="fin-v2-fine">'+(isComplete?'Semua harga pada skenario ini sudah terisi.':'Nilai belum final karena ada harga yang belum diisi.')+'</p>'+
      '<button type="button" data-action="'+(isParts?'navigateParts':'editMotor')+'"'+(isParts?'':' data-id="'+e(row.id)+'"')+' class="fin-v2-button">'+
       (isParts?'Edit Harga Sparepart':'Edit Harga Jual Motor')+' <span aria-hidden="true">›</span></button></article>';
  };
  const motorQuoted=row.motorTarget!==null;
  const partQuoted=row.partPricesFilled>0;
  const partsComplete=row.partsCount>0&&row.partPricesMissing===0;
  const motorComplete=motorQuoted;
  const gap=motorQuoted&&partQuoted?row.partsTarget-row.motorTarget:null;
  const gapLabel=gap===null?'Belum bisa dibandingkan':
    gap===0?'Kedua skenario bernilai sama':
    gap>0?'Nilai part lebih tinggi '+cash(gap):'Nilai motor utuh lebih tinggi '+cash(Math.abs(gap));
  const warning=!partsComplete?
    'Perbandingan masih sementara. '+row.partPricesMissing+' sparepart belum memiliki harga jual.':
    'Bandingkan kedua skenario sebagai alternatif, jangan jumlahkan keduanya.';
  const realized=row.realizedMotor+row.realizedParts;
  return '<div class="fin-v2">'+
    '<header class="fin-v2-head"><div><span class="fin-v2-kicker">STARPOINT SECOND PARTSHOP · KEUANGAN</span>'+
    '<h1>Dashboard Keuangan</h1><p>Simulasi pemasukan jika motor dijual utuh atau sparepart dijual terpisah.</p></div>'+
    '<div class="fin-v2-selector">'+selector+'</div></header>'+
    '<div class="fin-v2-summary">'+
      '<div class="fin-v2-stat"><span>MODAL TOTAL</span><strong>'+cash(row.invested)+'</strong><small>Motor '+cash(row.motorCost)+' · Part '+cash(row.addedPartsCost)+'</small></div>'+
      '<div class="fin-v2-stat"><span>JUAL MOTOR UTUH</span><strong>'+(motorQuoted?cash(row.motorTarget):'Belum diisi')+'</strong><small>Target harga jual motor</small></div>'+
      '<div class="fin-v2-stat"><span>JUAL SEMUA PART</span><strong>'+(partQuoted?cash(row.partsTarget):'Belum diisi')+'</strong><small>'+row.partPricesFilled+'/'+row.partsCount+' harga terisi</small></div>'+
      '<div class="fin-v2-stat"><span>PENJUALAN FIX</span><strong>'+cash(realized)+'</strong><small>'+row.soldPartsCount+' part dan '+(row.status==='sold'?'1':'0')+' motor terjual</small></div>'+
    '</div>'+
    '<div class="fin-v2-section-title"><div><span class="fin-v2-kicker">PERBANDINGAN 2 SKENARIO</span><h2>Jika Dijual, Hasilnya Berapa?</h2></div></div>'+
    '<div class="fin-v2-scenarios">'+
      scenario('motor','Jual Motor Utuh','Menggunakan harga jual motor yang kamu masukkan.',row.motorTarget??0,motorQuoted?1:0,1,row.motorDifference,motorComplete)+
      scenario('parts','Jual Semua Sparepart','Menjumlahkan harga jual setiap part ZX25.',row.partsTarget,row.partPricesFilled,row.partsCount,row.partDifference,partsComplete)+
    '</div>'+
    '<section class="fin-v2-comparison"><div><span class="fin-v2-kicker">PERBANDINGAN NILAI JUAL</span><h2>'+gapLabel+'</h2><p>'+warning+'</p></div>'+
    '<span class="fin-v2-comparison-chip">'+(partsComplete&&motorComplete?'Harga lengkap':'Estimasi sementara')+'</span></section>'+
    '<section class="fin-v2-bottom"><div><span class="fin-v2-kicker">STATUS PERHITUNGAN</span><h2>'+row.partsCount+' sparepart tercatat</h2><p>'+row.partPricesFilled+' sudah punya harga jual, '+row.partPricesMissing+' masih kosong. Seluruh nilai diperbarui otomatis setelah edit.</p></div>'+
    '<button type="button" data-action="navigateParts" class="fin-v2-button fin-v2-button-solid">Lihat &amp; Edit Sparepart <span aria-hidden="true">›</span></button></section>'+
    '<p class="fin-v2-disclaimer">Potensi selisih bruto bukan laba bersih. Belum memperhitungkan ongkir, biaya transaksi, servis, dan pajak. Skenario jual motor utuh dan jual seluruh part adalah alternatif; jangan menjumlahkan keduanya untuk unit yang sama.</p>'+
  '</div>';
}
