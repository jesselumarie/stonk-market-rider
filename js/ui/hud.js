let hudEl, tickerEl, companyEl, priceEl, dateEl, jumpHintEl;
let hintTimeout = null;

export function initHUD() {
  hudEl = document.getElementById('hud');
  tickerEl = document.getElementById('hud-ticker');
  companyEl = document.getElementById('hud-company');
  priceEl = document.getElementById('hud-price');
  dateEl = document.getElementById('hud-date');
  jumpHintEl = document.getElementById('jump-hint');
}

export function showHUD(ticker, companyName) {
  if (!hudEl) return;
  tickerEl.textContent = ticker;
  companyEl.textContent = companyName || '';
  hudEl.classList.add('visible');

  // Show jump hint, fade after 5 seconds
  if (jumpHintEl) {
    jumpHintEl.classList.remove('hidden');
    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => {
      jumpHintEl.classList.add('hidden');
    }, 5000);
  }
}

export function hideHUD() {
  if (hudEl) hudEl.classList.remove('visible');
  if (jumpHintEl) jumpHintEl.classList.add('hidden');
}

export function updateHUD(priceInfo) {
  if (!priceEl || !priceInfo) return;

  const priceText = `$${priceInfo.price.toFixed(2)}`;
  priceEl.textContent = priceText;

  // Color based on whether price is above/below starting price
  priceEl.className = 'price';

  if (dateEl) {
    dateEl.textContent = priceInfo.date || '';
  }
}
