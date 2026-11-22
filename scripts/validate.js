#!/usr/bin/env node
/**
 * Validasi dataset kutipan-json.
 *
 * 1. Setiap berkas di data/ dan kandidat/ dicek terhadap JSON Schema di schema/.
 * 2. Konsistensi: id unik dan berurutan per kategori, kategori sesuai nama berkas,
 *    tidak ada teks ganda di seluruh data/, dan kandidat tidak menduplikasi data/.
 *
 * Jalankan: npm install && npm run validate
 */
const path = require('path');
const Ajv = require('ajv');
const { ROOT, KATEGORI, KATEGORI_RELIGIUS, RELIGIUS, baca, bacaData, bacaKandidat, normal } = require('./lib');

const ajv = new Ajv({ allErrors: true });
ajv.addSchema(baca(path.join(ROOT, 'schema', 'kutipan.schema.json')));
const cekData = ajv.getSchema('kutipan.schema.json');
const cekKandidat = ajv.compile(baca(path.join(ROOT, 'schema', 'kandidat.schema.json')));

const errors = [];
const peringatan = [];
const teks = new Map();
let total = 0;
let totalKandidat = 0;
const ringkas = [];

for (const kat of KATEGORI) {
  const data = bacaData(kat);
  if (!cekData(data)) for (const e of cekData.errors) errors.push(`data/${kat}.json${e.instancePath}: ${e.message}`);
  data.forEach((k, i) => {
    const harap = `${kat}-${String(i + 1).padStart(4, '0')}`;
    if (k.kategori !== kat) errors.push(`data/${kat}.json [${k.id}]: kategori "${k.kategori}" tidak sesuai nama berkas`);
    if (k.id !== harap) errors.push(`data/${kat}.json [${k.id}]: id seharusnya ${harap} (urut, tanpa lompat)`);
    const n = normal(k.teks);
    if (teks.has(n)) errors.push(`data/${kat}.json [${k.id}]: teks sama dengan ${teks.get(n)}`);
    teks.set(n, k.id);
    if (KATEGORI_RELIGIUS.includes(kat) && k.religius !== undefined) errors.push(`data/${kat}.json [${k.id}]: kolom religius hanya untuk kategori umum`);
    if (!KATEGORI_RELIGIUS.includes(kat) && k.religius === undefined && RELIGIUS.test(k.teks)) peringatan.push(`data/${kat}.json [${k.id}]: memuat istilah keagamaan; isi "religius": true atau false`);
  });
  total += data.length;

  const kandidat = bacaKandidat(kat);
  if (!cekKandidat(kandidat)) for (const e of cekKandidat.errors) errors.push(`kandidat/${kat}.json${e.instancePath}: ${e.message}`);
  const ids = new Set();
  for (const k of kandidat) {
    if (ids.has(k.id)) errors.push(`kandidat/${kat}.json [${k.id}]: id ganda`);
    ids.add(k.id);
    if (k.kategori !== kat) errors.push(`kandidat/${kat}.json [${k.id}]: kategori "${k.kategori}" tidak sesuai nama berkas`);
  }
  totalKandidat += kandidat.length;
  ringkas.push([kat, data.length, kandidat.length]);
}
for (const kat of KATEGORI) for (const k of bacaKandidat(kat)) if (teks.has(normal(k.teks))) errors.push(`kandidat/${kat}.json [${k.id}]: sudah ada di data (${teks.get(normal(k.teks))})`);

console.log('kategori'.padEnd(18), 'data'.padStart(6), 'kandidat'.padStart(9));
for (const [k, d, c] of ringkas) console.log(k.padEnd(18), String(d).padStart(6), String(c).padStart(9));
console.log('total'.padEnd(18), String(total).padStart(6), String(totalKandidat).padStart(9));

if (peringatan.length) {
  console.warn(`\n${peringatan.length} peringatan:`);
  for (const p of peringatan) console.warn('  - ' + p);
}
if (errors.length) {
  console.error(`\n${errors.length} masalah ditemukan:`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('\nSemua berkas valid.');
