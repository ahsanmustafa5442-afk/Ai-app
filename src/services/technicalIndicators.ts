import { Candle } from '../types';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  if (prices.length < period) return new Array(prices.length).fill(prices[prices.length - 1]);

  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(prices.length);

  // Simple Moving Average as first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let prevEma = sum / period;
  emaArray[period - 1] = prevEma;

  // Populate previous indices with SMA baseline
  for (let i = 0; i < period - 1; i++) {
    emaArray[i] = prices[i];
  }

  for (let i = period; i < prices.length; i++) {
    const currentEma = prices[i] * k + prevEma * (1 - k);
    emaArray[i] = currentEma;
    prevEma = currentEma;
  }

  return emaArray;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period = 14): number[] {
  if (prices.length <= period) return new Array(prices.length).fill(50);

  const rsiArray: number[] = new Array(prices.length).fill(50);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsiArray[period] = 100 - 100 / (1 + rs);

  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiArray[i] = 100 - 100 / (1 + rs);
  }

  return rsiArray;
}

/**
 * Calculates Volume-Weighted Average Price (VWAP)
 */
export function calculateVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  let cumulativeTypicalPriceVolume = 0;
  let cumulativeVolume = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativeTypicalPriceVolume += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
  }

  return cumulativeVolume > 0 ? cumulativeTypicalPriceVolume / cumulativeVolume : candles[candles.length - 1].close;
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return candles[0] ? candles[0].high - candles[0].low : 0;

  const trValues: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trValues.push(tr);
  }

  const slice = trValues.slice(-period);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return sum / slice.length;
}
