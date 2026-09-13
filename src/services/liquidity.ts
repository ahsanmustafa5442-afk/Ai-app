import { Candle } from '../types';
import { detectSwingPoints } from './marketStructure';

export interface LiquidityAnalysis {
  condition: 'Buy-Side Swept' | 'Sell-Side Swept' | 'Resting Liquidity Above' | 'Resting Liquidity Below' | 'Neutral';
  buySideLevel: number;
  sellSideLevel: number;
  sweptPrice?: number;
  details: string;
}

export function analyzeLiquidity(candles: Candle[]): LiquidityAnalysis {
  if (candles.length < 10) {
    const p = candles[candles.length - 1]?.close || 100;
    return {
      condition: 'Neutral',
      buySideLevel: p * 1.01,
      sellSideLevel: p * 0.99,
      details: 'Insufficient candle data to map liquidity pools.',
    };
  }

  const swings = detectSwingPoints(candles, 2);
  const highs = swings.filter((s) => s.type === 'HIGH').map((s) => s.price);
  const lows = swings.filter((s) => s.type === 'LOW').map((s) => s.price);

  const currentCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const currentPrice = currentCandle.close;

  const buySideLevel = highs.length > 0 ? Math.max(...highs.slice(-3)) : currentPrice * 1.015;
  const sellSideLevel = lows.length > 0 ? Math.min(...lows.slice(-3)) : currentPrice * 0.985;

  // Check for Sell-Side Sweep (Turtle Soup Long setup):
  // Current or previous candle wicked below recent swing low, but closed back above it
  const isSellSideSweep =
    (currentCandle.low < sellSideLevel && currentCandle.close > sellSideLevel) ||
    (prevCandle && prevCandle.low < sellSideLevel && currentCandle.close > sellSideLevel);

  // Check for Buy-Side Sweep (Turtle Soup Short setup):
  // Wicked above recent swing high, but closed back below it
  const isBuySideSweep =
    (currentCandle.high > buySideLevel && currentCandle.close < buySideLevel) ||
    (prevCandle && prevCandle.high > buySideLevel && currentCandle.close < buySideLevel);

  if (isSellSideSweep) {
    return {
      condition: 'Sell-Side Swept',
      buySideLevel,
      sellSideLevel,
      sweptPrice: sellSideLevel,
      details: `Sell-side liquidity swept below ${sellSideLevel.toFixed(2)}. Liquidity grabbed with rejection wick — Bullish reversal cue.`,
    };
  }

  if (isBuySideSweep) {
    return {
      condition: 'Buy-Side Swept',
      buySideLevel,
      sellSideLevel,
      sweptPrice: buySideLevel,
      details: `Buy-side liquidity swept above ${buySideLevel.toFixed(2)}. Trapped breakout buyers, closed back inside range — Bearish reversal cue.`,
    };
  }

  const distToHigh = (buySideLevel - currentPrice) / currentPrice;
  const distToLow = (currentPrice - sellSideLevel) / currentPrice;

  if (distToHigh < 0.004) {
    return {
      condition: 'Resting Liquidity Above',
      buySideLevel,
      sellSideLevel,
      details: `Approaching major buy-stop pool at ${buySideLevel.toFixed(2)}. Watch for liquidity sweep or expansion.`,
    };
  }

  if (distToLow < 0.004) {
    return {
      condition: 'Resting Liquidity Below',
      buySideLevel,
      sellSideLevel,
      details: `Hovering directly above sell-stop pool at ${sellSideLevel.toFixed(2)}. Watch for stop hunt or bounce.`,
    };
  }

  return {
    condition: 'Neutral',
    buySideLevel,
    sellSideLevel,
    details: 'Price navigating between resting liquidity pools without immediate sweeps.',
  };
}
