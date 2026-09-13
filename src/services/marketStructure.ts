import { Candle } from '../types';

export interface SwingPoint {
  index: number;
  price: number;
  type: 'HIGH' | 'LOW';
  time: number;
}

export function detectSwingPoints(candles: Candle[], window = 3): SwingPoint[] {
  const points: SwingPoint[] = [];

  for (let i = window; i < candles.length - window; i++) {
    const currentHigh = candles[i].high;
    const currentLow = candles[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= window; j++) {
      if (candles[i - j].high >= currentHigh || candles[i + j].high > currentHigh) {
        isHigh = false;
      }
      if (candles[i - j].low <= currentLow || candles[i + j].low < currentLow) {
        isLow = false;
      }
    }

    if (isHigh) {
      points.push({ index: i, price: currentHigh, type: 'HIGH', time: candles[i].time });
    } else if (isLow) {
      points.push({ index: i, price: currentLow, type: 'LOW', time: candles[i].time });
    }
  }

  return points;
}

export function analyzeMarketStructure(candles: Candle[]): {
  trend: 'Bullish' | 'Bearish' | 'Neutral / Ranging';
  structure: 'Bullish BOS' | 'Bearish BOS' | 'CHoCH Bullish' | 'CHoCH Bearish' | 'Equal Highs/Lows' | 'Consolidation';
  keySupport: number;
  keyResistance: number;
  lastSwingHigh?: number;
  lastSwingLow?: number;
} {
  if (candles.length < 15) {
    const last = candles[candles.length - 1];
    return {
      trend: 'Neutral / Ranging',
      structure: 'Consolidation',
      keySupport: last ? last.low * 0.98 : 0,
      keyResistance: last ? last.high * 1.02 : 0,
    };
  }

  const swings = detectSwingPoints(candles, 2);
  const highs = swings.filter((s) => s.type === 'HIGH');
  const lows = swings.filter((s) => s.type === 'LOW');

  const currentPrice = candles[candles.length - 1].close;

  // Key Support and Resistance from prominent swings
  const recentLows = lows.slice(-4).map((l) => l.price);
  const recentHighs = highs.slice(-4).map((h) => h.price);

  const keySupport = recentLows.length > 0 ? Math.min(...recentLows) : currentPrice * 0.98;
  const keyResistance = recentHighs.length > 0 ? Math.max(...recentHighs) : currentPrice * 1.02;

  const lastHigh = highs[highs.length - 1]?.price ?? currentPrice * 1.01;
  const prevHigh = highs[highs.length - 2]?.price ?? lastHigh;
  const lastLow = lows[lows.length - 1]?.price ?? currentPrice * 0.99;
  const prevLow = lows[lows.length - 2]?.price ?? lastLow;

  const isHigherHigh = lastHigh > prevHigh * 1.001;
  const isHigherLow = lastLow > prevLow * 1.001;
  const isLowerHigh = lastHigh < prevHigh * 0.999;
  const isLowerLow = lastLow < prevLow * 0.999;

  let trend: 'Bullish' | 'Bearish' | 'Neutral / Ranging' = 'Neutral / Ranging';
  let structure: 'Bullish BOS' | 'Bearish BOS' | 'CHoCH Bullish' | 'CHoCH Bearish' | 'Equal Highs/Lows' | 'Consolidation' = 'Consolidation';

  if (isHigherHigh && isHigherLow) {
    trend = 'Bullish';
    structure = currentPrice > lastHigh ? 'Bullish BOS' : 'Consolidation';
  } else if (isLowerHigh && isLowerLow) {
    trend = 'Bearish';
    structure = currentPrice < lastLow ? 'Bearish BOS' : 'Consolidation';
  } else if (isHigherHigh && isLowerLow) {
    // Expanding / volatility
    trend = 'Neutral / Ranging';
    structure = 'Consolidation';
  } else if (isHigherLow && currentPrice > lastHigh) {
    trend = 'Bullish';
    structure = 'CHoCH Bullish';
  } else if (isLowerHigh && currentPrice < lastLow) {
    trend = 'Bearish';
    structure = 'CHoCH Bearish';
  } else {
    // Check for Equal Highs or Lows (liquidity pool)
    const eqhDiff = Math.abs(lastHigh - prevHigh) / lastHigh;
    const eqlDiff = Math.abs(lastLow - prevLow) / lastLow;
    if (eqhDiff < 0.0015 || eqlDiff < 0.0015) {
      structure = 'Equal Highs/Lows';
    }
  }

  return {
    trend,
    structure,
    keySupport,
    keyResistance,
    lastSwingHigh: lastHigh,
    lastSwingLow: lastLow,
  };
}
