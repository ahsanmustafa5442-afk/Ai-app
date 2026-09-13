import { Candle, ConfluenceAnalysis, Timeframe } from '../types';
import {
  analyzeSingleTimeframe,
  runComprehensiveScalpAnalysis,
} from './scalpEngine';

export { analyzeSingleTimeframe, runComprehensiveScalpAnalysis };

/**
 * Primary multi-timeframe confluence analysis optimized specifically for short-term SCALP TRADING.
 * Preserves full compatibility with all existing app consumers while applying the strict
 * 15M (Setup) -> 5M (Confirmation) -> 3M (Displacement) -> 1M (Execution Timing) hierarchy,
 * 4H/1H directional filters, and strict ~1:3 R:R validation.
 */
export function runComprehensiveConfluenceAnalysis(
  symbol: string,
  timeframeCandles: Record<Timeframe, Candle[]>,
  currentPrice: number,
  openInterest = 1200000000,
  oiChange24h = 3.5,
  priceChange24h = 2.4,
  marketRegimeBias?: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP'
): ConfluenceAnalysis {
  return runComprehensiveScalpAnalysis(
    symbol,
    timeframeCandles,
    currentPrice,
    openInterest,
    oiChange24h,
    priceChange24h,
    marketRegimeBias
  );
}
