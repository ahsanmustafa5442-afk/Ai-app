import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Sliders,
  X,
  Zap,
} from 'lucide-react';
import { FlowStepResult } from '../types';

interface AnalysisFlowDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  flowSteps: FlowStepResult[];
  symbol: string;
}

export const AnalysisFlowDrawer: React.FC<AnalysisFlowDrawerProps> = ({
  isOpen,
  onClose,
  flowSteps,
  symbol,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">15-Step Confluence Flow</h3>
              <p className="text-[11px] text-slate-400">
                Institutional verification pipeline for {symbol}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {flowSteps.map((step) => {
            const isPassed = step.status === 'passed';
            const isNeutral = step.status === 'neutral';
            const isFailed = step.status === 'failed';

            return (
              <div
                key={step.step}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                  step.biasContribution === 'LONG'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : step.biasContribution === 'SHORT'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                {/* Step Number & Indicator */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300 font-mono shrink-0 mt-0.5">
                  {step.step}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {step.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        step.biasContribution === 'LONG'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : step.biasContribution === 'SHORT'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {step.biasContribution}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{step.finding}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Confluence required: ≥55% weighted consensus with HTF bias
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs hover:bg-amber-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
