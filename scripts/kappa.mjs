import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export function parseCsv(text) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()));
  if (rows.length === 0) return [];
  const header = rows[0].map((cell) => cell.toLowerCase());
  const hasHeader = header.includes('item') || header.includes('ratera') || header.includes('raterb');
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows
    .filter((row) => row.length >= 3)
    .map((row) => ({ item: row[0], raterA: row[1], raterB: row[2] }));
}

export function cohenKappa(pairs) {
  const n = pairs.length;
  if (n === 0) throw new Error('no rating pairs provided');
  const countsA = new Map();
  const countsB = new Map();
  let agree = 0;
  for (const { raterA, raterB } of pairs) {
    if (raterA === raterB) agree += 1;
    countsA.set(raterA, (countsA.get(raterA) || 0) + 1);
    countsB.set(raterB, (countsB.get(raterB) || 0) + 1);
  }
  const po = agree / n;
  const categories = new Set([...countsA.keys(), ...countsB.keys()]);
  let pe = 0;
  for (const category of categories) {
    pe += ((countsA.get(category) || 0) / n) * ((countsB.get(category) || 0) / n);
  }
  const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);
  return { n, po, pe, kappa };
}

function main() {
  const file = process.argv[2];
  if (!file) {
    process.stderr.write('usage: node scripts/kappa.mjs <labels.csv>\n');
    process.exit(2);
  }
  const pairs = parseCsv(fs.readFileSync(file, 'utf8'));
  const result = cohenKappa(pairs);
  process.stdout.write(`n=${result.n}\n`);
  process.stdout.write(`po=${result.po.toFixed(4)}\n`);
  process.stdout.write(`pe=${result.pe.toFixed(4)}\n`);
  process.stdout.write(`kappa=${result.kappa.toFixed(4)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main();
}
