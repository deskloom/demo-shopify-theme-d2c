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
});
