import React from 'react';
import {
  AlertOctagon,
  Calculator,
  CheckCircle2,
  DollarSign,
  Info,
  Percent,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { ConfluenceAnalysis, RiskSettings } from '../types';
import { calculatePositionRisk } from '../services/paperTrading';

interface RiskCalculatorProps {
  analysis: ConfluenceAnalysis;
  accountBalance: number;
  onApplyCalculatedMargin?: (margin: number, leverage: number) => void;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({
  analysis,
  accountBalance,
  onApplyCalculatedMargin,
}) => {
  const [riskPercent, setRiskPercent] = React.useState<number>(1.0);
  const [leverage, setLeverage] = React.useState<number>(10);
  const [customEntry, setCustomEntry] = React.useState<number>(analysis.entryPrice);
  const [customSl, setCustomSl] = React.useState<number>(analysis.stopLoss);
  const [customTp, setCustomTp] = React.useState<number>(analysis.takeProfit);

  // Sync with analysis when symbol or signal changes
  React.useEffect(() => {
    setCustomEntry(analysis.entryPrice);
    setCustomSl(analysis.stopLoss);
    setCustomTp(analysis.takeProfit);
  }, [analysis.symbol, analysis.entryPrice, analysis.stopLoss, analysis.takeProfit]);

  const riskSettings: RiskSettings = {
    accountBalance,
    riskPercentage: riskPercent,
    leverage,
    maxAllowedRiskPercent: 3.0,
  };

  const calculation = calculatePositionRisk(riskSettings, customEntry, customSl, customTp);

  const calculatedRr = React.useMemo(() => {
    const risk = Math.abs(customEntry - customSl);
    const reward = Math.abs(customTp - customEntry);
    if (risk === 0) return 0;
    return Number((reward / risk).toFixed(2));
  }, [customEntry, customSl, customTp]);

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Risk & Position Size Calculator</h2>
            <p className="text-[11px] text-slate-400">
              Institutional capital preservation model (Max 3.0% risk rule)
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
            Paper Capital
          </span>
          <span className="text-sm font-bold font-mono text-emerald-400">
            ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Risk Percentage Selector */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between mb-1.5">
            <span>Risk per Trade</span>
            <span className="text-amber-400 font-mono font-bold">{riskPercent}%</span>
          </label>
          <div className="flex items-center gap-1.5 mb-2">
            {[0.5, 1.0, 2.0, 3.0].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setRiskPercent(preset)}
                className={`flex-1 py-1 rounded text-xs font-semibold font-mono transition-colors ${
                  riskPercent === preset
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {preset}%
              </button>
            ))}
          </div>
          <input
            type="range"
            min="0.25"
            max="5"
            step="0.25"
            value={riskPercent}
            onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          {calculation.isRiskExceeded && (
            <div className="flex items-center gap-1 mt-1 text-[10px] text-rose-400 font-medium">
              <AlertOctagon className="w-3 h-3 shrink-0" />
              <span>Exceeds safe 3.0% maximum risk guardrail!</span>
            </div>
          )}
        </div>

        {/* Leverage Slider */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between mb-1.5">
            <span>Leverage (Isolated)</span>
            <span className="text-cyan-400 font-mono font-bold">{leverage}x</span>
          </label>
          <div className="flex items-center gap-1.5 mb-2">
            {[5, 10, 20, 50].map((lev) => (
              <button
                key={lev}
                type="button"
                onClick={() => setLeverage(lev)}
                className={`flex-1 py-1 rounded text-xs font-semibold font-mono transition-colors ${
                  leverage === lev
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="text-[10px] text-slate-500 font-mono mt-1">
            Higher leverage shrinks liquidation distance.
          </div>
        </div>

        {/* Custom Entry / SL Adjuster */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <label className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between mb-1.5">
            <span>Entry & Stop Tuning</span>
            <span className="text-slate-400 font-mono text-[10px]">Manual override</span>
          </label>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px]">Entry:</span>
              <input
                type="number"
                step="any"
                value={customEntry}
                onChange={(e) => setCustomEntry(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-400 text-[10px]">Stop Loss:</span>
              <input
                type="number"
                step="any"
                value={customSl}
                onChange={(e) => setCustomSl(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-rose-300 text-xs"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-400 text-[10px]">Take Profit:</span>
              <input
                type="number"
                step="any"
                value={customTp}
                onChange={(e) => setCustomTp(parseFloat(e.target.value) || 0)}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-emerald-300 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Output Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 mb-3">
        {/* Risk Amount */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Max Risk ($)</span>
          <span className="text-sm sm:text-base font-bold font-mono text-rose-400">
            ${calculation.maxRiskAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {calculation.stopLossPercent}% SL distance
          </span>
        </div>

        {/* Position Size */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Position Size</span>
          <span className="text-sm sm:text-base font-bold font-mono text-white">
            ${calculation.positionSizeUsdt.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono block">
            ≈ {calculation.contracts} contracts
          </span>
        </div>

        {/* Margin Required */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Margin Required</span>
          <span className="text-sm sm:text-base font-bold font-mono text-amber-300">
            ${calculation.initialMargin.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">At {leverage}x leverage</span>
        </div>

        {/* Est. Liquidation */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Est. Liquidation</span>
          <span className="text-sm sm:text-base font-bold font-mono text-orange-400">
            ${calculation.estimatedLiquidationPrice.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            R:R is 1 : {calculatedRr}
          </span>
        </div>
      </div>

      {/* Risk Assessment Guidance */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-2">
          {calculatedRr >= 2.5 ? (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="text-slate-300">
            {calculatedRr >= 2.5
              ? `Healthy 1:${calculatedRr} Risk/Reward ratio. Setup provides positive mathematical expectancy.`
              : `Caution: 1:${calculatedRr} R:R is below the 1:3 institutional target benchmark.`}
          </span>
        </div>

        {onApplyCalculatedMargin && (
          <button
            type="button"
            onClick={() => onApplyCalculatedMargin(calculation.initialMargin, leverage)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 shrink-0"
          >
            Apply to Paper Order →
          </button>
        )}
      </div>
    </div>
  );
};
