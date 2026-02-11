/**
 * URL encode/decode for shareable ride links.
 */

export function encodeShareUrl(ticker, timeframe) {
  const params = new URLSearchParams();
  params.set('ticker', ticker);
  if (timeframe && timeframe !== '1Y') {
    params.set('range', timeframe.toLowerCase());
  }
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

export function decodeShareUrl() {
  const params = new URLSearchParams(window.location.search);
  const ticker = params.get('ticker');
  const range = (params.get('range') || '1y').toUpperCase();
  const autoplay = params.get('autoplay') === 'true';

  // Normalize range
  const validRanges = { '1D': '1D', '1MO': '1M', '1M': '1M', '6MO': '6M', '6M': '6M', '1Y': '1Y', '5Y': '5Y' };
  const timeframe = validRanges[range] || '1Y';

  if (!ticker) return null;

  return { ticker: ticker.toUpperCase(), timeframe, autoplay };
}

export async function copyShareUrl(ticker, timeframe) {
  const url = encodeShareUrl(ticker, timeframe);
  try {
    await navigator.clipboard.writeText(url);
    showToast('Link copied!');
  } catch (e) {
    // Fallback for older browsers
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    showToast('Link copied!');
  }
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2000);
}
