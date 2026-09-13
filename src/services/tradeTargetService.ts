import { Coin24hTarget, PaperTradeRecord, Target24hSummary, TradingMode } from '../types';
import {
  ALL_DISPLAY_NAMES,
  CORE_SYMBOLS,
  getActiveScannerSymbols,
  isCoreSymbol,
} from './coinSelectionService';

export const TARGET_SYMBOLS = CORE_SYMBOLS;

export const SYMBOL_NAMES: Record<string, string> = ALL_DISPLAY_NAMES;

const LIVE_TRADES_STORAGE_KEY = 'binance_futures_ai_live_trades_history_v2';

export function loadLiveTradesHistory(): PaperTradeRecord[] {
  try {
    const saved = localStorage.getItem(LIVE_TRADES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load live trades history', e);
  }
  return [];
}

export function saveLiveTradesHistory(trades: PaperTradeRecord[]): void {
  try {
    localStorage.setItem(LIVE_TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save live trades history', e);
  }
}

export function clearLiveTradingHistory(): PaperTradeRecord[] {
  localStorage.removeItem(LIVE_TRADES_STORAGE_KEY);
  return [];
}

/**
 * Filter trades that occurred within the rolling 24-hour window
 * (or within today's UTC daily trading cycle)
 */
export function getTradesIn24hWindow(trades: PaperTradeRecord[]): PaperTradeRecord[] {
  const now = Date.now();
  const rollingCutoff = now - 24 * 60 * 60 * 1000;
  
  // Start of current UTC day
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const utcCutoff = todayUtc.getTime();

  // Any trade entered in rolling 24 hours OR since UTC midnight counts toward the 24H target
  const cutoff = Math.min(rollingCutoff, utcCutoff);

  return trades.filter((t) => t.entryTime >= cutoff);
}

/**
 * Calculate time remaining in the current 24-hour cycle (until next 00:00:00 UTC cycle reset)
 */
export function get24hWindowTimeRemaining(): {
  msRemaining: number;
  formatted: string;
  resetTime: number;
} {
  const now = new Date();
  const nextReset = new Date();
  nextReset.setUTCHours(24, 0, 0, 0); // 00:00:00 UTC of next day
  const msRemaining = Math.max(0, nextReset.getTime() - now.getTime());

  const totalSec = Math.floor(msRemaining / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return {
    msRemaining,
    formatted,
    resetTime: nextReset.getTime(),
  };
}

/**
 * Compute the complete 24-hour trade target summary for a specific trading mode
 * across all 10 active coins (6 CORE + 4 USER SELECTED)
 */
export function calculate24hTargetSummary(
  trades: PaperTradeRecord[],
  mode: TradingMode,
  activeSymbols?: string[]
): Target24hSummary {
  const windowTrades = getTradesIn24hWindow(trades);
  const { msRemaining, formatted, resetTime } = get24hWindowTimeRemaining();

  const symbolsToTrack = activeSymbols && activeSymbols.length > 0 ? activeSymbols : getActiveScannerSymbols();

  const coinsRecord: Record<string, Coin24hTarget> = {};
  const coinList: Coin24hTarget[] = [];

  let meetingTargetCount = 0;

  for (const symbol of symbolsToTrack) {
    const symbolTrades = windowTrades.filter((t) => t.symbol === symbol);
    const tradesCompleted = symbolTrades.length;
    const isTargetMet = tradesCompleted >= 1;

    if (isTargetMet) {
      meetingTargetCount++;
    }

    // Find latest trade
    const sortedTrades = [...symbolTrades].sort((a, b) => b.entryTime - a.entryTime);
    const latestTrade = sortedTrades[0];

    const coinTarget: Coin24hTarget = {
      symbol,
      name: SYMBOL_NAMES[symbol] || symbol.replace('USDT', ''),
      tradesCompleted,
      target: 1,
      isTargetMet,
      displayRatio: `${tradesCompleted}/1`,
      isPriority: tradesCompleted === 0, // Prioritize pending coins for analysis
      lastTradeTime: latestTrade?.entryTime || null,
      lastTradeResult: latestTrade ? (latestTrade.status === 'OPEN' ? 'OPEN' : latestTrade.result) : null,
      isCore: isCoreSymbol(symbol),
      isUserSelected: !isCoreSymbol(symbol),
    };

    coinsRecord[symbol] = coinTarget;
    coinList.push(coinTarget);
  }

  const pendingCount = symbolsToTrack.length - meetingTargetCount;

  return {
    mode,
    coins: coinsRecord,
    coinList,
    tradesCompletedToday: windowTrades.length,
    coinsMeetingTarget: meetingTargetCount,
    coinsPending: pendingCount,
    totalCoins: symbolsToTrack.length,
    timeRemainingStr: formatted,
    windowRemainingMs: msRemaining,
    windowResetTime: resetTime,
  };
}

/**
 * Generates initial realistic seed trades for PAPER mode when fresh,
 * matching the user's exact dashboard example:
 * BTCUSDT: 1/1
 * BNBUSDT: 0/1
 * SOLUSDT: 1/1
 * XRPUSDT: 0/1
 * SUIUSDT: 1/1
 * DOGEUSDT: 0/1
 */
export function createRealisticPaperSeedTrades(): PaperTradeRecord[] {
  const now = Date.now();

  const btcTrade: PaperTradeRecord = {
    id: `seed-btc-${now - 3600000 * 5}`,
    symbol: 'BTCUSDT',
    type: 'LONG',
    confidenceScore: 82,
    setupQuality: 'A+',
    entryPrice: 91420.5,
    stopLoss: 90850.0,
    takeProfit: 93130.0,
    riskReward: 3.0,
    positionSize: 2000,
    margin: 200,
    leverage: 10,
    entryTime: now - 3600000 * 5, // 5 hours ago
    exitTime: now - 3600000 * 4,
    exitPrice: 93130.0,
    currentPrice: 93130.0,
    pnl: 37.4,
    pnlPercent: 18.7,
    status: 'CLOSED',
    result: 'WIN',
    entryReason: '15M Demand Zone Retest + 1M Bullish CHoCH Trigger | Swept Asia Low',
    exitReason: 'TAKE_PROFIT',
    source: 'SCALP_AUTO',
  };

  const solTrade: PaperTradeRecord = {
    id: `seed-sol-${now - 3600000 * 3}`,
    symbol: 'SOLUSDT',
    type: 'SHORT',
    confidenceScore: 78,
    setupQuality: 'A',
    entryPrice: 198.4,
    stopLoss: 200.2,
    takeProfit: 193.0,
    riskReward: 3.0,
    positionSize: 1500,
    margin: 150,
    leverage: 10,
    entryTime: now - 3600000 * 3, // 3 hours ago
    exitTime: now - 3600000 * 2,
    exitPrice: 193.0,
    currentPrice: 193.0,
    pnl: 40.8,
    pnlPercent: 27.2,
    status: 'CLOSED',
    result: 'WIN',
    entryReason: '15M Bearish FVG Mitigation + Sell-Side Liquidity Sweep Confirmation',
    exitReason: 'TAKE_PROFIT',
    source: 'SCALP_AUTO',
  };

  const suiTrade: PaperTradeRecord = {
    id: `seed-sui-${now - 3600000 * 1.5}`,
    symbol: 'SUIUSDT',
    type: 'LONG',
    confidenceScore: 75,
    setupQuality: 'A',
    entryPrice: 3.42,
    stopLoss: 3.38,
    takeProfit: 3.54,
    riskReward: 3.0,
    positionSize: 1200,
    margin: 120,
    leverage: 10,
    entryTime: now - 3600000 * 1.5, // 1.5 hours ago
    exitTime: now - 3600000 * 0.8,
    exitPrice: 3.54,
    currentPrice: 3.54,
    pnl: 42.1,
    pnlPercent: 35.1,
    status: 'CLOSED',
    result: 'WIN',
    entryReason: 'Break of Structure + High Volume Volume Node Surge',
    exitReason: 'TAKE_PROFIT',
    source: 'SCALP_AUTO',
  };

  return [btcTrade, solTrade, suiTrade];
}
