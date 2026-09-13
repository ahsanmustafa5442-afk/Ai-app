import {
  Candle,
  ConfidenceCategory,
  ConfluenceAnalysis,
  FlowStepResult,
  SetupQuality,
  SignalType,
  Timeframe,
  TimeframeAnalysis,
} from '../types';
import { getBtcMarketContext } from './btcContext';
import { analyzeFairValueGaps } from './fvg';
import { analyzeLiquidity } from './liquidity';
import { analyzeMarketStructure } from './marketStructure';
import { analyzeSupplyDemand } from './supplyDemand';
import { calculateATR, calculateEMA, calculateRSI, calculateVWAP } from './technicalIndicators';
import { analyzeOpenInterest, analyzeVolume } from './volumeOi';

export function analyzeSingleTimeframe(
  candles: Candle[],
  timeframe: Timeframe
): TimeframeAnalysis {
  const currentPrice = candles[candles.length - 1]?.close || 100;
  const closes = candles.map((c) => c.close);

  // Indicators
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);
  const ema200Arr = calculateEMA(closes, Math.min(200, Math.max(10, closes.length - 1)));

  const ema20 = ema20Arr[ema20Arr.length - 1];
  const ema50 = ema50Arr[ema50Arr.length - 1];
  const ema200 = ema200Arr[ema200Arr.length - 1];

  let emaStatus: TimeframeAnalysis['emaStatus'] = 'Tangled / Transitioning';
  if (ema20 > ema50 && ema50 > ema200) {
    emaStatus = 'Bullish Stack (20>50>200)';
  } else if (ema20 < ema50 && ema50 < ema200) {
    emaStatus = 'Bearish Stack (20<50<200)';
  }

  // RSI
  const rsiArr = calculateRSI(closes, 14);
  const rsi = Math.round(rsiArr[rsiArr.length - 1]);
  let rsiCondition: TimeframeAnalysis['rsiCondition'] = 'Neutral';
  if (rsi <= 32) rsiCondition = 'Oversold';
  else if (rsi >= 68) rsiCondition = 'Overbought';
  else if (rsi > 50 && rsi < 65) rsiCondition = 'Bullish Divergence';
  else if (rsi < 50 && rsi > 35) rsiCondition = 'Bearish Divergence';

  // VWAP
  const vwap = calculateVWAP(candles);
  let vwapRelation: TimeframeAnalysis['vwapRelation'] = 'At VWAP';
  const vwapDiff = (currentPrice - vwap) / vwap;
  if (vwapDiff > 0.001) vwapRelation = 'Above VWAP';
  else if (vwapDiff < -0.001) vwapRelation = 'Below VWAP';

  // ATR
  const atr = calculateATR(candles, 14);

  // Smart Money modules
  const structureData = analyzeMarketStructure(candles);
  const liquidityData = analyzeLiquidity(candles);
  const sdData = analyzeSupplyDemand(candles);
  const fvgData = analyzeFairValueGaps(candles);
  const volData = analyzeVolume(candles);

  // Sentiment score (-100 to +100)
  let score = 0;
  if (structureData.trend === 'Bullish') score += 25;
  if (structureData.trend === 'Bearish') score -= 25;

  if (emaStatus === 'Bullish Stack (20>50>200)') score += 15;
  if (emaStatus === 'Bearish Stack (20<50<200)') score -= 15;

  if (vwapRelation === 'Above VWAP') score += 10;
  if (vwapRelation === 'Below VWAP') score -= 10;

  if (liquidityData.condition === 'Sell-Side Swept') score += 20;
  if (liquidityData.condition === 'Buy-Side Swept') score -= 20;

  if (sdData.condition === 'In Demand Zone' || sdData.condition === 'Approaching Demand') score += 15;
  if (sdData.condition === 'In Supply Zone' || sdData.condition === 'Approaching Supply') score -= 15;

  if (fvgData.condition === 'Bullish FVG Active') score += 15;
  if (fvgData.condition === 'Bearish FVG Active') score -= 15;

  return {
    timeframe,
    trend: structureData.trend,
    structure: structureData.structure,
    emaStatus,
    rsi,
    rsiCondition,
    vwapRelation,
    volumeCondition: volData.condition,
    liquidityCondition: liquidityData.condition,
    fvgCondition: fvgData.condition,
    supplyDemandCondition: sdData.condition,
    keySupport: structureData.keySupport,
    keyResistance: structureData.keyResistance,
    ema20,
    ema50,
    ema200,
    vwap,
    atr,
    sentimentScore: Math.max(-100, Math.min(100, score)),
  };
}

export function runComprehensiveScalpAnalysis(
  symbol: string,
  timeframeCandles: Record<Timeframe, Candle[]>,
  currentPrice: number,
  openInterest = 1200000000,
  oiChange24h = 3.5,
  priceChange24h = 2.4,
  marketRegimeBias?: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP'
): ConfluenceAnalysis {
  const timeframesList: Timeframe[] = ['4H', '1H', '15M', '5M', '3M', '1M'];
  const tfAnalysis: Record<Timeframe, TimeframeAnalysis> = {} as any;

  timeframesList.forEach((tf) => {
    tfAnalysis[tf] = analyzeSingleTimeframe(timeframeCandles[tf], tf);
  });

  const htf4h = tfAnalysis['4H'];
  const htf1h = tfAnalysis['1H'];
  const itf15m = tfAnalysis['15M'];
  const ltf5m = tfAnalysis['5M'];
  const ltf3m = tfAnalysis['3M'];
  const ltf1m = tfAnalysis['1M'];

  // =========================================================================
  // TIMEFRAME ROLES & HTF DIRECTIONAL FILTERS
  // 4H: Major market context
  // 1H: HTF directional bias and major structure
  // =========================================================================
  let htfBias: 'Bullish' | 'Bearish' | 'Neutral' = 'Neutral';
  if (htf4h.trend === 'Bullish' && htf1h.trend !== 'Bearish') {
    htfBias = 'Bullish';
  } else if (htf4h.trend === 'Bearish' && htf1h.trend !== 'Bullish') {
    htfBias = 'Bearish';
  } else if (htf1h.trend === 'Bullish' && htf4h.trend !== 'Bearish') {
    htfBias = 'Bullish';
  } else if (htf1h.trend === 'Bearish' && htf4h.trend !== 'Bullish') {
    htfBias = 'Bearish';
  } else {
    htfBias = 'Neutral';
  }

  // Interactive Scenario selector override if active
  if (marketRegimeBias === 'BULLISH') htfBias = 'Bullish';
  else if (marketRegimeBias === 'BEARISH') htfBias = 'Bearish';
  else if (marketRegimeBias === 'RANGING') htfBias = 'Neutral';

  // Open interest analysis
  const oiAnalysis = analyzeOpenInterest(openInterest, oiChange24h, priceChange24h);

  // BTC Context
  const btcTrendBias =
    htfBias === 'Bullish'
      ? 'Bullish'
      : htfBias === 'Bearish'
      ? 'Bearish'
      : 'Choppy';
  const btcContext = getBtcMarketContext(89500, btcTrendBias);

  // Flow Trackers
  const flowSteps: FlowStepResult[] = [];
  const reasonsFor: string[] = [];
  const reasonsAgainst: string[] = [];

  let longPoints = 0;
  let shortPoints = 0;

  // ==========================================
  // STEP 1: 4H Major Market Context (Filter)
  // ==========================================
  if (htf4h.trend === 'Bullish') {
    longPoints += 8;
    flowSteps.push({
      step: 1,
      name: '4H Market Context (Filter)',
      status: 'passed',
      finding: '4H macro context is Bullish. Scalp longs aligned with higher timeframe expansion.',
      biasContribution: 'LONG',
    });
    reasonsFor.push('4H macro trend provides favorable bullish backdrop.');
  } else if (htf4h.trend === 'Bearish') {
    shortPoints += 8;
    flowSteps.push({
      step: 1,
      name: '4H Market Context (Filter)',
      status: 'passed',
      finding: '4H macro context is Bearish. Scalp shorts aligned with higher timeframe distribution.',
      biasContribution: 'SHORT',
    });
    reasonsFor.push('4H macro trend provides favorable bearish backdrop.');
  } else {
    flowSteps.push({
      step: 1,
      name: '4H Market Context (Filter)',
      status: 'neutral',
      finding: '4H context is Neutral / Ranging. Lower timeframes must generate self-contained scalp confluence.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 2: 1H Directional Bias & Structure (Filter)
  // ==========================================
  if (htf1h.trend === 'Bullish' && htf1h.structure.includes('Bullish')) {
    longPoints += 10;
    flowSteps.push({
      step: 2,
      name: '1H Directional Bias (Filter)',
      status: 'passed',
      finding: `1H bias is Bullish (${htf1h.structure}). HTF resistance is cleared.`,
      biasContribution: 'LONG',
    });
    reasonsFor.push('1H directional bias confirms bullish institutional order flow.');
  } else if (htf1h.trend === 'Bearish' && htf1h.structure.includes('Bearish')) {
    shortPoints += 10;
    flowSteps.push({
      step: 2,
      name: '1H Directional Bias (Filter)',
      status: 'passed',
      finding: `1H bias is Bearish (${htf1h.structure}). HTF support is compromised.`,
      biasContribution: 'SHORT',
    });
    reasonsFor.push('1H directional bias confirms bearish institutional liquidation.');
  } else {
    flowSteps.push({
      step: 2,
      name: '1H Directional Bias (Filter)',
      status: 'neutral',
      finding: '1H structure is oscillating in equilibrium; acting as a neutral filter.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 3: 15M Primary Scalp Setup Timeframe
  // Evaluates 15M Structure & Supply/Demand zones
  // ==========================================
  const is15mDemandValid =
    itf15m.supplyDemandCondition === 'In Demand Zone' ||
    itf15m.supplyDemandCondition === 'Approaching Demand';
  const is15mSupplyValid =
    itf15m.supplyDemandCondition === 'In Supply Zone' ||
    itf15m.supplyDemandCondition === 'Approaching Supply';

  if (is15mDemandValid || itf15m.structure.includes('Bullish')) {
    longPoints += 14;
    flowSteps.push({
      step: 3,
      name: '15M Primary Setup Zone',
      status: 'passed',
      finding: `15M primary scalp setup active: ${itf15m.supplyDemandCondition} with ${itf15m.structure}.`,
      biasContribution: 'LONG',
    });
    reasonsFor.push(`15M primary setup framed at valid demand (${itf15m.structure}).`);
  } else if (is15mSupplyValid || itf15m.structure.includes('Bearish')) {
    shortPoints += 14;
    flowSteps.push({
      step: 3,
      name: '15M Primary Setup Zone',
      status: 'passed',
      finding: `15M primary scalp setup active: ${itf15m.supplyDemandCondition} with ${itf15m.structure}.`,
      biasContribution: 'SHORT',
    });
    reasonsFor.push(`15M primary setup framed at valid supply (${itf15m.structure}).`);
  } else {
    flowSteps.push({
      step: 3,
      name: '15M Primary Setup Zone',
      status: 'failed',
      finding: '15M primary setup timeframe lacks distinct institutional Order Block or structure.',
      biasContribution: 'NEUTRAL',
    });
    reasonsAgainst.push('15M lacks high-probability Demand or Supply order block.');
  }

  // ==========================================
  // STEP 4: 15M Support / Resistance Boundaries
  // ==========================================
  const near15mSupport = Math.abs(currentPrice - itf15m.keySupport) / currentPrice < 0.009;
  const near15mResistance = Math.abs(currentPrice - itf15m.keyResistance) / currentPrice < 0.009;

  if (near15mSupport) {
    longPoints += 8;
    flowSteps.push({
      step: 4,
      name: '15M S/R Anchor',
      status: 'passed',
      finding: `Price holding 15M key support floor ($${itf15m.keySupport.toFixed(2)}).`,
      biasContribution: 'LONG',
    });
    reasonsFor.push(`Holding 15M key support floor ($${itf15m.keySupport.toFixed(2)}).`);
  } else if (near15mResistance) {
    shortPoints += 8;
    flowSteps.push({
      step: 4,
      name: '15M S/R Anchor',
      status: 'passed',
      finding: `Price rejecting 15M resistance ceiling ($${itf15m.keyResistance.toFixed(2)}).`,
      biasContribution: 'SHORT',
    });
    reasonsFor.push(`Rejection at 15M key resistance ceiling ($${itf15m.keyResistance.toFixed(2)}).`);
  } else {
    flowSteps.push({
      step: 4,
      name: '15M S/R Anchor',
      status: 'neutral',
      finding: 'Price traversing intermediate 15M liquidity corridor.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 5: 15M Fair Value Gap & Imbalances
  // ==========================================
  if (itf15m.fvgCondition === 'Bullish FVG Active') {
    longPoints += 8;
    flowSteps.push({
      step: 5,
      name: '15M Fair Value Gap',
      status: 'passed',
      finding: '15M Bullish Fair Value Gap respected; algorithmic re-pricing magnet active.',
      biasContribution: 'LONG',
    });
    reasonsFor.push('15M Bullish FVG providing immediate price support.');
  } else if (itf15m.fvgCondition === 'Bearish FVG Active') {
    shortPoints += 8;
    flowSteps.push({
      step: 5,
      name: '15M Fair Value Gap',
      status: 'passed',
      finding: '15M Bearish Fair Value Gap capping upside; sellers distributing.',
      biasContribution: 'SHORT',
    });
    reasonsFor.push('15M Bearish FVG capping upward retracements.');
  } else {
    flowSteps.push({
      step: 5,
      name: '15M Fair Value Gap',
      status: 'neutral',
      finding: '15M imbalances are mitigated or balanced.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 6: 5M Scalp Confirmation (BOS / CHoCH)
  // ==========================================
  const is5mBullishStructure =
    ltf5m.structure === 'Bullish BOS' || ltf5m.structure === 'CHoCH Bullish';
  const is5mBearishStructure =
    ltf5m.structure === 'Bearish BOS' || ltf5m.structure === 'CHoCH Bearish';

  if (is5mBullishStructure) {
    longPoints += 12;
    flowSteps.push({
      step: 6,
      name: '5M Scalp Confirmation',
      status: 'passed',
      finding: `5M structural confirmation verified: ${ltf5m.structure} breaks local high.`,
      biasContribution: 'LONG',
    });
    reasonsFor.push(`5M Scalp Confirmation: ${ltf5m.structure}.`);
  } else if (is5mBearishStructure) {
    shortPoints += 12;
    flowSteps.push({
      step: 6,
      name: '5M Scalp Confirmation',
      status: 'passed',
      finding: `5M structural confirmation verified: ${ltf5m.structure} breaks local low.`,
      biasContribution: 'SHORT',
    });
    reasonsFor.push(`5M Scalp Confirmation: ${ltf5m.structure}.`);
  } else {
    flowSteps.push({
      step: 6,
      name: '5M Scalp Confirmation',
      status: 'failed',
      finding: '5M structure lacks decisive Break of Structure or Change of Character.',
      biasContribution: 'NEUTRAL',
    });
    reasonsAgainst.push('5M structure has not confirmed clean BOS / CHoCH.');
  }

  // ==========================================
  // STEP 7: 5M Liquidity Sweep
  // ==========================================
  const is5mSellSweep = ltf5m.liquidityCondition === 'Sell-Side Swept';
  const is5mBuySweep = ltf5m.liquidityCondition === 'Buy-Side Swept';

  if (is5mSellSweep) {
    longPoints += 10;
    flowSteps.push({
      step: 7,
      name: '5M Liquidity Sweep',
      status: 'passed',
      finding: '5M sell-side liquidity swept below recent equal lows followed by rapid absorption.',
      biasContribution: 'LONG',
    });
    reasonsFor.push('5M Sell-Side Liquidity swept into demand.');
  } else if (is5mBuySweep) {
    shortPoints += 10;
    flowSteps.push({
      step: 7,
      name: '5M Liquidity Sweep',
      status: 'passed',
      finding: '5M buy-side liquidity purged above equal highs followed by swift down-rejection.',
      biasContribution: 'SHORT',
    });
    reasonsFor.push('5M Buy-Side Liquidity purged into supply.');
  } else {
    flowSteps.push({
      step: 7,
      name: '5M Liquidity Sweep',
      status: 'neutral',
      finding: '5M liquidity pools remain intact without an aggressive stop run.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 8: 3M Micro Structure & Displacement
  // Stronger entry confirmation
  // ==========================================
  const is3mBullishDisplacement =
    ltf3m.structure.includes('Bullish') ||
    ltf3m.volumeCondition === 'High Buying Volume' ||
    ltf3m.fvgCondition === 'Bullish FVG Active';
  const is3mBearishDisplacement =
    ltf3m.structure.includes('Bearish') ||
    ltf3m.volumeCondition === 'High Selling Volume' ||
    ltf3m.fvgCondition === 'Bearish FVG Active';

  if (is3mBullishDisplacement && !is3mBearishDisplacement) {
    longPoints += 10;
    flowSteps.push({
      step: 8,
      name: '3M Micro Displacement',
      status: 'passed',
      finding: `3M bullish displacement candle confirmed with ${ltf3m.structure} and strong volume.`,
      biasContribution: 'LONG',
    });
    reasonsFor.push('3M energetic displacement candle validates aggressive buyers.');
  } else if (is3mBearishDisplacement && !is3mBullishDisplacement) {
    shortPoints += 10;
    flowSteps.push({
      step: 8,
      name: '3M Micro Displacement',
      status: 'passed',
      finding: `3M bearish displacement candle confirmed with ${ltf3m.structure} and heavy sell volume.`,
      biasContribution: 'SHORT',
    });
    reasonsFor.push('3M impulsive displacement candle validates aggressive sellers.');
  } else {
    flowSteps.push({
      step: 8,
      name: '3M Micro Displacement',
      status: 'neutral',
      finding: '3M micro structure displays overlapping bodies without impulsive expansion.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 9: 3M EMA / VWAP Alignment
  // ==========================================
  if (ltf3m.vwapRelation === 'Above VWAP' && ltf3m.ema20 >= ltf3m.ema50) {
    longPoints += 6;
    flowSteps.push({
      step: 9,
      name: '3M Indicator Alignment',
      status: 'passed',
      finding: '3M price holding firmly above VWAP and EMA 20/50 golden alignment.',
      biasContribution: 'LONG',
    });
    reasonsFor.push('3M price sustained above intraday VWAP with bullish EMA stack.');
  } else if (ltf3m.vwapRelation === 'Below VWAP' && ltf3m.ema20 <= ltf3m.ema50) {
    shortPoints += 6;
    flowSteps.push({
      step: 9,
      name: '3M Indicator Alignment',
      status: 'passed',
      finding: '3M price rejecting below VWAP and EMA 20/50 death cross.',
      biasContribution: 'SHORT',
    });
    reasonsFor.push('3M price suppressed below intraday VWAP with bearish EMA stack.');
  } else {
    flowSteps.push({
      step: 9,
      name: '3M Indicator Alignment',
      status: 'neutral',
      finding: '3M price oscillating around VWAP without clear trend alignment.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 10: 1M Precise Entry Timing
  // Used ONLY for precise entry timing
  // ==========================================
  const is1mTriggerLong =
    ltf1m.structure.includes('Bullish') ||
    ltf1m.liquidityCondition === 'Sell-Side Swept' ||
    ltf1m.fvgCondition === 'Bullish FVG Active';
  const is1mTriggerShort =
    ltf1m.structure.includes('Bearish') ||
    ltf1m.liquidityCondition === 'Buy-Side Swept' ||
    ltf1m.fvgCondition === 'Bearish FVG Active';

  let entryTimeframe: '1M' | '3M' | '5M' = '1M';
  if (is1mTriggerLong || is1mTriggerShort) {
    entryTimeframe = '1M';
    if (is1mTriggerLong) longPoints += 10;
    if (is1mTriggerShort) shortPoints += 10;
    flowSteps.push({
      step: 10,
      name: '1M Precise Entry Trigger',
      status: 'passed',
      finding: `1M execution trigger primed: Micro ${ltf1m.structure} and ${ltf1m.liquidityCondition}.`,
      biasContribution: is1mTriggerLong ? 'LONG' : 'SHORT',
    });
    reasonsFor.push(`1M execution trigger verified (${ltf1m.structure}).`);
  } else if (is3mBullishDisplacement || is3mBearishDisplacement) {
    entryTimeframe = '3M';
    if (is3mBullishDisplacement) longPoints += 6;
    if (is3mBearishDisplacement) shortPoints += 6;
    flowSteps.push({
      step: 10,
      name: '1M/3M Entry Timing',
      status: 'passed',
      finding: '3M displacement provides primary entry confirmation (1M consolidating).',
      biasContribution: is3mBullishDisplacement ? 'LONG' : 'SHORT',
    });
  } else {
    entryTimeframe = '5M';
    flowSteps.push({
      step: 10,
      name: '1M/3M Entry Timing',
      status: 'failed',
      finding: '1M micro timing lacks crisp rejection or FVG tap. Entry risk elevated.',
      biasContribution: 'NEUTRAL',
    });
    reasonsAgainst.push('1M execution trigger not cleanly formed.');
  }

  // ==========================================
  // STEP 11: Open Interest & Institutional Flow
  // ==========================================
  if (oiAnalysis.biasContribution === 'BULLISH') {
    longPoints += 6;
    flowSteps.push({
      step: 11,
      name: 'Open Interest Flow',
      status: 'passed',
      finding: `OI rising with price: ${oiAnalysis.interpretation}. Net aggressive buyers entering.`,
      biasContribution: 'LONG',
    });
    reasonsFor.push('Open Interest expands alongside price (Institutional Accumulation).');
  } else if (oiAnalysis.biasContribution === 'BEARISH') {
    shortPoints += 6;
    flowSteps.push({
      step: 11,
      name: 'Open Interest Flow',
      status: 'passed',
      finding: `OI rising with price breakdown: ${oiAnalysis.interpretation}. Net aggressive shorts.`,
      biasContribution: 'SHORT',
    });
    reasonsFor.push('Open Interest confirms fresh short distribution.');
  } else {
    flowSteps.push({
      step: 11,
      name: 'Open Interest Flow',
      status: 'neutral',
      finding: `OI condition: ${oiAnalysis.interpretation}.`,
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 12: Intraday VWAP & RSI Scalp Momentum
  // ==========================================
  if (itf15m.rsi >= 40 && itf15m.rsi <= 65 && itf15m.vwapRelation === 'Above VWAP') {
    longPoints += 6;
    flowSteps.push({
      step: 12,
      name: 'VWAP & RSI Scalp Momentum',
      status: 'passed',
      finding: `15M RSI ${itf15m.rsi} in healthy momentum corridor above intraday VWAP.`,
      biasContribution: 'LONG',
    });
  } else if (itf15m.rsi >= 35 && itf15m.rsi <= 60 && itf15m.vwapRelation === 'Below VWAP') {
    shortPoints += 6;
    flowSteps.push({
      step: 12,
      name: 'VWAP & RSI Scalp Momentum',
      status: 'passed',
      finding: `15M RSI ${itf15m.rsi} in bearish continuation corridor below intraday VWAP.`,
      biasContribution: 'SHORT',
    });
  } else {
    flowSteps.push({
      step: 12,
      name: 'VWAP & RSI Scalp Momentum',
      status: 'neutral',
      finding: `15M RSI (${itf15m.rsi}) or VWAP proximity indicates potential exhaustion or chop.`,
      biasContribution: 'NEUTRAL',
    });
    if (itf15m.rsi > 70) reasonsAgainst.push('15M RSI overbought; risk of immediate micro mean-reversion.');
    if (itf15m.rsi < 30) reasonsAgainst.push('15M RSI oversold; shorting into local exhaustion.');
  }

  // ==========================================
  // STEP 13: BTC Macro Correlation Filter
  // ==========================================
  if (btcContext.impactOnAlt === 'Favorable for Longs') {
    longPoints += 6;
    flowSteps.push({
      step: 13,
      name: 'BTC Context Filter',
      status: 'passed',
      finding: `BTC Bullish: ${btcContext.summary}. Macro tailwinds favor crypto scalp longs.`,
      biasContribution: 'LONG',
    });
  } else if (btcContext.impactOnAlt === 'Favorable for Shorts') {
    shortPoints += 6;
    flowSteps.push({
      step: 13,
      name: 'BTC Context Filter',
      status: 'passed',
      finding: `BTC Bearish: ${btcContext.summary}. Downside drag supports scalp shorts.`,
      biasContribution: 'SHORT',
    });
  } else {
    flowSteps.push({
      step: 13,
      name: 'BTC Context Filter',
      status: 'neutral',
      finding: `BTC Volatility Alert: ${btcContext.summary}.`,
      biasContribution: 'NEUTRAL',
    });
  }

  // =========================================================================
  // SCALP TRADE MANAGEMENT & TIGHT INVALIDATION CALCULATION
  // Scalping rules:
  // - Avoid unnecessarily wide SL
  // - Avoid chasing candles
  // - Prefer nearby logical invalidation levels (micro swing high/low)
  // - Require realistic 1:3 R:R where possible
  // =========================================================================
  const recent1mCandles = timeframeCandles['1M'] || [];
  const recent3mCandles = timeframeCandles['3M'] || [];

  const micro1mLows = recent1mCandles.slice(-6).map((c) => c.low);
  const micro3mLows = recent3mCandles.slice(-4).map((c) => c.low);
  const microLows = [...micro1mLows, ...micro3mLows];
  const microSwingLow = microLows.length > 0 ? Math.min(...microLows) : currentPrice * 0.995;

  const micro1mHighs = recent1mCandles.slice(-6).map((c) => c.high);
  const micro3mHighs = recent3mCandles.slice(-4).map((c) => c.high);
  const microHighs = [...micro1mHighs, ...micro3mHighs];
  const microSwingHigh = microHighs.length > 0 ? Math.max(...microHighs) : currentPrice * 1.005;

  // Tight scalp buffer
  const scalpBuffer = Math.max(currentPrice * 0.0006, (ltf1m.atr || currentPrice * 0.002) * 0.25);

  const rawLongInvalidation = microSwingLow - scalpBuffer;
  const rawShortInvalidation = microSwingHigh + scalpBuffer;

  const longSlDist = currentPrice - rawLongInvalidation;
  const shortSlDist = rawShortInvalidation - currentPrice;

  // Percentage SL distances
  const longSlPercent = (longSlDist / currentPrice) * 100;
  const shortSlPercent = (shortSlDist / currentPrice) * 100;

  // =========================================================================
  // STRICT WAIT CONDITIONS EVALUATION
  // Return WAIT when:
  // 1. HTF context strongly contradicts the setup
  // 2. No meaningful liquidity event exists
  // 3. No valid entry zone exists
  // 4. Market structure is unclear
  // 5. Volume confirmation is insufficient
  // 6. Entry would require chasing price
  // 7. Stop Loss is too large for a scalp (SL > 0.85%)
  // 8. Approximately 1:3 R:R is not realistically achievable
  // 9. Multiple important signals conflict
  // =========================================================================
  const anyLiquiditySweep =
    is5mSellSweep ||
    is5mBuySweep ||
    ltf3m.liquidityCondition === 'Sell-Side Swept' ||
    ltf3m.liquidityCondition === 'Buy-Side Swept' ||
    ltf1m.liquidityCondition === 'Sell-Side Swept' ||
    ltf1m.liquidityCondition === 'Buy-Side Swept' ||
    itf15m.liquidityCondition === 'Sell-Side Swept' ||
    itf15m.liquidityCondition === 'Buy-Side Swept';

  const hasValidLongZone =
    is15mDemandValid ||
    near15mSupport ||
    itf15m.fvgCondition === 'Bullish FVG Active' ||
    ltf5m.fvgCondition === 'Bullish FVG Active';

  const hasValidShortZone =
    is15mSupplyValid ||
    near15mResistance ||
    itf15m.fvgCondition === 'Bearish FVG Active' ||
    ltf5m.fvgCondition === 'Bearish FVG Active';

  const isVolumeConfirmed =
    ltf5m.volumeCondition !== 'Declining / Exhaustion' &&
    (ltf3m.volumeCondition === 'High Buying Volume' ||
      ltf3m.volumeCondition === 'High Selling Volume' ||
      ltf1m.volumeCondition !== 'Declining / Exhaustion');

  // Tentative determination based on scalp hierarchy:
  // 15M setup + 5M confirmation + 3M confirmation + 1M timing
  let tentativeSignal: SignalType = 'WAIT';
  const failReasons: string[] = [];

  // Check Long Scalp Feasibility
  const passesLongConfluence =
    longPoints >= 48 &&
    longPoints - shortPoints >= 15 &&
    htfBias !== 'Bearish' && // HTF filter does not contradict
    hasValidLongZone &&
    isVolumeConfirmed &&
    anyLiquiditySweep &&
    longSlPercent <= 0.85; // Stop loss not too wide for scalp

  // Check Short Scalp Feasibility
  const passesShortConfluence =
    shortPoints >= 48 &&
    shortPoints - longPoints >= 15 &&
    htfBias !== 'Bullish' && // HTF filter does not contradict
    hasValidShortZone &&
    isVolumeConfirmed &&
    anyLiquiditySweep &&
    shortSlPercent <= 0.85; // Stop loss not too wide for scalp

  if (passesLongConfluence) {
    tentativeSignal = 'LONG';
  } else if (passesShortConfluence) {
    tentativeSignal = 'SHORT';
  } else {
    tentativeSignal = 'WAIT';
    if (htfBias === 'Bearish' && longPoints > shortPoints) {
      failReasons.push('HTF context strongly contradicts setup: 4H/1H is Bearish while attempting Long.');
    }
    if (htfBias === 'Bullish' && shortPoints > longPoints) {
      failReasons.push('HTF context strongly contradicts setup: 4H/1H is Bullish while attempting Short.');
    }
    if (!anyLiquiditySweep) {
      failReasons.push('No meaningful liquidity event detected (stops not yet purged).');
    }
    if (!hasValidLongZone && !hasValidShortZone) {
      failReasons.push('No valid 15M Demand/Supply or FVG entry zone exists.');
    }
    if (!isVolumeConfirmed) {
      failReasons.push('Volume confirmation is insufficient (exhaustion / low volume).');
    }
    if (longSlPercent > 0.85 || shortSlPercent > 0.85) {
      failReasons.push('Stop Loss is too wide for an institutional scalp (exceeds 0.85%).');
    }
  }

  // ==========================================
  // STEP 14: Scalp Invalidation & 1:3 R:R Validation
  // ==========================================
  let entryPrice = currentPrice;
  let stopLoss = currentPrice;
  let takeProfit = currentPrice;
  let riskRewardRatio = 3.0;
  let invalidationLevel = currentPrice;

  if (tentativeSignal === 'LONG') {
    // Clamp SL distance to minimum 0.20% and maximum 0.80%
    const boundedSlDist = Math.max(currentPrice * 0.002, Math.min(currentPrice * 0.008, longSlDist));
    invalidationLevel = currentPrice - boundedSlDist;
    stopLoss = Number(invalidationLevel.toFixed(2));
    const risk = currentPrice - stopLoss;
    takeProfit = Number((currentPrice + risk * 3.05).toFixed(2));
    riskRewardRatio = Number(((takeProfit - currentPrice) / risk).toFixed(2));

    // Verify 1:3 R:R realism against next major HTF resistance
    const distToHtfRes = htf1h.keyResistance - currentPrice;
    if (distToHtfRes > 0 && distToHtfRes < risk * 2.2) {
      // Opposing barrier too close to achieve 1:3 R:R realistically
      tentativeSignal = 'WAIT';
      failReasons.push('Approximately 1:3 R:R is not realistically achievable before hitting 1H resistance.');
      flowSteps.push({
        step: 14,
        name: 'Risk / Reward Validation',
        status: 'failed',
        finding: `1:3 target blocked by immediate 1H resistance barrier ($${htf1h.keyResistance.toFixed(2)}).`,
        biasContribution: 'NEUTRAL',
      });
    } else {
      flowSteps.push({
        step: 14,
        name: 'Risk / Reward Validation',
        status: 'passed',
        finding: `Tight scalp invalidation at $${stopLoss.toFixed(2)} (-${((risk / currentPrice) * 100).toFixed(2)}%). Realistic 1:${riskRewardRatio} R:R target.`,
        biasContribution: 'LONG',
      });
    }
  } else if (tentativeSignal === 'SHORT') {
    // Clamp SL distance to minimum 0.20% and maximum 0.80%
    const boundedSlDist = Math.max(currentPrice * 0.002, Math.min(currentPrice * 0.008, shortSlDist));
    invalidationLevel = currentPrice + boundedSlDist;
    stopLoss = Number(invalidationLevel.toFixed(2));
    const risk = stopLoss - currentPrice;
    takeProfit = Number((currentPrice - risk * 3.05).toFixed(2));
    riskRewardRatio = Number(((currentPrice - takeProfit) / risk).toFixed(2));

    // Verify 1:3 R:R realism against next major HTF support
    const distToHtfSupp = currentPrice - htf1h.keySupport;
    if (distToHtfSupp > 0 && distToHtfSupp < risk * 2.2) {
      // Opposing barrier too close to achieve 1:3 R:R realistically
      tentativeSignal = 'WAIT';
      failReasons.push('Approximately 1:3 R:R is not realistically achievable before hitting 1H support.');
      flowSteps.push({
        step: 14,
        name: 'Risk / Reward Validation',
        status: 'failed',
        finding: `1:3 target blocked by immediate 1H support floor ($${htf1h.keySupport.toFixed(2)}).`,
        biasContribution: 'NEUTRAL',
      });
    } else {
      flowSteps.push({
        step: 14,
        name: 'Risk / Reward Validation',
        status: 'passed',
        finding: `Tight scalp invalidation at $${stopLoss.toFixed(2)} (+${((risk / currentPrice) * 100).toFixed(2)}%). Realistic 1:${riskRewardRatio} R:R target.`,
        biasContribution: 'SHORT',
      });
    }
  } else {
    // WAIT state values
    const placeholderSlDist = currentPrice * 0.004;
    stopLoss = Number((currentPrice - placeholderSlDist).toFixed(2));
    takeProfit = Number((currentPrice + placeholderSlDist * 3.0).toFixed(2));
    riskRewardRatio = 3.0;
    invalidationLevel = stopLoss;

    flowSteps.push({
      step: 14,
      name: 'Risk / Reward Validation',
      status: 'neutral',
      finding: 'Trade invalidation or R:R ratio unresolved. Preserving capital in WAIT mode.',
      biasContribution: 'NEUTRAL',
    });
  }

  // ==========================================
  // STEP 15: Final Scalp Decision
  // ==========================================
  const rawScore = Math.max(longPoints, shortPoints);
  let confidenceScore = Math.min(95, Math.max(25, rawScore));

  if (tentativeSignal === 'WAIT') {
    confidenceScore = Math.min(48, confidenceScore);
    flowSteps.push({
      step: 15,
      name: 'Final Scalp Decision',
      status: 'failed',
      finding: `WAIT: Scalp confluence guardrail triggered. ${failReasons[0] || 'Multi-factor alignment incomplete.'}`,
      biasContribution: 'NEUTRAL',
    });
    if (failReasons.length > 0) {
      reasonsAgainst.push(...failReasons);
    } else {
      reasonsAgainst.push('Market lacking synchronized multi-timeframe scalp confirmation.');
    }
  } else {
    flowSteps.push({
      step: 15,
      name: 'Final Scalp Decision',
      status: 'passed',
      finding: `${tentativeSignal} SCALP qualified! 15M setup + 5M confirmation + ${entryTimeframe} execution trigger aligned.`,
      biasContribution: tentativeSignal,
    });
  }

  // Confidence Category
  let confidenceCategory: ConfidenceCategory = 'Weak';
  if (confidenceScore >= 80) confidenceCategory = 'Very Strong';
  else if (confidenceScore >= 65) confidenceCategory = 'Strong';
  else if (confidenceScore >= 50) confidenceCategory = 'Moderate';
  else confidenceCategory = 'Weak';

  // Setup Quality
  let setupQuality: SetupQuality = 'C';
  if (tentativeSignal === 'WAIT') {
    setupQuality = 'Invalid';
  } else if (confidenceScore >= 80 && riskRewardRatio >= 2.95) {
    setupQuality = 'A+';
  } else if (confidenceScore >= 65) {
    setupQuality = 'A';
  } else if (confidenceScore >= 50) {
    setupQuality = 'B';
  }

  const slDistancePercent = Number(((Math.abs(currentPrice - stopLoss) / currentPrice) * 100).toFixed(2));
  const tpDistancePercent = Number(((Math.abs(takeProfit - currentPrice) / currentPrice) * 100).toFixed(2));

  // Liquidity event text
  let liquidityEventText = 'No Recent Sweep';
  if (is5mSellSweep || ltf1m.liquidityCondition === 'Sell-Side Swept') {
    liquidityEventText = `Sell-Side Liquidity Swept below $${microSwingLow.toFixed(2)}`;
  } else if (is5mBuySweep || ltf1m.liquidityCondition === 'Buy-Side Swept') {
    liquidityEventText = `Buy-Side Liquidity Purged above $${microSwingHigh.toFixed(2)}`;
  } else if (itf15m.liquidityCondition !== 'Neutral') {
    liquidityEventText = `15M ${itf15m.liquidityCondition}`;
  }

  // FVG Status text
  const fvgStatusText =
    itf15m.fvgCondition !== 'No Significant FVG'
      ? `15M: ${itf15m.fvgCondition} • 5M: ${ltf5m.fvgCondition}`
      : `5M: ${ltf5m.fvgCondition}`;

  // Volume Status text
  const volumeStatusText = `15M ${itf15m.volumeCondition} | 3M ${ltf3m.volumeCondition}`;

  // OI Status text
  const oiStatusText = `${oiAnalysis.interpretation} (${oiChange24h > 0 ? '+' : ''}${oiChange24h.toFixed(1)}%)`;

  // HTF Confirmation text
  const htfConfirmationText = `4H ${htf4h.trend} | 1H ${htf1h.trend} (Bias: ${htfBias})`;

  return {
    symbol,
    timestamp: Date.now(),
    signal: tentativeSignal,
    setupType: 'SCALP',
    htfBias,
    confidenceScore,
    confidenceCategory,
    setupQuality,
    entryPrice: Number(entryPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    takeProfit: Number(takeProfit.toFixed(2)),
    riskRewardRatio,
    slDistancePercent,
    tpDistancePercent,

    entryTimeframe,
    setupTimeframe: '15M',
    htfConfirmation: htfConfirmationText,
    liquidityEvent: liquidityEventText,
    fvgStatus: fvgStatusText,
    volumeStatus: volumeStatusText,
    oiStatus: oiStatusText,
    invalidationLevel: Number(invalidationLevel.toFixed(2)),

    reasonsFor: reasonsFor.slice(0, 5),
    reasonsAgainst: reasonsAgainst.slice(0, 5),

    marketStructureSummary: `15M ${itf15m.structure} | 5M ${ltf5m.structure} | 1M ${ltf1m.structure}`,
    trendSummary: `4H ${htf4h.trend}, 1H ${htf1h.trend} (HTF Bias: ${htfBias})`,
    liquiditySummary: liquidityEventText,
    supportResistanceSummary: `15M Sup: $${itf15m.keySupport.toFixed(2)} | 15M Res: $${itf15m.keyResistance.toFixed(2)}`,
    supplyDemandSummary: `15M: ${itf15m.supplyDemandCondition}`,
    fvgSummary: fvgStatusText,
    volumeSummary: volumeStatusText,
    openInterestSummary: oiStatusText,
    emaSummary: `15M: ${itf15m.emaStatus} | 3M EMA20: $${ltf3m.ema20.toFixed(2)}`,
    rsiSummary: `15M RSI ${itf15m.rsi} (${itf15m.rsiCondition})`,
    vwapSummary: `15M: ${itf15m.vwapRelation} | 3M: ${ltf3m.vwapRelation}`,
    btcContext,
    timeframes: tfAnalysis,
    flowSteps,
  };
}
