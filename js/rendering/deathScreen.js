/**
 * Death screen overlay - "YOU CAN'T TAKE IT WITH YOU"
 * Uses DOM elements for text rendering quality.
 */

const elements = {
  screen: null,
  ticker: null,
  survived: null,
  drop: null,
  cause: null,
};

export function initDeathScreen() {
  elements.screen = document.getElementById('death-screen');
  elements.ticker = document.getElementById('death-ticker');
  elements.survived = document.getElementById('death-survived');
  elements.drop = document.getElementById('death-drop');
  elements.cause = document.getElementById('death-cause');
}

export function showDeathScreen(stats) {
  if (!elements.screen) return;

  elements.ticker.textContent = `${stats.ticker} (${stats.timeframe})`;
  elements.survived.textContent = `Survived ${stats.survived} of ${stats.total} trading days`;
  elements.drop.textContent = `Biggest drop survived: ${stats.biggestDropPercent}%`;
  elements.cause.textContent = `Cause of death: ${stats.deathCause}`;

  elements.screen.classList.add('visible');
}

export function hideDeathScreen() {
  if (!elements.screen) return;
  elements.screen.classList.remove('visible');
}
