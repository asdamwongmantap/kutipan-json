// Seluruh kutipan terkurasi (data/), dikelompokkan per kategori. Kandidat hasil crawl tidak ikut.
// Untuk bundle yang lebih kecil, impor berkas kategori langsung: require('kutipan-json/data/hadis.json').
const KATEGORI = ['alquran', 'hadis', 'nasihat-sahabat', 'nasihat-ulama', 'hikmah', 'peribahasa', 'kutipan-buku', 'kata-bijak', 'motivasi'];
const KATEGORI_RELIGIUS = ['alquran', 'hadis', 'nasihat-sahabat', 'nasihat-ulama'];
const perKategori = Object.fromEntries(KATEGORI.map((k) => [k, require(`./data/${k}.json`)]));

module.exports = { KATEGORI, KATEGORI_RELIGIUS, perKategori, semua: KATEGORI.flatMap((k) => perKategori[k]) };
