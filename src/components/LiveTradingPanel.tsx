import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Key,
  Lock,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
  Wallet,
  Zap,
} from 'lucide-react';
import { BinanceLiveAccountStatus, BinanceLivePosition } from '../types';
import {
  disconnectBinance,
  fetchBinanceLiveStatus,
  fetchLivePositions,
  saveBinanceCredentials,
  testBinanceConnection,
  toggleLiveTrading,
} from '../services/binanceApiService';

interface LiveTradingPanelProps {
  liveStatus: BinanceLiveAccountStatus;
  onRefreshStatus: () => void;
  onModeSelect?: (mode: 'PAPER' | 'DEMO' | 'LIVE') => void;
}

export const LiveTradingPanel: React.FC<LiveTradingPanelProps> = ({
  liveStatus,
  onRefreshStatus,
  onModeSelect,
}) => {
  // Input form state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTogglingLive, setIsTogglingLive] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Safety confirmation modal state for enabling live trading
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [ackRisk, setAckRisk] = useState(false);
  const [ackNoWithdrawals, setAckNoWithdrawals] = useState(false);

  // Live positions list
  const [positions, setPositions] = useState<BinanceLivePosition[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  // Load positions when connected
  const loadPositions = async () => {
    if (!liveStatus.isConnected) return;
    setLoadingPositions(true);
    try {
      const res = await fetchLivePositions();
      setPositions(res.positions);
    } catch (e) {
      console.error('Failed to load positions', e);
    } finally {
      setLoadingPositions(false);
    }
  };

  useEffect(() => {
    if (liveStatus.isConnected) {
      loadPositions();
    }
  }, [liveStatus.isConnected, liveStatus.lastChecked]);

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim() || !apiSecretInput.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'Please provide both Binance API Key and API Secret.',
      });
      return;
    }

    setIsSaving(true);
    setActionFeedback(null);
    try {
      const result = await saveBinanceCredentials(apiKeyInput.trim(), apiSecretInput.trim());
      if (result.success) {
        setActionFeedback({
          type: 'success',
          message: 'Binance credentials connected and verified server-side! Secret key purged from form.',
        });
        setApiKeyInput('');
        setApiSecretInput('');
        onRefreshStatus();
      } else {
        setActionFeedback({
          type: 'error',
          message: result.error || 'Failed to connect credentials.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Error connecting to server backend.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setActionFeedback(null);
    try {
      const result = await testBinanceConnection();
      if (result.success) {
        setActionFeedback({
          type: 'success',
          message: `Connection Verified! Ping: ${result.latencyMs || 0}ms. Account trading permission: ${
            result.canTrade ? 'ACTIVE' : 'READ-ONLY'
          }`,
        });
        onRefreshStatus();
      } else {
        setActionFeedback({
          type: 'error',
          message: result.error || 'Connection test failed.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Error testing connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleClick = () => {
    if (liveStatus.liveTradingEnabled) {
      // Direct turn OFF is always allowed and immediate (kill switch)
      executeToggle(false, false);
    } else {
      // Turning ON requires safety confirmation modal
      setAckRisk(false);
      setAckNoWithdrawals(false);
      setShowConfirmModal(true);
    }
  };

  const executeToggle = async (enabled: boolean, confirmed: boolean) => {
    setIsTogglingLive(true);
    try {
      const res = await toggleLiveTrading(enabled, confirmed);
      if (res.success) {
        setShowConfirmModal(false);
        setActionFeedback({
          type: enabled ? 'success' : 'info',
          message: res.message || (enabled ? 'LIVE Trading ENABLED!' : 'LIVE Trading DEACTIVATED.'),
        });
        onRefreshStatus();
      } else {
        setActionFeedback({
          type: 'error',
          message: res.error || 'Failed to update live trading status.',
        });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Network error updating live trading.',
      });
    } finally {
      setIsTogglingLive(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect and clear your Binance API credentials from the server?')) {
      return;
    }
    try {
      await disconnectBinance();
      setActionFeedback({
        type: 'info',
        message: 'Credentials disconnected and purged from server memory.',
      });
      onRefreshStatus();
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err?.message || 'Failed to disconnect.',
      });
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header Warning & Mode Badge */}
      <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-amber-950/40 border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  LIVE TRADING GATEWAY
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 border border-rose-500/40 text-rose-300">
                  Real Binance Futures
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Secure server-side API proxy. Real funds are only risked when Live Trading is explicitly enabled.
              </p>
            </div>
          </div>

          {/* Quick return to safe PAPER / DEMO */}
          {onModeSelect && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onModeSelect('PAPER')}
                className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Switch to PAPER</span>
              </button>
              <button
                type="button"
                onClick={() => onModeSelect('DEMO')}
                className="px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Switch to DEMO</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Security Guarantees Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Backend-Only Credential Memory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Never Stored in localStorage</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Withdrawals Permanently Disabled</span>
          </div>
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : actionFeedback.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              : 'bg-sky-950/60 border-sky-500/50 text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {actionFeedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {actionFeedback.type === 'info' && <Shield className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-white text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Live Control Grid: Status Card & Safety Toggle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Account Connection & Status */}
        <div className="lg:col-span-2 space-y-4">
          {/* Connection Status Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <span>Binance Futures Account Status</span>
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    liveStatus.isConnected
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                      : liveStatus.configured
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      liveStatus.isConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {liveStatus.isConnected
                      ? 'CONNECTED & ACTIVE'
                      : liveStatus.configured
                      ? 'AUTH FAILED'
                      : 'NOT CONNECTED'}
                  </span>
                </span>

                {liveStatus.configured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    title="Disconnect and remove credentials"
                    className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Account Metrics Grid (If connected) */}
            {liveStatus.isConnected && liveStatus.balance ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Total Margin Balance
                  </span>
                  <div className="text-lg font-black text-white font-mono">
                    ${liveStatus.balance.totalWalletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500">USDT Collateral</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Available Free Margin
                  </span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    ${liveStatus.balance.availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-500">Ready for Execution</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Unrealized PnL
                  </span>
                  <div
                    className={`text-lg font-black font-mono flex items-center gap-1 ${
                      liveStatus.balance.totalUnrealizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {liveStatus.balance.totalUnrealizedProfit >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {liveStatus.balance.totalUnrealizedProfit >= 0 ? '+' : ''}$
                      {liveStatus.balance.totalUnrealizedProfit.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Active Positions</span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-center text-xs text-slate-400 space-y-1">
                <Key className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="font-semibold text-slate-300">No Binance Account Connected</p>
                <p>
                  Connect your Binance Futures API Key below to view live balance and enable protected real execution.
                </p>
              </div>
            )}

            {/* Connection Details Metadata */}
            {liveStatus.configured && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>API Key:</span>
                  <code className="bg-slate-900 px-2 py-0.5 rounded text-amber-300 font-mono text-[11px]">
                    {liveStatus.apiKeyMasked}
                  </code>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">Futures Trading:</span>
                    <span className={liveStatus.canTrade ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {liveStatus.canTrade ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">Withdrawals:</span>
                    <span className="text-emerald-400 font-bold">DISABLED (SAFE)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition flex items-center gap-1 border border-slate-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Test Ping</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Credentials Input Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>{liveStatus.configured ? 'Update Binance API Credentials' : 'Connect Binance Futures API'}</span>
            </h3>

            <form onSubmit={handleSaveCredentials} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Binance API Key
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={liveStatus.apiKeyMasked || 'Enter Binance Futures API Key (Read & Trade only)'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-400">
                    Binance API Secret
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="text-[11px] text-slate-400 hover:text-amber-400 transition"
                  >
                    {showSecret ? 'Hide Secret' : 'Show Secret'}
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={apiSecretInput}
                  onChange={(e) => setApiSecretInput(e.target.value)}
                  placeholder="Enter Binance Futures API Secret"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  🔒 Handled by secure server memory only. Never stored in browser localStorage or transmitted in plain client-side state.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                {liveStatus.configured && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Test Connection</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSaving || !apiKeyInput.trim() || !apiSecretInput.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying on Binance...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Save & Verify Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Safety Switch & Live Execution Controller */}
        <div className="space-y-4">
          {/* Master Live Trading Switch Card */}
          <div
            className={`border rounded-2xl p-5 shadow-lg transition-all ${
              liveStatus.liveTradingEnabled
                ? 'bg-gradient-to-b from-rose-950/80 to-slate-900 border-rose-500 shadow-rose-500/20'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Master Safety Switch
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  liveStatus.liveTradingEnabled ? 'bg-rose-500 animate-ping' : 'bg-slate-600'
                }`}
              />
            </div>

            <div className="text-center py-3">
              <div
                className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 transition-all ${
                  liveStatus.liveTradingEnabled
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Power className="w-8 h-8" />
              </div>

              <h4 className="text-base font-black text-white">
                LIVE TRADING:{' '}
                <span className={liveStatus.liveTradingEnabled ? 'text-rose-400' : 'text-slate-400'}>
                  {liveStatus.liveTradingEnabled ? 'ACTIVE' : 'OFF (SAFETY LOCK)'}
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {liveStatus.liveTradingEnabled
                  ? 'Real orders will execute on Binance Futures when strategy confidence is >= 70.'
                  : 'System is protected in read-only analysis mode. Real order execution is blocked.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                id="master-live-toggle-btn"
                onClick={handleToggleClick}
                disabled={!liveStatus.isConnected || isTogglingLive}
                className={`w-full py-3 rounded-xl font-black text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                  liveStatus.liveTradingEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40'
                    : 'bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white shadow-rose-600/30'
                }`}
              >
                {isTogglingLive ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Safety Switch...</span>
                  </>
                ) : liveStatus.liveTradingEnabled ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>DEACTIVATE LIVE TRADING (LOCK)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>ACTIVATE LIVE TRADING</span>
                  </>
                )}
              </button>

              {!liveStatus.isConnected && (
                <p className="text-[10px] text-amber-400/80 text-center mt-2">
                  Connect verified Binance API credentials first to unlock switch.
                </p>
              )}
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-400">
            <h5 className="font-bold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Binance API Configuration:</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>Enable: <strong>Reading</strong> (Account balances)</li>
              <li>Enable: <strong>Futures Trading</strong> (Order placement)</li>
              <li>Disable: <strong>Spot Trading & Margin</strong> (Not required)</li>
              <li>Disable: <strong>Withdrawals</strong> (Never enable withdrawals)</li>
              <li>Restrict access to trusted IPs if desired.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Live Positions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Open Binance Futures Positions ({positions.length})</span>
          </h3>
          {liveStatus.isConnected && (
            <button
              type="button"
              onClick={loadPositions}
              disabled={loadingPositions}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loadingPositions ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {positions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Side / Size</th>
                  <th className="py-2.5 px-3">Entry Price</th>
                  <th className="py-2.5 px-3">Mark Price</th>
                  <th className="py-2.5 px-3">Margin / Leverage</th>
                  <th className="py-2.5 px-3 text-right">Unrealized PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {positions.map((p) => {
                  const isLong = p.positionAmt > 0;
                  return (
                    <tr key={p.symbol} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white font-sans">{p.symbol}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                            isLong ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {isLong ? 'LONG' : 'SHORT'}
                        </span>{' '}
                        <span className="text-slate-300">{Math.abs(p.positionAmt)}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">${p.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-300">${p.markPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {p.marginType} • {p.leverage}x
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-black ${
                          p.unRealizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {p.unRealizedProfit >= 0 ? '+' : ''}${p.unRealizedProfit.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-6 text-center text-xs text-slate-500">
            {liveStatus.isConnected
              ? 'No active open positions on Binance Futures account.'
              : 'Connect Binance Futures credentials to monitor active positions.'}
          </div>
        )}
      </div>

      {/* Safety Confirmation Modal for enabling LIVE trading */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
        >
          <div className="bg-slate-900 border border-rose-500/60 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Enable Real Binance Execution</h3>
                <span className="text-xs text-rose-400 font-semibold">Strict Capital Warning</span>
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3.5 text-xs text-rose-200 leading-relaxed space-y-2">
              <p>
                <strong>You are about to enable LIVE TRADING on your Binance Futures account.</strong>
              </p>
              <p>
                When active, high-confidence scalp signals (score &ge; 70) will place <strong>real orders with real funds</strong>. Cryptocurrency futures trading involves high risk of loss.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ackRisk}
                  onChange={(e) => setAckRisk(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-400"
                />
                <span>I understand that real funds will be risked on Binance Futures and accept all financial risks.</span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ackNoWithdrawals}
                  onChange={(e) => setAckNoWithdrawals(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-400"
                />
                <span>I have verified that withdrawal permissions are disabled on my API key.</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Cancel (Keep Safe)
              </button>

              <button
                type="button"
                disabled={!ackRisk || !ackNoWithdrawals || isTogglingLive}
                onClick={() => executeToggle(true, true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-rose-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTogglingLive ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enabling...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>CONFIRM & ENABLE LIVE TRADING</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
