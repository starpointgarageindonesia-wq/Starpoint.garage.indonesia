'use strict';
const supabaseClient=window.supabase.createClient('https://msvdxyicostwztisvbvl.supabase.co','sb_publishable_ihIG0dcPUHF9egWHaRlfvQ_E_Bn8zBk',{auth:{detectSessionInUrl:true,flowType:'implicit',persistSession:false,autoRefreshToken:false}});
const get=id=>document.getElementById(id);
function showAlert(text){const note=get('resetNotice');note.hidden=false;note.textContent=text}
(async()=>{
 try{const {data,error}=await supabaseClient.auth.getSession();if(error||!data.session){get('resetIntro').textContent='Tautan reset belum terverifikasi.';showAlert('Gunakan tautan reset resmi dari email member.');return}get('resetIntro').textContent='Tautan berhasil diverifikasi. Masukkan password baru.';get('resetForm').hidden=false}
 catch(e){showAlert('Tidak bisa memverifikasi tautan. Silakan coba lagi.')}
})();
get('resetForm').addEventListener('submit',async event=>{
 event.preventDefault();
 const password=get('newPassword').value;
 if(password!==get('confirmPassword').value){showAlert('Konfirmasi password belum cocok.');return}
 if(password.length<8||!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){showAlert('Minimal 8 karakter, terdiri dari huruf dan angka.');return}
 const btn=get('resetSubmit');btn.disabled=true;
 try{const {error}=await supabaseClient.auth.updateUser({password});if(error)throw error;await supabaseClient.auth.signOut();get('resetForm').hidden=true;get('resetSuccess').hidden=false;get('resetIntro').textContent='Password berhasil diperbarui.';get('resetNotice').hidden=true}
 catch(e){showAlert('Password belum dapat diubah. Coba tautan reset baru.')}
 finally{btn.disabled=false}
});