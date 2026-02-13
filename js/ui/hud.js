let hudEl, tickerEl, companyEl, priceEl, dateEl, jumpHintEl, speedLevelEl;
let hintTimeout = null;
let startPrice = null;

const SPEED_TIERS = [
  { threshold: 0,    label: 'Intern' },
  { threshold: 0.15, label: 'Analyst' },
  { threshold: 0.35, label: 'Associate' },
  { threshold: 0.55, label: 'VP' },
  { threshold: 0.75, label: 'Director' },
  { threshold: 0.90, label: 'C-Suite' },
];

export function initHUD() {
  hudEl = document.getElementById('hud');
  tickerEl = document.getElementById('hud-ticker');
  companyEl = document.getElementById('hud-company');
  priceEl = document.getElementById('hud-price');
  dateEl = document.getElementById('hud-date');
  jumpHintEl = document.getElementById('jump-hint');
  speedLevelEl = document.getElementById('hud-speed-level');
}

export function showHUD(ticker, companyName) {
  if (!hudEl) return;
  tickerEl.textContent = ticker;
  companyEl.textContent = companyName || '';
  hudEl.classList.add('visible');
  startPrice = null;

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

export function updateHUD(priceInfo, difficulty) {
  if (!priceEl || !priceInfo) return;

  if (startPrice === null) startPrice = priceInfo.price;

  const priceText = `$${priceInfo.price.toFixed(2)}`;
  priceEl.textContent = priceText;

  // Color based on whether price is above/below starting price
  const direction = priceInfo.price >= startPrice ? 'up' : 'down';
  priceEl.className = `price ${direction}`;

  if (dateEl) {
    dateEl.textContent = priceInfo.date || '';
  }

  if (speedLevelEl && difficulty) {
    let tier = SPEED_TIERS[0];
    for (const t of SPEED_TIERS) {
      if (difficulty.progress >= t.threshold) tier = t;
    }
    speedLevelEl.textContent = tier.label;
    speedLevelEl.classList.toggle('fast', difficulty.progress >= 0.55);
  }
}
