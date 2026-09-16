#!/usr/bin/env node
// Cohen's kappa between two raters classifying design-system rules.
// Usage: node scripts/cohen-kappa.mjs <gold.csv> <rater2.csv>
// Both CSVs must have an `ID` column and a class column. Gold uses the workbook's
// `Class` column; rater2 uses `Your class ...`. Rows are matched by ID; only rows
// the second rater actually filled in are scored.

import fs from 'node:fs';

function parseCsv(path) {
  const text = fs.readFileSync(path, 'utf8');
  const rows = [];
  let field = '', row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((f) => f !== '')) rows.push(row); }
  const header = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

function classColumn(rec) {
  const key = Object.keys(rec).find((k) => /^your class/i.test(k)) || Object.keys(rec).find((k) => /^class$/i.test(k));
  return key;
}
function norm(v) {
  if (!v) return '';
  return v.split('#')[0].trim().toUpperCase().replace('PLATFORM', 'PL').replace('RESPONSIVE', 'R');
}

const [goldPath, r2Path] = process.argv.slice(2);
if (!goldPath || !r2Path) {
  console.error('usage: node scripts/cohen-kappa.mjs <gold.csv> <rater2.csv>');
  process.exit(2);
}

const gold = parseCsv(goldPath);
const r2 = parseCsv(r2Path);
const gCol = classColumn(gold[0]);
const rCol = classColumn(r2[0]);
const gById = new Map(gold.map((r) => [r.ID, norm(r[gCol])]));

const pairs = [];
for (const rec of r2) {
  const a = gById.get(rec.ID);
  const b = norm(rec[rCol]);
  if (a && b) pairs.push([a, b]);
}

if (pairs.length === 0) {
  console.error('No overlapping, filled-in rows to compare. Did the rater fill the class column?');
  process.exit(1);
}

const labels = [...new Set(pairs.flatMap((p) => p))].sort();
const n = pairs.length;
let observed = 0;
const marginA = {}, marginB = {};
for (const [a, b] of pairs) {
  if (a === b) observed++;
  marginA[a] = (marginA[a] || 0) + 1;
  marginB[b] = (marginB[b] || 0) + 1;
}
const po = observed / n;
let pe = 0;
for (const l of labels) pe += ((marginA[l] || 0) / n) * ((marginB[l] || 0) / n);
const kappa = pe === 1 ? 1 : (po - pe) / (1 - pe);

const disagreements = pairs.filter(([a, b]) => a !== b);
console.log(`rows compared:        ${n}`);
console.log(`raw agreement (po):   ${(po * 100).toFixed(1)}%`);
console.log(`expected by chance:   ${(pe * 100).toFixed(1)}%`);
console.log(`Cohen's kappa:        ${kappa.toFixed(3)}  ${kappa >= 0.8 ? '(almost perfect)' : kappa >= 0.6 ? '(substantial)' : kappa >= 0.4 ? '(moderate)' : '(weak — revisit taxonomy definitions)'}`);
console.log(`\npublication bar:      kappa >= 0.7`);
console.log(`disagreements (${disagreements.length}):`);
const conf = {};
for (const [a, b] of disagreements) { const k = `${a}->${b}`; conf[k] = (conf[k] || 0) + 1; }
for (const [k, c] of Object.entries(conf).sort((x, y) => y[1] - x[1])) console.log(`  gold ${k}: ${c}`);
