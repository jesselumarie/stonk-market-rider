/**
 * Death screen overlay.
 * Shows "YOU DIED" for mid-track deaths, "YOU CAN'T TAKE IT WITH YOU" for reaching the end.
 */

const elements = {
  screen: null,
  title: null,
  ticker: null,
  survived: null,
  drop: null,
  cause: null,
};

export function initDeathScreen() {
  elements.screen = document.getElementById('death-screen');
  elements.title = document.getElementById('death-title');
  elements.ticker = document.getElementById('death-ticker');
  elements.survived = document.getElementById('death-survived');
  elements.drop = document.getElementById('death-drop');
  elements.cause = document.getElementById('death-cause');
}

export function showDeathScreen(stats) {
  if (!elements.screen) return;

  // Dynamic title based on how you died
  if (stats.deathCause === 'Reached the end of the line') {
    elements.title.innerHTML = "YOU CAN'T TAKE IT<br>WITH YOU";
  } else {
    elements.title.textContent = 'YOU DIED';
  }

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
