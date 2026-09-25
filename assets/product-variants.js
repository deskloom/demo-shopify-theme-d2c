/* Product variant switching logic. Shared between theme and Node tests. */
function normalizeVariant(variant) {
  if (!variant) return null;
  return {
    id: variant.id,
    price: Number(variant.price),
    available: Boolean(variant.available),
    inventoryQuantity: variant.inventory_quantity != null ? Number(variant.inventory_quantity) : null
  };
}

function getVariantState(variant) {
  var v = normalizeVariant(variant);
  if (!v) {
    return { found: false, isSoldOut: true, price: 0, buttonDisabled: true };
  }
  var soldOut = !v.available;
  return {
    found: true,
    isSoldOut: soldOut,
    price: isFinite(v.price) ? v.price : 0,
    buttonDisabled: soldOut
  };
}

function findVariantById(variants, id) {
  var list = Array.isArray(variants) ? variants : [];
  var target = String(id);
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].id) === target) return list[i];
  }
  return null;
}

function formatPrice(cents) {
  var n = Number(cents);
  if (!isFinite(n)) n = 0;
  return '¥' + Math.round(n / 100).toLocaleString('en-US');
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('[data-variant-form]');
    if (!form) return;
    var select = form.querySelector('[data-variant-select]');
    var price = form.querySelector('[data-variant-price]');
    var stock = form.querySelector('[data-variant-stock]');
    var button = form.querySelector('[data-add-button]');
    var raw = form.getAttribute('data-variants');
    var variants = [];
    try {
      variants = JSON.parse(raw || '[]');
    } catch (e) {
      variants = [];
    }
    var soldOutText = form.getAttribute('data-soldout-text') || 'Sold out';
    var inStockText = form.getAttribute('data-instock-text') || 'In stock';
    function update() {
      var current = findVariantById(variants, select ? select.value : '');
      if (!current && variants.length > 0 && select) {
        current = findVariantById(variants, variants[0].id);
      }
      var state = getVariantState(current);
      if (price) price.textContent = formatPrice(state.price);
      if (button) {
        button.disabled = state.buttonDisabled;
        if (state.isSoldOut) button.value = soldOutText;
        else button.value = button.getAttribute('data-default-label') || 'Add';
      }
      if (stock) {
        if (state.isSoldOut) stock.textContent = soldOutText;
        else if (current && current.inventory_quantity != null && Number(current.inventory_quantity) <= 5) {
          stock.textContent = String(current.inventory_quantity);
        } else {
          stock.textContent = inStockText;
        }
      }
      var galleryMain = document.querySelector('[data-gallery-main]');
      if (galleryMain && current && current.featured_image) {
        var src = current.featured_image.src || current.featured_image;
        if (src) galleryMain.setAttribute('src', src);
      }
    }
    if (select) select.addEventListener('change', update);
    update();
    var thumbs = document.querySelectorAll('[data-gallery-thumb]');
    var main = document.querySelector('[data-gallery-main]');
    for (var j = 0; j < thumbs.length; j++) {
      thumbs[j].addEventListener('click', function () {
        var src = this.getAttribute('data-gallery-thumb');
        if (main && src) main.setAttribute('src', src);
        for (var k = 0; k < thumbs.length; k++) thumbs[k].classList.remove('is-active');
        this.classList.add('is-active');
      });
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeVariant: normalizeVariant,
    getVariantState: getVariantState,
    findVariantById: findVariantById,
    formatPrice: formatPrice
  };
}
