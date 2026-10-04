'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

describe('storefront review fixes (static checks)', () => {
  it('header does not render the free-shipping bar on the cart page', () => {
    assert.match(read('sections/header.liquid'), /show_free_bar and template\.name != 'cart'/);
  });

  it('header cart link has an aria-label from cart.title and the icon is aria-hidden', () => {
    const s = read('sections/header.liquid');
    assert.match(s, /href="\{\{ routes\.cart_url \}\}" aria-label="\{\{ 'cart\.title' \| t \}\}"/);
    assert.match(s, /icon-cart\.svg' \| inline_asset_content \| replace: '<svg', '<svg aria-hidden="true"'/);
    for (const f of ['locales/ja.default.json', 'locales/en.json']) {
      assert.ok(JSON.parse(read(f)).cart.title, f + ' lacks cart.title');
    }
  });

  it('product page uses a hidden input for single-default-variant products', () => {
    const s = read('sections/product.liquid');
    assert.match(s, /product\.has_only_default_variant/);
    assert.match(s, /<input type="hidden" name="id" value="\{\{ current_variant\.id \}\}" data-variant-select>/);
  });

  it('product price and stock are inside an aria-live region', () => {
    assert.match(read('sections/product.liquid'), /aria-live="polite"[^>]*>\s*<p data-variant-price>[\s\S]*?<p data-variant-stock>/);
  });

  it('search terms are escaped inside _html translations', () => {
    const s = read('sections/search.liquid');
    assert.match(s, /assign escaped_terms = search.terms | escape/);
    assert.doesNotMatch(s, /terms: search.terms/);
    assert.equal((s.match(/terms: escaped_terms/g) || []).length, 2);
  });

  it('product-variants.js reads the value from the [data-variant-select] element regardless of tag', () => {
    assert.match(read('assets/product-variants.js'), /select \? select\.value/);
  });
});
