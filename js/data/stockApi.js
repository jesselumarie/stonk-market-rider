import { TIMEFRAMES } from '../config.js';

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const CORS_PROXY = 'https://corsproxy.io/?';

/**
 * Fetch stock data from Yahoo Finance.
 * Falls back to CORS proxy if direct call fails.
 */
export async function fetchStockData(symbol, timeframeKey = '1Y') {
  const tf = TIMEFRAMES[timeframeKey];
  if (!tf) throw new Error(`Invalid timeframe: ${timeframeKey}`);

  // Check session cache
  const cacheKey = `stock_${symbol}_${timeframeKey}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) { /* ignore cache errors */ }
  }

  const url = `${YAHOO_BASE}${encodeURIComponent(symbol)}?range=${tf.range}&interval=${tf.interval}`;

  let data;
  try {
    // Try direct call first
    data = await fetchJSON(url);
  } catch (e) {
    // Fall back to CORS proxy
    try {
      data = await fetchJSON(`${CORS_PROXY}${encodeURIComponent(url)}`);
    } catch (e2) {
      throw new Error(`Failed to fetch data for ${symbol}. Please try again.`);
    }
  }

  const normalized = normalizeYahooData(data, symbol);
  if (normalized.length === 0) {
    throw new Error(`No data available for ${symbol}.`);
  }

  // Cache in session storage
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(normalized));
  } catch (e) { /* storage full, ignore */ }

  return normalized;
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function normalizeYahooData(data, symbol) {
  try {
    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];

    const normalized = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = quote.close[i];
      if (close == null || isNaN(close)) continue;

      normalized.push({
        timestamp: timestamps[i],
        open: quote.open[i] || close,
        high: quote.high[i] || close,
        low: quote.low[i] || close,
        close,
        volume: quote.volume[i] || 0,
        date: new Date(timestamps[i] * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      });
    }

    return normalized;
  } catch (e) {
    throw new Error(`Invalid data format for ${symbol}`);
  }
}

/**
 * Generate sample data for testing (used when API fails or for demos).
 */
export function generateSampleData(days = 252) {
  const data = [];
  let price = 100 + Math.random() * 100;
  const startTime = Date.now() / 1000 - days * 86400;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.48) * price * 0.03;
    price = Math.max(5, price + change);

    const timestamp = startTime + i * 86400;
    data.push({
      timestamp,
      open: price - Math.random() * 2,
      high: price + Math.random() * 3,
      low: price - Math.random() * 3,
      close: price,
      volume: Math.floor(Math.random() * 10000000),
      date: new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });
  }

  return data;
}
