import { Candle, MarketStats, Timeframe } from '../types';

export interface SymbolConfig {
  symbol: string;
  name: string;
  basePrice: number;
  tickSize: number;
  precision: number;
  volatility: number;
}

export const SUPPORTED_SYMBOLS: SymbolConfig[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin Futures', basePrice: 89620.0, tickSize: 0.1, precision: 1, volatility: 0.004 },
  { symbol: 'ETHUSDT', name: 'Ethereum Futures', basePrice: 3180.5, tickSize: 0.01, precision: 2, volatility: 0.006 },
  { symbol: 'SOLUSDT', name: 'Solana Futures', basePrice: 188.4, tickSize: 0.01, precision: 2, volatility: 0.009 },
  { symbol: 'BNBUSDT', name: 'BNB Futures', basePrice: 628.0, tickSize: 0.01, precision: 2, volatility: 0.005 },
  { symbol: 'DOGEUSDT', name: 'Dogecoin Futures', basePrice: 0.2465, tickSize: 0.0001, precision: 4, volatility: 0.012 },
  { symbol: 'XRPUSDT', name: 'XRP Futures', basePrice: 2.145, tickSize: 0.0001, precision: 4, volatility: 0.008 },
  { symbol: 'SUIUSDT', name: 'Sui Futures', basePrice: 3.285, tickSize: 0.0001, precision: 4, volatility: 0.011 },
  { symbol: 'ADAUSDT', name: 'Cardano Futures', basePrice: 0.824, tickSize: 0.0001, precision: 4, volatility: 0.010 },
  { symbol: 'AVAXUSDT', name: 'Avalanche Futures', basePrice: 36.8, tickSize: 0.01, precision: 2, volatility: 0.011 },
  { symbol: 'LINKUSDT', name: 'Chainlink Futures', basePrice: 18.45, tickSize: 0.001, precision: 3, volatility: 0.009 },
  { symbol: 'NEARUSDT', name: 'NEAR Futures', basePrice: 5.65, tickSize: 0.001, precision: 3, volatility: 0.012 },
  { symbol: 'APTUSDT', name: 'Aptos Futures', basePrice: 11.2, tickSize: 0.001, precision: 3, volatility: 0.013 },
  { symbol: 'ARBUSDT', name: 'Arbitrum Futures', basePrice: 0.74, tickSize: 0.0001, precision: 4, volatility: 0.011 },
  { symbol: 'OPUSDT', name: 'Optimism Futures', basePrice: 1.68, tickSize: 0.001, precision: 3, volatility: 0.012 },
  { symbol: 'DOTUSDT', name: 'Polkadot Futures', basePrice: 8.12, tickSize: 0.001, precision: 3, volatility: 0.009 },
  { symbol: 'POLUSDT', name: 'Polygon Futures', basePrice: 0.485, tickSize: 0.0001, precision: 4, volatility: 0.010 },
  { symbol: 'PEPEUSDT', name: 'Pepe Futures', basePrice: 0.0000185, tickSize: 0.0000001, precision: 7, volatility: 0.016 },
  { symbol: 'WIFUSDT', name: 'dogwifhat Futures', basePrice: 2.85, tickSize: 0.001, precision: 3, volatility: 0.015 },
  { symbol: 'INJUSDT', name: 'Injective Futures', basePrice: 22.4, tickSize: 0.001, precision: 3, volatility: 0.012 },
  { symbol: 'RENDERUSDT', name: 'Render Futures', basePrice: 8.45, tickSize: 0.001, precision: 3, volatility: 0.013 },
  { symbol: 'FETUSDT', name: 'ASI Futures', basePrice: 1.48, tickSize: 0.0001, precision: 4, volatility: 0.014 },
  { symbol: 'SEIUSDT', name: 'Sei Futures', basePrice: 0.52, tickSize: 0.0001, precision: 4, volatility: 0.012 },
  { symbol: 'LTCUSDT', name: 'Litecoin Futures', basePrice: 92.5, tickSize: 0.01, precision: 2, volatility: 0.007 },
  { symbol: 'BCHUSDT', name: 'Bitcoin Cash Futures', basePrice: 485.0, tickSize: 0.01, precision: 2, volatility: 0.008 },
  { symbol: 'UNIUSDT', name: 'Uniswap Futures', basePrice: 10.85, tickSize: 0.001, precision: 3, volatility: 0.010 },
  { symbol: 'AAVEUSDT', name: 'Aave Futures', basePrice: 182.0, tickSize: 0.01, precision: 2, volatility: 0.011 },
];

export function getSymbolConfig(symbol: string): SymbolConfig {
  const normalized = symbol.toUpperCase().trim();
  const found = SUPPORTED_SYMBOLS.find((s) => s.symbol === normalized);
  if (found) return found;

  // Custom symbol fallback
  return {
    symbol: normalized,
    name: `${normalized} Futures`,
    basePrice: 50.0,
    tickSize: 0.01,
    precision: 2,
    volatility: 0.007,
  };
}

export function generateRealisticCandles(
  basePrice: number,
  timeframe: Timeframe,
  count = 60,
  bias: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP' = 'BULLISH'
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();

  const intervalMs: Record<Timeframe, number> = {
    '4H': 4 * 60 * 60 * 1000,
    '1H': 1 * 60 * 60 * 1000,
    '15M': 15 * 60 * 1000,
    '5M': 5 * 60 * 1000,
    '3M': 3 * 60 * 1000,
    '1M': 1 * 60 * 1000,
  };

  const stepMs = intervalMs[timeframe];
  let currentClose = basePrice * (1 - (bias === 'BULLISH' ? 0.02 : bias === 'BEARISH' ? -0.02 : 0.005));

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * stepMs;
    const progress = (count - i) / count;

    let drift = 0;
    if (bias === 'BULLISH') {
      drift = 0.0008 + (Math.sin(i * 0.4) * 0.001);
    } else if (bias === 'BEARISH') {
      drift = -0.0008 + (Math.cos(i * 0.4) * 0.001);
    } else if (bias === 'LIQUIDITY_SWEEP') {
      // sweep lower then bounce sharp at the end
      if (i <= 3) {
        drift = 0.003; // sharp recovery
      } else if (i <= 6) {
        drift = -0.003; // sharp plunge to sweep low
      } else {
        drift = Math.sin(i * 0.3) * 0.001;
      }
    } else {
      // Ranging / conflicting
      drift = Math.sin(i * 0.6) * 0.002;
    }

    const randomNoise = (Math.random() - 0.48) * 0.004;
    const open = currentClose;
    const change = open * (drift + randomNoise);
    const close = open + change;

    const candleRange = Math.abs(change) + open * (0.002 + Math.random() * 0.003);
    const high = Math.max(open, close) + candleRange * (Math.random() * 0.5);
    const low = Math.min(open, close) - candleRange * (Math.random() * 0.5);

    const baseVol = basePrice > 1000 ? 500 : 50000;
    const volume = baseVol * (0.6 + Math.random() * 0.8 + (Math.abs(change) / open) * 20);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });

    currentClose = close;
  }

  return candles;
}

export function generateMarketStats(
  symbol: string,
  currentPrice: number,
  change24h = 3.42
): MarketStats {
  const cfg = getSymbolConfig(symbol);
  const markPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.0002);
  const high24h = currentPrice * (1 + Math.abs(change24h * 0.008) + 0.015);
  const low24h = currentPrice * (1 - Math.abs(change24h * 0.008) - 0.012);

  // Scaled realistic volume & OI based on symbol
  const isLarge = cfg.basePrice > 1000;
  const volume24h = isLarge ? 2840000000 + Math.random() * 200000000 : 450000000 + Math.random() * 50000000;
  const openInterest = isLarge ? 1650000000 + Math.random() * 80000000 : 180000000 + Math.random() * 20000000;
  const openInterestChange24h = change24h > 0 ? 4.2 + (Math.random() - 0.5) * 2 : -2.1 + (Math.random() - 0.5) * 2;
  const fundingRate = 0.0001 + (change24h > 0 ? 0.00004 : -0.00003); // +0.01% standard

  return {
    symbol: cfg.symbol,
    currentPrice,
    markPrice,
    change24h,
    high24h,
    low24h,
    volume24h,
    openInterest,
    openInterestChange24h,
    fundingRate,
    nextFundingTime: '04:00:00 UTC (in 2h 48m)',
  };
}
