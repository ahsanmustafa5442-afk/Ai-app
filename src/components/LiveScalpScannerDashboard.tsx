import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Layers,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { ScannerCoinState, Target24hSummary, TradingMode } from '../types';
import { TradeTarget24hCard } from './TradeTarget24hCard';
import {
  CORE_SYMBOLS,
  DEFAULT_USER_SELECTED_SYMBOLS,
  isCoreSymbol,
} from '../services/coinSelectionService';

interface LiveScalpScannerDashboardProps {
  coins: Record<string, ScannerCoinState>;
  rankedSymbols: string[];
  topSetupSymbol: string | null;
  isScannerActive: boolean;
  onToggleScannerActive: () => void;
  onOpenRiskModal: () => void;
  onSelectCoinForDetail: (symbol: string) => void;
  onManualCloseTrade?: (tradeId: string) => void;
  liveDataStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastScanTime: number;
  currentMode?: TradingMode;
  accountBalance?: number;
  onSelectMode?: (mode: TradingMode) => void;
  target24h?: Target24hSummary;
  onOpenSelectCoins?: () => void;
  userSelectedSymbols?: string[];
}

export const LiveScalpScannerDashboard: React.FC<LiveScalpScannerDashboardProps> = ({
  coins,
  rankedSymbols,
  topSetupSymbol,
  isScannerActive,
  onToggleScannerActive,
  onOpenRiskModal,
  onSelectCoinForDetail,
  onManualCloseTrade,
  liveDataStatus,
  lastScanTime,
  currentMode = 'PAPER',
  accountBalance,
  onSelectMode,
  target24h,
  onOpenSelectCoins,
  userSelectedSymbols = DEFAULT_USER_SELECTED_SYMBOLS,
}) => {
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsSinceScan = lastScanTime > 0 ? Math.floor((now - lastScanTime) / 1000) : 0;
  const isDemo = currentMode === 'DEMO';
  const isLive = currentMode === 'LIVE';
  const displayBalance = accountBalance !== undefined ? accountBalance : isDemo ? 50000 : 10000;

  return (
    <div className="space-y-4">
      {/* Prominent Mode Banner on Dashboard (Prompt Requirement 2: Clearly show "DEMO MODE" on the dashboard) */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 shadow-lg transition-all ${
          isDemo
            ? 'bg-gradient-to-r from-sky-950/80 via-slate-900 to-sky-900/30 border-sky-500/50 shadow-sky-500/10'
            : isLive
            ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/40 border-rose-500/50 shadow-rose-500/10'
            : 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-500/10'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isDemo
                ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                : isLive
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isDemo ? <Target className="w-5 h-5" /> : isLive ? <ShieldAlert className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border ${
                  isDemo
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-sm shadow-sky-500/30'
                    : isLive
                    ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/30'
                    : 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm shadow-emerald-500/30'
                }`}
              >
                {isDemo ? 'DEMO MODE' : isLive ? 'LIVE MODE' : 'PAPER MODE'}
              </span>
              <span className="text-xs font-bold text-white">
                {isDemo
                  ? 'Simulated Exchange Environment'
                  : isLive
                  ? 'Real Binance Futures Trading'
                  : 'Simulated Trading'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {isDemo
                ? 'Dedicated demo account using Binance public Futures prices for realistic fills. Isolated $50,000 demo margin. Zero real capital at risk.'
                : isLive
                ? 'Direct Binance Futures API integration. Real orders execute when Live Trading master switch is enabled.'
                : 'Scanning BTC, BNB, SOL, XRP, SUI, DOGE with Binance public data. Creates paper trades when score ≥ 70. Virtual $10,000 margin.'}
            </p>
          </div>
        </div>

        {/* Current Mode Balance & Quick Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isDemo ? 'Demo Balance' : isLive ? 'Binance Wallet' : 'Paper Balance'}
            </span>
            <span
              className={`text-base font-black font-mono ${
                isDemo ? 'text-sky-400' : isLive ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              ${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {onSelectMode && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onSelectMode('PAPER')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  currentMode === 'PAPER' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                PAPER
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('DEMO')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  currentMode === 'DEMO' ? 'bg-sky-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                DEMO
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('LIVE')}
                className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                  currentMode === 'LIVE' ? 'bg-rose-500 text-white font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                LIVE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 24-Hour Trade Target Quota Board (At least 1 valid trade per coin per rolling 24H) */}
      <TradeTarget24hCard
        summary={target24h}
        currentMode={currentMode}
        onSelectCoinForDetail={onSelectCoinForDetail}
        onSelectMode={onSelectMode}
        isScannerActive={isScannerActive}
        onOpenSelectCoins={onOpenSelectCoins}
      />

      {/* Scanner Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            {isScannerActive && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                LIVE SCALP SCANNER
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                  isScannerActive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {isScannerActive ? 'SCANNING ACTIVE' : 'SCANNER STOPPED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous 6-timeframe confluence radar across 10 Binance Futures coins. Auto-executes trades when Score ≥ 70 with valid 1:3 R:R.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* SELECT COINS Button (Requirement 2 & 9) */}
          {onOpenSelectCoins && (
            <button
              type="button"
              id="select-coins-control-btn"
              onClick={onOpenSelectCoins}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/50 text-xs font-black flex items-center gap-1.5 transition shadow-sm shadow-cyan-500/15"
              title="Select 4 additional Binance Futures coins to scan (10 total)"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>SELECT COINS (4/4)</span>
            </button>
          )}

          {/* Risk Limits Config */}
          <button
            type="button"
            id="portfolio-risk-btn"
            onClick={onOpenRiskModal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Configure portfolio risk protection"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Portfolio Risk</span>
          </button>

          {/* Emergency Stop Button (Prompt Requirement 10) */}
          <button
            type="button"
            id="emergency-stop-scanner-btn"
            onClick={onToggleScannerActive}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-md ${
              isScannerActive
                ? 'bg-rose-600/90 hover:bg-rose-500 text-white shadow-rose-600/20 border border-rose-500'
                : 'bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-emerald-600/20 border border-emerald-500'
            }`}
          >
            {isScannerActive ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>STOP SCANNER</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RESUME SCANNER</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Scanner Composition Overview (Requirement 6: Show CORE & USER SELECTED clearly) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Active Scanner List (10 Coins Total)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              6 CORE + 4 USER SELECTED
            </span>
          </div>
          {onOpenSelectCoins && (
            <button
              type="button"
              onClick={onOpenSelectCoins}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition"
            >
              <Layers className="w-3 h-3" />
              <span>Modify Coins (4/4)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {/* CORE: 6 Permanent Priority Coins */}
          <div className="bg-slate-950/70 border border-amber-500/20 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono font-black text-[10px] text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                CORE (6 PERMANENT):
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">Priority Permanent</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CORE_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectCoinForDetail(sym)}
                  className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 font-mono font-bold text-[11px] text-amber-300 transition flex items-center gap-1"
                  title={`Inspect detailed charts & setups for ${sym}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{sym}</span>
                </button>
              ))}
            </div>
          </div>

          {/* USER SELECTED: 4 Additional Coins */}
          <div className="bg-slate-950/70 border border-cyan-500/20 rounded-xl p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono font-black text-[10px] text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                USER SELECTED (4 ACTIVE):
              </span>
              <span className="text-[9px] text-slate-500 font-semibold">User Configured</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {userSelectedSymbols.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => onSelectCoinForDetail(sym)}
                  className="px-2 py-0.5 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 font-mono font-bold text-[11px] text-cyan-300 transition flex items-center gap-1"
                  title={`Inspect detailed charts & setups for ${sym}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{sym}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Ten Coin Grid (Sorted by Setup Quality & Confidence Score) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rankedSymbols.map((symbol, idx) => {
          const coin = coins[symbol];
          if (!coin) return null;

          const analysis = coin.analysis;
          const isTopSetup = symbol === topSetupSymbol && (analysis?.confidenceScore || 0) >= 65;
          const score = analysis?.confidenceScore ?? 50;
          const isLong = analysis?.signal === 'LONG';
          const isShort = analysis?.signal === 'SHORT';
          const isWait = !isLong && !isShort;
          const activeTrade = coin.activeTrade;

          return (
            <div
              key={symbol}
              id={`scanner-card-${symbol}`}
              className={`rounded-2xl p-4 transition-all relative flex flex-col justify-between border ${
                isTopSetup
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-400/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80 shadow-md'
              }`}
            >
              {/* Top Setup Gold Ribbon */}
              {isTopSetup && (
                <div className="absolute -top-3 left-4 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 tracking-wider z-10">
                  <Award className="w-3 h-3 fill-current" />
                  <span>TOP SCALP SETUP (#{idx + 1})</span>
                </div>
              )}

              {/* Card Header: Coin, Price, 24h Change */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white font-mono tracking-tight">
                      {symbol}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase tracking-wider border ${
                        isCoreSymbol(symbol)
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {isCoreSymbol(symbol) ? 'CORE' : 'SELECTED'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium hidden xs:inline">
                      {coin.name}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-lg font-extrabold text-white font-mono">
                      ${coin.currentPrice >= 1 ? coin.currentPrice.toFixed(2) : coin.currentPrice.toFixed(4)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono flex items-center ${
                        coin.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {coin.change24h >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 inline" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 inline" />
                      )}
                      {coin.change24h >= 0 ? `+${coin.change24h.toFixed(2)}%` : `${coin.change24h.toFixed(2)}%`}
                    </span>
                  </div>
                </div>

                {/* Signal Badge */}
                <div className="text-right">
                  <div
                    className={`px-3 py-1 rounded-xl font-black text-xs tracking-wider inline-flex items-center gap-1 shadow-sm ${
                      isLong
                        ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                        : isShort
                        ? 'bg-rose-500 text-white shadow-rose-500/20'
                        : 'bg-slate-800 text-amber-300 border border-slate-700'
                    }`}
                  >
                    {isLong ? (
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isShort ? (
                      <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    <span>{analysis?.signal || 'WAIT'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 font-semibold">
                    Grade: {analysis?.setupQuality || 'C'}
                  </div>
                </div>
              </div>

              {/* Confidence Score Bar */}
              <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 mb-3">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Confidence Score:
                  </span>
                  <span className="font-mono font-bold text-white text-xs">
                    {score}%
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (Auto-Trade ≥ 70)
                    </span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      score >= 70
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                        : score >= 50
                        ? 'bg-amber-400'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                  />
                </div>
              </div>

              {/* Timeframe Scalp Matrix (Prompt Requirement 8) */}
              <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                {/* HTF Bias */}
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    HTF Bias (4H/1H)
                  </span>
                  <span
                    className={`font-semibold block truncate mt-0.5 ${
                      analysis?.marketStructureTrend === 'Bullish'
                        ? 'text-emerald-400'
                        : analysis?.marketStructureTrend === 'Bearish'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {analysis?.marketStructureTrend || 'Neutral Range'}
                  </span>
                </div>

                {/* 15M Setup */}
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    15M Setup
                  </span>
                  <span className="font-semibold text-slate-200 block truncate mt-0.5">
                    {analysis?.supplyDemandZone?.includes('Demand')
                      ? '🟢 15M Demand Zone'
                      : analysis?.supplyDemandZone?.includes('Supply')
                      ? '🔴 15M Supply Zone'
                      : analysis?.fvgStatus !== 'None'
                      ? '15M FVG'
                      : 'Structure Key Level'}
                  </span>
                </div>

                {/* 5M Confirmation */}
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    5M Confirmation
                  </span>
                  <span className="font-semibold text-slate-200 block truncate mt-0.5">
                    {analysis?.liquidityEvent && analysis.liquidityEvent !== 'None'
                      ? `⚡ ${analysis.liquidityEvent}`
                      : 'Volume / BOS Valid'}
                  </span>
                </div>

                {/* 1M Entry Primed */}
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/70">
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    3M & 1M Entry
                  </span>
                  <span className="font-semibold text-amber-300 block truncate mt-0.5">
                    {analysis?.entryTimeframe === '1M' ? '🎯 Trigger Primed' : 'Micro Consolidation'}
                  </span>
                </div>
              </div>

              {/* Trade Execution Levels: Entry, SL, TP, R:R (Prompt Requirement 8) */}
              <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 mb-3 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Entry</span>
                  <span className="font-bold text-white block mt-0.5">
                    {analysis?.entryPrice
                      ? `$${analysis.entryPrice >= 1 ? analysis.entryPrice.toFixed(2) : analysis.entryPrice.toFixed(4)}`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Stop Loss</span>
                  <span className="font-bold text-rose-400 block mt-0.5">
                    {analysis?.stopLoss
                      ? `$${analysis.stopLoss >= 1 ? analysis.stopLoss.toFixed(2) : analysis.stopLoss.toFixed(4)}`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Take Profit</span>
                  <span className="font-bold text-emerald-400 block mt-0.5">
                    {analysis?.takeProfit
                      ? `$${analysis.takeProfit >= 1 ? analysis.takeProfit.toFixed(2) : analysis.takeProfit.toFixed(4)}`
                      : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">R:R</span>
                  <span className="font-black text-amber-300 block mt-0.5">
                    1:{analysis?.riskRewardRatio ? analysis.riskRewardRatio.toFixed(1) : '3.0'}
                  </span>
                </div>
              </div>

              {/* Paper Trade Status / Risk Block Banner (Prompt Requirement 8) */}
              <div className="mb-3">
                {activeTrade ? (
                  <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ACTIVE PAPER {activeTrade.type}
                      </div>
                      <div className="text-[11px] font-mono mt-0.5 text-emerald-200">
                        P/L: {activeTrade.pnl >= 0 ? `+$${activeTrade.pnl.toFixed(2)}` : `-$${Math.abs(activeTrade.pnl).toFixed(2)}`} (
                        {activeTrade.pnlPercent >= 0 ? `+${activeTrade.pnlPercent.toFixed(1)}%` : `${activeTrade.pnlPercent.toFixed(1)}%`})
                      </div>
                    </div>
                    {onManualCloseTrade && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManualCloseTrade(activeTrade.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold"
                      >
                        Close
                      </button>
                    )}
                  </div>
                ) : coin.blockedReason ? (
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-2 text-center text-[11px] font-bold text-rose-300">
                    <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-rose-400" />
                    {coin.blockedReason}
                  </div>
                ) : (
                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-2 text-center text-[11px] text-slate-400">
                    No Open Position • Radar Active
                  </div>
                )}
              </div>

              {/* 24-Hour Trade Target Status for Coin */}
              <div className="mb-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  <span>24H Target:</span>
                </span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                    (coin.trades24hCount ?? 0) >= 1
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span>{symbol}: {coin.trades24hCount ?? 0}/1</span>
                  {(coin.trades24hCount ?? 0) >= 1 ? (
                    <span className="text-emerald-400 font-black">✓ Target Met</span>
                  ) : (
                    <span className="text-amber-400 font-black flex items-center gap-0.5">
                      <Zap className="w-3 h-3 animate-pulse" /> Pending
                    </span>
                  )}
                </span>
              </div>

              {/* Bottom Action: Inspect Chart & Detailed Diagnostics */}
              <button
                type="button"
                id={`inspect-coin-${symbol}`}
                onClick={() => onSelectCoinForDetail(symbol)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition active:scale-95"
              >
                <span>Inspect Detailed Charts & Confluence</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
