'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { freeShippingRemaining, buildFreeShippingMessage, formatYen } = require('../assets/free-shipping');

describe('free shipping remaining', () => {
  it('below threshold returns remaining', () => {
    const r = freeShippingRemaining(500000, 800000);
    assert.equal(r.remaining, 300000);
    assert.equal(r.achieved, false);
    assert.ok(r.progress > 0 && r.progress < 100);
  });

  it('exactly at threshold is achieved with zero remaining', () => {
    const r = freeShippingRemaining(800000, 800000);
    assert.equal(r.remaining, 0);
    assert.equal(r.achieved, true);
    assert.equal(r.progress, 100);
  });

  it('above threshold is achieved with zero remaining', () => {
    const r = freeShippingRemaining(1200000, 800000);
    assert.equal(r.remaining, 0);
    assert.equal(r.achieved, true);
    assert.equal(r.progress, 100);
  });

  it('buildFreeShippingMessage formats remaining cents to yen', () => {
    assert.equal(
      buildFreeShippingMessage('あと __AMOUNT__ で送料無料', 300000),
      'あと ¥3,000 で送料無料'
    );
  });

  it('formatYen converts cents to yen with thousands separator', () => {
    assert.equal(formatYen(300000), '¥3,000');
    assert.equal(formatYen(0), '¥0');
    assert.equal(formatYen(800000), '¥8,000');
  });
});
