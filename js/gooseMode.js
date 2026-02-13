/**
 * Goose Mode state — when enabled and ticker is FIG,
 * the rider becomes a goose.
 */

let gooseModeEnabled = false;

export function setGooseMode(enabled) {
  gooseModeEnabled = enabled;
}

export function isGooseMode() {
  return gooseModeEnabled;
}
