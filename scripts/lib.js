// Bantuan bersama untuk validate, crawl, terima, dan tolak.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const KATEGORI = ['alquran', 'hadis', 'nasihat-sahabat', 'nasihat-ulama', 'hikmah', 'peribahasa', 'kutipan-buku', 'kata-bijak', 'motivasi'];

const berkas = (dir, kat) => path.join(ROOT, dir, `${kat}.json`);
function baca(p, awal) {
  if (!fs.existsSync(p)) return awal;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}
const tulis = (p, isi) => fs.writeFileSync(p, JSON.stringify(isi, null, 2) + '\n');

const bacaData = (kat) => baca(berkas('data', kat), []);
const tulisData = (kat, isi) => tulis(berkas('data', kat), isi);
const bacaKandidat = (kat) => baca(berkas('kandidat', kat), []);
const tulisKandidat = (kat, isi) => tulis(berkas('kandidat', kat), isi);
const STATUS = path.join(ROOT, 'kandidat', '_status.json');
const DITOLAK = path.join(ROOT, 'kandidat', '_ditolak.json');

/** Bentuk pembanding: huruf kecil tanpa tanda baca, supaya beda kutip/spasi tidak lolos sebagai kutipan baru. */
const normal = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]/g, '');

// Tebakan tema dari kata kunci, yang cocok pertama menang. Hasilnya tetap ditinjau saat `terima`.
const kata = (...daftar) => new RegExp(`(?:^|[^a-z])(?:${daftar.join("|")})(?:lah|kah|nya|mu|ku)?(?![a-z])`, 'i');
const TEMA = [
  ['doa', kata('doa', 'berdoa', 'doaku', 'ya tuhanku', 'ya tuhan kami', 'mohonlah', 'memohon')],
  ['ibadah', kata('salat', 'salatnya', 'shalat', 'masjid', 'puasa', 'berpuasa', 'zakat', 'haji', 'zikir', 'berzikir', 'tasbih', 'bertasbih', 'ibadah', 'beribadah', 'sujud', 'bersuci', 'tobat', 'bertobat')],
  ['sabar', kata('sabar', 'bersabar', 'kesabaran', 'ujian', 'diuji', 'cobaan', 'musibah', 'kesulitan', 'kesusahan', 'sedih', 'bersedih', 'putus asa', 'derita', 'sakit', 'tabah')],
  ['syukur', kata('syukur', 'bersyukur', 'nikmat', 'karunia', 'anugerah')],
  ['belajar', kata('ilmu', 'berilmu', 'belajar', 'membaca', 'bacalah', 'buku', 'guru', 'murid', 'bertanya', 'berpikir', 'pengetahuan', 'sekolah', 'menulis', 'paham', 'memahami', 'akal', 'berakal')],
  ['waktu', kata('waktu', 'masa', 'hari ini', 'esok', 'besok', 'kemarin', 'umur', 'umurmu', 'usia', 'pagi', 'menunda')],
  ['sesama', kata('saudara', 'saudaramu', 'tetangga', 'orang lain', 'sesama', 'teman', 'sahabat', 'tolong', 'menolong', 'sedekah', 'bersedekah', 'maaf', 'memaafkan', 'silaturahmi', 'orang tua', 'ibu', 'ibumu', 'ayah', 'kasih sayang', 'menyayangi')],
  ['usaha', kata('kerja', 'bekerja', 'usaha', 'berusaha', 'bersungguh-sungguh', 'kesungguhan', 'tekun', 'gigih', 'langkah', 'berjuang', 'gagal', 'kegagalan', 'berhasil', 'sukses', 'mencoba', 'menyerah')],
  ['diri', kata('hati', 'hatimu', 'diri', 'dirimu', 'jiwa', 'jujur', 'kejujuran', 'sombong', 'ikhlas', 'niat', 'akhlak', 'marah', 'lisan', 'takwa', 'bertakwa', 'sabar')],
];
const tebakTema = (teks) => (TEMA.find(([, re]) => re.test(teks)) || [null])[0];

/** Tanggal hari ini (WIB) sebagai YYYY-MM-DD. */
const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

module.exports = { ROOT, KATEGORI, baca, tulis, bacaData, tulisData, bacaKandidat, tulisKandidat, STATUS, DITOLAK, normal, tebakTema, hariIni };
