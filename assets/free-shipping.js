/* Free shipping remaining calculation. Shared between theme and Node tests. */
function freeShippingRemaining(cartTotal, threshold) {
  var total = Number(cartTotal);
  var limit = Number(threshold);
  if (!isFinite(total) || total < 0) total = 0;
  if (!isFinite(limit) || limit < 0) limit = 0;
  var remaining = limit - total;
  if (remaining < 0) remaining = 0;
  var achieved = total >= limit;
  var progress = limit > 0 ? Math.min(100, Math.round((total / limit) * 100)) : 100;
  return { remaining: remaining, achieved: achieved, progress: progress };
}

function renderFreeShippingBar(root) {
  if (!root || typeof document === 'undefined') return;
  var total = Number(root.getAttribute('data-cart-total'));
  var threshold = Number(root.getAttribute('data-threshold'));
  var result = freeShippingRemaining(total, threshold);
  var message = root.querySelector('[data-free-message]');
  var fill = root.querySelector('[data-free-fill]');
  if (fill) fill.style.width = result.progress + '%';
  if (!message) return;
  if (result.achieved) {
    message.textContent = message.getAttribute('data-achieved-text') || '';
  } else {
    var template = message.getAttribute('data-remaining-template') || '';
    message.textContent = template.replace('{{ amount }}', String(result.remaining));
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var bars = document.querySelectorAll('[data-free-bar]');
    for (var i = 0; i < bars.length; i++) renderFreeShippingBar(bars[i]);
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { freeShippingRemaining: freeShippingRemaining, renderFreeShippingBar: renderFreeShippingBar };
}
