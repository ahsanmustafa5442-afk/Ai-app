import { BtcContext } from '../types';

export function getBtcMarketContext(overrideBtcPrice?: number, btcTrend?: 'Bullish' | 'Bearish' | 'Choppy'): BtcContext {
  const price = overrideBtcPrice || 89450.0;
  const trend4h = btcTrend || 'Bullish';
  const trend1h = btcTrend === 'Bearish' ? 'Bearish' : 'Bullish';
  const dominance = 57.2;

  let impactOnAlt: BtcContext['impactOnAlt'] = 'Favorable for Longs';
  let summary = '';

  if (trend4h === 'Bullish' && trend1h === 'Bullish') {
    impactOnAlt = 'Favorable for Longs';
    summary = `BTC is establishing higher highs above $${(price * 0.98).toFixed(0)} with stable dominance (${dominance}%). Market tailwinds favor long continuation across large and mid-cap futures.`;
  } else if (trend4h === 'Bearish' || trend1h === 'Bearish') {
    impactOnAlt = 'Favorable for Shorts';
    summary = `BTC is under selling pressure below key 4H/1H pivot levels. High correlation risk suggests heavy headwinds for altcoin longs; favorable for selective short breakdowns.`;
  } else {
    impactOnAlt = 'High Volatility Warning';
    summary = `BTC is range-bound in compression. Potential breakout volatility could trigger stop runs across altcoin pairs. Tight stop-loss discipline required.`;
  }

  return {
    symbol: 'BTCUSDT',
    price,
    trend4h,
    trend1h,
    dominance,
    impactOnAlt,
    summary,
  };
}
