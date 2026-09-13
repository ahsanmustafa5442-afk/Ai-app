export type Timeframe = '4H' | '1H' | '15M' | '5M' | '3M' | '1M';

export type SignalType = 'LONG' | 'SHORT' | 'WAIT';

export type SetupQuality = 'A+' | 'A' | 'B' | 'C' | 'Invalid';

export type ConfidenceCategory = 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';

export type MarketRegime = 'BULLISH_TREND' | 'BEARISH_TREND' | 'RANGE_BOUND' | 'LIQUIDITY_SWEEP_REVERSAL';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketStats {
  symbol: string;
  currentPrice: number;
  markPrice: number;
  change24h: number; // percentage
  high24h: number;
  low24h: number;
  volume24h: number; // in USDT
  openInterest: number; // in USDT
  openInterestChange24h: number; // percentage
  fundingRate: number; // e.g. 0.0001 = 0.0100%
  nextFundingTime: string;
}

export interface TechnicalsSnapshot {
  ema20: number;
  ema50: number;
  ema200: number;
  rsi: number;
  rsiCondition: 'Oversold' | 'Neutral' | 'Overbought' | 'Bullish Divergence' | 'Bearish Divergence';
  vwap: number;
  vwapRelation: 'Above VWAP' | 'At VWAP' | 'Below VWAP';
  atr: number;
}

export interface StructureSnapshot {
  trend: 'Bullish' | 'Bearish' | 'Neutral / Ranging';
  structure: 'Bullish BOS' | 'Bearish BOS' | 'CHoCH Bullish' | 'CHoCH Bearish' | 'Equal Highs/Lows' | 'Consolidation';
  emaStatus: 'Bullish Stack (20>50>200)' | 'Bearish Stack (20<50<200)' | 'Tangled / Transitioning';
  volumeCondition: 'High Buying Volume' | 'High Selling Volume' | 'Declining / Exhaustion' | 'Normal';
  liquidityCondition: 'Buy-Side Swept' | 'Sell-Side Swept' | 'Resting Liquidity Above' | 'Resting Liquidity Below' | 'Neutral';
  fvgCondition: 'Bullish FVG Active' | 'Bearish FVG Active' | 'FVG Mitigated' | 'No Significant FVG';
  supplyDemandCondition: 'In Demand Zone' | 'In Supply Zone' | 'Equilibrium' | 'Approaching Demand' | 'Approaching Supply';
  keySupport: number;
  keyResistance: number;
}

export interface TimeframeAnalysis extends StructureSnapshot, TechnicalsSnapshot {
  timeframe: Timeframe;
  sentimentScore: number; // -100 to +100
}

export interface BtcContext {
  symbol: 'BTCUSDT';
  price: number;
  trend4h: 'Bullish' | 'Bearish' | 'Choppy';
  trend1h: 'Bullish' | 'Bearish' | 'Choppy';
  dominance: number; // e.g. 56.4%
  impactOnAlt: 'Favorable for Longs' | 'Favorable for Shorts' | 'High Volatility Warning' | 'Neutral / Decoupled';
  summary: string;
}

export interface FlowStepResult {
  step: number;
  name: string;
  status: 'passed' | 'neutral' | 'failed';
  finding: string;
  biasContribution: 'LONG' | 'SHORT' | 'NEUTRAL';
}

export interface ConfluenceAnalysis {
  symbol: string;
  timestamp: number;
  signal: SignalType;
  setupType: 'SCALP';
  htfBias: 'Bullish' | 'Bearish' | 'Neutral';
  confidenceScore: number; // 0 to 100
  confidenceCategory: ConfidenceCategory;
  setupQuality: SetupQuality;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  slDistancePercent: number;
  tpDistancePercent: number;
  
  // Scalp specifics
  entryTimeframe: '1M' | '3M' | '5M';
  setupTimeframe: '15M';
  htfConfirmation: string;
  liquidityEvent: string;
  fvgStatus: string;
  volumeStatus: string;
  oiStatus: string;
  invalidationLevel: number;
  
  reasonsFor: string[];
  reasonsAgainst: string[];
  
  marketStructureSummary: string;
  trendSummary: string;
  liquiditySummary: string;
  supportResistanceSummary: string;
  supplyDemandSummary: string;
  fvgSummary: string;
  volumeSummary: string;
  openInterestSummary: string;
  emaSummary: string;
  rsiSummary: string;
  vwapSummary: string;
  btcContext: BtcContext;
  
  timeframes: Record<Timeframe, TimeframeAnalysis>;
  flowSteps: FlowStepResult[];
}

export interface RiskSettings {
  accountBalance: number;
  riskPercentage: number; // e.g. 1% or 2%
  leverage: number; // 1 to 50x
  maxAllowedRiskPercent: number; // default 3%
}

export interface RiskCalculation {
  maxRiskAmount: number; // balance * riskPercentage
  stopLossPercent: number;
  positionSizeUsdt: number;
  contracts: number;
  initialMargin: number;
  estimatedLiquidationPrice: number;
  potentialProfitUsdt: number;
  potentialLossUsdt: number;
  isRiskExceeded: boolean;
}

export interface VirtualPosition {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSizeUsdt: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openedAt: number;
  source?: 'SCALP_AUTO' | 'MANUAL';
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  positionSizeUsdt: number;
  leverage: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  result: 'WIN' | 'LOSS' | 'BREAKEVEN';
  closeReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'MANUAL';
  closedAt: number;
}

export interface PaperAccount {
  balance: number; // initial default $10,000
  equity: number;
  marginUsed: number;
  freeMargin: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // percentage
  profitFactor: number;
  maxDrawdown: number; // percentage
  totalPnl: number;
  activePositions: VirtualPosition[];
  closedTrades: ClosedTrade[];
}

export interface PaperTradeRecord {
  id: string; // e.g. "TRD-1024"
  symbol: string;
  type: 'LONG' | 'SHORT';
  confidenceScore: number;
  setupQuality: SetupQuality;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  positionSize: number; // in USDT
  margin: number;
  leverage: number;
  entryTime: number;
  exitTime?: number | null;
  exitPrice?: number | null;
  currentPrice: number;
  pnl: number; // in USDT
  pnlPercent: number; // %
  status: 'OPEN' | 'CLOSED';
  result: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
  entryReason: string;
  exitReason?: string;
  source: 'SCALP_AUTO' | 'MANUAL';
}

export interface PortfolioRiskSettings {
  maxSimultaneousTrades: number; // default: 5
  maxRiskPerTradePercent: number; // default: 1.0%
  maxTotalRiskPercent: number; // default: 3.0%
}

export interface PaperTradeHistoryStats {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %
  totalPnl: number;
  averagePnl: number;
  averageRiskReward: number;
  maxDrawdown: number; // %
  bestTradePnl: number;
  worstTradePnl: number;
}

export interface ScannerCoinState {
  symbol: string;
  name: string;
  currentPrice: number;
  change24h: number;
  analysis: ConfluenceAnalysis;
  marketStats: MarketStats;
  isScanning: boolean;
  lastUpdated: number;
  activeTrade?: PaperTradeRecord | null;
  blockedReason?: string | null;
  trades24hCount?: number;
  target24hMet?: boolean;
  isTargetPending?: boolean;
  isCore?: boolean;
  isUserSelected?: boolean;
  isUnavailable?: boolean;
}

export interface Coin24hTarget {
  symbol: string;
  name: string;
  tradesCompleted: number;
  target: number; // 1 (minimum target)
  isTargetMet: boolean;
  displayRatio: string; // e.g. "1/1", "0/1", "2/1"
  isPriority: boolean; // true when tradesCompleted === 0
  lastTradeTime?: number | null;
  lastTradeResult?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN' | null;
  isCore?: boolean;
  isUserSelected?: boolean;
  isUnavailable?: boolean;
}

export interface ActiveCoinsConfig {
  coreSymbols: string[]; // 6 permanent priority coins
  userSelectedSymbols: string[]; // exactly 4 coins selected by user
  allSymbols: string[]; // exactly 10 coins (6 core + 4 selected)
}

export interface AvailableFuturesContract {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h?: number;
  low24h?: number;
  isTradable: boolean;
  status: 'TRADING' | 'HALT' | 'DELISTED' | 'BREAK';
  category?: 'Layer 1/2' | 'DeFi' | 'AI & Data' | 'Meme' | 'Infra' | 'Trending';
}

export interface Target24hSummary {
  mode: TradingMode;
  coins: Record<string, Coin24hTarget>;
  coinList: Coin24hTarget[];
  tradesCompletedToday: number;
  coinsMeetingTarget: number;
  coinsPending: number;
  totalCoins: number;
  timeRemainingStr: string;
  windowRemainingMs: number;
  windowResetTime: number;
}

export interface SignalLogEntry {
  id: string;
  time: number;
  symbol: string;
  signal: SignalType;
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  rr: number;
  action: string;
  isTradeAction?: boolean;
}

export type TradingMode = 'PAPER' | 'DEMO' | 'LIVE';

export interface BinanceLiveAccountStatus {
  configured: boolean;
  apiKeyMasked: string | null;
  isConnected: boolean;
  canTrade: boolean;
  liveTradingEnabled: boolean;
  balance: {
    totalWalletBalance: number;
    availableBalance: number;
    totalUnrealizedProfit: number;
  } | null;
  permissions: {
    enableTrading: boolean;
    enableWithdrawals: boolean;
  };
  latencyMs?: number;
  error: string | null;
  lastChecked: number;
}

export interface BinanceLivePosition {
  symbol: string;
  positionAmt: number;
  entryPrice: number;
  markPrice: number;
  unRealizedProfit: number;
  liquidationPrice: number;
  leverage: number;
  marginType: string;
  isolatedWallet: number;
}

