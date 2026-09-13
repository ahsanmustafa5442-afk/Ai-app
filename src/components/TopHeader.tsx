import React from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Layers,
  Lock,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Wallet,
  Zap,
} from 'lucide-react';
import { TradingMode } from '../types';
import { SUPPORTED_SYMBOLS } from '../services/marketData';

export type MainViewTab = 'SCANNER' | 'DETAIL' | 'HISTORY' | 'SIGNALS' | 'RISK' | 'LIVE_PANEL';

interface TopHeaderProps {
  currentSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedRegime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP';
  onSelectRegime: (regime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP') => void;
  activeView: MainViewTab;
  onSelectView: (view: MainViewTab) => void;
  liveDataStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  lastUpdateTime: number;
  isScannerActive: boolean;
  onToggleScanner: () => void;
  currentMode: TradingMode;
  onSelectMode: (mode: TradingMode) => void;
  onOpenLiveModal: () => void;
  onOpenRiskModal: () => void;
  openTradesCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentSymbol,
  onSelectSymbol,
  onAnalyze,
  isAnalyzing,
  selectedRegime,
  onSelectRegime,
  activeView,
  onSelectView,
  liveDataStatus,
  lastUpdateTime,
  isScannerActive,
  onToggleScanner,
  currentMode,
  onSelectMode,
  onOpenLiveModal,
  onOpenRiskModal,
  openTradesCount,
}) => {
  const [customInput, setCustomInput] = React.useState('');
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondsSinceUpdate = Math.max(0, Math.floor((now - lastUpdateTime) / 1000));

  const handleModeClick = (mode: TradingMode) => {
    onSelectMode(mode);
    if (mode === 'LIVE') {
      onSelectView('LIVE_PANEL');
    }
  };

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-3 py-2.5 sm:px-5">
      {/* Top Banner: Brand, 3-Mode Switcher, Live Data Status, Scanner Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-none flex items-center gap-1.5">
              Binance Futures <span className="text-amber-400">AI Scalp Bot</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              Multi-Timeframe Confluence Engine & 6-Coin Scanner
            </p>
          </div>
        </div>

        {/* Status Indicators & Prominent 3-Mode Switcher [PAPER] [DEMO] [LIVE] */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Binance Live Market Data Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold border transition ${
              liveDataStatus === 'CONNECTED'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/70 border-rose-500/40 text-rose-400'
            }`}
            title={`Binance Futures Live WebSocket (${secondsSinceUpdate}s ago)`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                liveDataStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="hidden xs:inline">LIVE DATA:</span>
            <span>{liveDataStatus}</span>
          </div>

          {/* PROMINENT 3-MODE SELECTOR: [PAPER] [DEMO] [LIVE] */}
          <div
            className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-0.5 text-xs font-bold shadow-inner"
            role="group"
            aria-label="Trading Mode Selector"
          >
            {/* PAPER MODE */}
            <button
              type="button"
              id="mode-switch-paper-btn"
              onClick={() => handleModeClick('PAPER')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all flex items-center gap-1 text-[11px] ${
                currentMode === 'PAPER'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
              title="PAPER — simulated trading with Binance public data"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>PAPER</span>
            </button>

            {/* DEMO MODE */}
            <button
              type="button"
              id="mode-switch-demo-btn"
              onClick={() => handleModeClick('DEMO')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all flex items-center gap-1 text-[11px] ${
                currentMode === 'DEMO'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
              title="DEMO — simulated exchange environment"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>DEMO</span>
            </button>

            {/* LIVE MODE */}
            <button
              type="button"
              id="mode-switch-live-btn"
              onClick={() => handleModeClick('LIVE')}
              className={`px-2.5 py-1 rounded-lg font-black transition-all flex items-center gap-1 text-[11px] ${
                currentMode === 'LIVE'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
              title="LIVE — real Binance Futures trading"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>LIVE</span>
            </button>
          </div>

          {/* Stop Scanner / Resume Scanner */}
          <button
            type="button"
            onClick={onToggleScanner}
            id="header-scanner-toggle-btn"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition active:scale-95 ${
              isScannerActive
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {isScannerActive ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">STOP SCANNER</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">RESUME</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode Sub-Banner: Informs user clearly to prevent accidental mode mixing */}
      <div
        className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center justify-between border mb-2 transition-all ${
          currentMode === 'PAPER'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : currentMode === 'DEMO'
            ? 'bg-sky-950/40 border-sky-500/30 text-sky-300'
            : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {currentMode === 'PAPER' && (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>PAPER MODE — Simulated Trading (Binance public data, $10,000 virtual balance)</span>
            </>
          )}
          {currentMode === 'DEMO' && (
            <>
              <Cpu className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>DEMO MODE — Simulated Exchange Environment ($50,000 demo balance, zero real risk)</span>
            </>
          )}
          {currentMode === 'LIVE' && (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>LIVE MODE — Real Binance Futures Trading (Direct API connection, real funds at risk)</span>
            </>
          )}
        </div>

        <span className="text-[10px] uppercase tracking-wider opacity-80 hidden md:inline">
          {currentMode === 'PAPER' && 'Isolated Paper Ledger'}
          {currentMode === 'DEMO' && 'Isolated Demo Ledger'}
          {currentMode === 'LIVE' && 'Real Exchange Ledger'}
        </span>
      </div>

      {/* Main Navigation View Tabs */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-800/80 pt-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-xs">
          <button
            type="button"
            id="tab-scanner-btn"
            onClick={() => onSelectView('SCANNER')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeView === 'SCANNER'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Multi-Coin Scanner</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            type="button"
            id="tab-detail-btn"
            onClick={() => onSelectView('DETAIL')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeView === 'DETAIL'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{currentSymbol} Scalp Engine</span>
          </button>

          <button
            type="button"
            id="tab-history-btn"
            onClick={() => onSelectView('HISTORY')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeView === 'HISTORY'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{currentMode === 'DEMO' ? 'Demo History' : 'Trade History'}</span>
            {openTradesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-slate-950 font-black">
                {openTradesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="tab-signals-btn"
            onClick={() => onSelectView('SIGNALS')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeView === 'SIGNALS'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Signal Log</span>
          </button>

          <button
            type="button"
            id="tab-risk-btn"
            onClick={() => onSelectView('RISK')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeView === 'RISK'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Risk Sizing</span>
          </button>

          {/* DEDICATED LIVE API GATEWAY TAB */}
          <button
            type="button"
            id="tab-live-gateway-btn"
            onClick={() => onSelectView('LIVE_PANEL')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
              activeView === 'LIVE_PANEL'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-800/80 text-rose-300 hover:bg-slate-700 border border-rose-500/40'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>LIVE API Gateway</span>
          </button>
        </div>

        {/* Analyze CTA */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            id="analyze-run-button"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all shrink-0 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Scanning...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Run Confluence</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
