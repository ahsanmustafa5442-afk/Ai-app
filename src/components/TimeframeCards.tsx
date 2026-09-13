import React from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart2,
  Compass,
  Layers,
  Percent,
  Sliders,
  TrendingDown,
  TrendingUp,
  Waves,
  Zap,
} from 'lucide-react';
import { Timeframe, TimeframeAnalysis } from '../types';

interface TimeframeCardsProps {
  timeframes: Record<Timeframe, TimeframeAnalysis>;
  selectedTf: Timeframe;
  onSelectTf: (tf: Timeframe) => void;
}

const TF_DESCRIPTIONS: Record<Timeframe, string> = {
  '4H': 'HTF Macro Bias & Major Swings',
  '1H': 'HTF Trend & Key Key S/R Anchors',
  '15M': 'ITF Order Flow & S/D Structure',
  '5M': 'LTF Execution & Imbalances',
  '3M': 'Micro Confirmation & FVG',
  '1M': 'Precision Entry & Trigger Wicks',
};

export const TimeframeCards: React.FC<TimeframeCardsProps> = ({
  timeframes,
  selectedTf,
  onSelectTf,
}) => {
  const tfKeys: Timeframe[] = ['4H', '1H', '15M', '5M', '3M', '1M'];

  const getTrendBadge = (trend: TimeframeAnalysis['trend']) => {
    if (trend === 'Bullish') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          <TrendingUp className="w-3 h-3" /> Bullish
        </span>
      );
    }
    if (trend === 'Bearish') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
          <TrendingDown className="w-3 h-3" /> Bearish
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
        Ranging
      </span>
    );
  };

  const getEmaBadge = (status: TimeframeAnalysis['emaStatus']) => {
    if (status.includes('Bullish Stack')) {
      return <span className="text-emerald-400 font-semibold">Bullish Stack</span>;
    }
    if (status.includes('Bearish Stack')) {
      return <span className="text-rose-400 font-semibold">Bearish Stack</span>;
    }
    return <span className="text-amber-400 font-medium">Tangled</span>;
  };

  const getRsiBadge = (rsi: number) => {
    let color = 'text-slate-300';
    if (rsi >= 70) color = 'text-rose-400 font-bold';
    else if (rsi <= 30) color = 'text-emerald-400 font-bold';
    else if (rsi > 50) color = 'text-teal-300 font-semibold';
    return <span className={`font-mono ${color}`}>{rsi}</span>;
  };

  const activeAnalysis = timeframes[selectedTf] || timeframes['15M'];

  return (
    <div className="space-y-3">
      {/* Timeframe Selector Strip */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
        {tfKeys.map((tf) => {
          const item = timeframes[tf];
          const isSelected = selectedTf === tf;
          const isBull = item?.trend === 'Bullish';
          const isBear = item?.trend === 'Bearish';

          return (
            <button
              key={tf}
              type="button"
              id={`tf-tab-${tf}`}
              onClick={() => onSelectTf(tf)}
              className={`flex-1 min-w-[58px] py-2 px-1.5 rounded-lg text-center transition-all ${
                isSelected
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div className="text-xs font-black tracking-tight">{tf}</div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBull ? 'bg-emerald-400' : isBear ? 'bg-rose-400' : 'bg-amber-400'
                  }`}
                />
                <span className="text-[10px] font-mono">
                  {item ? (isBull ? 'Bull' : isBear ? 'Bear' : 'Chop') : '--'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Focused Active Timeframe Detail Card */}
      {activeAnalysis && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 sm:p-4">
          {/* Header of Active Timeframe */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white">{selectedTf} Timeframe</span>
                <span className="text-xs text-slate-400 font-mono">({TF_DESCRIPTIONS[selectedTf]})</span>
              </div>
            </div>
            {getTrendBadge(activeAnalysis.trend)}
          </div>

          {/* Grid of all 9 required criteria for this timeframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            {/* 1. Structure */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Market Structure</span>
              <span className="font-bold text-white mt-1">{activeAnalysis.structure}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                S: ${activeAnalysis.keySupport.toFixed(1)} | R: ${activeAnalysis.keyResistance.toFixed(1)}
              </span>
            </div>

            {/* 2. EMA Status */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">EMA (20 / 50 / 200)</span>
              <div className="mt-1">{getEmaBadge(activeAnalysis.emaStatus)}</div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                EMA 20: ${activeAnalysis.ema20.toFixed(1)}
              </span>
            </div>

            {/* 3. RSI Indicator */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">RSI (14-Period)</span>
              <div className="flex items-center gap-2 mt-1">
                {getRsiBadge(activeAnalysis.rsi)}
                <span className="text-[11px] text-slate-400">({activeAnalysis.rsiCondition})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {activeAnalysis.rsi >= 70
                  ? 'Overbought zone'
                  : activeAnalysis.rsi <= 30
                  ? 'Oversold zone'
                  : 'Balanced momentum'}
              </span>
            </div>

            {/* 4. VWAP Position */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">VWAP Position</span>
              <span
                className={`font-bold mt-1 ${
                  activeAnalysis.vwapRelation === 'Above VWAP'
                    ? 'text-emerald-400'
                    : activeAnalysis.vwapRelation === 'Below VWAP'
                    ? 'text-rose-400'
                    : 'text-amber-300'
                }`}
              >
                {activeAnalysis.vwapRelation}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                VWAP: ${activeAnalysis.vwap.toFixed(1)}
              </span>
            </div>

            {/* 5. Volume Condition */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Volume Condition</span>
              <span
                className={`font-bold mt-1 ${
                  activeAnalysis.volumeCondition.includes('Buying')
                    ? 'text-emerald-400'
                    : activeAnalysis.volumeCondition.includes('Selling')
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {activeAnalysis.volumeCondition}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                ATR (14): ${activeAnalysis.atr.toFixed(2)}
              </span>
            </div>

            {/* 6. Liquidity Condition */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Liquidity Condition</span>
              <span
                className={`font-bold mt-1 ${
                  activeAnalysis.liquidityCondition === 'Sell-Side Swept'
                    ? 'text-emerald-400'
                    : activeAnalysis.liquidityCondition === 'Buy-Side Swept'
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {activeAnalysis.liquidityCondition}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                Sweep detection active
              </span>
            </div>

            {/* 7. Fair Value Gap (FVG) */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">FVG Condition</span>
              <span
                className={`font-bold mt-1 ${
                  activeAnalysis.fvgCondition.includes('Bullish')
                    ? 'text-emerald-400'
                    : activeAnalysis.fvgCondition.includes('Bearish')
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {activeAnalysis.fvgCondition}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                3-bar price balance
              </span>
            </div>

            {/* 8. Supply / Demand Condition */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Supply / Demand</span>
              <span
                className={`font-bold mt-1 ${
                  activeAnalysis.supplyDemandCondition.includes('Demand')
                    ? 'text-emerald-400'
                    : activeAnalysis.supplyDemandCondition.includes('Supply')
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {activeAnalysis.supplyDemandCondition}
              </span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                Order Block validation
              </span>
            </div>

            {/* 9. Sentiment Net Bias Meter */}
            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400">TF Net Bias</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${
                      activeAnalysis.sentimentScore >= 0 ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                    style={{
                      width: `${Math.abs(activeAnalysis.sentimentScore)}%`,
                      marginLeft: activeAnalysis.sentimentScore < 0 ? '0' : '50%',
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-300">
                  {activeAnalysis.sentimentScore > 0 ? '+' : ''}
                  {activeAnalysis.sentimentScore}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                {activeAnalysis.sentimentScore > 20
                  ? 'Strong Bullish Bias'
                  : activeAnalysis.sentimentScore < -20
                  ? 'Strong Bearish Bias'
                  : 'Equilibrium / Range'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Card Timeframe Grid for 4H, 1H, 15M, 5M, 3M, 1M */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {tfKeys.map((tf) => {
          const item = timeframes[tf];
          if (!item) return null;
          const isSelected = selectedTf === tf;

          return (
            <div
              key={tf}
              onClick={() => onSelectTf(tf)}
              className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-850 border-amber-400/50 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white font-mono">{tf}</span>
                <span
                  className={`text-[10px] font-semibold px-1 rounded ${
                    item.trend === 'Bullish'
                      ? 'text-emerald-400 bg-emerald-950/60'
                      : item.trend === 'Bearish'
                      ? 'text-rose-400 bg-rose-950/60'
                      : 'text-amber-400 bg-amber-950/60'
                  }`}
                >
                  {item.trend}
                </span>
              </div>
              <div className="space-y-0.5 text-[10px] text-slate-400 font-mono">
                <div className="truncate">RSI: {item.rsi}</div>
                <div className="truncate">{item.fvgCondition.replace(' Active', '')}</div>
                <div className="truncate">{item.supplyDemandCondition}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
