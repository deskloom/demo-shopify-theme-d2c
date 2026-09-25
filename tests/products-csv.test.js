'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./helpers');

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const headers = splitLine(lines[0]);
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function splitLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

describe('products.csv', () => {
  it('has required headers, 6+ products, variants and zero-stock', () => {
    const file = path.join(ROOT, 'sample-data', 'products.csv');
    assert.ok(fs.existsSync(file), 'sample-data/products.csv must exist');
    const { headers, rows } = parseCsv(fs.readFileSync(file, 'utf8'));
    const required = ['Handle', 'Title', 'Body (HTML)', 'Vendor', 'Type', 'Tags', 'Published', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price', 'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Image Src', 'Status'];
    for (const h of required) assert.ok(headers.includes(h), 'missing header: ' + h);
    const idx = (n) => headers.indexOf(n);
    const handles = new Set(rows.map((r) => r[idx('Handle')]));
    assert.ok(handles.size >= 6, 'need 6+ distinct products, got ' + handles.size);
    const byHandle = {};
    for (const r of rows) {
      const h = r[idx('Handle')];
      byHandle[h] = byHandle[h] || [];
      byHandle[h].push(r);
    }
    const multi = Object.values(byHandle).some((list) => list.length > 1);
    assert.ok(multi, 'need at least one product with variants (same Handle on 2+ rows)');
    const zero = rows.some((r) => Number(r[idx('Variant Inventory Qty')]) === 0);
    assert.ok(zero, 'need at least one zero-inventory variant');
    for (const r of rows) {
      assert.ok(Number(r[idx('Variant Price')]) > 0, 'variant price must be positive: ' + r[idx('Variant SKU')]);
      assert.ok(r[idx('Status')] === 'active', 'status should be active');
    }
  });
});
