let tickerData = [];
let loaded = false;
let debounceTimer = null;

/**
 * Load ticker data from JSON file.
 */
export async function loadTickers() {
  if (loaded) return;
  try {
    const response = await fetch('data/tickers.json');
    tickerData = await response.json();
    loaded = true;
  } catch (e) {
    console.warn('Failed to load tickers.json, using built-in list');
    tickerData = getBuiltInTickers();
    loaded = true;
  }
}

/**
 * Search tickers with fuzzy matching.
 * Returns top 8 results.
 */
export function searchTickers(query) {
  if (!query || query.length === 0) return [];

  const q = query.toUpperCase().trim();
  const results = [];

  for (const ticker of tickerData) {
    const sym = ticker.symbol.toUpperCase();
    const name = (ticker.name || '').toUpperCase();

    let score = 0;

    // Exact symbol match
    if (sym === q) {
      score = 100;
    }
    // Symbol prefix match
    else if (sym.startsWith(q)) {
      score = 80 - sym.length;
    }
    // Name prefix match (word-level)
    else if (name.startsWith(q)) {
      score = 60;
    }
    // Name word-start match
    else if (name.split(/\s+/).some(w => w.startsWith(q))) {
      score = 40;
    }
    // Symbol substring
    else if (sym.includes(q)) {
      score = 30;
    }
    // Name substring
    else if (name.includes(q)) {
      score = 20;
    }

    if (score > 0) {
      results.push({ ...ticker, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 8);
}

/**
 * Debounced search.
 */
export function debouncedSearch(query, callback, delay = 150) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    callback(searchTickers(query));
  }, delay);
}

/**
 * Built-in fallback ticker list (popular stocks).
 */
function getBuiltInTickers() {
  return [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'BAC', name: 'Bank of America Corp.' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
    { symbol: 'KO', name: 'Coca-Cola Co.' },
    { symbol: 'PEP', name: 'PepsiCo Inc.' },
    { symbol: 'COST', name: 'Costco Wholesale Corp.' },
    { symbol: 'TMO', name: 'Thermo Fisher Scientific' },
    { symbol: 'AVGO', name: 'Broadcom Inc.' },
    { symbol: 'ABT', name: 'Abbott Laboratories' },
    { symbol: 'NKE', name: 'Nike Inc.' },
    { symbol: 'MRK', name: 'Merck & Co Inc.' },
    { symbol: 'CVX', name: 'Chevron Corporation' },
    { symbol: 'LLY', name: 'Eli Lilly and Company' },
    { symbol: 'ORCL', name: 'Oracle Corporation' },
    { symbol: 'AMD', name: 'Advanced Micro Devices' },
    { symbol: 'INTC', name: 'Intel Corporation' },
    { symbol: 'QCOM', name: 'Qualcomm Inc.' },
    { symbol: 'T', name: 'AT&T Inc.' },
    { symbol: 'VZ', name: 'Verizon Communications' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.' },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
    { symbol: 'GME', name: 'GameStop Corp.' },
    { symbol: 'AMC', name: 'AMC Entertainment' },
    { symbol: 'PLTR', name: 'Palantir Technologies' },
    { symbol: 'COIN', name: 'Coinbase Global Inc.' },
    { symbol: 'SNAP', name: 'Snap Inc.' },
    { symbol: 'UBER', name: 'Uber Technologies Inc.' },
    { symbol: 'SQ', name: 'Block Inc.' },
    { symbol: 'SHOP', name: 'Shopify Inc.' },
    { symbol: 'ROKU', name: 'Roku Inc.' },
    { symbol: 'RBLX', name: 'Roblox Corporation' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
    { symbol: 'GLD', name: 'SPDR Gold Trust' },
    { symbol: 'BA', name: 'Boeing Company' },
    { symbol: 'CAT', name: 'Caterpillar Inc.' },
    { symbol: 'GS', name: 'Goldman Sachs Group' },
    { symbol: 'IBM', name: 'International Business Machines' },
    { symbol: 'SBUX', name: 'Starbucks Corporation' },
    { symbol: 'MCD', name: 'McDonald\'s Corporation' },
  ];
}
