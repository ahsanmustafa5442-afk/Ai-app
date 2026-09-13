import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Radio,
  Shield,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { Target24hSummary, TradingMode } from '../types';
import { calculate24hTargetSummary, get24hWindowTimeRemaining } from '../services/tradeTargetService';
import { isCoreSymbol } from '../services/coinSelectionService';

interface TradeTarget24hCardProps {
  summary?: Target24hSummary | null;
  onSelectCoinForDetail?: (symbol: string) => void;
  currentMode: TradingMode;
  onSelectMode?: (mode: TradingMode) => void;
  isScannerActive?: boolean;
  onOpenSelectCoins?: () => void;
}

export const TradeTarget24hCard: React.FC<TradeTarget24hCardProps> = ({
  summary: providedSummary,
  onSelectCoinForDetail,
  currentMode,
  onSelectMode,
  isScannerActive = true,
  onOpenSelectCoins,
}) => {
  const summary = React.useMemo(() => {
    return providedSummary || calculate24hTargetSummary([], currentMode);
  }, [providedSummary, currentMode]);

  // Live ticking countdown for the 24H window
  const [timeRemaining, setTimeRemaining] = React.useState(summary.timeRemainingStr);

  React.useEffect(() => {
    setTimeRemaining(summary.timeRemainingStr);
  }, [summary.timeRemainingStr]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      const { formatted } = get24hWindowTimeRemaining();
      setTimeRemaining(formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isDemo = currentMode === 'DEMO';
  const isLive = currentMode === 'LIVE';

  return (
    <div
      id="24h-trade-target-dashboard"
      className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden"
    >
      {/* Background Accent Subtle Glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                24H TRADE TARGET
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                1 TRADE / COIN QUOTA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Targeting at least 1 valid high-confluence scalp per coin every rolling 24-hour cycle.
            </p>
          </div>
        </div>

        {/* Mode-Specific Ledger Badge & Switcher */}
        <div className="flex items-center flex-wrap gap-2">
          {onOpenSelectCoins && (
            <button
              type="button"
              id="quota-select-coins-btn"
              onClick={onOpenSelectCoins}
              className="px-2.5 py-1 rounded-xl bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Select 4 additional Binance Futures coins to scan (10 total)"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>SELECT COINS (4/4)</span>
            </button>
          )}

          {onSelectMode && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => onSelectMode('PAPER')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                  currentMode === 'PAPER'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PAPER
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('DEMO')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                  currentMode === 'DEMO'
                    ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                DEMO
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('LIVE')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition ${
                  currentMode === 'LIVE'
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LIVE
              </button>
            </div>
          )}

          <div
            className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border hidden md:flex items-center gap-1.5 ${
              isDemo
                ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                : isLive
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            <span>{currentMode} LEDGER</span>
          </div>
        </div>
      </div>

      {/* 2. Key Target Metrics Summary (4 Tiles) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
        {/* Metric 1: Trades Completed Today */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Trades Completed Today</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {summary.tradesCompletedToday}
            </span>
            <span className="text-[11px] text-slate-400">valid scalps</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Rolling 24H window executions</span>
        </div>

        {/* Metric 2: Coins Meeting 24H Target */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Coins Meeting Target</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {summary.coinsMeetingTarget} / {summary.totalCoins}
            </span>
            <span className="text-[11px] text-slate-400">coins</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${(summary.coinsMeetingTarget / summary.totalCoins) * 100}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Coins Still Pending */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Coins Still Pending</span>
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-xl sm:text-2xl font-black font-mono ${
                summary.coinsPending > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {summary.coinsPending} / {summary.totalCoins}
            </span>
            <span className="text-[11px] text-slate-400">pending</span>
          </div>
          <span className="text-[10px] text-amber-400/90 font-medium mt-1">
            {summary.coinsPending > 0 ? '⚡ Radar Prioritizing Setups' : '✓ All 6 coins reached target'}
          </span>
        </div>

        {/* Metric 4: Time Remaining in Current 24H Window */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>24H Window Remaining</span>
            <Clock className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-black text-sky-300 font-mono tracking-tight">
              {timeRemaining}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1">Resets at 00:00:00 UTC cycle</span>
        </div>
      </div>

      {/* 3. The 6-Coin Quota Status Grid (Requested: BTCUSDT: 1/1, BNBUSDT: 0/1, etc.) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              24-Hour Coin Quota Status
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-semibold">
              Target: ≥ 1 Valid Trade
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Coins with 0/1 are automatically prioritized for scanner evaluation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          {summary.coinList.map((coin) => {
            const hasMet = coin.isTargetMet;
            const extraTrades = Math.max(0, coin.tradesCompleted - 1);
            const isCore = isCoreSymbol(coin.symbol);

            return (
              <div
                key={coin.symbol}
                id={`target-coin-${coin.symbol}`}
                onClick={() => onSelectCoinForDetail && onSelectCoinForDetail(coin.symbol)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  hasMet
                    ? 'bg-slate-950/80 border-emerald-500/40 hover:border-emerald-400 hover:bg-slate-950 shadow-sm'
                    : 'bg-slate-950/90 border-amber-500/40 hover:border-amber-400 hover:bg-slate-950 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                }`}
                title={`Click to inspect detailed chart and setup for ${coin.symbol}`}
              >
                {/* Priority Ping Badge if pending */}
                {!hasMet && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                  </span>
                )}

                <div>
                  {/* Symbol Header with CORE vs SELECTED pill */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-bold text-xs text-white">
                      {coin.symbol}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase tracking-wider border ${
                        isCore
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      {isCore ? 'CORE' : 'SELECTED'}
                    </span>
                  </div>

                  {/* Main Ratio Display: e.g. "1/1" or "0/1" or "2/1" */}
                  <div className="flex items-baseline justify-between my-1.5">
                    <span
                      className={`text-xl font-black font-mono tracking-tight ${
                        hasMet ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {coin.displayRatio}
                    </span>

                    {extraTrades > 0 && (
                      <span className="text-[10px] font-bold text-emerald-300 font-mono bg-emerald-950/60 px-1 rounded border border-emerald-500/30">
                        +{extraTrades} extra
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  {hasMet ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>TARGET MET</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 shrink-0 text-amber-400" />
                      <span>SCAN PRIORITY</span>
                    </span>
                  )}
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Strict Operational Rules & Institutional Guarantee Banner */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>Institutional 24-Hour Trade Target Rules & Safety Protocols</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-400">
          <div className="flex items-start gap-1.5">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              <strong className="text-slate-200">Minimum Target, Not A Cap:</strong> Completing 1 trade is the minimum goal. Scanner continues uninterrupted; a coin can execute 2, 3, or more valid trades if setups qualify.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              <strong className="text-slate-200">Non-Compromised Confluence:</strong> Confidence score (≥70), R:R (≥1:3), and risk rules are never relaxed to force or rush a quota trade.
            </span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="text-amber-400 font-bold">•</span>
            <span>
              <strong className="text-slate-200">Active Mode Isolation:</strong> 24-hour targets are tracked and calculated completely separately for PAPER, DEMO, and LIVE execution ledgers.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
