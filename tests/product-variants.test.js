'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getVariantState, findVariantById, formatPrice } = require('../assets/product-variants');

describe('product variant switching', () => {
  const available = { id: 1, price: 3300, available: true, inventory_quantity: 10 };
  const soldOut = { id: 2, price: 4950, available: false, inventory_quantity: 0 };

  it('available variant enables button and shows price', () => {
    const s = getVariantState(available);
    assert.equal(s.found, true);
    assert.equal(s.isSoldOut, false);
    assert.equal(s.buttonDisabled, false);
    assert.equal(s.price, 3300);
  });

  it('sold-out variant disables button', () => {
    const s = getVariantState(soldOut);
    assert.equal(s.isSoldOut, true);
    assert.equal(s.buttonDisabled, true);
    assert.equal(s.price, 4950);
  });

  it('findVariantById switches price correctly', () => {
    const list = [available, soldOut];
    const v = findVariantById(list, 2);
    assert.equal(v.price, 4950);
    const state = getVariantState(v);
    assert.equal(state.buttonDisabled, true);
    const v1 = findVariantById(list, 1);
    assert.equal(getVariantState(v1).buttonDisabled, false);
  });

  it('formatPrice renders yen', () => {
    assert.match(formatPrice(330000), /¥/);
  });
});
