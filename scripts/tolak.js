#!/usr/bin/env node
/**
 * Buang kandidat yang tidak layak. Id-nya dicatat di kandidat/_ditolak.json supaya tidak diambil lagi oleh crawler.
 *
 *   npm run tolak -- eq-2-282 wq-soekarno-1a2b3c4d
 */
const { KATEGORI, baca, tulis, bacaKandidat, tulisKandidat, DITOLAK } = require('./lib');

const ids = new Set(process.argv.slice(2));
if (!ids.size) { console.error('Sebutkan id kandidat yang ditolak.'); process.exit(1); }
const ditolak = new Set(baca(DITOLAK, []));
let n = 0;
for (const kat of KATEGORI) {
  const isi = bacaKandidat(kat);
  const sisa = isi.filter((k) => !ids.has(k.id));
  n += isi.length - sisa.length;
  tulisKandidat(kat, sisa);
}
for (const id of ids) ditolak.add(id);
tulis(DITOLAK, [...ditolak].sort());
console.log(`${n} kandidat dibuang, ${ids.size} id dicatat sebagai ditolak.`);
