# kutipan-json

Dataset JSON kutipan berbahasa Indonesia: ayat Al-Qur'an, hadis, nasihat sahabat dan ulama, hikmah (mahfudzat), peribahasa, kutipan buku, kata bijak tokoh, dan kalimat motivasi. Dipakai oleh [Nawaitu](https://github.com/asdamwongmantap/nwaitu-web) (Kutipan Hari Ini) dan [MantapEdu](https://github.com/asdamwongmantap/mantapeduuiweb) (Motivasi Hari Ini).

*English summary below: [jump to English](#english).*

---

## Bahasa Indonesia

### Isi

Repo ini punya dua lapis data:

| Folder | Isi | Dipakai aplikasi? |
| --- | --- | --- |
| `data/` | Kutipan **terkurasi**: sudah dicek redaksi, atribusi, dan rujukannya | Ya |
| `kandidat/` | Hasil **crawl harian** dari sumber terbuka, belum ditinjau | Tidak (tidak ikut terpasang lewat npm) |

Satu berkas per kategori, di kedua folder:

| Berkas | Isi |
| --- | --- |
| `alquran.json` | Terjemahan makna ayat, dengan rujukan surah dan ayat |
| `hadis.json` | Sabda Nabi ﷺ, dengan perawi |
| `nasihat-sahabat.json` | Ucapan sahabat Nabi (Abu Bakar, Umar, Utsman, Ali, Ibnu Mas'ud, dll.) |
| `nasihat-ulama.json` | Nasihat ulama (Hasan Al-Bashri, Imam Syafi'i, Ibnul Qayyim, Al-Ghazali, Ibnu 'Athaillah, Buya Hamka, dll.) |
| `hikmah.json` | Mahfudzat dan pepatah Arab |
| `peribahasa.json` | Peribahasa Indonesia dan bangsa lain |
| `kutipan-buku.json` | Kutipan yang rujukannya buku atau karya tulis (Tao Te Ching, Meditations, Bumi Manusia, dll.) |
| `kata-bijak.json` | Ucapan tokoh dari pidato, surat, wawancara, atau yang masyhur tanpa rujukan buku |
| `motivasi.json` | Kalimat penyemangat orisinal yang ditulis untuk Nawaitu dan MantapEdu |

### Format

```json
{
  "id": "alquran-0001",
  "teks": "Maka sesungguhnya bersama kesulitan ada kemudahan. Sesungguhnya bersama kesulitan ada kemudahan.",
  "kategori": "alquran",
  "penutur": null,
  "rujukan": "QS. Al-Insyirah: 5–6",
  "tema": "sabar"
}
```

| Kolom | Keterangan |
| --- | --- |
| `id` | `<kategori>-NNNN`, berurutan. Id tidak pernah diubah atau dipakai ulang, jadi aman dijadikan kunci. |
| `teks` | Isi kutipan dalam bahasa Indonesia |
| `penutur` | Siapa yang mengucapkan atau menulis; `null` untuk ayat dan kalimat orisinal |
| `rujukan` | Surah dan ayat, perawi hadis, judul kitab atau buku, pidato; `null` bila tidak ada |
| `tema` | Salah satu dari `belajar`, `usaha`, `waktu`, `diri`, `sesama`, `sabar`, `syukur`, `ibadah`, `doa` |
| `religius` | *(opsional)* `true` untuk kalimat bernuansa keagamaan di kategori umum (motivasi, kata-bijak, kutipan-buku, peribahasa, hikmah), supaya aplikasi umum bisa melewatinya. Kategori `alquran`, `hadis`, dan `nasihat-*` selalu religius sehingga tidak memakai kolom ini. |
| `teks_asli` | *(opsional)* Teks bahasa asli, mis. teks Arab ayat |
| `catatan` | *(opsional)* Catatan atribusi, mis. "masyhur dinisbatkan kepada …, rujukan tertulisnya belum dipastikan" |
| `sumber_url`, `lisensi` | *(opsional)* Untuk butir yang diambil dari sumber daring |

Skema lengkap ada di `schema/kutipan.schema.json` (data) dan `schema/kandidat.schema.json` (kandidat).

### Cara memakai

Pasang sebagai dependency dari GitHub, dikunci ke tag rilis:

```bash
npm install github:asdamwongmantap/kutipan-json#v1.0.0
```

```ts
// Satu kategori saja (bundle lebih kecil)
import hadis from 'kutipan-json/data/hadis.json';

// Aplikasi umum: kategori umum tanpa kalimat religius
import motivasi from 'kutipan-json/data/motivasi.json';
const umum = motivasi.filter((k) => !k.religius);

// Semua kategori
import { perKategori, semua, type Kutipan } from 'kutipan-json';
```

Tanpa npm, berkas bisa diambil lewat CDN:

```
https://cdn.jsdelivr.net/gh/asdamwongmantap/kutipan-json@v1.0.0/data/alquran.json
```

### Crawl harian dan peninjauan

GitHub Actions (`.github/workflows/crawl.yml`) menjalankan `npm run crawl` setiap hari pukul 03.00 WIB. Sumbernya diambil bertahap, dan posisi terakhir disimpan di `kandidat/_status.json`:

| Sumber | Yang diambil | Per hari |
| --- | --- | --- |
| [equran.id](https://equran.id) | Terjemahan Kemenag per ayat (25–280 karakter), dengan teks Arab | 4 surah |
| [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) | Terjemahan Indonesia Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibnu Majah, Malik. Hanya sabda Nabi; sanad dipotong dan hadis hukum fikih teknis dilewati | 2 bab per kitab |
| [Wikiquote Indonesia](https://id.wikiquote.org) | Kutipan tokoh, buku, dan peribahasa. Bagian "tentang", "disalahatribusikan", halaman film, anime, dan tanggal dilewati | 50 halaman |

Setelah satu putaran selesai, sumber diulang dari awal untuk menangkap halaman baru. Kutipan yang sudah ada (di `data/`, `kandidat/`, atau pernah ditolak) tidak diambil lagi.

Hasil crawl **tidak langsung masuk ke `data/`**, karena ayat yang diambil acak belum tentu cocok sebagai kutipan, potongan matan hadis bisa terpotong kurang pas, dan atribusi di Wikiquote kadang keliru. Tinjau dulu, lalu:

```bash
npm run terima -- eq-94-5 hd-bukhari-15              # pindahkan ke data/ (dapat id tetap)
npm run terima -- eq-2-153 --tema=sabar               # sekaligus tetapkan tema
npm run terima -- wq-buyahamka-1a2b3c4d --kategori=nasihat-ulama
npm run terima -- --semua=peribahasa                  # semua kandidat satu kategori (tinjau dulu!)
npm run terima -- wq-x-1a2b3c4d --religius=false     # batalkan tanda religius otomatis
npm run tolak -- eq-2-282 wq-soekarno-1a2b3c4d        # buang; tidak akan diambil lagi
npm run validate                                      # cek skema, id, dan duplikat
```

Saat diterima ke kategori umum, kalimat yang memuat istilah keagamaan (Allah, doa, ibadah, surga, dll.) otomatis diberi `"religius": true`. `npm run validate` memberi peringatan bila ada kalimat seperti itu yang belum diputuskan.

Crawl juga bisa dijalankan lokal: `npm run crawl` (semua sumber) atau `npm run crawl -- equran` (satu sumber). Jumlah per hari diatur lewat env `EQURAN_SURAT`, `HADIS_BAGIAN`, dan `WIKIQUOTE_HALAMAN`.

### Merilis versi baru

Aplikasi memakai tag, jadi perubahan di `data/` baru sampai ke aplikasi setelah rilis:

```bash
npm run validate
npm version minor          # 1.0.0 → 1.1.0, membuat commit dan tag v1.1.0
git push --follow-tags
```

Lalu di aplikasi: `npm install github:asdamwongmantap/kutipan-json#v1.1.0`.

### Catatan isi

- Terjemahan ayat dan hadis di `data/` berupa ringkasan makna yang mendekati terjemahan Kemenag, bukan kutipan kata per kata. Sebaiknya ditinjau bersama ustadz sebelum disebarkan luas.
- Kutipan populer yang atribusinya meragukan sengaja tidak dimasukkan. Yang masyhur tetapi rujukannya belum pasti diberi `catatan`.
- Ungkapan yang sering dikira hadis padahal bukan (mis. "Bekerjalah untuk duniamu seakan engkau hidup selamanya…") dimasukkan ke `hikmah`, bukan `hadis`, dan diberi `catatan`.

### Lisensi

Skrip: MIT. Data: CC BY-SA 4.0. Butir dengan lisensi berbeda mencantumkannya di kolom `lisensi`. Lihat `LICENSE`.

---

## English

`kutipan-json` is a JSON dataset of Indonesian-language quotes: Qur'an verses (meaning translations), hadith, sayings of the Companions and scholars, Arabic maxims, proverbs, book quotes, sayings of notable people, and original motivational lines. `data/` holds curated items consumed by apps, one file per category. `kandidat/` holds unreviewed candidates that a daily GitHub Action crawls from equran.id, fawazahmed0/hadith-api, and Indonesian Wikiquote. Candidates are promoted with `npm run terima` and rejected with `npm run tolak`. Install with `npm install github:asdamwongmantap/kutipan-json#v1.0.0`. Scripts are MIT; data is CC BY-SA 4.0.
