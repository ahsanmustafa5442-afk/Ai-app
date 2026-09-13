import {
  ClosedTrade,
  PaperAccount,
  PaperTradeHistoryStats,
  PaperTradeRecord,
  PortfolioRiskSettings,
  RiskCalculation,
  RiskSettings,
  SetupQuality,
  VirtualPosition,
} from '../types';
import { createRealisticPaperSeedTrades } from './tradeTargetService';

const ACCOUNT_STORAGE_KEY = 'binance_futures_ai_paper_account_v2';
const TRADES_STORAGE_KEY = 'binance_futures_ai_paper_trades_history_v2';
const DEMO_ACCOUNT_STORAGE_KEY = 'binance_futures_ai_demo_account_v2';
const DEMO_TRADES_STORAGE_KEY = 'binance_futures_ai_demo_trades_history_v2';
const RISK_SETTINGS_STORAGE_KEY = 'binance_futures_ai_portfolio_risk_v2';

export const DEFAULT_PORTFOLIO_RISK_SETTINGS: PortfolioRiskSettings = {
  maxSimultaneousTrades: 5,
  maxRiskPerTradePercent: 1.0, // 1% of balance
  maxTotalRiskPercent: 3.0, // 3% maximum total risk
};

export const DEFAULT_PAPER_ACCOUNT: PaperAccount = {
  balance: 10000.0,
  equity: 10000.0,
  marginUsed: 0.0,
  freeMargin: 10000.0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0.0,
  profitFactor: 0.0,
  maxDrawdown: 0.0,
  totalPnl: 0.0,
  activePositions: [],
  closedTrades: [],
};

export const DEFAULT_DEMO_ACCOUNT: PaperAccount = {
  balance: 50000.0,
  equity: 50000.0,
  marginUsed: 0.0,
  freeMargin: 50000.0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0.0,
  profitFactor: 0.0,
  maxDrawdown: 0.0,
  totalPnl: 0.0,
  activePositions: [],
  closedTrades: [],
};

export function loadPortfolioRiskSettings(): PortfolioRiskSettings {
  try {
    const saved = localStorage.getItem(RISK_SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PORTFOLIO_RISK_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load portfolio risk settings', e);
  }
  return DEFAULT_PORTFOLIO_RISK_SETTINGS;
}

export function savePortfolioRiskSettings(settings: PortfolioRiskSettings): void {
  try {
    localStorage.setItem(RISK_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save portfolio risk settings', e);
  }
}

export function loadPaperAccount(): PaperAccount {
  try {
    const saved = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PAPER_ACCOUNT,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to load paper account', e);
  }
  return DEFAULT_PAPER_ACCOUNT;
}

export function savePaperAccount(account: PaperAccount): void {
  try {
    localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } catch (e) {
    console.error('Failed to save paper account', e);
  }
}

export function loadPaperTradesHistory(): PaperTradeRecord[] {
  try {
    const saved = localStorage.getItem(TRADES_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load paper trades history', e);
  }
  // First launch default: seed 3 trades (BTC, SOL, SUI) to initialize the 24H target dashboard
  const seeded = createRealisticPaperSeedTrades();
  savePaperTradesHistory(seeded);
  return seeded;
}

export function savePaperTradesHistory(trades: PaperTradeRecord[]): void {
  try {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save paper trades history', e);
  }
}

export function clearPaperTradingHistory(): { account: PaperAccount; trades: PaperTradeRecord[] } {
  localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  localStorage.removeItem(TRADES_STORAGE_KEY);
  const freshAccount = { ...DEFAULT_PAPER_ACCOUNT };
  const freshTrades: PaperTradeRecord[] = [];
  savePaperAccount(freshAccount);
  savePaperTradesHistory(freshTrades);
  return { account: freshAccount, trades: freshTrades };
}

export function loadDemoAccount(): PaperAccount {
  try {
    const saved = localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_DEMO_ACCOUNT,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to load demo account', e);
  }
  return DEFAULT_DEMO_ACCOUNT;
}

export function saveDemoAccount(account: PaperAccount): void {
  try {
    localStorage.setItem(DEMO_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  } catch (e) {
    console.error('Failed to save demo account', e);
  }
}

export function loadDemoTradesHistory(): PaperTradeRecord[] {
  try {
    const saved = localStorage.getItem(DEMO_TRADES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load demo trades history', e);
  }
  return [];
}

export function saveDemoTradesHistory(trades: PaperTradeRecord[]): void {
  try {
    localStorage.setItem(DEMO_TRADES_STORAGE_KEY, JSON.stringify(trades));
  } catch (e) {
    console.error('Failed to save demo trades history', e);
  }
}

export function clearDemoTradingHistory(): { account: PaperAccount; trades: PaperTradeRecord[] } {
  localStorage.removeItem(DEMO_ACCOUNT_STORAGE_KEY);
  localStorage.removeItem(DEMO_TRADES_STORAGE_KEY);
  const freshAccount = { ...DEFAULT_DEMO_ACCOUNT };
  const freshTrades: PaperTradeRecord[] = [];
  saveDemoAccount(freshAccount);
  saveDemoTradesHistory(freshTrades);
  return { account: freshAccount, trades: freshTrades };
}

/**
 * Compute aggregate statistics across all paper trades
 */
export function calculateHistoryStats(trades: PaperTradeRecord[]): PaperTradeHistoryStats {
  const totalTrades = trades.length;
  const openTrades = trades.filter((t) => t.status === 'OPEN').length;
  const closed = trades.filter((t) => t.status === 'CLOSED');
  const closedTrades = closed.length;
  const winningTrades = closed.filter((t) => t.result === 'WIN').length;
  const losingTrades = closed.filter((t) => t.result === 'LOSS').length;
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades) * 100 : 0;

  const totalPnl = trades.reduce((sum, t) => sum + (t.status === 'CLOSED' ? t.pnl : t.pnl), 0);
  const averagePnl = closedTrades > 0 ? closed.reduce((sum, t) => sum + t.pnl, 0) / closedTrades : 0;

  const validRrTrades = trades.filter((t) => t.riskReward > 0);
  const averageRiskReward =
    validRrTrades.length > 0
      ? validRrTrades.reduce((sum, t) => sum + t.riskReward, 0) / validRrTrades.length
      : 3.0;

  let peak = 10000;
  let runningBalance = 10000;
  let maxDd = 0;

  // Process chronologically for accurate drawdown calculation
  const chronological = [...closed].sort((a, b) => a.entryTime - b.entryTime);
  for (const t of chronological) {
    runningBalance += t.pnl;
    if (runningBalance > peak) peak = runningBalance;
    const dd = peak > 0 ? ((peak - runningBalance) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }

  const bestTradePnl = closed.length > 0 ? Math.max(...closed.map((t) => t.pnl)) : 0;
  const worstTradePnl = closed.length > 0 ? Math.min(...closed.map((t) => t.pnl)) : 0;

  return {
    totalTrades,
    openTrades,
    closedTrades,
    winningTrades,
    losingTrades,
    winRate: Number(winRate.toFixed(1)),
    totalPnl: Number(totalPnl.toFixed(2)),
    averagePnl: Number(averagePnl.toFixed(2)),
    averageRiskReward: Number(averageRiskReward.toFixed(2)),
    maxDrawdown: Number(maxDd.toFixed(2)),
    bestTradePnl: Number(bestTradePnl.toFixed(2)),
    worstTradePnl: Number(worstTradePnl.toFixed(2)),
  };
}

/**
 * Validate portfolio risk rules before opening a paper trade
 */
export function validatePortfolioRisk(
  account: PaperAccount,
  trades: PaperTradeRecord[],
  riskSettings: PortfolioRiskSettings,
  symbol: string,
  entryPrice: number,
  stopLossPrice: number
): { allowed: boolean; reason?: string; tradeRiskPercent: number; positionSizeUsdt: number; marginRequired: number } {
  const activeTrades = trades.filter((t) => t.status === 'OPEN');

  // Check 1: Duplicate position check
  if (activeTrades.some((t) => t.symbol === symbol)) {
    return {
      allowed: false,
      reason: `TRADE BLOCKED — POSITION ALREADY ACTIVE FOR ${symbol}`,
      tradeRiskPercent: 0,
      positionSizeUsdt: 0,
      marginRequired: 0,
    };
  }

  // Check 2: Maximum simultaneous trades check (default 5)
  if (activeTrades.length >= riskSettings.maxSimultaneousTrades) {
    return {
      allowed: false,
      reason: `TRADE BLOCKED — MAX SIMULTANEOUS TRADES REACHED (${activeTrades.length}/${riskSettings.maxSimultaneousTrades})`,
      tradeRiskPercent: 0,
      positionSizeUsdt: 0,
      marginRequired: 0,
    };
  }

  // Calculate SL distance
  const slDistance = Math.abs(entryPrice - stopLossPrice);
  const slPercent = entryPrice > 0 ? slDistance / entryPrice : 0.005;

  // Max allowed dollar risk for this trade = 1% of balance
  const maxRiskDollar = (account.balance * riskSettings.maxRiskPerTradePercent) / 100;
  const tradeRiskPercent = riskSettings.maxRiskPerTradePercent;

  // Position Size = Risk Dollar / SL Distance %
  // Enforce reasonable leverage cap (e.g. 10x)
  const leverage = 10;
  const rawPositionSize = slPercent > 0 ? maxRiskDollar / slPercent : maxRiskDollar * 10;
  // Cap position size to 25% of balance * leverage for safety
  const maxPositionSizeCap = account.balance * 0.25 * leverage;
  const positionSizeUsdt = Math.min(rawPositionSize, maxPositionSizeCap);
  const marginRequired = positionSizeUsdt / leverage;

  // Check 3: Free margin availability
  if (marginRequired > account.freeMargin) {
    return {
      allowed: false,
      reason: `TRADE BLOCKED — INSUFFICIENT FREE MARGIN ($${account.freeMargin.toFixed(0)} free, $${marginRequired.toFixed(0)} required)`,
      tradeRiskPercent,
      positionSizeUsdt,
      marginRequired,
    };
  }

  // Check 4: Calculate current total open risk across all active trades
  let currentOpenRiskPercent = 0;
  for (const t of activeTrades) {
    const tSlDistance = Math.abs(t.entryPrice - t.stopLoss);
    const tSlPercent = t.entryPrice > 0 ? tSlDistance / t.entryPrice : 0.005;
    const tDollarRisk = t.positionSize * tSlPercent;
    currentOpenRiskPercent += (tDollarRisk / account.balance) * 100;
  }

  const projectedTotalRisk = currentOpenRiskPercent + tradeRiskPercent;
  if (projectedTotalRisk > riskSettings.maxTotalRiskPercent) {
    return {
      allowed: false,
      reason: `TRADE BLOCKED — PORTFOLIO RISK LIMIT (${projectedTotalRisk.toFixed(1)}% > max ${riskSettings.maxTotalRiskPercent}%)`,
      tradeRiskPercent,
      positionSizeUsdt,
      marginRequired,
    };
  }

  return {
    allowed: true,
    tradeRiskPercent,
    positionSizeUsdt: Number(positionSizeUsdt.toFixed(2)),
    marginRequired: Number(marginRequired.toFixed(2)),
  };
}

/**
 * Open an automatic or manual paper trade with complete trade tracking
 */
export function openPaperTradeRecord(
  account: PaperAccount,
  trades: PaperTradeRecord[],
  riskSettings: PortfolioRiskSettings,
  params: {
    symbol: string;
    type: 'LONG' | 'SHORT';
    confidenceScore: number;
    setupQuality: SetupQuality;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
    entryReason: string;
    source?: 'SCALP_AUTO' | 'MANUAL';
  }
): {
  updatedAccount: PaperAccount;
  updatedTrades: PaperTradeRecord[];
  newTrade?: PaperTradeRecord;
  error?: string;
} {
  const riskCheck = validatePortfolioRisk(
    account,
    trades,
    riskSettings,
    params.symbol,
    params.entryPrice,
    params.stopLoss
  );

  if (!riskCheck.allowed) {
    return {
      updatedAccount: account,
      updatedTrades: trades,
      error: riskCheck.reason,
    };
  }

  const leverage = 10;
  const positionSize = riskCheck.positionSizeUsdt;
  const margin = riskCheck.marginRequired;

  const tradeId = `TRD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const newTrade: PaperTradeRecord = {
    id: tradeId,
    symbol: params.symbol,
    type: params.type,
    confidenceScore: params.confidenceScore,
    setupQuality: params.setupQuality,
    entryPrice: params.entryPrice,
    stopLoss: params.stopLoss,
    takeProfit: params.takeProfit,
    riskReward: params.riskReward,
    positionSize,
    margin,
    leverage,
    entryTime: Date.now(),
    exitTime: null,
    exitPrice: null,
    currentPrice: params.entryPrice,
    pnl: 0,
    pnlPercent: 0,
    status: 'OPEN',
    result: 'OPEN',
    entryReason: params.entryReason,
    source: params.source || 'SCALP_AUTO',
  };

  // Also maintain VirtualPosition for backward compatibility
  const newPosition: VirtualPosition = {
    id: tradeId,
    symbol: params.symbol,
    type: params.type,
    entryPrice: params.entryPrice,
    currentPrice: params.entryPrice,
    stopLoss: params.stopLoss,
    takeProfit: params.takeProfit,
    positionSizeUsdt: positionSize,
    leverage,
    margin,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    openedAt: Date.now(),
    source: params.source || 'SCALP_AUTO',
  };

  const updatedTrades = [newTrade, ...trades];
  const updatedActive = [...account.activePositions, newPosition];
  const marginUsed = updatedActive.reduce((sum, p) => sum + p.margin, 0);
  const freeMargin = Math.max(0, account.balance - marginUsed);

  const updatedAccount: PaperAccount = {
    ...account,
    activePositions: updatedActive,
    marginUsed: Number(marginUsed.toFixed(2)),
    freeMargin: Number(freeMargin.toFixed(2)),
  };

  savePaperAccount(updatedAccount);
  savePaperTradesHistory(updatedTrades);

  return {
    updatedAccount,
    updatedTrades,
    newTrade,
  };
}

/**
 * Tick update for paper trades - monitors live market price,
 * detects Stop Loss and Take Profit triggers automatically,
 * updates PnL, closes positions and updates statistics.
 */
export function updatePaperTradesPriceTick(
  account: PaperAccount,
  trades: PaperTradeRecord[],
  symbol: string,
  latestPrice: number
): {
  updatedAccount: PaperAccount;
  updatedTrades: PaperTradeRecord[];
  closedEvents: {
    trade: PaperTradeRecord;
    reason: 'TAKE_PROFIT' | 'STOP_LOSS';
    pnl: number;
    pnlPercent: number;
  }[];
} {
  let hasChanges = false;
  let currentAccount = { ...account };
  const closedEvents: {
    trade: PaperTradeRecord;
    reason: 'TAKE_PROFIT' | 'STOP_LOSS';
    pnl: number;
    pnlPercent: number;
  }[] = [];

  const nextTrades: PaperTradeRecord[] = [];

  for (const trade of trades) {
    if (trade.status !== 'OPEN' || trade.symbol !== symbol) {
      nextTrades.push(trade);
      continue;
    }

    hasChanges = true;
    const isLong = trade.type === 'LONG';
    const priceDiff = isLong ? latestPrice - trade.entryPrice : trade.entryPrice - latestPrice;
    const returnFraction = trade.entryPrice > 0 ? priceDiff / trade.entryPrice : 0;
    const unrealizedPnl = returnFraction * trade.positionSize;
    const unrealizedPnlPercent = returnFraction * trade.leverage * 100;

    // Trigger checks
    const hitTakeProfit = isLong ? latestPrice >= trade.takeProfit : latestPrice <= trade.takeProfit;
    const hitStopLoss = isLong ? latestPrice <= trade.stopLoss : latestPrice >= trade.stopLoss;

    if (hitTakeProfit || hitStopLoss) {
      const exitReasonType = hitTakeProfit ? 'TAKE_PROFIT' : 'STOP_LOSS';
      const exitPrice = hitTakeProfit ? trade.takeProfit : trade.stopLoss;
      const finalPriceDiff = isLong ? exitPrice - trade.entryPrice : trade.entryPrice - exitPrice;
      const finalReturn = trade.entryPrice > 0 ? finalPriceDiff / trade.entryPrice : 0;
      const realizedPnl = Number((finalReturn * trade.positionSize).toFixed(2));
      const realizedPnlPercent = Number((finalReturn * trade.leverage * 100).toFixed(2));
      const result: 'WIN' | 'LOSS' = realizedPnl >= 0 ? 'WIN' : 'LOSS';

      const closedTrade: PaperTradeRecord = {
        ...trade,
        currentPrice: exitPrice,
        exitPrice,
        exitTime: Date.now(),
        status: 'CLOSED',
        result,
        pnl: realizedPnl,
        pnlPercent: realizedPnlPercent,
        exitReason: hitTakeProfit
          ? `Take Profit Hit (Target ~1:${trade.riskReward.toFixed(1)} achieved at $${exitPrice.toFixed(2)})`
          : `Stop Loss Hit (Invalidation triggered at $${exitPrice.toFixed(2)})`,
      };

      nextTrades.push(closedTrade);
      closedEvents.push({
        trade: closedTrade,
        reason: exitReasonType,
        pnl: realizedPnl,
        pnlPercent: realizedPnlPercent,
      });

      // Update account balance and closed trades
      const newBalance = Number((currentAccount.balance + realizedPnl).toFixed(2));
      const newActivePositions = currentAccount.activePositions.filter((p) => p.id !== trade.id);
      const marginUsed = newActivePositions.reduce((sum, p) => sum + p.margin, 0);

      const legacyClosedTrade: ClosedTrade = {
        id: closedTrade.id,
        symbol: closedTrade.symbol,
        type: closedTrade.type,
        entryPrice: closedTrade.entryPrice,
        exitPrice,
        positionSizeUsdt: closedTrade.positionSize,
        leverage: closedTrade.leverage,
        realizedPnl,
        realizedPnlPercent,
        result,
        closeReason: exitReasonType,
        closedAt: Date.now(),
      };

      const updatedClosed = [legacyClosedTrade, ...currentAccount.closedTrades];
      const winCount = updatedClosed.filter((t) => t.result === 'WIN').length;
      const lossCount = updatedClosed.filter((t) => t.result === 'LOSS').length;

      currentAccount = {
        ...currentAccount,
        balance: newBalance,
        equity: newBalance,
        marginUsed: Number(marginUsed.toFixed(2)),
        freeMargin: Math.max(0, Number((newBalance - marginUsed).toFixed(2))),
        totalTrades: updatedClosed.length,
        winningTrades: winCount,
        losingTrades: lossCount,
        winRate: Number(((winCount / updatedClosed.length) * 100).toFixed(1)),
        totalPnl: Number((newBalance - 10000).toFixed(2)),
        activePositions: newActivePositions,
        closedTrades: updatedClosed,
      };
    } else {
      // Position remains open, update unrealized metrics
      const updatedOpenTrade: PaperTradeRecord = {
        ...trade,
        currentPrice: latestPrice,
        pnl: Number(unrealizedPnl.toFixed(2)),
        pnlPercent: Number(unrealizedPnlPercent.toFixed(2)),
      };
      nextTrades.push(updatedOpenTrade);
    }
  }

  if (hasChanges) {
    // Update active positions in account
    const activeTrades = nextTrades.filter((t) => t.status === 'OPEN');
    const totalUnrealized = activeTrades.reduce((sum, t) => sum + t.pnl, 0);
    const updatedAccount: PaperAccount = {
      ...currentAccount,
      equity: Number((currentAccount.balance + totalUnrealized).toFixed(2)),
      activePositions: currentAccount.activePositions.map((p) => {
        const found = activeTrades.find((t) => t.id === p.id);
        return found
          ? {
              ...p,
              currentPrice: found.currentPrice,
              unrealizedPnl: found.pnl,
              unrealizedPnlPercent: found.pnlPercent,
            }
          : p;
      }),
    };

    savePaperAccount(updatedAccount);
    savePaperTradesHistory(nextTrades);
    return { updatedAccount, updatedTrades: nextTrades, closedEvents };
  }

  return { updatedAccount: account, updatedTrades: trades, closedEvents: [] };
}

/**
 * Manually close a paper trade by ID
 */
export function manualClosePaperTrade(
  account: PaperAccount,
  trades: PaperTradeRecord[],
  tradeId: string,
  exitPrice?: number
): { updatedAccount: PaperAccount; updatedTrades: PaperTradeRecord[]; closedTrade?: PaperTradeRecord } {
  const target = trades.find((t) => t.id === tradeId && t.status === 'OPEN');
  if (!target) return { updatedAccount: account, updatedTrades: trades };

  const finalExitPrice = exitPrice ?? target.currentPrice;
  const isLong = target.type === 'LONG';
  const priceDiff = isLong ? finalExitPrice - target.entryPrice : target.entryPrice - finalExitPrice;
  const returnFraction = target.entryPrice > 0 ? priceDiff / target.entryPrice : 0;
  const realizedPnl = Number((returnFraction * target.positionSize).toFixed(2));
  const realizedPnlPercent = Number((returnFraction * target.leverage * 100).toFixed(2));
  const result: 'WIN' | 'LOSS' | 'BREAKEVEN' =
    realizedPnl > 0.1 ? 'WIN' : realizedPnl < -0.1 ? 'LOSS' : 'BREAKEVEN';

  const closedTrade: PaperTradeRecord = {
    ...target,
    currentPrice: finalExitPrice,
    exitPrice: finalExitPrice,
    exitTime: Date.now(),
    status: 'CLOSED',
    result,
    pnl: realizedPnl,
    pnlPercent: realizedPnlPercent,
    exitReason: 'Manual Close by Trader',
  };

  const updatedTrades = trades.map((t) => (t.id === tradeId ? closedTrade : t));
  const newBalance = Number((account.balance + realizedPnl).toFixed(2));
  const newActive = account.activePositions.filter((p) => p.id !== tradeId);
  const marginUsed = newActive.reduce((sum, p) => sum + p.margin, 0);

  const legacyClosed: ClosedTrade = {
    id: closedTrade.id,
    symbol: closedTrade.symbol,
    type: closedTrade.type,
    entryPrice: closedTrade.entryPrice,
    exitPrice: finalExitPrice,
    positionSizeUsdt: closedTrade.positionSize,
    leverage: closedTrade.leverage,
    realizedPnl,
    realizedPnlPercent,
    result,
    closeReason: 'MANUAL',
    closedAt: Date.now(),
  };

  const updatedClosed = [legacyClosed, ...account.closedTrades];
  const winCount = updatedClosed.filter((t) => t.result === 'WIN').length;
  const lossCount = updatedClosed.filter((t) => t.result === 'LOSS').length;

  const updatedAccount: PaperAccount = {
    ...account,
    balance: newBalance,
    equity: newBalance,
    marginUsed: Number(marginUsed.toFixed(2)),
    freeMargin: Math.max(0, Number((newBalance - marginUsed).toFixed(2))),
    totalTrades: updatedClosed.length,
    winningTrades: winCount,
    losingTrades: lossCount,
    winRate: Number(((winCount / updatedClosed.length) * 100).toFixed(1)),
    totalPnl: Number((newBalance - 10000).toFixed(2)),
    activePositions: newActive,
    closedTrades: updatedClosed,
  };

  savePaperAccount(updatedAccount);
  savePaperTradesHistory(updatedTrades);
  return { updatedAccount, updatedTrades, closedTrade };
}

/**
 * Close all active positions (e.g. on emergency stop)
 */
export function closeAllActivePaperTrades(
  account: PaperAccount,
  trades: PaperTradeRecord[]
): { updatedAccount: PaperAccount; updatedTrades: PaperTradeRecord[] } {
  let currAccount = { ...account };
  let currTrades = [...trades];

  for (const t of trades) {
    if (t.status === 'OPEN') {
      const res = manualClosePaperTrade(currAccount, currTrades, t.id);
      currAccount = res.updatedAccount;
      currTrades = res.updatedTrades;
    }
  }

  return { updatedAccount: currAccount, updatedTrades: currTrades };
}

// Keep legacy helper exports for backward compatibility with RiskCalculator
export function calculatePositionRisk(
  settings: RiskSettings,
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number
): RiskCalculation {
  const { accountBalance, riskPercentage, leverage, maxAllowedRiskPercent } = settings;
  const isRiskExceeded = riskPercentage > maxAllowedRiskPercent;

  const maxRiskAmount = (accountBalance * riskPercentage) / 100;
  const stopLossDistance = Math.abs(entryPrice - stopLossPrice);
  const stopLossPercent = entryPrice > 0 ? (stopLossDistance / entryPrice) * 100 : 1;

  const positionSizeUsdt = stopLossPercent > 0 ? maxRiskAmount / (stopLossPercent / 100) : 0;
  const contracts = entryPrice > 0 ? positionSizeUsdt / entryPrice : 0;
  const initialMargin = positionSizeUsdt / Math.max(1, leverage);

  const isLong = takeProfitPrice > entryPrice;
  const tpDistance = Math.abs(takeProfitPrice - entryPrice);
  const potentialProfitUsdt = entryPrice > 0 ? (tpDistance / entryPrice) * positionSizeUsdt : 0;
  const potentialLossUsdt = maxRiskAmount;

  let estimatedLiquidationPrice = 0;
  if (isLong) {
    estimatedLiquidationPrice = entryPrice * (1 - 1 / leverage + 0.005);
  } else {
    estimatedLiquidationPrice = entryPrice * (1 + 1 / leverage - 0.005);
  }

  return {
    maxRiskAmount: Number(maxRiskAmount.toFixed(2)),
    stopLossPercent: Number(stopLossPercent.toFixed(2)),
    positionSizeUsdt: Number(positionSizeUsdt.toFixed(2)),
    contracts: Number(contracts.toFixed(4)),
    initialMargin: Number(initialMargin.toFixed(2)),
    estimatedLiquidationPrice: Math.max(0, Number(estimatedLiquidationPrice.toFixed(2))),
    potentialProfitUsdt: Number(potentialProfitUsdt.toFixed(2)),
    potentialLossUsdt: Number(potentialLossUsdt.toFixed(2)),
    isRiskExceeded,
  };
}

export function openPaperTrade(
  account: PaperAccount,
  symbol: string,
  type: 'LONG' | 'SHORT',
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  margin: number,
  leverage: number,
  source: 'SCALP_AUTO' | 'MANUAL' = 'MANUAL'
): { updatedAccount: PaperAccount; position?: VirtualPosition; error?: string } {
  const history = loadPaperTradesHistory();
  const riskSettings = loadPortfolioRiskSettings();
  const rr = Math.abs(takeProfit - entryPrice) / Math.max(0.0001, Math.abs(entryPrice - stopLoss));

  const res = openPaperTradeRecord(account, history, riskSettings, {
    symbol,
    type,
    confidenceScore: 75,
    setupQuality: 'A',
    entryPrice,
    stopLoss,
    takeProfit,
    riskReward: Number(rr.toFixed(2)),
    entryReason: 'Manual / Auto Paper Trade Order',
    source,
  });

  if (res.error) {
    return { updatedAccount: account, error: res.error };
  }

  const legacyPos = res.updatedAccount.activePositions.find((p) => p.id === res.newTrade?.id);
  return { updatedAccount: res.updatedAccount, position: legacyPos };
}

export function closePaperTrade(
  account: PaperAccount,
  positionId: string,
  exitPrice: number,
  reason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL'
): PaperAccount {
  const history = loadPaperTradesHistory();
  const res = manualClosePaperTrade(account, history, positionId, exitPrice);
  return res.updatedAccount;
}

export function updatePositionsPrice(
  account: PaperAccount,
  symbol: string,
  latestPrice: number
): { account: PaperAccount; closedEvents: { symbol: string; reason: string; pnl: number }[] } {
  const history = loadPaperTradesHistory();
  const res = updatePaperTradesPriceTick(account, history, symbol, latestPrice);
  return {
    account: res.updatedAccount,
    closedEvents: res.closedEvents.map((e) => ({
      symbol: e.trade.symbol,
      reason: e.reason === 'TAKE_PROFIT' ? 'Take Profit Hit' : 'Stop Loss Hit',
      pnl: e.pnl,
    })),
  };
}
