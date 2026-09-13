import { Candle } from '../types';

export interface VolumeAnalysis {
  condition: 'High Buying Volume' | 'High Selling Volume' | 'Declining / Exhaustion' | 'Normal';
  currentVolume: number;
  averageVolume: number;
  volumeRatio: number;
  details: string;
}

export interface OpenInterestAnalysis {
  openInterestUsdt: number;
  openInterestChangePercent: number;
  interpretation: 'Long Buildup' | 'Short Buildup' | 'Long Liquidation' | 'Short Covering' | 'Neutral Flow';
  biasContribution: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  details: string;
}

export function analyzeVolume(candles: Candle[]): VolumeAnalysis {
  if (candles.length < 5) {
    return {
      condition: 'Normal',
      currentVolume: candles[candles.length - 1]?.volume || 1000,
      averageVolume: 1000,
      volumeRatio: 1.0,
      details: 'Standard volume flow across the session.',
    };
  }

  const recent = candles.slice(-20);
  const avgVol = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
  const lastCandle = candles[candles.length - 1];
  const currentVol = lastCandle.volume;
  const ratio = currentVol / (avgVol || 1);

  const isGreen = lastCandle.close >= lastCandle.open;

  if (ratio > 1.6) {
    if (isGreen) {
      return {
        condition: 'High Buying Volume',
        currentVolume: currentVol,
        averageVolume: avgVol,
        volumeRatio: ratio,
        details: `Aggressive market buying (${ratio.toFixed(2)}x 20-period avg). Strong buyer absorption and expansion.`,
      };
    } else {
      return {
        condition: 'High Selling Volume',
        currentVolume: currentVol,
        averageVolume: avgVol,
        volumeRatio: ratio,
        details: `Heavy market sell delta (${ratio.toFixed(2)}x 20-period avg). Institutional distribution or panic unloading.`,
      };
    }
  }

  if (ratio < 0.65) {
    return {
      condition: 'Declining / Exhaustion',
      currentVolume: currentVol,
      averageVolume: avgVol,
      volumeRatio: ratio,
      details: `Volume tapering off (${ratio.toFixed(2)}x avg). Sign of momentum exhaustion or quiet pre-breakout compression.`,
    };
  }

  return {
    condition: 'Normal',
    currentVolume: currentVol,
    averageVolume: avgVol,
    volumeRatio: ratio,
    details: `Steady organic volume turnover (${ratio.toFixed(2)}x avg). Normal auction market participation.`,
  };
}

export function analyzeOpenInterest(
  openInterest: number,
  oiChange24h: number,
  priceChange24h: number
): OpenInterestAnalysis {
  let interpretation: OpenInterestAnalysis['interpretation'] = 'Neutral Flow';
  let biasContribution: OpenInterestAnalysis['biasContribution'] = 'NEUTRAL';
  let details = '';

  if (priceChange24h > 0.5 && oiChange24h > 1.5) {
    interpretation = 'Long Buildup';
    biasContribution = 'BULLISH';
    details = `Rising OI (+${oiChange24h.toFixed(1)}%) alongside rising price indicates fresh institutional capital entering long positions with conviction.`;
  } else if (priceChange24h < -0.5 && oiChange24h > 1.5) {
    interpretation = 'Short Buildup';
    biasContribution = 'BEARISH';
    details = `Rising OI (+${oiChange24h.toFixed(1)}%) with dropping price signals aggressive new short positioning taking dominance.`;
  } else if (priceChange24h < -0.5 && oiChange24h < -1.5) {
    interpretation = 'Long Liquidation';
    biasContribution = 'BULLISH'; // often sets up exhaustion flush / bottom
    details = `Declining OI (${oiChange24h.toFixed(1)}%) during price drops reflects over-leveraged long stop runs and margin liquidations.`;
  } else if (priceChange24h > 0.5 && oiChange24h < -1.5) {
    interpretation = 'Short Covering';
    biasContribution = 'NEUTRAL';
    details = `Price advance driven by short covering/liquidation (-${Math.abs(oiChange24h).toFixed(1)}% OI) rather than sustained spot/futures spot buying.`;
  } else {
    interpretation = 'Neutral Flow';
    biasContribution = 'NEUTRAL';
    details = `OI is stable (${oiChange24h > 0 ? '+' : ''}${oiChange24h.toFixed(1)}%). No one-sided speculative positioning extremes observed.`;
  }

  return {
    openInterestUsdt: openInterest,
    openInterestChangePercent: oiChange24h,
    interpretation,
    biasContribution,
    details,
  };
}
