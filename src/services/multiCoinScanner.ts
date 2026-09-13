import {
  BinanceLiveAccountStatus,
  ConfluenceAnalysis,
  MarketStats,
  PaperAccount,
  PaperTradeRecord,
  PortfolioRiskSettings,
  ScannerCoinState,
  SignalLogEntry,
  SignalType,
  Target24hSummary,
  Timeframe,
  TradingMode,
} from '../types';
import {
  fetchAllLiveTickers,
  fetchAllTimeframesForSymbol,
  fetchLiveOpenInterest,
  getBinanceStream,
  LiveTickerData,
  SCANNER_SYMBOLS,
  SYMBOL_DISPLAY_NAMES,
} from './binanceLive';
import {
  ALL_DISPLAY_NAMES,
  CORE_SYMBOLS,
  getActiveScannerSymbols,
  isCoreSymbol,
  loadUserSelectedSymbols,
  saveUserSelectedSymbols,
} from './coinSelectionService';
import { fetchBinanceLiveStatus } from './binanceApiService';
import { generateMarketStats } from './marketData';
import {
  calculateHistoryStats,
  clearDemoTradingHistory,
  clearPaperTradingHistory,
  DEFAULT_DEMO_ACCOUNT,
  DEFAULT_PAPER_ACCOUNT,
  loadDemoAccount,
  loadDemoTradesHistory,
  loadPaperAccount,
  loadPaperTradesHistory,
  loadPortfolioRiskSettings,
  manualClosePaperTrade,
  openPaperTradeRecord,
  saveDemoAccount,
  saveDemoTradesHistory,
  savePaperAccount,
  savePaperTradesHistory,
  updatePaperTradesPriceTick,
} from './paperTrading';
import { runComprehensiveScalpAnalysis } from './scalpEngine';
import {
  calculate24hTargetSummary,
  clearLiveTradingHistory,
  loadLiveTradesHistory,
  saveLiveTradesHistory,
} from './tradeTargetService';

const SIGNAL_LOGS_STORAGE_KEY = 'binance_futures_ai_signal_logs_v2';

export function loadSignalLogs(): SignalLogEntry[] {
  try {
    const saved = localStorage.getItem(SIGNAL_LOGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load signal logs', e);
  }
  return [];
}

export function saveSignalLogs(logs: SignalLogEntry[]): void {
  try {
    // Keep last 150 entries to prevent unbounded memory growth
    const trimmed = logs.slice(0, 150);
    localStorage.setItem(SIGNAL_LOGS_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save signal logs', e);
  }
}

export interface ScannerEngineState {
  currentMode: TradingMode;
  coins: Record<string, ScannerCoinState>;
  rankedSymbols: string[];
  topSetupSymbol: string | null;
  account: PaperAccount; // PAPER mode account ($10,000 starting margin)
  trades: PaperTradeRecord[]; // PAPER mode trade ledger
  demoAccount: PaperAccount; // DEMO mode account ($50,000 starting exchange margin)
  demoTrades: PaperTradeRecord[]; // DEMO mode trade ledger
  liveTrades: PaperTradeRecord[]; // LIVE mode trade ledger
  liveStatus: BinanceLiveAccountStatus; // LIVE mode status from backend
  target24h: Target24hSummary; // 24-Hour trade quota tracking for active mode
  signalLogs: SignalLogEntry[];
  riskSettings: PortfolioRiskSettings;
  isScannerActive: boolean;
  liveDataStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastUpdateTime: number;
  lastScanTime: number;
  errorMessage: string | null;
}

export type ScannerUpdateListener = (state: ScannerEngineState) => void;

class MultiCoinScannerService {
  private state: ScannerEngineState;
  private listeners: Set<ScannerUpdateListener> = new Set();
  private scanIntervalTimer: any = null;
  private liveStatusTimer: any = null;
  private isScanningInProgress = false;
  private lastLoggedAction: Record<string, string> = {};
  private wsUnsubscribe: (() => void) | null = null;
  private wsStatusUnsubscribe: (() => void) | null = null;
  private activeSymbols: string[] = getActiveScannerSymbols();

  constructor() {
    const account = loadPaperAccount();
    const trades = loadPaperTradesHistory();
    const demoAccount = loadDemoAccount();
    const demoTrades = loadDemoTradesHistory();
    const liveTrades = loadLiveTradesHistory();
    const riskSettings = loadPortfolioRiskSettings();
    const signalLogs = loadSignalLogs();

    this.activeSymbols = getActiveScannerSymbols();
    const initialTargetSummary = calculate24hTargetSummary(trades, 'PAPER', this.activeSymbols);

    const initialCoins: Record<string, ScannerCoinState> = {};
    for (const sym of this.activeSymbols) {
      const baseStats = generateMarketStats(sym, 100);
      const coinTarget = initialTargetSummary.coins[sym];
      const tradesCompleted = coinTarget?.tradesCompleted || 0;
      initialCoins[sym] = {
        symbol: sym,
        name: SYMBOL_DISPLAY_NAMES[sym] || sym.replace('USDT', ''),
        currentPrice: baseStats.currentPrice,
        change24h: baseStats.change24h,
        marketStats: baseStats,
        isScanning: false,
        lastUpdated: Date.now(),
        analysis: {} as any,
        activeTrade: null,
        trades24hCount: tradesCompleted,
        target24hMet: tradesCompleted >= 1,
        isTargetPending: tradesCompleted === 0,
        isCore: isCoreSymbol(sym),
        isUserSelected: !isCoreSymbol(sym),
      };
    }

    this.state = {
      currentMode: 'PAPER',
      coins: initialCoins,
      rankedSymbols: [...this.activeSymbols],
      topSetupSymbol: null,
      account,
      trades,
      demoAccount,
      demoTrades,
      liveTrades,
      liveStatus: {
        configured: false,
        apiKeyMasked: null,
        isConnected: false,
        canTrade: false,
        liveTradingEnabled: false,
        balance: null,
        permissions: {
          enableTrading: false,
          enableWithdrawals: false,
        },
        error: null,
        lastChecked: Date.now(),
      },
      target24h: initialTargetSummary,
      signalLogs,
      riskSettings,
      isScannerActive: true,
      liveDataStatus: 'CONNECTING',
      lastUpdateTime: Date.now(),
      lastScanTime: 0,
      errorMessage: null,
    };

    this.init();
  }

  private emit() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public subscribe(listener: ScannerUpdateListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): ScannerEngineState {
    return { ...this.state };
  }

  public getActiveTradesLedger(): PaperTradeRecord[] {
    if (this.state.currentMode === 'DEMO') return this.state.demoTrades;
    if (this.state.currentMode === 'LIVE') return this.state.liveTrades;
    return this.state.trades;
  }

  public getActiveSymbols(): string[] {
    return [...this.activeSymbols];
  }

  public getUserSelectedSymbols(): string[] {
    return loadUserSelectedSymbols();
  }

  public getUserSelectedCoins(): string[] {
    return loadUserSelectedSymbols();
  }

  public getCoreSymbols(): string[] {
    return [...CORE_SYMBOLS];
  }

  /**
   * Updates the 4 user-selected coins.
   * Total active coins remains strictly 10: 6 CORE + 4 USER SELECTED.
   */
  public setUserSelectedCoins(selectedCoins: string[]): string[] {
    const validatedFour = saveUserSelectedSymbols(selectedCoins);
    const newActive = [...CORE_SYMBOLS, ...validatedFour];
    this.activeSymbols = newActive;

    // Update websocket stream to include the new active 10 coins
    getBinanceStream().updateSymbols(newActive);

    // Reconcile coin states
    const updatedCoins: Record<string, ScannerCoinState> = {};
    const currentTargetSummary = calculate24hTargetSummary(this.getActiveTradesLedger(), this.state.currentMode, newActive);

    for (const sym of newActive) {
      if (this.state.coins[sym]) {
        updatedCoins[sym] = {
          ...this.state.coins[sym],
          isCore: isCoreSymbol(sym),
          isUserSelected: !isCoreSymbol(sym),
        };
      } else {
        const baseStats = generateMarketStats(sym, 100);
        const coinTarget = currentTargetSummary.coins[sym];
        const tradesCompleted = coinTarget?.tradesCompleted || 0;
        updatedCoins[sym] = {
          symbol: sym,
          name: SYMBOL_DISPLAY_NAMES[sym] || sym.replace('USDT', ''),
          currentPrice: baseStats.currentPrice,
          change24h: baseStats.change24h,
          marketStats: baseStats,
          isScanning: false,
          lastUpdated: Date.now(),
          analysis: {} as any,
          activeTrade: null,
          trades24hCount: tradesCompleted,
          target24hMet: tradesCompleted >= 1,
          isTargetPending: tradesCompleted === 0,
          isCore: isCoreSymbol(sym),
          isUserSelected: !isCoreSymbol(sym),
        };
      }
    }

    this.state.coins = updatedCoins;
    this.state.rankedSymbols = [...newActive];
    this.updateActiveTradeReferences();
    this.recompute24hTargetSummary();

    this.addSignalLog({
      id: `coins-updated-${Date.now()}`,
      time: Date.now(),
      symbol: 'SCANNER',
      signal: 'WAIT',
      confidence: 0,
      entry: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      action: `ACTIVE COINS UPDATED (10 TOTAL): 6 CORE [${CORE_SYMBOLS.join(', ')}] + 4 SELECTED [${validatedFour.join(', ')}]`,
    });

    this.emit();

    // Trigger immediate background multi-coin scan of all 10 active coins
    this.runFullMultiCoinScan().catch((err) => {
      console.warn('Scan after updating coins failed:', err);
    });

    return validatedFour;
  }

  /**
   * Recalculates 24-Hour trade target quota and updates each coin state
   */
  public recompute24hTargetSummary(): Target24hSummary {
    const activeTrades = this.getActiveTradesLedger();
    const summary = calculate24hTargetSummary(activeTrades, this.state.currentMode, this.activeSymbols);
    this.state.target24h = summary;

    for (const sym of this.activeSymbols) {
      const coin = this.state.coins[sym];
      if (coin) {
        const coinTarget = summary.coins[sym];
        const count = coinTarget?.tradesCompleted || 0;
        coin.trades24hCount = count;
        coin.target24hMet = count >= 1;
        coin.isTargetPending = count === 0;
        coin.isCore = isCoreSymbol(sym);
        coin.isUserSelected = !isCoreSymbol(sym);
      }
    }
    return summary;
  }

  /**
   * Switches trading mode: PAPER | DEMO | LIVE
   * Completely separates active ledger, balances, and execution rules.
   */
  public setTradingMode(mode: TradingMode) {
    this.state.currentMode = mode;
    this.updateActiveTradeReferences();
    this.recompute24hTargetSummary();

    const modeLabels: Record<TradingMode, string> = {
      PAPER: 'PAPER MODE (Simulated Trading, $10,000 Margin)',
      DEMO: 'DEMO MODE (Simulated Exchange Environment, $50,000 Margin)',
      LIVE: 'LIVE MODE (Real Binance Futures Trading)',
    };

    this.addSignalLog({
      id: `mode-${Date.now()}`,
      time: Date.now(),
      symbol: 'ALL',
      signal: 'WAIT',
      confidence: 0,
      entry: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      action: `SWITCHED TO ${modeLabels[mode]}`,
    });

    if (mode === 'LIVE') {
      this.refreshLiveStatus();
    }

    this.emit();
  }

  public setScannerActive(active: boolean) {
    this.state.isScannerActive = active;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.addSignalLog({
      id: `sys-${Date.now()}`,
      time: Date.now(),
      symbol: 'ALL',
      signal: 'WAIT',
      confidence: 0,
      entry: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      action: active ? `SCANNER RESUMED (${timeStr})` : `STOP SCANNER ACTIVATED (${timeStr})`,
    });
    this.emit();
  }

  public updateRiskSettings(settings: PortfolioRiskSettings) {
    this.state.riskSettings = settings;
    this.emit();
  }

  public manualCloseTrade(tradeId: string) {
    if (this.state.currentMode === 'DEMO') {
      const res = manualClosePaperTrade(this.state.demoAccount, this.state.demoTrades, tradeId);
      this.state.demoAccount = res.updatedAccount;
      this.state.demoTrades = res.updatedTrades;
      saveDemoAccount(this.state.demoAccount);
      saveDemoTradesHistory(this.state.demoTrades);
    } else {
      const res = manualClosePaperTrade(this.state.account, this.state.trades, tradeId);
      this.state.account = res.updatedAccount;
      this.state.trades = res.updatedTrades;
      savePaperAccount(this.state.account);
      savePaperTradesHistory(this.state.trades);
    }
    this.updateActiveTradeReferences();
    this.recompute24hTargetSummary();
    this.emit();
  }

  public resetPaperAccountAndHistory() {
    const { account, trades } = clearPaperTradingHistory();
    this.state.account = account;
    this.state.trades = trades;
    this.updateActiveTradeReferences();
    this.recompute24hTargetSummary();

    this.addSignalLog({
      id: `reset-paper-${Date.now()}`,
      time: Date.now(),
      symbol: 'ALL',
      signal: 'WAIT',
      confidence: 0,
      entry: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      action: 'PAPER ACCOUNT & HISTORY RESET ($10,000.00 Starting Margin)',
    });
    this.emit();
  }

  public resetDemoAccountAndHistory() {
    const { account, trades } = clearDemoTradingHistory();
    this.state.demoAccount = account;
    this.state.demoTrades = trades;
    this.updateActiveTradeReferences();
    this.recompute24hTargetSummary();

    this.addSignalLog({
      id: `reset-demo-${Date.now()}`,
      time: Date.now(),
      symbol: 'ALL',
      signal: 'WAIT',
      confidence: 0,
      entry: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      action: 'DEMO ACCOUNT & HISTORY RESET ($50,000.00 Exchange Demo Margin)',
    });
    this.emit();
  }

  public resetLiveTradingHistory() {
    this.state.liveTrades = clearLiveTradingHistory();
    this.updateActiveTradeReferences();
    this.recompute24hTargetSummary();

    this.addSignalLog({
      id: `reset-live-${Date.now()}`,
      time: Date.now(),
      symbol: 'ALL',
      signal: 'WAIT',
      confidence: 0,
      entry: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      action: 'LIVE TRADE HISTORY RESET',
    });
    this.emit();
  }

  public async refreshLiveStatus() {
    try {
      const status = await fetchBinanceLiveStatus();
      this.state.liveStatus = status;
      this.emit();
    } catch (e) {
      console.error('Failed to refresh Binance live status', e);
    }
  }

  public setLiveStatus(status: BinanceLiveAccountStatus) {
    this.state.liveStatus = status;
    this.emit();
  }

  public addSignalLog(entry: SignalLogEntry) {
    const nextLogs = [entry, ...this.state.signalLogs].slice(0, 150);
    this.state.signalLogs = nextLogs;
    saveSignalLogs(nextLogs);
  }

  private init() {
    // 1. Initial full scan of all 6 coins
    this.runFullMultiCoinScan();

    // 2. Schedule recurring scans every 10 seconds for real-time responsiveness
    this.scanIntervalTimer = setInterval(() => {
      if (this.state.isScannerActive) {
        this.runFullMultiCoinScan();
      }
    }, 10000);

    // 3. Periodic check for live Binance status (every 15 seconds)
    this.refreshLiveStatus();
    this.liveStatusTimer = setInterval(() => {
      if (this.state.currentMode === 'LIVE') {
        this.refreshLiveStatus();
      }
    }, 15000);

    // 4. Connect to Binance WebSocket for instant sub-second price ticks
    const stream = getBinanceStream();
    this.wsStatusUnsubscribe = stream.onStatus((status) => {
      this.state.liveDataStatus = status;
      this.emit();
    });

    this.wsUnsubscribe = stream.subscribe((tick) => {
      this.handleIncomingPriceTick(tick.symbol, tick.price, tick.change24h, tick.high, tick.low, tick.volume);
    });
  }

  /**
   * Sub-second live price tick handler from Binance WebSocket
   */
  public handleIncomingPriceTick(
    symbol: string,
    price: number,
    change24h: number,
    high24h?: number,
    low24h?: number,
    volume24h?: number
  ) {
    if (!this.activeSymbols.includes(symbol)) return;

    this.state.lastUpdateTime = Date.now();
    this.state.liveDataStatus = 'CONNECTED';

    // 1. Update coin current price & stats
    const coin = this.state.coins[symbol];
    if (coin) {
      coin.currentPrice = price;
      coin.change24h = change24h;
      coin.lastUpdated = Date.now();
      if (high24h) coin.marketStats.high24h = high24h;
      if (low24h) coin.marketStats.low24h = low24h;
      if (volume24h) coin.marketStats.volume24h = volume24h;
      coin.marketStats.currentPrice = price;
      coin.marketStats.change24h = change24h;
    }

    // 2. Automatic Paper Trade Management (PAPER ledger)
    const paperResult = updatePaperTradesPriceTick(
      this.state.account,
      this.state.trades,
      symbol,
      price
    );
    this.state.account = paperResult.updatedAccount;
    this.state.trades = paperResult.updatedTrades;
    savePaperAccount(this.state.account);
    savePaperTradesHistory(this.state.trades);

    if (paperResult.closedEvents.length > 0) {
      for (const ev of paperResult.closedEvents) {
        const isWin = ev.reason === 'TAKE_PROFIT';
        const pnlStr = ev.pnl >= 0 ? `+$${ev.pnl.toFixed(2)}` : `-$${Math.abs(ev.pnl).toFixed(2)}`;
        const actionStr = isWin
          ? `[PAPER] TP HIT (${pnlStr}, +${ev.pnlPercent.toFixed(1)}%) — WIN`
          : `[PAPER] SL HIT (${pnlStr}, ${ev.pnlPercent.toFixed(1)}%) — LOSS`;

        this.addSignalLog({
          id: `exit-paper-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          time: Date.now(),
          symbol: ev.trade.symbol,
          signal: ev.trade.type,
          confidence: ev.trade.confidenceScore,
          entry: ev.trade.entryPrice,
          sl: ev.trade.stopLoss,
          tp: ev.trade.takeProfit,
          rr: ev.trade.riskReward,
          action: actionStr,
          isTradeAction: true,
        });
      }
    }

    // 3. Automatic Demo Trade Management (DEMO ledger)
    const demoResult = updatePaperTradesPriceTick(
      this.state.demoAccount,
      this.state.demoTrades,
      symbol,
      price
    );
    this.state.demoAccount = demoResult.updatedAccount;
    this.state.demoTrades = demoResult.updatedTrades;
    saveDemoAccount(this.state.demoAccount);
    saveDemoTradesHistory(this.state.demoTrades);

    if (demoResult.closedEvents.length > 0) {
      for (const ev of demoResult.closedEvents) {
        const isWin = ev.reason === 'TAKE_PROFIT';
        const pnlStr = ev.pnl >= 0 ? `+$${ev.pnl.toFixed(2)}` : `-$${Math.abs(ev.pnl).toFixed(2)}`;
        const actionStr = isWin
          ? `[DEMO] TP HIT (${pnlStr}, +${ev.pnlPercent.toFixed(1)}%) — WIN`
          : `[DEMO] SL HIT (${pnlStr}, ${ev.pnlPercent.toFixed(1)}%) — LOSS`;

        this.addSignalLog({
          id: `exit-demo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          time: Date.now(),
          symbol: ev.trade.symbol,
          signal: ev.trade.type,
          confidence: ev.trade.confidenceScore,
          entry: ev.trade.entryPrice,
          sl: ev.trade.stopLoss,
          tp: ev.trade.takeProfit,
          rr: ev.trade.riskReward,
          action: actionStr,
          isTradeAction: true,
        });
      }
    }

    // Update active trade reference on coins for current mode
    this.updateActiveTradeReferences();
    this.emit();
  }

  private updateActiveTradeReferences() {
    const currentTrades =
      this.state.currentMode === 'DEMO'
        ? this.state.demoTrades
        : this.state.currentMode === 'PAPER'
        ? this.state.trades
        : [];

    const active = currentTrades.filter((t) => t.status === 'OPEN');
    for (const sym of this.activeSymbols) {
      const coin = this.state.coins[sym];
      if (coin) {
        coin.activeTrade = active.find((t) => t.symbol === sym) || null;
      }
    }
    this.recompute24hTargetSummary();
  }

  /**
   * Main multi-coin scanner cycle:
   * 1. Fetches Binance live 24hr tickers & funding for all 10 active coins
   * 2. Fetches 6 timeframes (4H, 1H, 15M, 5M, 3M, 1M) for each coin
   * 3. Calculates scalp analysis for each coin
   * 4. Enforces Confidence Score Auto-Trading Rule (score >= 70)
   * 5. Ranks coins by setup quality & confidence
   */
  public async runFullMultiCoinScan(): Promise<void> {
    if (this.isScanningInProgress) return;
    this.isScanningInProgress = true;

    try {
      // Step A: Fetch all 10 active coins live tickers in one batch
      const tickers = await fetchAllLiveTickers(this.activeSymbols);

      // Step B: Concurrently fetch candles & calculate scalp engine for all 10 coins
      const scanPromises = this.activeSymbols.map(async (symbol) => {
        const ticker = tickers[symbol];
        const currentPrice = ticker?.currentPrice || this.state.coins[symbol]?.currentPrice || 100;
        const change24h = ticker?.change24h || this.state.coins[symbol]?.change24h || 0;

        // Fetch all 6 timeframes (4H, 1H, 15M, 5M, 3M, 1M)
        const timeframeCandles = await fetchAllTimeframesForSymbol(symbol);
        const oiData = await fetchLiveOpenInterest(symbol, currentPrice);

        // Run full scalp confluence engine
        const analysis = runComprehensiveScalpAnalysis(
          symbol,
          timeframeCandles,
          currentPrice,
          oiData.openInterest,
          oiData.oiChange24h,
          change24h
        );

        const marketStats: MarketStats = {
          symbol,
          currentPrice,
          markPrice: ticker?.markPrice || currentPrice,
          change24h,
          high24h: ticker?.high24h || currentPrice * 1.02,
          low24h: ticker?.low24h || currentPrice * 0.98,
          volume24h: ticker?.volume24h || 500000000,
          openInterest: oiData.openInterest,
          openInterestChange24h: oiData.oiChange24h,
          fundingRate: ticker?.fundingRate || 0.0001,
          nextFundingTime: ticker?.nextFundingTime || '04:00:00 UTC',
        };

        return { symbol, analysis, marketStats, currentPrice, change24h };
      });

      const scanResults = await Promise.all(scanPromises);

      // Step C: Update state for all 10 coins and recalculate 24H target quota
      for (const res of scanResults) {
        const coin = this.state.coins[res.symbol];
        if (coin) {
          coin.analysis = res.analysis;
          coin.marketStats = res.marketStats;
          coin.currentPrice = res.currentPrice;
          coin.change24h = res.change24h;
          coin.lastUpdated = Date.now();
          coin.blockedReason = null;
        }
      }
      this.recompute24hTargetSummary();

      // Step D: CONFIDENCE SCORE AUTO-TRADING RULE & PORTFOLIO RISK CHECKS
      if (this.state.isScannerActive) {
        this.evaluateAutoTradingRules(scanResults);
      }

      // Step E: Rank coins by setup quality, confidence score, and prioritize pending 24H quota coins
      const ranked = [...this.activeSymbols].sort((a, b) => {
        const coinA = this.state.coins[a];
        const coinB = this.state.coins[b];
        const scoreA = coinA?.analysis?.confidenceScore || 0;
        const scoreB = coinB?.analysis?.confidenceScore || 0;

        // If both setups qualify (>= 70), pending 24H target coin is prioritized for top setup
        if (scoreA >= 70 && scoreB >= 70) {
          if (coinA?.isTargetPending && !coinB?.isTargetPending) return -1;
          if (!coinA?.isTargetPending && coinB?.isTargetPending) return 1;
        }

        return scoreB - scoreA;
      });

      this.state.rankedSymbols = ranked;
      const validCandidate = ranked.find((sym) => {
        const sig = this.state.coins[sym]?.analysis?.signal;
        return sig === 'LONG' || sig === 'SHORT';
      });
      this.state.topSetupSymbol = validCandidate || ranked[0];

      this.state.lastScanTime = Date.now();
      this.state.lastUpdateTime = Date.now();
      this.state.liveDataStatus = 'CONNECTED';
      this.state.errorMessage = null;

      this.updateActiveTradeReferences();
      this.emit();
    } catch (err: any) {
      console.error('Error during multi-coin scan:', err);
      this.state.liveDataStatus = 'DISCONNECTED';
      this.state.errorMessage = err?.message || 'Binance data connection issue';
      this.emit();
    } finally {
      this.isScanningInProgress = false;
    }
  }

  /**
   * Evaluates Auto-Trading rules:
   * When Strategy Confidence Score >= 70:
   * - In PAPER mode -> creates a PAPER trade
   * - In DEMO mode -> creates a DEMO trade
   * - In LIVE mode -> handled strictly through verified Binance API with liveTradingEnabled safety toggle
   */
  private evaluateAutoTradingRules(
    scanResults: {
      symbol: string;
      analysis: ConfluenceAnalysis;
      marketStats: MarketStats;
      currentPrice: number;
      change24h: number;
    }[]
  ) {
    const targetSummary = this.recompute24hTargetSummary();

    // Prioritize pending coins that have not yet traded in the 24H window (0/1).
    // IMPORTANT CONSTRAINTS:
    // - Never lowers the confidence requirement below 70 merely to satisfy quota
    // - Never creates a fake trade or forces entry into unsafe market conditions
    // - The 1 trade target is a MINIMUM TARGET, NOT A MAXIMUM LIMIT:
    //   Coins that already completed their first valid trade continue scanning normally
    //   and can take 2, 3+ valid trades if confidence >= 70, R:R >= 1:3, and risk rules pass.
    const sorted = [...scanResults].sort((a, b) => {
      const scoreA = a.analysis.confidenceScore;
      const scoreB = b.analysis.confidenceScore;

      const aValid = scoreA >= 70 && (a.analysis.signal === 'LONG' || a.analysis.signal === 'SHORT');
      const bValid = scoreB >= 70 && (b.analysis.signal === 'LONG' || b.analysis.signal === 'SHORT');

      const aPending = (targetSummary.coins[a.symbol]?.tradesCompleted || 0) === 0;
      const bPending = (targetSummary.coins[b.symbol]?.tradesCompleted || 0) === 0;

      if (aValid && bValid) {
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
      }

      return scoreB - scoreA;
    });

    const isPaperMode = this.state.currentMode === 'PAPER';
    const isDemoMode = this.state.currentMode === 'DEMO';

    if (!isPaperMode && !isDemoMode) {
      // In LIVE mode, real executions only happen if liveTradingEnabled is verified ON on the server
      return;
    }

    const currentAccount = isDemoMode ? this.state.demoAccount : this.state.account;
    const currentTrades = isDemoMode ? this.state.demoTrades : this.state.trades;
    const modePrefix = isDemoMode ? 'DEMO' : 'PAPER';

    for (const item of sorted) {
      const { symbol, analysis, currentPrice } = item;
      const coin = this.state.coins[symbol];

      // Check: Already have an active position for this coin in this mode?
      const hasActive = currentTrades.some(
        (t) => t.symbol === symbol && t.status === 'OPEN'
      );

      if (hasActive) {
        continue;
      }

      const score = analysis.confidenceScore;
      const isSignalValid = analysis.signal === 'LONG' || analysis.signal === 'SHORT';

      // Primary Rule: Confidence Score >= 70
      if (score >= 70 && isSignalValid) {
        const entryDrift = Math.abs(currentPrice - analysis.entryPrice) / analysis.entryPrice;
        const notChasing = entryDrift <= 0.0035;

        const slDistance = Math.abs(analysis.entryPrice - analysis.stopLoss) / analysis.entryPrice;
        const logicalSl = slDistance > 0.001 && slDistance <= 0.015;

        const achievableRr = analysis.riskRewardRatio >= 2.8;
        const confirmationsPresent =
          analysis.setupQuality === 'A+' || analysis.setupQuality === 'A';

        if (!notChasing) {
          coin.blockedReason = 'TRADE BLOCKED — ENTRY BEING CHASED';
          this.logThrottledAction(
            symbol,
            `${symbol} WAIT ${score} — Entry Chased (${(entryDrift * 100).toFixed(2)}% drift)`,
            analysis
          );
          continue;
        }

        if (!logicalSl) {
          coin.blockedReason = 'TRADE BLOCKED — INVALID SL PLACEMENT';
          this.logThrottledAction(
            symbol,
            `${symbol} WAIT ${score} — Stop Loss Out of Range (${(slDistance * 100).toFixed(2)}%)`,
            analysis
          );
          continue;
        }

        if (!achievableRr) {
          coin.blockedReason = 'TRADE BLOCKED — SUB-OPTIMAL R:R (<1:2.8)';
          this.logThrottledAction(
            symbol,
            `${symbol} WAIT ${score} — Sub-optimal R:R (1:${analysis.riskRewardRatio.toFixed(1)})`,
            analysis
          );
          continue;
        }

        if (!confirmationsPresent) {
          coin.blockedReason = 'TRADE BLOCKED — INSUFFICIENT CONFIRMATION';
          this.logThrottledAction(
            symbol,
            `${symbol} WAIT ${score} — Setup Grade ${analysis.setupQuality}`,
            analysis
          );
          continue;
        }

        // Execute into active mode ledger
        const openResult = openPaperTradeRecord(
          currentAccount,
          currentTrades,
          this.state.riskSettings,
          {
            symbol,
            type: analysis.signal as 'LONG' | 'SHORT',
            confidenceScore: score,
            setupQuality: analysis.setupQuality,
            entryPrice: analysis.entryPrice,
            stopLoss: analysis.stopLoss,
            takeProfit: analysis.takeProfit,
            riskReward: analysis.riskRewardRatio,
            entryReason: `${analysis.setupTimeframe} Setup + ${analysis.entryTimeframe} Trigger | ${analysis.liquidityEvent} | ${analysis.fvgStatus}`,
            source: 'SCALP_AUTO',
          }
        );

        if (openResult.error) {
          coin.blockedReason = openResult.error;
          this.logThrottledAction(
            symbol,
            `${symbol} ${analysis.signal} ${score} — ${openResult.error}`,
            analysis
          );
        } else if (openResult.newTrade) {
          if (isDemoMode) {
            this.state.demoAccount = openResult.updatedAccount;
            this.state.demoTrades = openResult.updatedTrades;
            saveDemoAccount(this.state.demoAccount);
            saveDemoTradesHistory(this.state.demoTrades);
          } else {
            this.state.account = openResult.updatedAccount;
            this.state.trades = openResult.updatedTrades;
            savePaperAccount(this.state.account);
            savePaperTradesHistory(this.state.trades);
          }

          coin.blockedReason = null;
          coin.activeTrade = openResult.newTrade;

          const actionMsg = `[${modePrefix}] ${symbol} ${analysis.signal} ${score} — AUTO OPENED at $${analysis.entryPrice.toFixed(2)}`;
          this.addSignalLog({
            id: `trade-${modePrefix.toLowerCase()}-${Date.now()}-${symbol}`,
            time: Date.now(),
            symbol,
            signal: analysis.signal,
            confidence: score,
            entry: analysis.entryPrice,
            sl: analysis.stopLoss,
            tp: analysis.takeProfit,
            rr: analysis.riskRewardRatio,
            action: actionMsg,
            isTradeAction: true,
          });
        }
      } else {
        const waitReason =
          score < 70
            ? `WAIT (Score ${score} < 70)`
            : `WAIT (${analysis.reasonsAgainst[0] || 'Opposing HTF context'})`;
        this.logThrottledAction(symbol, `${symbol} ${waitReason}`, analysis, true);
      }
    }
  }

  private logThrottledAction(
    symbol: string,
    action: string,
    analysis: ConfluenceAnalysis,
    isWait = false
  ) {
    const prev = this.lastLoggedAction[symbol];
    if (prev === action && isWait) return;

    this.lastLoggedAction[symbol] = action;
    this.addSignalLog({
      id: `log-${Date.now()}-${symbol}`,
      time: Date.now(),
      symbol,
      signal: analysis.signal,
      confidence: analysis.confidenceScore,
      entry: analysis.entryPrice,
      sl: analysis.stopLoss,
      tp: analysis.takeProfit,
      rr: analysis.riskRewardRatio,
      action,
      isTradeAction: false,
    });
  }

  public destroy() {
    clearInterval(this.scanIntervalTimer);
    clearInterval(this.liveStatusTimer);
    if (this.wsUnsubscribe) this.wsUnsubscribe();
    if (this.wsStatusUnsubscribe) this.wsStatusUnsubscribe();
    this.listeners.clear();
  }
}

// Singleton scanner service
let scannerServiceInstance: MultiCoinScannerService | null = null;

export function getScannerService(): MultiCoinScannerService {
  if (!scannerServiceInstance) {
    scannerServiceInstance = new MultiCoinScannerService();
  }
  return scannerServiceInstance;
}
