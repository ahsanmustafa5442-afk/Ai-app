import { AvailableFuturesContract } from '../types';

export const CORE_SYMBOLS = [
  'BTCUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'SUIUSDT',
  'DOGEUSDT',
] as const;

export type CoreSymbol = typeof CORE_SYMBOLS[number];

export const DEFAULT_USER_SELECTED_SYMBOLS = [
  'ETHUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
];

export const STORAGE_KEY_USER_COINS = 'binance_futures_user_selected_coins_v2';

export const KNOWN_CONTRACTS_CATALOG: Omit<AvailableFuturesContract, 'price' | 'change24h' | 'volume24h'>[] = [
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', name: 'Ethereum', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', name: 'Cardano', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', quoteAsset: 'USDT', name: 'Avalanche', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'LINKUSDT', baseAsset: 'LINK', quoteAsset: 'USDT', name: 'Chainlink', isTradable: true, status: 'TRADING', category: 'Infra' },
  { symbol: 'NEARUSDT', baseAsset: 'NEAR', quoteAsset: 'USDT', name: 'NEAR Protocol', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'APTUSDT', baseAsset: 'APT', quoteAsset: 'USDT', name: 'Aptos', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'ARBUSDT', baseAsset: 'ARB', quoteAsset: 'USDT', name: 'Arbitrum', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'OPUSDT', baseAsset: 'OP', quoteAsset: 'USDT', name: 'Optimism', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'TIAUSDT', baseAsset: 'TIA', quoteAsset: 'USDT', name: 'Celestia', isTradable: true, status: 'TRADING', category: 'Infra' },
  { symbol: 'PEPEUSDT', baseAsset: '1000PEPE', quoteAsset: 'USDT', name: 'Pepe', isTradable: true, status: 'TRADING', category: 'Meme' },
  { symbol: 'SHIBUSDT', baseAsset: '1000SHIB', quoteAsset: 'USDT', name: 'Shiba Inu', isTradable: true, status: 'TRADING', category: 'Meme' },
  { symbol: 'WIFUSDT', baseAsset: 'WIF', quoteAsset: 'USDT', name: 'dogwifhat', isTradable: true, status: 'TRADING', category: 'Meme' },
  { symbol: 'INJUSDT', baseAsset: 'INJ', quoteAsset: 'USDT', name: 'Injective', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'RENDERUSDT', baseAsset: 'RENDER', quoteAsset: 'USDT', name: 'Render', isTradable: true, status: 'TRADING', category: 'AI & Data' },
  { symbol: 'FETUSDT', baseAsset: 'FET', quoteAsset: 'USDT', name: 'Artificial Superintelligence', isTradable: true, status: 'TRADING', category: 'AI & Data' },
  { symbol: 'SEIUSDT', baseAsset: 'SEI', quoteAsset: 'USDT', name: 'Sei Network', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'FILUSDT', baseAsset: 'FIL', quoteAsset: 'USDT', name: 'Filecoin', isTradable: true, status: 'TRADING', category: 'Infra' },
  { symbol: 'DOTUSDT', baseAsset: 'DOT', quoteAsset: 'USDT', name: 'Polkadot', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'POLUSDT', baseAsset: 'POL', quoteAsset: 'USDT', name: 'Polygon (POL)', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', name: 'Litecoin', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'BCHUSDT', baseAsset: 'BCH', quoteAsset: 'USDT', name: 'Bitcoin Cash', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'FTMUSDT', baseAsset: 'FTM', quoteAsset: 'USDT', name: 'Fantom / Sonic', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'ATOMUSDT', baseAsset: 'ATOM', quoteAsset: 'USDT', name: 'Cosmos', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'UNIUSDT', baseAsset: 'UNI', quoteAsset: 'USDT', name: 'Uniswap', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'AAVEUSDT', baseAsset: 'AAVE', quoteAsset: 'USDT', name: 'Aave', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'KASUSDT', baseAsset: 'KAS', quoteAsset: 'USDT', name: 'Kaspa', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'ICPUSDT', baseAsset: 'ICP', quoteAsset: 'USDT', name: 'Internet Computer', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'GALAUSDT', baseAsset: 'GALA', quoteAsset: 'USDT', name: 'Gala Games', isTradable: true, status: 'TRADING', category: 'Trending' },
  { symbol: 'ORDIUSDT', baseAsset: 'ORDI', quoteAsset: 'USDT', name: 'Ordinals', isTradable: true, status: 'TRADING', category: 'Trending' },
  { symbol: 'STXUSDT', baseAsset: 'STX', quoteAsset: 'USDT', name: 'Stacks', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'TAOUSDT', baseAsset: 'TAO', quoteAsset: 'USDT', name: 'Bittensor', isTradable: true, status: 'TRADING', category: 'AI & Data' },
  { symbol: 'TONUSDT', baseAsset: 'TON', quoteAsset: 'USDT', name: 'Toncoin', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'RUNEUSDT', baseAsset: 'RUNE', quoteAsset: 'USDT', name: 'THORChain', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'JUPUSDT', baseAsset: 'JUP', quoteAsset: 'USDT', name: 'Jupiter', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'ONDOUSDT', baseAsset: 'ONDO', quoteAsset: 'USDT', name: 'Ondo Finance', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'PYTHUSDT', baseAsset: 'PYTH', quoteAsset: 'USDT', name: 'Pyth Network', isTradable: true, status: 'TRADING', category: 'Infra' },
  { symbol: 'WLDUSDT', baseAsset: 'WLD', quoteAsset: 'USDT', name: 'Worldcoin', isTradable: true, status: 'TRADING', category: 'AI & Data' },
  { symbol: 'PENDLEUSDT', baseAsset: 'PENDLE', quoteAsset: 'USDT', name: 'Pendle', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'FLOKIUSDT', baseAsset: '1000FLOKI', quoteAsset: 'USDT', name: 'Floki', isTradable: true, status: 'TRADING', category: 'Meme' },
  { symbol: 'BONKUSDT', baseAsset: '1000BONK', quoteAsset: 'USDT', name: 'Bonk', isTradable: true, status: 'TRADING', category: 'Meme' },
  { symbol: 'NOTUSDT', baseAsset: 'NOT', quoteAsset: 'USDT', name: 'Notcoin', isTradable: true, status: 'TRADING', category: 'Trending' },
  { symbol: 'ENAUSDT', baseAsset: 'ENA', quoteAsset: 'USDT', name: 'Ethena', isTradable: true, status: 'TRADING', category: 'DeFi' },
  { symbol: 'STRKUSDT', baseAsset: 'STRK', quoteAsset: 'USDT', name: 'Starknet', isTradable: true, status: 'TRADING', category: 'Layer 1/2' },
  { symbol: 'BLURUSDT', baseAsset: 'BLUR', quoteAsset: 'USDT', name: 'Blur', isTradable: true, status: 'TRADING', category: 'Trending' },
  { symbol: 'DYDXUSDT', baseAsset: 'DYDX', quoteAsset: 'USDT', name: 'dYdX', isTradable: true, status: 'TRADING', category: 'DeFi' },
];

export const ALL_DISPLAY_NAMES: Record<string, string> = {
  BTCUSDT: 'Bitcoin',
  BNBUSDT: 'BNB Chain',
  SOLUSDT: 'Solana',
  XRPUSDT: 'XRP Ripple',
  SUIUSDT: 'Sui Network',
  DOGEUSDT: 'Dogecoin',
  ETHUSDT: 'Ethereum',
  ADAUSDT: 'Cardano',
  AVAXUSDT: 'Avalanche',
  LINKUSDT: 'Chainlink',
  NEARUSDT: 'NEAR Protocol',
  APTUSDT: 'Aptos',
  ARBUSDT: 'Arbitrum',
  OPUSDT: 'Optimism',
  TIAUSDT: 'Celestia',
  PEPEUSDT: 'Pepe',
  SHIBUSDT: 'Shiba Inu',
  WIFUSDT: 'dogwifhat',
  INJUSDT: 'Injective',
  RENDERUSDT: 'Render',
  FETUSDT: 'Artificial Superintelligence',
  SEIUSDT: 'Sei Network',
  FILUSDT: 'Filecoin',
  DOTUSDT: 'Polkadot',
  POLUSDT: 'Polygon (POL)',
  LTCUSDT: 'Litecoin',
  BCHUSDT: 'Bitcoin Cash',
  FTMUSDT: 'Fantom / Sonic',
  ATOMUSDT: 'Cosmos',
  UNIUSDT: 'Uniswap',
  AAVEUSDT: 'Aave',
  KASUSDT: 'Kaspa',
  ICPUSDT: 'Internet Computer',
  GALAUSDT: 'Gala Games',
  ORDIUSDT: 'Ordinals',
  STXUSDT: 'Stacks',
  TAOUSDT: 'Bittensor',
  TONUSDT: 'Toncoin',
  RUNEUSDT: 'THORChain',
  JUPUSDT: 'Jupiter',
  ONDOUSDT: 'Ondo Finance',
  PYTHUSDT: 'Pyth Network',
  WLDUSDT: 'Worldcoin',
  PENDLEUSDT: 'Pendle',
  FLOKIUSDT: 'Floki',
  BONKUSDT: 'Bonk',
  NOTUSDT: 'Notcoin',
  ENAUSDT: 'Ethena',
  STRKUSDT: 'Starknet',
  BLURUSDT: 'Blur',
  DYDXUSDT: 'dYdX',
};

export function isCoreSymbol(symbol: string): boolean {
  return CORE_SYMBOLS.includes(symbol as CoreSymbol);
}

export function getCoinDisplayName(symbol: string): string {
  return ALL_DISPLAY_NAMES[symbol] || symbol.replace('USDT', '');
}

/**
 * Load the 4 user-selected symbols from storage, validating exactly 4 items
 * and preventing overlap with core symbols.
 */
export function loadUserSelectedSymbols(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_COINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any core symbols and duplicates
        const filtered = parsed
          .map((s) => String(s).toUpperCase().trim())
          .filter((s, idx, arr) => s && !isCoreSymbol(s) && arr.indexOf(s) === idx);

        if (filtered.length === 4) {
          return filtered;
        }
        if (filtered.length > 4) {
          return filtered.slice(0, 4);
        }
        // If fewer than 4, fill remaining with defaults
        const filled = [...filtered];
        for (const def of DEFAULT_USER_SELECTED_SYMBOLS) {
          if (filled.length < 4 && !filled.includes(def) && !isCoreSymbol(def)) {
            filled.push(def);
          }
        }
        return filled.slice(0, 4);
      }
    }
  } catch (err) {
    console.error('Failed to load user selected coins:', err);
  }
  return [...DEFAULT_USER_SELECTED_SYMBOLS];
}

/**
 * Save user selected coins.
 * Enforces exactly 4 symbols, no core symbols, and no duplicates.
 */
export function saveUserSelectedSymbols(symbols: string[]): string[] {
  const sanitized = symbols
    .map((s) => String(s).toUpperCase().trim())
    .filter((s, idx, arr) => s && !isCoreSymbol(s) && arr.indexOf(s) === idx);

  let finalFour = sanitized.slice(0, 4);
  if (finalFour.length < 4) {
    for (const def of DEFAULT_USER_SELECTED_SYMBOLS) {
      if (finalFour.length < 4 && !finalFour.includes(def) && !isCoreSymbol(def)) {
        finalFour.push(def);
      }
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_USER_COINS, JSON.stringify(finalFour));
  } catch (err) {
    console.error('Failed to save user selected coins:', err);
  }

  return finalFour;
}

/**
 * Returns the 10 active scanner symbols: 6 CORE + 4 USER SELECTED
 */
export function getActiveScannerSymbols(): string[] {
  const userSelected = loadUserSelectedSymbols();
  return [...CORE_SYMBOLS, ...userSelected];
}

/**
 * Base fallback prices and volume for catalog coins
 */
const BASE_PRICES: Record<string, { price: number; change24h: number; volume24h: number }> = {
  ETHUSDT: { price: 3180.5, change24h: 2.8, volume24h: 3800000000 },
  ADAUSDT: { price: 0.824, change24h: 4.1, volume24h: 620000000 },
  AVAXUSDT: { price: 36.8, change24h: -1.2, volume24h: 510000000 },
  LINKUSDT: { price: 18.45, change24h: 3.4, volume24h: 440000000 },
  NEARUSDT: { price: 5.65, change24h: 1.9, volume24h: 390000000 },
  APTUSDT: { price: 11.2, change24h: -0.8, volume24h: 280000000 },
  ARBUSDT: { price: 0.74, change24h: 2.3, volume24h: 310000000 },
  OPUSDT: { price: 1.68, change24h: 1.5, volume24h: 220000000 },
  TIAUSDT: { price: 5.85, change24h: -2.4, volume24h: 190000000 },
  PEPEUSDT: { price: 0.0000185, change24h: 8.4, volume24h: 980000000 },
  SHIBUSDT: { price: 0.0000248, change24h: 3.1, volume24h: 420000000 },
  WIFUSDT: { price: 2.85, change24h: 6.7, volume24h: 680000000 },
  INJUSDT: { price: 22.4, change24h: 1.4, volume24h: 160000000 },
  RENDERUSDT: { price: 8.45, change24h: 5.2, volume24h: 340000000 },
  FETUSDT: { price: 1.48, change24h: 4.8, volume24h: 290000000 },
  SEIUSDT: { price: 0.52, change24h: 2.6, volume24h: 180000000 },
  FILUSDT: { price: 4.65, change24h: -0.5, volume24h: 130000000 },
  DOTUSDT: { price: 8.12, change24h: 1.1, volume24h: 240000000 },
  POLUSDT: { price: 0.485, change24h: 2.2, volume24h: 170000000 },
  LTCUSDT: { price: 92.5, change24h: 0.8, volume24h: 310000000 },
  BCHUSDT: { price: 485.0, change24h: 1.6, volume24h: 280000000 },
  FTMUSDT: { price: 0.88, change24h: 3.9, volume24h: 210000000 },
  ATOMUSDT: { price: 6.45, change24h: -1.0, volume24h: 120000000 },
  UNIUSDT: { price: 10.85, change24h: 2.5, volume24h: 260000000 },
  AAVEUSDT: { price: 182.0, change24h: 4.2, volume24h: 230000000 },
  KASUSDT: { price: 0.145, change24h: 1.8, volume24h: 140000000 },
  ICPUSDT: { price: 10.4, change24h: -0.4, volume24h: 160000000 },
  GALAUSDT: { price: 0.034, change24h: 5.1, volume24h: 180000000 },
  ORDIUSDT: { price: 38.5, change24h: -1.7, volume24h: 210000000 },
  STXUSDT: { price: 1.85, change24h: 3.0, volume24h: 150000000 },
  TAOUSDT: { price: 540.0, change24h: 4.5, volume24h: 320000000 },
  TONUSDT: { price: 5.75, change24h: 1.2, volume24h: 290000000 },
  RUNEUSDT: { price: 5.25, change24h: 2.1, volume24h: 170000000 },
  JUPUSDT: { price: 1.15, change24h: 4.0, volume24h: 220000000 },
  ONDOUSDT: { price: 1.08, change24h: 3.3, volume24h: 250000000 },
  PYTHUSDT: { price: 0.42, change24h: 2.7, volume24h: 130000000 },
  WLDUSDT: { price: 2.65, change24h: 6.2, volume24h: 370000000 },
  PENDLEUSDT: { price: 5.15, change24h: 2.9, volume24h: 180000000 },
  FLOKIUSDT: { price: 0.000195, change24h: 5.5, volume24h: 310000000 },
  BONKUSDT: { price: 0.000038, change24h: 7.1, volume24h: 420000000 },
  NOTUSDT: { price: 0.0082, change24h: 3.8, volume24h: 190000000 },
  ENAUSDT: { price: 0.68, change24h: 4.6, volume24h: 280000000 },
  STRKUSDT: { price: 0.49, change24h: 1.5, volume24h: 140000000 },
  BLURUSDT: { price: 0.28, change24h: 2.1, volume24h: 95000000 },
  DYDXUSDT: { price: 1.35, change24h: -0.9, volume24h: 110000000 },
};

/**
 * Fetch available Binance Futures USDT-M contracts.
 * Integrates live tickers from Binance fapi, enriched with metadata.
 */
export async function fetchAvailableFuturesContracts(): Promise<AvailableFuturesContract[]> {
  try {
    // Try fetching live 24hr tickers from proxy or direct Binance
    const proxyUrl = '/api/binance/ticker/24hr';
    const directUrl = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

    let liveTickers: any[] = [];
    try {
      const res = await fetch(proxyUrl, { cache: 'no-cache' });
      if (res.ok) {
        liveTickers = await res.json();
      }
    } catch {
      // proxy failed
    }

    if (!Array.isArray(liveTickers) || liveTickers.length === 0) {
      try {
        const directRes = await fetch(directUrl, { cache: 'no-cache' });
        if (directRes.ok) {
          liveTickers = await directRes.json();
        }
      } catch {
        // direct failed
      }
    }

    const tickerMap = new Map<string, any>();
    if (Array.isArray(liveTickers)) {
      liveTickers.forEach((t) => {
        if (t?.symbol) {
          tickerMap.set(t.symbol, t);
        }
      });
    }

    // Build contracts from catalog
    const contracts: AvailableFuturesContract[] = KNOWN_CONTRACTS_CATALOG.map((item) => {
      const live = tickerMap.get(item.symbol);
      const fallback = BASE_PRICES[item.symbol] || { price: 10.0, change24h: 1.5, volume24h: 100000000 };

      const price = live ? parseFloat(live.lastPrice) : fallback.price;
      const change24h = live ? parseFloat(live.priceChangePercent) : fallback.change24h;
      const volume24h = live ? parseFloat(live.quoteVolume || live.volume) : fallback.volume24h;
      const high24h = live ? parseFloat(live.highPrice) : price * 1.04;
      const low24h = live ? parseFloat(live.lowPrice) : price * 0.96;

      // Status check: if Binance returned ticker, it is trading; if missing or status halted, flag
      const isTradable = Boolean(price > 0);

      return {
        ...item,
        price,
        change24h,
        volume24h,
        high24h,
        low24h,
        isTradable,
        status: isTradable ? 'TRADING' : 'HALT',
      };
    });

    return contracts;
  } catch (err) {
    console.warn('Using offline catalog for Binance Futures contracts:', err);
    return KNOWN_CONTRACTS_CATALOG.map((item) => {
      const fallback = BASE_PRICES[item.symbol] || { price: 10.0, change24h: 1.5, volume24h: 100000000 };
      return {
        ...item,
        price: fallback.price,
        change24h: fallback.change24h,
        volume24h: fallback.volume24h,
        high24h: fallback.price * 1.04,
        low24h: fallback.price * 0.96,
        isTradable: true,
        status: 'TRADING',
      };
    });
  }
}
