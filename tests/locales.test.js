'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, listFiles, extractTKeys, flattenKeys, stripSchemaBlock, extractSchemaLiquidSafe } = require('./helpers');

function liquidFiles() {
  const dirs = ['sections', 'snippets', 'blocks', 'layout'].map((d) => path.join(ROOT, d));
  let out = [];
  for (const d of dirs) out = out.concat(listFiles(d, ['.liquid']));
  return out;
}

describe('locales', () => {
  it('ja and en key sets match', () => {
    const ja = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'ja.default.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'en.json'), 'utf8'));
    const jf = flattenKeys(ja);
    const ef = flattenKeys(en);
    assert.deepEqual(new Set(Object.keys(jf)), new Set(Object.keys(ef)));
    assert.ok(Object.keys(jf).length > 20, 'locales should have many keys');
  });

  it("all 'key' | t keys exist in both locales", () => {
    const ja = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'ja.default.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'en.json'), 'utf8'));
    const jf = flattenKeys(ja);
    const ef = flattenKeys(en);
    const files = liquidFiles();
    let allKeys = new Set();
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      for (const k of extractTKeys(content)) allKeys.add(k);
    }
    assert.ok(allKeys.size > 10, 'should detect translation keys');
    const missing = [...allKeys].filter((k) => !(k in jf) || !(k in ef));
    assert.deepEqual(missing, [], 'missing locale keys: ' + missing.join(', '));
  });

  it('no hardcoded Japanese outside schema blocks', () => {
    const jp = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/;
    const files = liquidFiles().concat(listFiles(path.join(ROOT, 'templates'), ['.json']));
    const offenders = [];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      const body = f.endsWith('.json') ? content : stripSchemaBlock(content);
      if (jp.test(body)) offenders.push(path.relative(ROOT, f));
    }
    assert.deepEqual(offenders, [], 'Japanese hardcoding found in: ' + offenders.join(', '));
  });

  it('no hardcoded English prose outside schema blocks', () => {
    const files = liquidFiles();
    const offenders = [];
    for (const f of files) {
      let body = fs.readFileSync(f, 'utf8');
      body = stripSchemaBlock(body);
      body = body.replace(/\{%\s*stylesheet\s*%\}[\s\S]*?\{%\s*endstylesheet\s*%\}/g, ' ');
      body = body.replace(/\{%\s*javascript\s*%\}[\s\S]*?\{%\s*endjavascript\s*%\}/g, ' ');
      body = body.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ');
      body = body.replace(/<title[\s\S]*?<\/title>/gi, ' ');
      body = body.replace(/\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\}/g, ' ');
      body = body.replace(/\{%\s*doc\s*%\}[\s\S]*?\{%\s*enddoc\s*%\}/g, ' ');
      body = body.replace(/\{\{[\s\S]*?\}\}/g, ' ');
      body = body.replace(/\{%[\s\S]*?%\}/g, ' ');
      const re = />([^<>]*)</g;
      let m;
      let found = null;
      while ((m = re.exec(body))) {
        const text = m[1].replace(/\s+/g, ' ').trim();
        if (!text) continue;
        const words = text.match(/[A-Za-z]{2,}/g) || [];
        if (words.length >= 2) {
          found = text.slice(0, 80);
          break;
        }
      }
      if (found) offenders.push(path.relative(ROOT, f) + ': ' + found);
    }
    assert.deepEqual(offenders, [], 'English hardcoding found in: ' + offenders.join('; '));
  });

  it('each section schema is valid JSON and has presets', () => {
    const sectionFiles = listFiles(path.join(ROOT, 'sections'), ['.liquid']);
    assert.ok(sectionFiles.length >= 10);
    for (const f of sectionFiles) {
      const schema = extractSchemaLiquidSafe(f);
      assert.ok(schema, path.basename(f) + ' must have {% schema %}');
      assert.ok(schema.name, path.basename(f) + ' schema must have name');
      assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0, path.basename(f) + ' schema must have presets');
    }
    const blockFiles = listFiles(path.join(ROOT, 'blocks'), ['.liquid']);
    for (const f of blockFiles) {
      const schema = extractSchemaLiquidSafe(f);
      assert.ok(schema, path.basename(f) + ' must have {% schema %}');
      assert.ok(Array.isArray(schema.presets) && schema.presets.length > 0, path.basename(f) + ' must have presets');
    }
  });

  it('does not use removed low-stock keys', () => {
    const ja = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'ja.default.json'), 'utf8'));
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'locales', 'en.json'), 'utf8'));
    const jf = flattenKeys(ja);
    const ef = flattenKeys(en);
    assert.ok(!('kotohana.product.low_stock_html' in jf), 'low_stock_html should be removed from ja');
    assert.ok(!('kotohana.product.low_stock_html' in ef), 'low_stock_html should be removed from en');
    const variantJs = fs.readFileSync(path.join(ROOT, 'assets', 'product-variants.js'), 'utf8');
    assert.ok(!variantJs.includes('String(current.inventory_quantity)'), 'raw inventory count display should be removed');
  });

  it('product section has no dead KotohanaVariants global', () => {
    const content = fs.readFileSync(path.join(ROOT, 'sections', 'product.liquid'), 'utf8');
    assert.ok(!content.includes('window.KotohanaVariants'), 'dead window.KotohanaVariants should be removed');
  });
});
