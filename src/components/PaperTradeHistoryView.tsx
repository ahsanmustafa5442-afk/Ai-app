import React from 'react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Coins,
  Filter,
  Flame,
  Info,
  Layers,
  Percent,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { PaperTradeHistoryStats, PaperTradeRecord, TradingMode } from '../types';
import { calculateHistoryStats } from '../services/paperTrading';

interface PaperTradeHistoryViewProps {
  trades: PaperTradeRecord[];
  onClearHistory: () => void;
  onManualCloseTrade?: (tradeId: string) => void;
  mode?: TradingMode;
  accountBalance?: number;
}

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED' | 'WIN' | 'LOSS';
type FilterCoin = 'ALL' | 'BTC' | 'BNB' | 'SOL' | 'XRP' | 'SUI' | 'DOGE';

export const PaperTradeHistoryView: React.FC<PaperTradeHistoryViewProps> = ({
  trades,
  onClearHistory,
  onManualCloseTrade,
  mode = 'PAPER',
  accountBalance,
}) => {
  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>('ALL');
  const [coinFilter, setCoinFilter] = React.useState<FilterCoin>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTrade, setSelectedTrade] = React.useState<PaperTradeRecord | null>(null);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);

  const isDemo = mode === 'DEMO';
  const defaultBalance = isDemo ? 50000 : 10000;
  const currentBalance = accountBalance !== undefined ? accountBalance : defaultBalance;

  // Compute aggregate statistics
  const stats: PaperTradeHistoryStats = React.useMemo(() => {
    return calculateHistoryStats(trades);
  }, [trades]);

  // Apply filters
  const filteredTrades = React.useMemo(() => {
    return trades.filter((trade) => {
      // Status filter
      if (statusFilter === 'OPEN' && trade.status !== 'OPEN') return false;
      if (statusFilter === 'CLOSED' && trade.status !== 'CLOSED') return false;
      if (statusFilter === 'WIN' && trade.result !== 'WIN') return false;
      if (statusFilter === 'LOSS' && trade.result !== 'LOSS') return false;

      // Coin filter
      if (coinFilter !== 'ALL') {
        const prefix = trade.symbol.replace('USDT', '');
        if (prefix !== coinFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = trade.id.toLowerCase().includes(query);
        const matchesSymbol = trade.symbol.toLowerCase().includes(query);
        const matchesReason =
          trade.entryReason?.toLowerCase().includes(query) ||
          trade.exitReason?.toLowerCase().includes(query);
        if (!matchesId && !matchesSymbol && !matchesReason) return false;
      }

      return true;
    });
  }, [trades, statusFilter, coinFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Reset Button */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4 transition-all ${
          isDemo
            ? 'bg-sky-950/20 border-sky-500/30'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className={`w-5 h-5 ${isDemo ? 'text-sky-400' : 'text-amber-400'}`} />
              <span>{isDemo ? 'Demo Trade History' : 'Paper Trade History'}</span>
            </h2>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                isDemo
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {isDemo ? 'Demo Exchange Ledger' : 'Persistent Virtual Ledger'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isDemo
              ? 'Dedicated simulated exchange environment using Binance public Futures prices. Completely separate from Paper mode.'
              : 'Every automatically or manually executed scalp paper trade is recorded and preserved across browser sessions.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Current Mode Balance Pill */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-right">
            <span className="text-[9px] uppercase font-bold text-slate-500 block">
              {isDemo ? 'Demo Balance' : 'Paper Balance'}
            </span>
            <span className={`text-sm font-black font-mono ${isDemo ? 'text-sky-400' : 'text-emerald-400'}`}>
              ${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            type="button"
            id="clear-history-button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isDemo ? 'Reset Demo Ledger' : 'Clear / Reset History'}</span>
          </button>
        </div>
      </div>

      {/* 12 Aggregate Statistics Cards (Prompt Requirement 1) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Trades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Trades</span>
          <div className="text-lg font-bold text-white font-mono mt-0.5">{stats.totalTrades}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Lifetime executed</div>
        </div>

        {/* Open Trades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Open Trades</span>
          <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">{stats.openTrades}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active in market</div>
        </div>

        {/* Closed Trades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Closed Trades</span>
          <div className="text-lg font-bold text-slate-200 font-mono mt-0.5">{stats.closedTrades}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Resolved exits</div>
        </div>

        {/* Winning Trades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Winning Trades</span>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{stats.winningTrades}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Target TP reached</div>
        </div>

        {/* Losing Trades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Losing Trades</span>
          <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">{stats.losingTrades}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Invalidation SL hit</div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Win Rate</span>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              stats.winRate >= 50 ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Wins / Closed</div>
        </div>

        {/* Total P/L */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total P/L</span>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.totalPnl >= 0 ? `+$${stats.totalPnl.toFixed(2)}` : `-$${Math.abs(stats.totalPnl).toFixed(2)}`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Realized + Open</div>
        </div>

        {/* Average P/L */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average P/L</span>
          <div
            className={`text-lg font-bold font-mono mt-0.5 ${
              stats.averagePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.averagePnl >= 0 ? `+$${stats.averagePnl.toFixed(2)}` : `-$${Math.abs(stats.averagePnl).toFixed(2)}`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Per closed trade</div>
        </div>

        {/* Average R:R */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Average R:R</span>
          <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
            1 : {stats.averageRiskReward.toFixed(1)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scalp design target ~1:3</div>
        </div>

        {/* Maximum Drawdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Drawdown</span>
          <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
            {stats.maxDrawdown.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Peak equity drop</div>
        </div>

        {/* Best Trade */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Best Trade</span>
          <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
            {stats.bestTradePnl > 0 ? `+$${stats.bestTradePnl.toFixed(2)}` : '$0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Max single gain</div>
        </div>

        {/* Worst Trade */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Worst Trade</span>
          <div className="text-lg font-bold text-rose-400 font-mono mt-0.5">
            {stats.worstTradePnl < 0 ? `-$${Math.abs(stats.worstTradePnl).toFixed(2)}` : '$0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Max single loss</div>
        </div>
      </div>

      {/* Filter Bar & Search (Prompt Requirement 1) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium text-xs flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Status:
            </span>
            {(['ALL', 'OPEN', 'CLOSED', 'WIN', 'LOSS'] as const).map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                    active
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  {status}
                  {status === 'ALL' && ` (${trades.length})`}
                  {status === 'OPEN' && ` (${stats.openTrades})`}
                  {status === 'CLOSED' && ` (${stats.closedTrades})`}
                  {status === 'WIN' && ` (${stats.winningTrades})`}
                  {status === 'LOSS' && ` (${stats.losingTrades})`}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Coin, Reason..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Coin Filter Pills (Prompt Requirement 1: BTC, BNB, SOL, XRP, SUI, DOGE) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-medium text-xs flex items-center gap-1 mr-1 shrink-0">
            <Coins className="w-3.5 h-3.5" />
            Coin:
          </span>
          {(['ALL', 'BTC', 'BNB', 'SOL', 'XRP', 'SUI', 'DOGE'] as const).map((coin) => {
            const active = coinFilter === coin;
            return (
              <button
                key={coin}
                type="button"
                onClick={() => setCoinFilter(coin)}
                className={`px-2.5 py-0.5 rounded-md font-semibold text-xs whitespace-nowrap transition ${
                  active
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {coin === 'ALL' ? 'All Coins' : `${coin}USDT`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Trade ID</th>
                <th className="py-2.5 px-3">Coin / Type</th>
                <th className="py-2.5 px-3">Confidence & Grade</th>
                <th className="py-2.5 px-3">Entry Price</th>
                <th className="py-2.5 px-3">Stop Loss</th>
                <th className="py-2.5 px-3">Take Profit</th>
                <th className="py-2.5 px-3">R:R</th>
                <th className="py-2.5 px-3">Size (USDT)</th>
                <th className="py-2.5 px-3">Exit Price</th>
                <th className="py-2.5 px-3">P/L ($ / %)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400 text-xs">
                    No paper trades match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const isLong = trade.type === 'LONG';
                  const isWin = trade.result === 'WIN';
                  const isLoss = trade.result === 'LOSS';
                  const isOpen = trade.status === 'OPEN';

                  return (
                    <tr
                      key={trade.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      {/* Trade ID */}
                      <td className="py-2.5 px-3 font-mono text-slate-300 font-semibold">
                        {trade.id}
                        {trade.source === 'SCALP_AUTO' && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            AUTO
                          </span>
                        )}
                      </td>

                      {/* Coin / Type */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white font-mono">{trade.symbol}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              isLong ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                            }`}
                          >
                            {trade.type}
                          </span>
                        </div>
                      </td>

                      {/* Confidence & Grade */}
                      <td className="py-2.5 px-3 font-mono">
                        <span className="text-white font-bold">{trade.confidenceScore}%</span>{' '}
                        <span className="text-[10px] text-slate-400 font-medium">({trade.setupQuality})</span>
                      </td>

                      {/* Entry Price */}
                      <td className="py-2.5 px-3 font-mono text-slate-200">
                        ${trade.entryPrice.toFixed(2)}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-2.5 px-3 font-mono text-rose-400">
                        ${trade.stopLoss.toFixed(2)}
                      </td>

                      {/* Take Profit */}
                      <td className="py-2.5 px-3 font-mono text-emerald-400">
                        ${trade.takeProfit.toFixed(2)}
                      </td>

                      {/* R:R */}
                      <td className="py-2.5 px-3 font-mono text-amber-300 font-bold">
                        1:{trade.riskReward.toFixed(1)}
                      </td>

                      {/* Position Size */}
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        ${trade.positionSize.toFixed(0)}
                      </td>

                      {/* Exit Price */}
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '—'}
                      </td>

                      {/* P/L ($ / %) */}
                      <td className="py-2.5 px-3 font-mono">
                        <div
                          className={`font-bold ${
                            trade.pnl > 0
                              ? 'text-emerald-400'
                              : trade.pnl < 0
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {trade.pnl >= 0 ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {trade.pnlPercent >= 0 ? `+${trade.pnlPercent.toFixed(1)}%` : `${trade.pnlPercent.toFixed(1)}%`}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        {isOpen ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 w-max">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            OPEN
                          </span>
                        ) : isWin ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            WIN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 w-max">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            LOSS
                          </span>
                        )}
                      </td>

                      {/* Details View */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrade(trade);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Inspection Modal (Full details: reason for entry, reason for exit, timestamps) */}
      {selectedTrade && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedTrade(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                {selectedTrade.type === 'LONG' ? <ArrowUpRight className="w-4 h-4 text-emerald-400" /> : <ArrowDownRight className="w-4 h-4 text-rose-400" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{selectedTrade.symbol}</span>
                  <span
                    className={`px-2 py-0.2 rounded text-xs font-black ${
                      selectedTrade.type === 'LONG' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {selectedTrade.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    #{selectedTrade.id}
                  </span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Confidence Score: {selectedTrade.confidenceScore}% • Grade: {selectedTrade.setupQuality}
                </span>
              </div>
            </div>

            {/* Price & PnL Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Entry Price</span>
                <span className="font-mono text-white font-bold block mt-0.5">
                  ${selectedTrade.entryPrice.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Stop Loss</span>
                <span className="font-mono text-rose-400 font-bold block mt-0.5">
                  ${selectedTrade.stopLoss.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Take Profit</span>
                <span className="font-mono text-emerald-400 font-bold block mt-0.5">
                  ${selectedTrade.takeProfit.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Risk / Reward</span>
                <span className="font-mono text-amber-300 font-bold block mt-0.5">
                  1:{selectedTrade.riskReward.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Timestamps & PnL */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Position Size & Margin</span>
                <span className="font-mono text-slate-200 block mt-0.5">
                  ${selectedTrade.positionSize.toFixed(0)} ({selectedTrade.leverage}x Leverage, ${selectedTrade.margin.toFixed(0)} margin)
                </span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase">Realized / Unrealized PnL</span>
                <span
                  className={`font-mono font-bold block mt-0.5 ${
                    selectedTrade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedTrade.pnl >= 0 ? `+$${selectedTrade.pnl.toFixed(2)}` : `-$${Math.abs(selectedTrade.pnl).toFixed(2)}`}{' '}
                  ({selectedTrade.pnlPercent.toFixed(1)}%)
                </span>
              </div>
            </div>

            {/* Reasons (Prompt Requirement 1) */}
            <div className="space-y-2 text-xs mb-4">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  Reason for Entry
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {selectedTrade.entryReason || 'Scalp Confluence verified across 15M, 5M and 1M timeframes.'}
                </p>
              </div>

              {selectedTrade.exitReason && (
                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-300 block mb-1">
                    Reason for Exit
                  </span>
                  <p className="text-slate-300 leading-relaxed">{selectedTrade.exitReason}</p>
                </div>
              )}

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Opened: {new Date(selectedTrade.entryTime).toLocaleString()}</span>
                {selectedTrade.exitTime && (
                  <span>Closed: {new Date(selectedTrade.exitTime).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              {selectedTrade.status === 'OPEN' && onManualCloseTrade && (
                <button
                  type="button"
                  onClick={() => {
                    onManualCloseTrade(selectedTrade.id);
                    setSelectedTrade(null);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition active:scale-95"
                >
                  Close Position Manually
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedTrade(null)}
                className="ml-auto px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
        >
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">
                {isDemo ? 'Reset Demo Trading Ledger?' : 'Reset Paper Trading Ledger?'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {isDemo
                ? 'This will clear all demo trade history, active demo positions, and reset your starting demo equity back to $50,000.00. This action cannot be undone.'
                : 'This will clear all paper trade history, active positions, and reset your starting paper equity back to $10,000.00. This action cannot be undone.'}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reset-history-btn"
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition active:scale-95"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
