import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crosshair,
  DollarSign,
  HelpCircle,
  Info,
  Shield,
  Sliders,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { ConfluenceAnalysis } from '../types';

interface SignalCardProps {
  analysis: ConfluenceAnalysis;
  onQuickPaperTrade: (tradeType: 'LONG' | 'SHORT') => void;
  onOpenFlowSteps: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({
  analysis,
  onQuickPaperTrade,
  onOpenFlowSteps,
}) => {
  const [showSummaryDetails, setShowSummaryDetails] = React.useState(false);

  const {
    signal,
    confidenceScore,
    confidenceCategory,
    setupQuality,
    entryPrice,
    stopLoss,
    takeProfit,
    riskRewardRatio,
    slDistancePercent,
    tpDistancePercent,
    reasonsFor,
    reasonsAgainst,
    btcContext,
  } = analysis;

  const getSignalConfig = () => {
    switch (signal) {
      case 'LONG':
        return {
          label: 'LONG',
          subLabel: 'Bullish Confluence Entry',
          bg: 'bg-emerald-950/40 border-emerald-500/40',
          badgeBg: 'bg-emerald-500 text-slate-950',
          textColor: 'text-emerald-400',
          glow: 'shadow-lg shadow-emerald-950/50',
          icon: <TrendingUp className="w-7 h-7 text-emerald-400" />,
        };
      case 'SHORT':
        return {
          label: 'SHORT',
          subLabel: 'Bearish Confluence Entry',
          bg: 'bg-rose-950/40 border-rose-500/40',
          badgeBg: 'bg-rose-500 text-white',
          textColor: 'text-rose-400',
          glow: 'shadow-lg shadow-rose-950/50',
          icon: <TrendingDown className="w-7 h-7 text-rose-400" />,
        };
      default:
        return {
          label: 'WAIT',
          subLabel: 'Conflicting Factors • Preserve Capital',
          bg: 'bg-amber-950/40 border-amber-500/40',
          badgeBg: 'bg-amber-500 text-slate-950',
          textColor: 'text-amber-400',
          glow: 'shadow-lg shadow-amber-950/50',
          icon: <AlertCircle className="w-7 h-7 text-amber-400" />,
        };
    }
  };

  const config = getSignalConfig();

  const getConfidenceBarColor = () => {
    if (confidenceScore >= 80) return 'bg-emerald-400';
    if (confidenceScore >= 65) return 'bg-teal-400';
    if (confidenceScore >= 50) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  return (
    <div className={`rounded-xl border p-3.5 sm:p-5 transition-all ${config.bg} ${config.glow}`}>
      {/* Top Row: Signal Hero & Confidence */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${config.textColor}`}>
                {config.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                SCALP MODE
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Grade: {setupQuality}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{config.subLabel}</p>
          </div>
        </div>

        {/* Confidence Gauge */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 sm:min-w-44">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Confidence Score</span>
            <span className="font-bold text-white font-mono">{confidenceScore}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getConfidenceBarColor()}`}
              style={{ width: `${confidenceScore}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
            <span>Rating:</span>
            <span
              className={`font-semibold ${
                confidenceCategory === 'Very Strong'
                  ? 'text-emerald-400'
                  : confidenceCategory === 'Strong'
                  ? 'text-teal-400'
                  : confidenceCategory === 'Moderate'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {confidenceCategory}
            </span>
          </div>
        </div>
      </div>

      {/* Execution Targets Matrix (Entry, SL, TP, R:R) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5">
        {/* Entry */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-cyan-400" />
            <span>Entry Zone</span>
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-white mt-1">
            ${entryPrice.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">Current / Retest</div>
        </div>

        {/* Stop Loss */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-rose-900/30">
          <div className="text-[10px] uppercase font-semibold text-rose-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-rose-400" />
            <span>Stop Loss</span>
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-rose-300 mt-1">
            ${stopLoss.toFixed(2)}
          </div>
          <div className="text-[10px] text-rose-400/80 font-mono">-{slDistancePercent}% distance</div>
        </div>

        {/* Take Profit */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-emerald-900/30">
          <div className="text-[10px] uppercase font-semibold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>Take Profit</span>
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-emerald-300 mt-1">
            ${takeProfit.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono">+{tpDistancePercent}% target</div>
        </div>

        {/* Risk : Reward */}
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-amber-900/30">
          <div className="text-[10px] uppercase font-semibold text-amber-400 flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" />
            <span>Risk / Reward</span>
          </div>
          <div className="text-sm sm:text-base font-black font-mono text-amber-300 mt-1">
            1 : {riskRewardRatio}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {riskRewardRatio >= 2.9 ? 'Target ~1:3 Met' : 'Sub-optimal R:R'}
          </div>
        </div>
      </div>

      {/* Scalp Confluence Diagnostics: Timeframe Hierarchy & SMC Parameters */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 my-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2 pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Scalp Confluence Diagnostics</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
            Hierarchy: 15M Setup → 5M/3M Conf. → 1M Trigger
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">HTF Filter (4H/1H)</span>
            <span className="font-semibold text-slate-200 block truncate mt-0.5">
              {analysis.htfConfirmation || analysis.trendSummary}
            </span>
          </div>

          <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Setup TF (15M)</span>
            <span className="font-semibold text-slate-200 block truncate mt-0.5">
              {analysis.setupTimeframe || '15M'} • {analysis.supplyDemandSummary}
            </span>
          </div>

          <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Entry Timing TF</span>
            <span className="font-semibold text-cyan-300 block truncate mt-0.5">
              {analysis.entryTimeframe || '1M'} Trigger Primed
            </span>
          </div>

          <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Liquidity Sweep</span>
            <span className="font-semibold text-amber-300 block truncate mt-0.5">
              {analysis.liquidityEvent || analysis.liquiditySummary}
            </span>
          </div>

          <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Tight Invalidation</span>
            <span className="font-semibold text-rose-300 font-mono block truncate mt-0.5">
              ${(analysis.invalidationLevel || stopLoss).toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-900/70 p-2 rounded border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">FVG & Order Flow</span>
            <span className="font-semibold text-slate-200 block truncate mt-0.5">
              {analysis.fvgStatus || analysis.fvgSummary}
            </span>
          </div>
        </div>
      </div>

      {/* Decision Catalysts: Reasons For & Reasons Against */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Supporting Confluence */}
        <div className="bg-slate-900/60 rounded-lg p-3 border border-emerald-500/20">
          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supporting Confluences ({reasonsFor.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {reasonsFor.length > 0 ? (
              reasonsFor.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span className="leading-snug">{r}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic text-[11px]">No dominant supporting catalysts.</li>
            )}
          </ul>
        </div>

        {/* Counter-Confluence / Risk Caveats */}
        <div className="bg-slate-900/60 rounded-lg p-3 border border-rose-500/20">
          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Counter-Factors & Risk Caveats ({reasonsAgainst.length})</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {reasonsAgainst.length > 0 ? (
              reasonsAgainst.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span className="leading-snug">{r}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-500 italic text-[11px]">No major contradictory factors observed.</li>
            )}
          </ul>
        </div>
      </div>

      {/* BTC Context Banner */}
      <div className="mt-3 bg-slate-950/70 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            BTC Context
          </span>
          <span className="text-slate-300 line-clamp-1 font-medium text-[11px] sm:text-xs">
            {btcContext.summary}
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400 shrink-0 font-semibold">
          {btcContext.impactOnAlt}
        </span>
      </div>

      {/* Action Footer: Execute Paper Trade & Step-by-Step Flow */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Simulation only. No real orders sent to Binance.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* View 15-step flow button */}
          <button
            type="button"
            onClick={onOpenFlowSteps}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>15-Step Flow</span>
          </button>

          {/* Quick Paper Trade Button */}
          {signal !== 'WAIT' ? (
            <button
              type="button"
              id="execute-paper-signal-btn"
              onClick={() => onQuickPaperTrade(signal as 'LONG' | 'SHORT')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 ${
                signal === 'LONG'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
              }`}
            >
              <span>Execute Paper {signal}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed"
            >
              <span>Wait Triggered (No Order)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
