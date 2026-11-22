#!/usr/bin/env node
/**
 * Pindahkan kandidat yang sudah ditinjau ke data/ (mendapat id tetap <kategori>-NNNN).
 *
 *   npm run terima -- eq-94-5 hd-bukhari-15         terima beberapa kandidat
 *   npm run terima -- eq-94-5 --tema=sabar           sekaligus tetapkan tema
 *   npm run terima -- wq-soekarno-1a2b3c4d --kategori=kata-bijak
 *   npm run terima -- --semua=peribahasa             terima SEMUA kandidat satu kategori (tinjau dulu!)
 *
 *   npm run terima -- wq-x-1a2b3c4d --religius=false   batalkan tanda religius otomatis
 *
 * Kalimat di kategori umum yang memuat istilah keagamaan otomatis diberi `religius: true`.
 * Kandidat tanpa tema (tebakan gagal) diberi tema "diri" bila --tema tidak diisi.
 */
const { KATEGORI, KATEGORI_RELIGIUS, RELIGIUS, bacaData, tulisData, bacaKandidat, tulisKandidat, normal } = require('./lib');

const opsi = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!ids.length && !opsi.semua) { console.error('Sebutkan id kandidat, atau --semua=<kategori>.'); process.exit(1); }
if (opsi.kategori && !KATEGORI.includes(opsi.kategori)) { console.error(`Kategori tidak dikenal: ${opsi.kategori}`); process.exit(1); }

const kandidat = Object.fromEntries(KATEGORI.map((k) => [k, bacaKandidat(k)]));
const data = Object.fromEntries(KATEGORI.map((k) => [k, bacaData(k)]));
const ada = new Set(Object.values(data).flat().map((k) => normal(k.teks)));
const pilih = opsi.semua ? [...kandidat[opsi.semua]] : ids.map((id) => Object.values(kandidat).flat().find((k) => k.id === id) || id);

let n = 0;
for (const k of pilih) {
  if (typeof k === 'string') { console.error(`Tidak ditemukan: ${k}`); continue; }
  kandidat[k.kategori] = kandidat[k.kategori].filter((x) => x.id !== k.id);
  if (ada.has(normal(k.teks))) { console.log(`Dilewati (sudah ada di data): ${k.id}`); continue; }
  const kat = opsi.kategori || k.kategori;
  const baru = {
    id: `${kat}-${String(data[kat].length + 1).padStart(4, '0')}`,
    teks: k.teks, kategori: kat, penutur: k.penutur, rujukan: k.rujukan, tema: opsi.tema || k.tema || 'diri',
  };
  if (opsi.religius === 'false') baru.religius = false;
  else if (opsi.religius === 'true' || (!KATEGORI_RELIGIUS.includes(kat) && RELIGIUS.test(k.teks))) baru.religius = true;
  if (k.teks_asli) baru.teks_asli = k.teks_asli;
  if (k.sumber_url) baru.sumber_url = k.sumber_url;
  if (k.lisensi) baru.lisensi = k.lisensi;
  data[kat].push(baru);
  ada.add(normal(k.teks));
  console.log(`${k.id} → ${baru.id}${baru.religius ? ' (religius)' : ''}`);
  n++;
}
for (const k of KATEGORI) { tulisData(k, data[k]); tulisKandidat(k, kandidat[k]); }
console.log(`${n} kutipan diterima.`);
