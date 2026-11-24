const numberFormatter=new Intl.NumberFormat('id-ID',{maximumFractionDigits:0});

export function formatRupiah(value){
  if(value===null||value===undefined||value==='')return '';
  const digits=String(value).replace(/[^0-9]/g,'');
  if(!digits)return '';
  const amount=Number(digits);
  if(!Number.isSafeInteger(amount))return '';
  return 'Rp '+numberFormatter.format(amount);
}

export function parseRupiah(value,{required=false}={}){
  const digits=String(value??'').replace(/[^0-9]/g,'');
  if(!digits){
    if(required)throw Error('Isi nominal rupiah terlebih dahulu.');
    return null;
  }
  const amount=Number(digits);
  if(!Number.isSafeInteger(amount)||amount>999999999999999)
    throw Error('Nominal rupiah terlalu besar.');
  return amount;
}

export function bindRupiahInputs(root){
  if(!root)return;
  for(const input of root.querySelectorAll('input[data-rupiah]')){
    if(input.dataset.rupiahBound==='true')continue;
    input.dataset.rupiahBound='true';
    input.type='text';
    input.inputMode='numeric';
    input.autocomplete='off';
    const onInput=()=>{
      const original=input.value;
      const before=original.slice(0,input.selectionStart??original.length).replace(/\D/g,'').length;
      const formatted=formatRupiah(original);
      if(formatted===original)return;
      input.value=formatted;
      if(document.activeElement===input&&typeof input.setSelectionRange==='function'){
        let position=formatted.length;
        if(before===0)position=formatted?Math.min(3,formatted.length):0;
        else {
          let seen=0;
          for(let i=0;i<formatted.length;i++){
            if(/[0-9]/.test(formatted[i]))seen++;
            if(seen>=before){position=i+1;break}
          }
        }
        input.setSelectionRange(position,position);
      }
    };
    input.addEventListener('input',onInput);
    input.addEventListener('blur',()=>{input.value=formatRupiah(input.value)});
    input.value=formatRupiah(input.value);
  }
}
