import React from 'react';
import { Check, RotateCcw, Shield, Sliders, X } from 'lucide-react';
import { PortfolioRiskSettings } from '../types';
import { DEFAULT_PORTFOLIO_RISK_SETTINGS, savePortfolioRiskSettings } from '../services/paperTrading';

interface PortfolioRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: PortfolioRiskSettings;
  onSaveSettings: (settings: PortfolioRiskSettings) => void;
}

export const PortfolioRiskModal: React.FC<PortfolioRiskModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onSaveSettings,
}) => {
  const [maxTrades, setMaxTrades] = React.useState(currentSettings.maxSimultaneousTrades);
  const [riskPerTrade, setRiskPerTrade] = React.useState(currentSettings.maxRiskPerTradePercent);
  const [totalRisk, setTotalRisk] = React.useState(currentSettings.maxTotalRiskPercent);

  React.useEffect(() => {
    setMaxTrades(currentSettings.maxSimultaneousTrades);
    setRiskPerTrade(currentSettings.maxRiskPerTradePercent);
    setTotalRisk(currentSettings.maxTotalRiskPercent);
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated: PortfolioRiskSettings = {
      maxSimultaneousTrades: Math.max(1, Math.min(10, maxTrades)),
      maxRiskPerTradePercent: Math.max(0.1, Math.min(5, riskPerTrade)),
      maxTotalRiskPercent: Math.max(0.5, Math.min(15, totalRisk)),
    };
    savePortfolioRiskSettings(updated);
    onSaveSettings(updated);
    onClose();
  };

  const handleResetDefaults = () => {
    setMaxTrades(DEFAULT_PORTFOLIO_RISK_SETTINGS.maxSimultaneousTrades);
    setRiskPerTrade(DEFAULT_PORTFOLIO_RISK_SETTINGS.maxRiskPerTradePercent);
    setTotalRisk(DEFAULT_PORTFOLIO_RISK_SETTINGS.maxTotalRiskPercent);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Portfolio Risk Protection</h3>
            <p className="text-xs text-slate-400">Automated Scalp Safety Limits</p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300">
          {/* Max Simultaneous Trades */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="max-simultaneous-input" className="font-semibold text-white">
                Max Simultaneous Trades
              </label>
              <span className="font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                {maxTrades} Coins
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Maximum concurrent open paper positions allowed across all 6 futures coins (default: 5).
            </p>
            <input
              id="max-simultaneous-input"
              type="range"
              min="1"
              max="6"
              step="1"
              value={maxTrades}
              onChange={(e) => setMaxTrades(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Risk Per Trade % */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="risk-per-trade-input" className="font-semibold text-white">
                Max Risk Per Trade
              </label>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                {riskPerTrade.toFixed(1)}% Balance
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              Maximum account capital risked on each individual scalp trade (default: 1.0%).
            </p>
            <input
              id="risk-per-trade-input"
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Total Open Risk % */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="total-risk-input" className="font-semibold text-white">
                Max Total Open Risk
              </label>
              <span className="font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                {totalRisk.toFixed(1)}% Max
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2">
              If opening another trade causes total open risk to exceed this, the trade is blocked with{' '}
              <span className="text-rose-300 font-semibold font-mono">
                "TRADE BLOCKED — PORTFOLIO RISK LIMIT"
              </span>{' '}
              (default: 3.0%).
            </p>
            <input
              id="total-risk-input"
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={totalRisk}
              onChange={(e) => setTotalRisk(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shadow-md shadow-amber-400/20 transition active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Limits</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
