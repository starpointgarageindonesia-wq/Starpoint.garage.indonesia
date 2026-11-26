// Daftar 44 sparepart ditranskripsi dari gambar ZX-25R yang disediakan pengguna.
// Harga, foto, dan status tidak ditebak; setiap item baru disimpan dengan modal 0,
// harga jual null, foto kosong, status Belum Terjual dan bisa diedit.
export const ZX25_IMPORT_NAMES=Object.freeze([
  "Velg Depan OZ Racing",
  "Velg Belakang OZ Racing",
  "Ban Depan Michelin Power GP2 120/70 ZR17",
  "Ban Belakang Michelin Power GP2 160/60 ZR17",
  "Cakram Depan Kanan WR3 Floating",
  "Cakram Depan Kiri WR3 Floating",
  "Bracket Footstep WR3 Kanan",
  "Bracket Footstep WR3 Kiri",
  "Bracket Kaliper Belakang Kendmoto",
  "Footstep Underbone Kendmoto",
  "Selang Radiator Silicone Kendmoto",
  "Master Kopling Accossato Racing",
  "Kaliper Rem Depan Kanan Brembo GP4 RS",
  "Kaliper Rem Depan Kiri Brembo GP4 RS",
  "Kaliper Rem Belakang Brembo 2P",
  "Master Rem Depan Brembo 17 RCS Corsa Corta",
  "Tabung Minyak Rem Brembo",
  "Headlamp Dual Projector LED",
  "Spakbor Depan Carbon KABON",
  "Stoplamp Belakang LED Smoke",
  "Shockbreaker Belakang Öhlins Tabung",
  "Selang Rem Depan Kanan HEL Performance",
  "Selang Rem Depan Kiri HEL Performance",
  "Selang Rem Belakang HEL Performance",
  "Cover Side Tail Carbon KABON Kanan",
  "Cover Side Tail Carbon KABON Kiri",
  "Cover Knalpot Carbon KABON",
  "Cover Panel Samping Carbon KABON",
  "Cover Buntut Belakang Carbon KABON",
  "Cover Plastik Inner Fairing Hitam",
  "Cover Headlamp Depan Carbon KABON",
  "Bracket Plat Nomor Belakang NASSERT-BEET",
  "Undercowl Carbon KABON Yoshimura",
  "Standar Samping Racing Adjustable",
  "Segitiga Atas Kendmoto",
  "Cover Jok Belakang Single Seat Cowl ZX-25R",
  "Stabilizer Stang RENDER Racing",
  "Bracket Stabilizer Stang NASSERT-BEET Kanan",
  "Bracket Stabilizer Stang NASSERT-BEET Kiri",
  "Handguard Carbon KABON Kanan",
  "Handguard Carbon KABON Kiri",
  "Frame Slider WR3 Kanan",
  "Frame Slider WR3 Kiri",
  "Knalpot Full System Yoshimura Hepta Force TSS"
]);
export const ZX25_IMPORT_VERSION="zx25-list-foto-v1-20261126";
export function normalizeZX25Name(value){
  return String(value??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
export function findZX25Motor(motors){
  const eligible=motors.filter(m=>/\bzx[\s-]*25(?:rr?)?\b/i.test(String(m.name??"")));
  if(eligible.length===1)return eligible[0];
  if(eligible.length>1){
    const exact=eligible.filter(m=>/^zx[\s-]*25(?:rr?)?$/i.test(String(m.name??"").trim()));
    if(exact.length===1)return exact[0];
  }
  return null;
}
export function missingZX25Names(motor,parts){
  if(!motor)return [];
  const known=new Set(parts.filter(p=>p.motorcycle_id===motor.id).map(p=>normalizeZX25Name(p.name)));
  return ZX25_IMPORT_NAMES.filter(name=>!known.has(normalizeZX25Name(name)));
}
