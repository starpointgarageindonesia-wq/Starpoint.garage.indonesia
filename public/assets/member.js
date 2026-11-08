'use strict';
const SUPABASE_ORIGIN='https://msvdxyicostwztisvbvl.supabase.co';
const PUBLIC_CLIENT_KEY='sb_publishable_ihIG0dcPUHF9egWHaRlfvQ_E_Bn8zBk';
const AUTH_ENDPOINT=SUPABASE_ORIGIN+'/functions/v1/member-auth';
const $=id=>document.getElementById(id);
const messages={
 INVALID_USERNAME:'Username hanya boleh terdiri dari 4 sampai 24 huruf, angka, titik, atau garis bawah.',
 INVALID_EMAIL:'Masukkan alamat email yang valid.', PHONE_REQUIRED:'Nomor WhatsApp wajib diisi.',
 INVALID_PHONE:'Format nomor WhatsApp tidak valid.',WEAK_PASSWORD:'Password minimal 8 karakter dan mengandung huruf serta angka.',
 USERNAME_TAKEN:'Username sudah dipakai akun lain. Silakan gunakan username berbeda.',
 EMAIL_TAKEN:'Email sudah terdaftar. Silakan masuk menggunakan akun yang ada.',
 PHONE_TAKEN:'Nomor WhatsApp sudah terhubung ke akun lain.',
 INVALID_CREDENTIALS:'Username/email atau password salah.',ACCOUNT_INACTIVE:'Akun member sedang tidak aktif. Hubungi admin.',
 TOO_MANY_REQUESTS:'Terlalu banyak percobaan. Silakan coba lagi nanti.',
 REGISTER_FAILED:'Pendaftaran belum berhasil. Periksa data lalu coba lagi.',
 REGISTER_UNAVAILABLE:'Pendaftaran sementara tidak tersedia. Coba lagi nanti.',
 LOOKUP_FAILED:'Username belum dapat diperiksa. Coba lagi nanti.',
 PHONE_LINK_FAILED:'Nomor WhatsApp belum dapat dihubungkan. Periksa nomornya lalu coba lagi.',
 SECURITY_CHECK_UNAVAILABLE:'Pemeriksaan keamanan sedang bermasalah. Coba lagi nanti.',
 SESSION_CREATE_FAILED:'Akun mungkin sudah terdaftar, tetapi login otomatis gagal. Coba masuk dengan akun yang dibuat.',
 REGISTRATION_INCOMPLETE:'Akun terbentuk tetapi profil belum siap. Hubungi Starpoint Garage.',
 EMAIL_RATE_LIMITED:'Terlalu banyak permintaan email. Silakan coba lagi nanti.',
 INVALID_JSON:'Terjadi masalah pada permintaan. Coba kembali.', SERVER_NOT_CONFIGURED:'Sistem pendaftaran belum siap. Hubungi admin.',
 ORIGIN_NOT_ALLOWED:'Koneksi ke layanan member tidak diizinkan.',UNKNOWN_ACTION:'Permintaan tidak dikenali.'
};
function notice(message,good=false){const n=$('authNotice');n.hidden=false;n.textContent=message;n.classList.toggle('good',good)}
function clearNotice(){$('authNotice').hidden=true;$('authNotice').textContent=''}
function setBusy(button,busy,label){button.disabled=busy;button.textContent=busy?'MENGHUBUNGKAN KE SERVER…':label}
function setMode(mode){
 const register=mode!=='login';
 $('tabRegister').setAttribute('aria-selected',String(register));
 $('tabLogin').setAttribute('aria-selected',String(!register));
 $('tabRegister').tabIndex=register?0:-1;$('tabLogin').tabIndex=register?-1:0;
 $('registerPanel').hidden=!register;$('loginPanel').hidden=register;
 $('formHeading').textContent=register?'BUAT AKUN MEMBER':'MASUK MEMBER';
 $('formHint').textContent=register?'Daftar gratis untuk mendapatkan identitas member Starpoint Garage.':'Masuk menggunakan akun yang sama seperti di aplikasi Starpoint Garage Member.';
 $('forgotPanel').hidden=true;clearNotice();
 const url=new URL(location.href);url.searchParams.set('mode',register?'daftar':'masuk');history.replaceState(null,'',url.pathname+url.search);
}
function showMember(member,wasCreated){
 $('authContent').hidden=true;$('successPanel').hidden=false;clearNotice();
 $('successTag').textContent=wasCreated?'✓ Pendaftaran berhasil':'✓ Login berhasil';
 $('successHeading').textContent=wasCreated?'SELAMAT DATANG, RIDER.':'WELCOME BACK, RIDER.';
 $('successText').textContent=wasCreated?'Akun Starpoint Garage Member berhasil dibuat dan tersimpan di sistem yang sama dengan aplikasi.':'Akun member berhasil diverifikasi.';
 $('memberCode').textContent=String(member.member_code||'Belum tersedia');
 $('memberUsername').textContent=String(member.username||'Belum tersedia');
 $('memberStatus').textContent=member.status==='active'?'Aktif':'Hubungi admin';
 // Access and refresh tokens returned by member-auth are intentionally never persisted or placed in URLs.
 window.scrollTo({top:0,behavior:'smooth'});
}
async function send(action,payload){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await fetch(AUTH_ENDPOINT,{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':'application/json','apikey':PUBLIC_CLIENT_KEY},body:JSON.stringify({action,...payload}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
  let data;try{data=await response.json()}catch{throw Error('INVALID_RESPONSE')}
  if(!response.ok||!data?.ok){const code=String(data?.error||'UNKNOWN_ERROR');throw Error(messages[code]||'Permintaan belum berhasil. Silakan coba lagi.')}
  return data;
 }catch(e){
   if(e.name==='AbortError')throw Error('Koneksi terlalu lama. Periksa internet dan coba lagi.');
   if(e.name==='TypeError')throw Error('Tidak dapat terhubung ke server member. Periksa internet dan coba lagi.');
   if(e.message==='INVALID_RESPONSE')throw Error('Respons server belum dapat dibaca. Coba lagi.');
   throw e;
 }finally{clearTimeout(timeout)}
}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
$('registerForm').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;clearNotice();
 const username=$('regUsername').value.trim().toLowerCase(),email=$('regEmail').value.trim().toLowerCase(),phone=$('regPhone').value.trim(),password=$('regPassword').value,confirm=$('regConfirm').value;
 if(!/^[a-z0-9._]{4,24}$/.test(username)){notice(messages.INVALID_USERNAME);return}
 if(!/^\+?[0-9][0-9\s-]{7,18}$/.test(phone)){notice(messages.INVALID_PHONE);return}
 if(password.length<8||password.length>128||!/[a-z]/i.test(password)||!/\d/.test(password)){notice(messages.WEAK_PASSWORD);return}
 if(password!==confirm){notice('Konfirmasi password belum sama.');return}
 const b=$('regSubmit');setBusy(b,true,'BUAT AKUN MEMBER ');
 try{const data=await send('register',{username,email,phone,password});form.reset();showMember(data.member||{},true)}
 catch(e){notice(e.message||'Pendaftaran gagal. Silakan coba lagi.')}
 finally{setBusy(b,false,'BUAT AKUN MEMBER ')}
});
$('loginForm').addEventListener('submit',async event=>{
 event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;clearNotice();
 const username=$('loginUser').value.trim(),password=$('loginPassword').value;
 const b=$('loginSubmit');setBusy(b,true,'MASUK MEMBER ');
 try{const data=await send('login',{username,password});$('loginPassword').value='';showMember(data.member||{},false)}
 catch(e){notice(e.message||'Login gagal. Silakan coba lagi.')}
 finally{setBusy(b,false,'MASUK MEMBER ')}
});
$('forgotOpen').addEventListener('click',()=>{$('forgotPanel').hidden=!$('forgotPanel').hidden;clearNotice();if(!$('forgotPanel').hidden)$('forgotEmail').focus()});
$('forgotForm').addEventListener('submit',async event=>{
 event.preventDefault();if(!event.currentTarget.reportValidity())return;clearNotice();
 const b=$('forgotSubmit');setBusy(b,true,'KIRIM TAUTAN RESET ');
 try{await send('forgot_password',{email:$('forgotEmail').value.trim().toLowerCase()});notice('Jika email terdaftar, tautan reset password akan dikirim. Periksa Inbox dan Spam.',true)}
 catch(e){notice(e.message||'Tautan reset belum berhasil dikirim.')}
 finally{setBusy(b,false,'KIRIM TAUTAN RESET ')}
});
$('backToForm').addEventListener('click',()=>{$('successPanel').hidden=true;$('authContent').hidden=false;setMode('login')});
$('year').textContent=String(new Date().getFullYear());
setMode(new URLSearchParams(location.search).get('mode')==='masuk'?'login':'register');
