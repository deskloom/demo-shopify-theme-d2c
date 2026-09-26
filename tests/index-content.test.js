'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ROOT, readJson, listFiles, extractSchemaLiquidSafe } = require('./helpers');

function isNonEmptyText(v) {
  if (typeof v === 'string') return v.trim() !== '' && v.trim() !== '<p></p>' && v.trim() !== '<p><br></p>';
  return false;
}

describe('index.json blocks have Japanese copy (no empty frames)', () => {
  it('all blocks in templates/index.json have non-empty text settings', () => {
    const index = readJson(path.join(ROOT, 'templates', 'index.json'));
    let checked = 0;
    const empty = [];
    for (const [secId, sec] of Object.entries(index.sections)) {
      if (!sec.blocks) continue;
      for (const [blockId, block] of Object.entries(sec.blocks)) {
        const settings = block.settings || {};
        const keys = Object.keys(settings);
        if (keys.length === 0) {
          empty.push(secId + '/' + blockId + ' (no settings)');
          continue;
        }
        for (const [k, v] of Object.entries(settings)) {
          if (typeof v === 'string') {
            checked++;
            if (!isNonEmptyText(v)) empty.push(secId + '/' + blockId + '/' + k);
          }
        }
      }
    }
    assert.ok(checked > 0, 'index.json blocks should have text settings to check');
    assert.deepEqual(empty, [], 'empty text settings in index.json: ' + empty.join(', '));
  });

  it('features/testimonials/faq presets have default block settings (not empty in editor)', () => {
    const targets = [
      'sections/kotohana-features.liquid',
      'sections/kotohana-testimonials.liquid',
      'sections/kotohana-faq.liquid',
    ];
    for (const rel of targets) {
      const schema = extractSchemaLiquidSafe(path.join(ROOT, rel));
      assert.ok(schema && Array.isArray(schema.presets) && schema.presets.length > 0, rel + ' must have presets');
      for (const preset of schema.presets) {
        const blocks = preset.blocks || [];
        assert.ok(blocks.length > 0, rel + ' preset must include blocks');
        for (const b of blocks) {
          const settings = b.settings || {};
          for (const [k, v] of Object.entries(settings)) {
            if (typeof v === 'string') assert.ok(isNonEmptyText(v), rel + ' preset block ' + b.type + '/' + k + ' must be non-empty');
          }
          // preset blocks must carry default settings so editor-added blocks are not empty
          assert.ok(Object.keys(settings).length > 0, rel + ' preset block ' + b.type + ' must have default settings');
        }
      }
    }
    // also ensure block files exist check
    assert.ok(listFiles(path.join(ROOT, 'sections'), ['.liquid']).length > 0);
  });
});
