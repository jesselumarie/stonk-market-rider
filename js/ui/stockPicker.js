import { loadTickers, debouncedSearch } from '../data/tickerSearch.js';

let selectedTicker = null;
let selectedTimeframe = '1Y';
let onRideCallback = null;
let selectedIndex = -1;
let currentResults = [];

export async function initStockPicker(onRide) {
  onRideCallback = onRide;
  await loadTickers();

  const searchInput = document.getElementById('ticker-search');
  const autocompleteList = document.getElementById('autocomplete-list');
  const rideBtn = document.getElementById('ride-btn');
  const display = document.getElementById('selected-ticker-display');
  const errorMsg = document.getElementById('error-message');

  // Search input
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (query.length === 0) {
      hideAutocomplete();
      selectedTicker = null;
      rideBtn.disabled = true;
      display.textContent = '';
      return;
    }

    // Always enable ride with whatever is typed
    selectedTicker = { symbol: query.toUpperCase(), name: '' };
    display.textContent = query.toUpperCase();
    rideBtn.disabled = false;

    debouncedSearch(query, (results) => {
      currentResults = results;
      selectedIndex = -1;
      showAutocomplete(results, autocompleteList);
    });
  });

  // Keyboard navigation
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && autocompleteList.classList.contains('visible')) {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
      highlightItem(autocompleteList, selectedIndex);
    } else if (e.key === 'ArrowUp' && autocompleteList.classList.contains('visible')) {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlightItem(autocompleteList, selectedIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentResults.length) {
        selectTicker(currentResults[selectedIndex], searchInput, display, rideBtn);
        hideAutocomplete();
      } else if (searchInput.value.trim().length > 0) {
        // Use typed text as ticker directly
        selectTicker(
          { symbol: searchInput.value.trim().toUpperCase(), name: '' },
          searchInput, display, rideBtn
        );
        hideAutocomplete();
      }
    } else if (e.key === 'Escape') {
      hideAutocomplete();
    }
  });

  // Click outside closes autocomplete
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
      hideAutocomplete();
    }
  });

  // Timeframe buttons
  const tfButtons = document.querySelectorAll('.timeframe-btn');
  tfButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tfButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTimeframe = btn.dataset.tf;
    });
  });

  // Ride button
  rideBtn.addEventListener('click', () => {
    if (selectedTicker && onRideCallback) {
      errorMsg.textContent = '';
      onRideCallback(selectedTicker.symbol, selectedTicker.name, selectedTimeframe);
    }
  });
}

function showAutocomplete(results, listEl) {
  listEl.innerHTML = '';
  if (results.length === 0) {
    listEl.classList.remove('visible');
    return;
  }

  for (let i = 0; i < results.length; i++) {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.innerHTML = `<span class="symbol">${results[i].symbol}</span><span class="name">${results[i].name}</span>`;
    item.addEventListener('click', () => {
      selectTicker(
        results[i],
        document.getElementById('ticker-search'),
        document.getElementById('selected-ticker-display'),
        document.getElementById('ride-btn')
      );
      hideAutocomplete();
    });
    listEl.appendChild(item);
  }

  listEl.classList.add('visible');
}

function hideAutocomplete() {
  const list = document.getElementById('autocomplete-list');
  if (list) {
    list.classList.remove('visible');
    currentResults = [];
    selectedIndex = -1;
  }
}

function highlightItem(listEl, index) {
  const items = listEl.querySelectorAll('.autocomplete-item');
  items.forEach((item, i) => {
    item.classList.toggle('selected', i === index);
  });
}

function selectTicker(ticker, searchInput, display, rideBtn) {
  selectedTicker = ticker;
  searchInput.value = ticker.symbol;
  display.textContent = ticker.name ? `${ticker.symbol} - ${ticker.name}` : ticker.symbol;
  rideBtn.disabled = false;
}

export function showError(message) {
  const errorMsg = document.getElementById('error-message');
  if (errorMsg) errorMsg.textContent = message;
}

export function clearError() {
  const errorMsg = document.getElementById('error-message');
  if (errorMsg) errorMsg.textContent = '';
}

export function getSelectedTicker() {
  return selectedTicker;
}

export function getSelectedTimeframe() {
  return selectedTimeframe;
}

export function setTickerFromURL(symbol, timeframe) {
  selectedTicker = { symbol, name: '' };
  selectedTimeframe = timeframe || '1Y';

  const searchInput = document.getElementById('ticker-search');
  const display = document.getElementById('selected-ticker-display');
  const rideBtn = document.getElementById('ride-btn');

  if (searchInput) searchInput.value = symbol;
  if (display) display.textContent = symbol;
  if (rideBtn) rideBtn.disabled = false;

  // Set active timeframe button
  const tfButtons = document.querySelectorAll('.timeframe-btn');
  tfButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tf === selectedTimeframe);
  });
}
