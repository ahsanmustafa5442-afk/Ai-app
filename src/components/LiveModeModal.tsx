import React from 'react';
import { AlertTriangle, KeyRound, Lock, ShieldAlert, X } from 'lucide-react';

interface LiveModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLive?: () => void;
}

export const LiveModeModal: React.FC<LiveModeModalProps> = ({
  isOpen,
  onClose,
  onConfirmLive,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              Enable LIVE Trading Gateway
            </h3>
            <span className="text-xs text-amber-400 font-semibold">
              Binance Futures Capital Protection Gate
            </span>
          </div>
        </div>

        {/* Primary Alert */}
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 mb-4 text-rose-200 text-xs sm:text-sm font-medium leading-relaxed">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-rose-100 font-bold block mb-1">
                LIVE MODE uses real Binance funds. Are you sure you want to proceed?
              </strong>
              Real-money order execution is locked by default. Automated scalp execution with real funds carries substantial financial risk of total margin liquidation.
            </p>
          </div>
        </div>

        {/* Checklist of Mandatory Safety Requirements */}
        <div className="space-y-2 mb-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
            Mandatory Live Integration Pre-requisites:
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Secure Backend Gateway:</strong> Private API & Secret keys are kept server-side in memory and never exposed to the browser.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong>Trading Permissions Check:</strong> Binance Futures trading authorization is validated server-side.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                <strong>Master Kill-Switch:</strong> Live trading remains OFF by default until explicitly unlocked with safety confirmation.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - CANCEL IS DEFAULT AND FOCUSED */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 shadow-sm transition active:scale-95"
          >
            Cancel (Keep in Safe Paper Mode)
          </button>

          <button
            type="button"
            onClick={() => {
              if (onConfirmLive) {
                onConfirmLive();
              } else {
                onClose();
              }
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-md transition"
          >
            Open Live API Gateway
          </button>
        </div>
      </div>
    </div>
  );
};
