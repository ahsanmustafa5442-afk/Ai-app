import { Candle } from '../types';

export interface SupplyDemandZone {
  type: 'DEMAND' | 'SUPPLY';
  top: number;
  bottom: number;
  timeframeCandleIndex: number;
  mitigated: boolean;
}

export interface SupplyDemandAnalysis {
  condition: 'In Demand Zone' | 'In Supply Zone' | 'Equilibrium' | 'Approaching Demand' | 'Approaching Supply';
  activeDemand?: { top: number; bottom: number };
  activeSupply?: { top: number; bottom: number };
  equilibriumPrice: number;
  discountZone: boolean;
  premiumZone: boolean;
  details: string;
}

export function analyzeSupplyDemand(candles: Candle[]): SupplyDemandAnalysis {
  if (candles.length < 15) {
    const p = candles[candles.length - 1]?.close || 100;
    return {
      condition: 'Equilibrium',
      equilibriumPrice: p,
      discountZone: false,
      premiumZone: false,
      details: 'Insufficient data to map supply/demand zones.',
    };
  }

  // Find range high and low of the last 30 candles
  const lookback = candles.slice(-30);
  const highest = Math.max(...lookback.map((c) => c.high));
  const lowest = Math.min(...lookback.map((c) => c.low));
  const equilibriumPrice = (highest + lowest) / 2;

  const currentPrice = candles[candles.length - 1].close;
  const isDiscount = currentPrice < equilibriumPrice;
  const isPremium = currentPrice > equilibriumPrice;

  // Identify most recent impulsive moves to define Order Blocks (Demand / Supply)
  // Demand OB: Last bearish candle prior to a strong green displacement upwards
  let demandZone: { top: number; bottom: number } | undefined;
  for (let i = candles.length - 3; i >= 5; i--) {
    const c = candles[i];
    const next = candles[i + 1];
    const nextNext = candles[i + 2];

    const isDisplacementUp =
      next.close > next.open &&
      nextNext &&
      nextNext.close > next.high &&
      (nextNext.close - c.low) / c.low > 0.008;

    if (c.close < c.open && isDisplacementUp) {
      demandZone = { top: Math.max(c.open, c.close), bottom: c.low };
      break;
    }
  }

  // Supply OB: Last bullish candle prior to a strong red displacement downwards
  let supplyZone: { top: number; bottom: number } | undefined;
  for (let i = candles.length - 3; i >= 5; i--) {
    const c = candles[i];
    const next = candles[i + 1];
    const nextNext = candles[i + 2];

    const isDisplacementDown =
      next.close < next.open &&
      nextNext &&
      nextNext.close < next.low &&
      (c.high - nextNext.close) / c.high > 0.008;

    if (c.close > c.open && isDisplacementDown) {
      supplyZone = { top: c.high, bottom: Math.min(c.open, c.close) };
      break;
    }
  }

  // Fallback zones based on range extremes if OB not found
  if (!demandZone) {
    demandZone = { top: lowest * 1.008, bottom: lowest };
  }
  if (!supplyZone) {
    supplyZone = { top: highest, bottom: highest * 0.992 };
  }

  let condition: SupplyDemandAnalysis['condition'] = 'Equilibrium';
  let details = `Trading around equilibrium ($${equilibriumPrice.toFixed(2)}). Neither premium nor discount is extreme.`;

  if (currentPrice >= demandZone.bottom && currentPrice <= demandZone.top * 1.002) {
    condition = 'In Demand Zone';
    details = `Currently inside institutional Demand / Order Block zone ($${demandZone.bottom.toFixed(2)} - $${demandZone.top.toFixed(2)}). Price in deep discount.`;
  } else if (currentPrice >= supplyZone.bottom * 0.998 && currentPrice <= supplyZone.top) {
    condition = 'In Supply Zone';
    details = `Currently inside institutional Supply / Order Block zone ($${supplyZone.bottom.toFixed(2)} - $${supplyZone.top.toFixed(2)}). Price in premium territory.`;
  } else if (currentPrice > demandZone.top && currentPrice <= demandZone.top * 1.006) {
    condition = 'Approaching Demand';
    details = `Price pulling back towards Demand OB ($${demandZone.bottom.toFixed(2)} - $${demandZone.top.toFixed(2)}). Favorable for long setup trigger.`;
  } else if (currentPrice < supplyZone.bottom && currentPrice >= supplyZone.bottom * 0.994) {
    condition = 'Approaching Supply';
    details = `Price rallying towards Supply OB ($${supplyZone.bottom.toFixed(2)} - $${supplyZone.top.toFixed(2)}). Potential rejection zone.`;
  }

  return {
    condition,
    activeDemand: demandZone,
    activeSupply: supplyZone,
    equilibriumPrice,
    discountZone: isDiscount,
    premiumZone: isPremium,
    details,
  };
}
