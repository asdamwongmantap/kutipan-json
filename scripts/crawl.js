#!/usr/bin/env node
/**
 * Crawler harian: mengambil kutipan baru dari sumber terbuka ke kandidat/ (BUKAN ke data/).
 * Kandidat ditinjau dulu lalu dipindahkan dengan `npm run terima` atau dibuang dengan `npm run tolak`.
 *
 * Sumber (dikerjakan bertahap; posisi terakhir disimpan di kandidat/_status.json):
 *  - equran.id        : terjemahan Kemenag per ayat, beberapa surah per hari
 *  - hadith-api       : terjemahan Indonesia 7 kitab hadis (fawazahmed0/hadith-api), matan dipotong dari sanad
 *  - id.wikiquote.org : kutipan tokoh, buku, dan peribahasa (CC BY-SA 4.0)
 *
 * Jumlah per hari bisa diatur lewat env: EQURAN_SURAT (4), HADIS_BAGIAN (2 per kitab), WIKIQUOTE_HALAMAN (50).
 * Jalankan: npm run crawl            (semua sumber)
 *           npm run crawl -- equran  (satu sumber saja: equran | hadis | wikiquote)
 */
const crypto = require('crypto');
const { KATEGORI, baca, tulis, bacaData, bacaKandidat, tulisKandidat, STATUS, DITOLAK, normal, tebakTema, hariIni } = require('./lib');

const UA = 'kutipan-json-crawler/1.0 (https://github.com/asdamwongmantap/kutipan-json)';
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
async function ambil(url) {
  for (let coba = 1; ; coba++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      await jeda(250);
      return json;
    } catch (e) {
      if (coba >= 3) throw new Error(`${url}: ${e.message}`);
      await jeda(2000 * coba);
    }
  }
}

const status = baca(STATUS, { equran: { surat: 1 }, hadis: {}, wikiquote: { lanjut: '' } });
const ditolak = new Set(baca(DITOLAK, []));
const kandidat = Object.fromEntries(KATEGORI.map((k) => [k, bacaKandidat(k)]));
const dikenalId = new Set(Object.values(kandidat).flat().map((k) => k.id));
const dikenalTeks = new Set([...KATEGORI.flatMap((k) => bacaData(k)), ...Object.values(kandidat).flat()].map((k) => normal(k.teks)));
const tambah = Object.fromEntries(KATEGORI.map((k) => [k, 0]));

function simpan(k) {
  const n = normal(k.teks);
  if (ditolak.has(k.id) || dikenalId.has(k.id) || dikenalTeks.has(n)) return;
  dikenalId.add(k.id);
  dikenalTeks.add(n);
  kandidat[k.kategori].push({ ...k, tema: tebakTema(k.teks), diambil: hariIni() });
  tambah[k.kategori]++;
}
const panjangPas = (s, min, max) => s.length >= min && s.length <= max;

// ---------- Al-Qur'an: equran.id ----------
async function equran() {
  const n = Number(process.env.EQURAN_SURAT || 4);
  for (let i = 0; i < n; i++) {
    const s = status.equran.surat;
    const { data } = await ambil(`https://equran.id/api/v2/surat/${s}`);
    for (const a of data.ayat) {
      const teks = a.teksIndonesia.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!panjangPas(teks, 25, 280)) continue;
      simpan({
        id: `eq-${s}-${a.nomorAyat}`, kategori: 'alquran', teks, penutur: null,
        rujukan: `QS. ${data.namaLatin}: ${a.nomorAyat}`, teks_asli: a.teksArab,
        sumber: 'equran.id', sumber_url: `https://equran.id/api/v2/surat/${s}`, lisensi: 'Terjemahan Kemenag RI',
      });
    }
    status.equran.surat = s >= 114 ? 1 : s + 1;
  }
}

// ---------- Hadis: fawazahmed0/hadith-api ----------
const KITAB = { bukhari: 'Bukhari', muslim: 'Muslim', abudawud: 'Abu Dawud', tirmidhi: 'Tirmidzi', nasai: "Nasa'i", ibnmajah: 'Ibnu Majah', malik: 'Malik' };
const HADIS_API = 'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1';

// Hadis hukum fikih yang teknis (bersuci, haid, talak, hudud, dsb.) sahih tetapi jarang cocok jadi kutipan harian.
const FIKIH = /(?:^|[^a-z])(wudlu|wudhu|wudu|junub|haid|nifas|istihadlah|mani|madzi|kencing|buang air|najis|bangkai|jima'|menggauli|kemaluan|talak|thalaq|iddah|rajam|cambuk|potong tangan|diyat|qishash|riba|budak|mahar|warisan|ruku'|tasyahud|takbiratul|tayamum|tayammum)(?![a-z])/i;

/** Potong sanad: ambil kalimat setelah "bersabda:" pertama. Hanya sabda Nabi yang diambil. */
function matan(teks) {
  const i = teks.search(/bersabda\s*:/i);
  if (i < 0) return null;
  return teks.slice(teks.indexOf(':', i) + 1)
    .replace(/\[([^\]]*)\]/g, '$1').replace(/\s+/g, ' ').trim()
    .replace(/^["“'‘\s]+/, '').replace(/["”'’\s]+$/, '').trim();
}
async function hadis() {
  const n = Number(process.env.HADIS_BAGIAN || 2);
  const info = await ambil(`${HADIS_API}/info.json`);
  for (const [kitab, nama] of Object.entries(KITAB)) {
    const bagian = Object.keys(info[kitab].metadata.sections).map(Number).filter((b) => b > 0).sort((a, b) => a - b);
    for (let i = 0; i < n; i++) {
      const pos = status.hadis[kitab] ?? 0;
      const b = bagian[pos % bagian.length];
      const isi = await ambil(`${HADIS_API}/editions/ind-${kitab}/sections/${b}.json`);
      for (const h of isi.hadiths) {
        const teks = h.text && matan(h.text);
        if (!teks || !panjangPas(teks, 20, 300) || FIKIH.test(teks)) continue;
        simpan({
          id: `hd-${kitab}-${h.hadithnumber}`.replace(/\./g, '-'), kategori: 'hadis', teks, penutur: 'Nabi Muhammad ﷺ',
          rujukan: `HR. ${nama} no. ${h.hadithnumber}`,
          sumber: 'hadith-api', sumber_url: `${HADIS_API}/editions/ind-${kitab}/${h.hadithnumber}.json`, lisensi: 'Unlicense (hadith-api)',
        });
      }
      status.hadis[kitab] = (pos + 1) % bagian.length;
    }
  }
}

// ---------- Wikiquote Indonesia ----------
const WQ = 'https://id.wikiquote.org/w/api.php';
const LEWATI_KATEGORI = /^(Film|Serial|Sinetron|Karakter|Anime|Manga|Kartun|Komik|Kota|Kabupaten|Provinsi|Negara|Acara|Lagu|Album|Permainan|Stasiun|Perusahaan|Organisasi|Disambiguasi|Hari)/i;
const LEWATI_BAGIAN = /tentang|mengenai|pranala|lihat|referensi|catatan|sumber|disalahatribusikan|diragukan|keliru|dialog|pemeran/i;
const KATA_INDONESIA = /\b(yang|dan|di|ke|dari|untuk|dengan|tidak|adalah|itu|ini|kita|kami|aku|saya|kamu|akan|dalam|pada|bukan|jika|karena|orang|harus|bisa)\b/gi;
const indonesia = (s) => (s.match(KATA_INDONESIA) || []).length >= 2;
function bersihkan(s) {
  return s
    .replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[(?:Berkas|File|Gambar|Kategori):[^\]]*\]\]/gi, '')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/\[https?:\/\/\S+\s+([^\]]*)\]/g, '$1').replace(/\[https?:\/\/[^\]]*\]/g, '')
    .replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
    .replace(/^["“„]+/, '').replace(/["”]+[.]?$/, (m) => (m.endsWith('.') ? '.' : '')).trim();
}
function jenisHalaman(judul, kategori) {
  // Halaman tanggal/tahun ("25 Desember", "2001") berisi kutipan banyak orang; penuturnya tidak bisa dipastikan.
  if (/^\d/.test(judul)) return null;
  if (/^Peribahasa/i.test(judul)) return { kategori: 'peribahasa', penutur: judul, rujukan: null };
  if (kategori.some((k) => LEWATI_KATEGORI.test(k) || /anime|manga|light novel|video game|fiksi/i.test(k))) return null;
  if (kategori.some((k) => /Buku|Novel|Kitab/i.test(k))) return { kategori: 'kutipan-buku', penutur: null, rujukan: judul };
  if (kategori.some((k) => /Sahabat Nabi/i.test(k))) return { kategori: 'nasihat-sahabat', penutur: judul };
  if (kategori.some((k) => /Ulama|Ahli fikih|Mufasir|Kiai/i.test(k))) return { kategori: 'nasihat-ulama', penutur: judul };
  return { kategori: 'kata-bijak', penutur: judul };
}
async function wikiquote() {
  const n = Number(process.env.WIKIQUOTE_HALAMAN || 50);
  let sisa = n;
  while (sisa > 0) {
    const batas = Math.min(sisa, 25);
    const q = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', generator: 'allpages', gapnamespace: '0', gapfilterredir: 'nonredirects',
      gaplimit: String(batas), prop: 'revisions|categories', rvprop: 'content', rvslots: 'main', cllimit: 'max', clshow: '!hidden',
    });
    if (status.wikiquote.lanjut) q.set('gapcontinue', status.wikiquote.lanjut);
    const res = await ambil(`${WQ}?${q}`);
    for (const hal of res.query?.pages ?? []) {
      const kat = (hal.categories ?? []).map((c) => c.title.replace(/^Kategori:/, ''));
      const jenis = jenisHalaman(hal.title, kat);
      const isi = hal.revisions?.[0]?.slots?.main?.content;
      if (!jenis || !isi) continue;
      const url = `https://id.wikiquote.org/wiki/${encodeURIComponent(hal.title.replace(/ /g, '_'))}`;
      let bagian = '';
      const baris = isi.split('\n');
      for (let i = 0; i < baris.length; i++) {
        const judul = baris[i].match(/^=+\s*(.*?)\s*=+\s*$/);
        if (judul) { bagian = judul[1]; continue; }
        const m = baris[i].match(/^\*(?!\*)\s*(.+)/);
        if (!m || LEWATI_BAGIAN.test(bagian)) continue;
        let teks = bersihkan(m[1]);
        const anak = [];
        for (let j = i + 1; j < baris.length && /^\*\*/.test(baris[j]); j++) anak.push(bersihkan(baris[j].replace(/^\*+\s*/, '')));
        // Kutipan berbahasa asing biasanya diikuti terjemahannya di baris anak.
        if (!indonesia(teks) && anak[0] && indonesia(anak[0])) teks = anak.shift();
        if (!indonesia(teks) || !panjangPas(teks, 15, 320)) continue;
        const rujukan = jenis.rujukan ?? (anak[0] ? anak[0].slice(0, 200) : null);
        const hash = crypto.createHash('sha1').update(normal(teks)).digest('hex').slice(0, 8);
        const slug = normal(hal.title).slice(0, 40) || 'halaman';
        simpan({
          id: `wq-${slug}-${hash}`, kategori: jenis.kategori, teks, penutur: jenis.penutur ?? null, rujukan: rujukan || null,
          sumber: 'id.wikiquote.org', sumber_url: url, lisensi: 'CC BY-SA 4.0',
        });
      }
    }
    sisa -= batas;
    status.wikiquote.lanjut = res.continue?.gapcontinue ?? '';
    if (!status.wikiquote.lanjut) break; // sudah sampai akhir; putaran berikutnya mulai dari awal lagi
  }
}

(async () => {
  const pilih = process.argv[2];
  const SUMBER = { equran, hadis, wikiquote };
  const gagal = [];
  for (const [nama, fn] of Object.entries(SUMBER)) {
    if (pilih && pilih !== nama) continue;
    try { await fn(); } catch (e) { gagal.push(`${nama}: ${e.message}`); }
  }
  for (const k of KATEGORI) tulisKandidat(k, kandidat[k]);
  status.terakhir = hariIni();
  tulis(STATUS, status);
  console.log('Kandidat baru:', Object.entries(tambah).filter(([, n]) => n).map(([k, n]) => `${k} +${n}`).join(', ') || 'tidak ada');
  if (gagal.length) { console.error('Sumber yang gagal:\n  ' + gagal.join('\n  ')); process.exitCode = 1; }
})();
