import React from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  History,
  Play,
  RefreshCcw,
  Shield,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';
import { ClosedTrade, PaperAccount, VirtualPosition } from '../types';

interface PaperTradingViewProps {
  account: PaperAccount;
  onClosePosition: (positionId: string, currentPrice: number) => void;
  onResetAccount: () => void;
  currentSymbol: string;
  currentPrice: number;
}

export const PaperTradingView: React.FC<PaperTradingViewProps> = ({
  account,
  onClosePosition,
  onResetAccount,
  currentSymbol,
  currentPrice,
}) => {
  const [activeTab, setActiveTab] = React.useState<'POSITIONS' | 'HISTORY'>('POSITIONS');
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const totalUnrealized = account.activePositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const isPnlPositive = account.totalPnl >= 0;

  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-3.5 sm:p-5">
      {/* Top Header: Safe Simulation Banner & Reset */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">Paper Trading Simulation</h2>
            <span className="text-[10px] bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
              NO REAL MONEY
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Real-time trade execution simulator testing confluence accuracy without financial risk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="reset-paper-acc-btn"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-xs transition-colors border border-slate-700"
          >
            <RefreshCcw className="w-3 h-3" />
            <span>Reset Demo Funds</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-lg p-3 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Reset paper balance back to $10,000.00 and clear all positions?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onResetAccount();
                setShowResetConfirm(false);
              }}
              className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-2.5 py-1 rounded text-xs"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(false)}
              className="bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {/* Paper Balance */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Paper Balance</span>
          <span className="text-sm sm:text-base font-bold font-mono text-white">
            ${account.balance.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">USDT Equity</span>
        </div>

        {/* Unrealized PnL */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Unrealized P/L</span>
          <span
            className={`text-sm sm:text-base font-bold font-mono ${
              totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {account.activePositions.length} active open
          </span>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Win Rate</span>
          <span className="text-sm sm:text-base font-bold font-mono text-amber-400">
            {account.winRate}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {account.winningTrades}W / {account.losingTrades}L
          </span>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Profit Factor</span>
          <span className="text-sm sm:text-base font-bold font-mono text-teal-300">
            {account.profitFactor > 0 ? account.profitFactor.toFixed(2) : '--'}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">Ratio</span>
        </div>

        {/* Maximum Drawdown */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Max Drawdown</span>
          <span className="text-sm sm:text-base font-bold font-mono text-rose-300">
            {account.maxDrawdown.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">Peak to trough</span>
        </div>

        {/* Total Net P/L */}
        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Net P/L</span>
          <span
            className={`text-sm sm:text-base font-bold font-mono ${
              isPnlPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPnlPositive ? '+' : ''}${account.totalPnl.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono block">
            {account.totalTrades} closed trades
          </span>
        </div>
      </div>

      {/* Tabs: Active Positions vs Closed Trades */}
      <div className="flex items-center gap-2 border-b border-slate-800 mb-3">
        <button
          type="button"
          onClick={() => setActiveTab('POSITIONS')}
          className={`pb-2 px-1 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'POSITIONS'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Virtual Positions ({account.activePositions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-2 px-1 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'HISTORY'
              ? 'text-amber-400 border-amber-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Closed Trades History ({account.closedTrades.length})
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'POSITIONS' ? (
        account.activePositions.length === 0 ? (
          <div className="text-center py-8 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No virtual positions open currently.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Click &quot;Execute Paper LONG/SHORT&quot; in the analysis card to initiate a simulated trade.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {account.activePositions.map((pos) => {
              const isLong = pos.type === 'LONG';
              const pnlPositive = pos.unrealizedPnl >= 0;

              return (
                <div
                  key={pos.id}
                  className="bg-slate-950/80 rounded-lg border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-black ${
                        isLong ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {pos.type} {pos.leverage}x
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{pos.symbol}</span>
                        {pos.source === 'SCALP_AUTO' && (
                          <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            ⚡ SCALP AUTO
                          </span>
                        )}
                        <span className="text-xs text-slate-400 font-mono">
                          Size: ${pos.positionSizeUsdt.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>Entry: ${pos.entryPrice.toFixed(2)}</span>
                        <span>•</span>
                        <span className="text-rose-400">SL: ${pos.stopLoss.toFixed(2)}</span>
                        <span>•</span>
                        <span className="text-emerald-400">TP: ${pos.takeProfit.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-bold font-mono ${
                          pnlPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {pnlPositive ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} (
                        {pnlPositive ? '+' : ''}
                        {pos.unrealizedPnlPercent.toFixed(2)}%)
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Margin: ${pos.margin.toFixed(2)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onClosePosition(pos.id, pos.currentPrice)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : account.closedTrades.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
          <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-medium">No closed trade records yet.</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Trades that hit Take Profit, Stop Loss, or are manually closed appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {account.closedTrades.map((t) => {
            const isWin = t.result === 'WIN';
            const isLoss = t.result === 'LOSS';

            return (
              <div
                key={t.id}
                className="bg-slate-950/60 rounded-lg border border-slate-800/80 p-2.5 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      t.type === 'LONG' ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {t.type} {t.leverage}x
                  </span>
                  <span className="font-bold text-white">{t.symbol}</span>
                  <span className="text-[10px] text-slate-400">
                    {t.closeReason.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-slate-400 text-[10px]">
                    ${t.entryPrice.toFixed(2)} → ${t.exitPrice.toFixed(2)}
                  </div>
                  <div
                    className={`font-bold ${
                      isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {t.realizedPnl >= 0 ? '+' : ''}${t.realizedPnl.toFixed(2)} (
                    {t.realizedPnl >= 0 ? '+' : ''}
                    {t.realizedPnlPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
