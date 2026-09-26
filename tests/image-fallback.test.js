'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, listFiles } = require('./helpers');

describe('image fallback for blank images', () => {
  it("snippets/image.liquid guards blank with placeholder", () => {
    const file = path.join(ROOT, 'snippets', 'image.liquid');
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('image_url'), 'image snippet should use image_url');
    assert.ok(content.includes('blank'), 'image snippet must branch on blank (if image != blank)');
    assert.ok(content.includes('placeholder_svg_tag'), 'image snippet must fallback to placeholder_svg_tag when blank');
  });

  it('all direct image_url/image_tag usages have a blank/if guard in the same file', () => {
    const liquidFiles = listFiles(path.join(ROOT, 'sections'), ['.liquid'])
      .concat(listFiles(path.join(ROOT, 'snippets'), ['.liquid']))
      .concat(listFiles(path.join(ROOT, 'layout'), ['.liquid']));
    let checked = 0;
    const offenders = [];
    for (const f of liquidFiles) {
      const content = fs.readFileSync(f, 'utf8');
      const lines = content.split(/\r?\n/);
      const usesImageFilter = lines.some((l) => /image_url|image_tag/.test(l) && !/^\s*\{\{\s*['"]/.test(l) && !l.includes('asset_url') && !l.includes('shopify_asset_url'));
      // skip doc comments mentioning filters without actual usage
      const hasRealUsage = lines.some((l) => /\|\s*image_url|\|\s*image_tag/.test(l));
      if (!hasRealUsage) continue;
      void usesImageFilter;
      checked++;
      const hasGuard = content.includes('blank') || /\{%\s*if\b/.test(content);
      const hasPlaceholder = content.includes('placeholder_svg_tag');
      // snippet itself is checked above; others must have at least a guard or placeholder delegation
      if (!(hasGuard || hasPlaceholder)) offenders.push(path.relative(ROOT, f));
    }
    assert.ok(checked > 0, 'should find liquid files using image filters');
    assert.deepEqual(offenders, [], 'missing blank/if guard: ' + offenders.join(', '));
  });

  it('product grid (collection) shows placeholder when featured image is blank', () => {
    const file = path.join(ROOT, 'sections', 'collection.liquid');
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(content.includes('placeholder_svg_tag'), 'collection grid must fallback to placeholder_svg_tag');
  });
});
