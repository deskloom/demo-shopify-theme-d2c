'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, readJson } = require('./helpers');

describe('templates reference existing sections', () => {
  const templatesDir = path.join(ROOT, 'templates');
  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith('.json'));
  assert.ok(files.length > 0, 'templates/*.json should exist');

  for (const file of files) {
    it(file + ' references existing sections', () => {
      const json = readJson(path.join(templatesDir, file));
      assert.ok(json.sections && typeof json.sections === 'object', 'sections object required');
      for (const [key, sec] of Object.entries(json.sections)) {
        assert.ok(sec.type, key + ' must have a type');
        const sectionFile = path.join(ROOT, 'sections', sec.type + '.liquid');
        assert.ok(fs.existsSync(sectionFile), key + ' type ' + sec.type + ' must exist as sections/' + sec.type + '.liquid');
        if (sec.blocks) {
          const schemaRaw = fs.readFileSync(sectionFile, 'utf8');
          const m = schemaRaw.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
          assert.ok(m, sec.type + ' must have a schema');
          const schema = JSON.parse(m[1]);
          const allowed = new Set((schema.blocks || []).map((b) => b.type));
          for (const [bk, bv] of Object.entries(sec.blocks)) {
            assert.ok(allowed.has(bv.type), 'block ' + bk + ' type ' + bv.type + ' must be defined in ' + sec.type + ' schema');
          }
        }
      }
      if (json.order) {
        for (const id of json.order) assert.ok(json.sections[id], 'order id ' + id + ' must exist in sections');
      }
    });
  }

  it('index.json contains hero/features/collection/testimonials/faq/newsletter', () => {
    const index = readJson(path.join(templatesDir, 'index.json'));
    const types = Object.values(index.sections).map((s) => s.type);
    for (const need of ['kotohana-hero', 'kotohana-features', 'kotohana-featured-collection', 'kotohana-testimonials', 'kotohana-faq', 'kotohana-newsletter']) {
      assert.ok(types.includes(need), 'index.json must include ' + need);
    }
  });

  it('product.json contains tab blocks and cart/collection templates exist', () => {
    const product = readJson(path.join(templatesDir, 'product.json'));
    const types = Object.values(product.sections).map((s) => s.type);
    assert.ok(types.includes('product'), 'product.json must use product section');
    const main = product.sections.main;
    const blockTypes = Object.values(main.blocks || {}).map((b) => b.type);
    for (const need of ['ingredients', 'howto', 'shipping']) {
      assert.ok(blockTypes.includes(need), 'product.json must include ' + need + ' tab block');
    }
  });
});
