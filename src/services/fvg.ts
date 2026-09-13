import { Candle } from '../types';

export interface FvgZone {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  candleIndex: number;
  mitigated: boolean;
}

export interface FvgAnalysis {
  condition: 'Bullish FVG Active' | 'Bearish FVG Active' | 'FVG Mitigated' | 'No Significant FVG';
  activeFvg?: FvgZone;
  details: string;
}

export function analyzeFairValueGaps(candles: Candle[]): FvgAnalysis {
  if (candles.length < 5) {
    return {
      condition: 'No Significant FVG',
      details: 'Insufficient candle data to detect 3-bar Fair Value Gaps.',
    };
  }

  const fvgs: FvgZone[] = [];
  const currentPrice = candles[candles.length - 1].close;

  // Scan recent candles for 3-bar imbalances
  for (let i = candles.length - 2; i >= 2; i--) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: c1.high < c3.low
    if (c3.low > c1.high && (c3.low - c1.high) / c1.high > 0.001) {
      const top = c3.low;
      const bottom = c1.high;
      // check if any subsequent candle mitigated it
      let mitigated = false;
      for (let k = i + 1; k < candles.length; k++) {
        if (candles[k].low <= bottom) {
          mitigated = true;
          break;
        }
      }
      fvgs.push({
        type: 'BULLISH',
        top,
        bottom,
        candleIndex: i - 1,
        mitigated,
      });
    }

    // Bearish FVG: c1.low > c3.high
    if (c1.low > c3.high && (c1.low - c3.high) / c3.high > 0.001) {
      const top = c1.low;
      const bottom = c3.high;
      let mitigated = false;
      for (let k = i + 1; k < candles.length; k++) {
        if (candles[k].high >= top) {
          mitigated = true;
          break;
        }
      }
      fvgs.push({
        type: 'BEARISH',
        top,
        bottom,
        candleIndex: i - 1,
        mitigated,
      });
    }

    if (fvgs.length >= 4) break;
  }

  const unmitigated = fvgs.filter((f) => !f.mitigated);

  // Find if current price is inside or directly interacting with an unmitigated FVG
  const interactiveFvg = unmitigated.find(
    (f) => currentPrice >= f.bottom * 0.998 && currentPrice <= f.top * 1.002
  );

  if (interactiveFvg) {
    if (interactiveFvg.type === 'BULLISH') {
      return {
        condition: 'Bullish FVG Active',
        activeFvg: interactiveFvg,
        details: `Price retesting active Bullish FVG imbalance zone ($${interactiveFvg.bottom.toFixed(2)} - $${interactiveFvg.top.toFixed(2)}). Institutional magnet for buyer defense.`,
      };
    } else {
      return {
        condition: 'Bearish FVG Active',
        activeFvg: interactiveFvg,
        details: `Price reacting into active Bearish FVG imbalance zone ($${interactiveFvg.bottom.toFixed(2)} - $${interactiveFvg.top.toFixed(2)}). Overhead supply inefficiency.`,
      };
    }
  }

  if (fvgs.length > 0 && unmitigated.length === 0) {
    return {
      condition: 'FVG Mitigated',
      details: 'Recent price imbalances have been efficiently rebalanced (FVGs mitigated).',
    };
  }

  const nearestUnmitigated = unmitigated[0];
  if (nearestUnmitigated) {
    const isBull = nearestUnmitigated.type === 'BULLISH';
    return {
      condition: isBull ? 'Bullish FVG Active' : 'Bearish FVG Active',
      activeFvg: nearestUnmitigated,
      details: `Open ${isBull ? 'Bullish' : 'Bearish'} FVG resting at $${nearestUnmitigated.bottom.toFixed(2)} - $${nearestUnmitigated.top.toFixed(2)}.`,
    };
  }

  return {
    condition: 'No Significant FVG',
    details: 'Price action is clean with balanced two-way liquidity; no major open imbalances found.',
  };
}
