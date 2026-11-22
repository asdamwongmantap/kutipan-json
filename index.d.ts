export type KategoriKutipan =
  | 'alquran' | 'hadis' | 'nasihat-sahabat' | 'nasihat-ulama' | 'hikmah'
  | 'peribahasa' | 'kutipan-buku' | 'kata-bijak' | 'motivasi';

export type TemaKutipan = 'belajar' | 'usaha' | 'waktu' | 'diri' | 'sesama' | 'sabar' | 'syukur' | 'ibadah' | 'doa';

export interface Kutipan {
  /** `<kategori>-NNNN`, tetap dan tidak dipakai ulang. */
  id: string;
  teks: string;
  kategori: KategoriKutipan;
  /** Siapa yang mengucapkan/menulis; null untuk ayat dan kalimat orisinal. */
  penutur: string | null;
  /** Surah dan ayat, perawi hadis, judul kitab/buku, atau pidato. */
  rujukan: string | null;
  tema: TemaKutipan;
  /** true untuk kalimat bernuansa keagamaan di kategori umum. alquran, hadis, nasihat-* selalu religius. */
  religius?: boolean;
  teks_asli?: string;
  catatan?: string;
  sumber_url?: string;
  lisensi?: string;
}

export const KATEGORI: KategoriKutipan[];
/** Kategori yang seluruh isinya religius. */
export const KATEGORI_RELIGIUS: KategoriKutipan[];
export const perKategori: Record<KategoriKutipan, Kutipan[]>;
export const semua: Kutipan[];
