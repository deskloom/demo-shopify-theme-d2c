'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, listFiles, extractSchemaLiquidSafe, readJson } = require('./helpers');

describe('block names are unique within each section', () => {
  const sectionFiles = listFiles(path.join(ROOT, 'sections'), ['.liquid']);
  assert.ok(sectionFiles.length > 0, 'sections/*.liquid should exist');

  for (const file of sectionFiles) {
    it(path.basename(file) + ' has unique block names', () => {
      const schema = extractSchemaLiquidSafe(file);
      if (!schema || !schema.blocks) return;
      const names = schema.blocks.map((b) => b.name).filter(Boolean);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      assert.deepEqual(dupes, [], path.basename(file) + ' has duplicate block names: ' + [...new Set(dupes)].join(', '));
    });
  }

  it('all theme blocks have unique names (blocks/*.liquid with type)', () => {
    const blockFiles = listFiles(path.join(ROOT, 'blocks'), ['.liquid']);
    for (const file of blockFiles) {
      const schema = extractSchemaLiquidSafe(file);
      if (!schema || !schema.blocks) return;
      const names = schema.blocks
        .filter((b) => b.type && b.type !== '@theme')
        .map((b) => b.name)
        .filter(Boolean);
      const dupes = names.filter((n, i) => names.indexOf(n) !== i);
      assert.deepEqual(dupes, [], path.basename(file) + ' has duplicate block names');
    }
  });
});

describe('range setting constraints (Shopify upload rules)', () => {
  function collectRangeSettings() {
    const out = [];
    const sectionFiles = listFiles(path.join(ROOT, 'sections'), ['.liquid']);
    const blockFiles = (() => {
      try {
        return listFiles(path.join(ROOT, 'blocks'), ['.liquid']);
      } catch {
        return [];
      }
    })();
    for (const file of sectionFiles.concat(blockFiles)) {
      const schema = extractSchemaLiquidSafe(file);
      if (!schema) continue;
      const settings = schema.settings || [];
      for (const s of settings) {
        if (s.type === 'range') {
          out.push({ file: path.relative(ROOT, file), id: s.id, min: s.min, max: s.max, step: s.step, def: s.default });
        }
      }
      for (const b of schema.blocks || []) {
        for (const s of b.settings || []) {
          if (s.type === 'range') {
            out.push({ file: path.relative(ROOT, file) + ' block:' + b.type, id: s.id, min: s.min, max: s.max, step: s.step, def: s.default });
          }
        }
      }
    }
    const config = readJson(path.join(ROOT, 'config', 'settings_schema.json'));
    for (const section of config) {
      for (const s of section.settings || []) {
        if (s.type === 'range') {
          out.push({ file: 'config/settings_schema.json', id: s.id, min: s.min, max: s.max, step: s.step, def: s.default });
        }
      }
    }
    return out;
  }

  it('all range settings satisfy max < 10000, min < max, steps <= 101, default on step', () => {
    const ranges = collectRangeSettings();
    assert.ok(ranges.length > 0, 'should find at least one range setting');
    for (const r of ranges) {
      const label = r.file + ' id=' + r.id;
      assert.ok(typeof r.min === 'number' && typeof r.max === 'number', label + ' min/max must be numbers');
      assert.ok(r.min < r.max, label + ' min must be < max');
      assert.ok(r.max < 10000, label + ' max must be < 10000 (got ' + r.max + ')');
      const step = r.step == null ? 1 : r.step;
      assert.ok(step > 0, label + ' step must be > 0');
      const steps = (r.max - r.min) / step;
      assert.ok(steps <= 101, label + ' (max-min)/step must be <= 101 (got ' + steps + ')');
      assert.ok(typeof r.def === 'number', label + ' default must be a number');
      assert.ok(r.def >= r.min && r.def <= r.max, label + ' default must be within min..max');
      const n = Math.round((r.def - r.min) / step);
      assert.ok(Math.abs(r.min + n * step - r.def) < 1e-9, label + ' default must land on step');
    }
  });

  it('free_shipping_threshold is not a range with max >= 10000', () => {
    const ranges = collectRangeSettings();
    const bad = ranges.filter((r) => r.id === 'free_shipping_threshold');
    assert.deepEqual(bad, [], 'free_shipping_threshold must not be a range (use number type instead)');
  });
});
