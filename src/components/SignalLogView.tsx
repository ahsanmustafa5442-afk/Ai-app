import React from 'react';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Coins,
  Filter,
  Layers,
  Radio,
  Search,
  ShieldAlert,
  Trash2,
  Zap,
} from 'lucide-react';
import { SignalLogEntry } from '../types';

interface SignalLogViewProps {
  logs: SignalLogEntry[];
  onClearLogs?: () => void;
}

export const SignalLogView: React.FC<SignalLogViewProps> = ({ logs, onClearLogs }) => {
  const [coinFilter, setCoinFilter] = React.useState<string>('ALL');
  const [onlyTrades, setOnlyTrades] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');

  const filtered = React.useMemo(() => {
    return logs.filter((log) => {
      if (coinFilter !== 'ALL' && !log.symbol.includes(coinFilter)) {
        return false;
      }
      if (onlyTrades && !log.isTradeAction) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          log.symbol.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.signal.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, coinFilter, onlyTrades, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-400" />
              Live Scalp Signal Log
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Real-Time Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time audit log of scalp signals, automatic paper executions, risk boundaries, and target completions.
          </p>
        </div>

        {onClearLogs && (
          <button
            type="button"
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Coin Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium text-xs flex items-center gap-1 mr-1">
              <Coins className="w-3.5 h-3.5" />
              Coin:
            </span>
            {['ALL', 'BTC', 'BNB', 'SOL', 'XRP', 'SUI', 'DOGE'].map((coin) => (
              <button
                key={coin}
                type="button"
                onClick={() => setCoinFilter(coin)}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition ${
                  coinFilter === coin
                    ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {coin}
              </button>
            ))}
          </div>

          {/* Trade Actions Only Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyTrades}
              onChange={(e) => setOnlyTrades(e.target.checked)}
              className="accent-amber-400 rounded"
            />
            <span>Trades Only (Executions / Exits)</span>
          </label>
        </div>
      </div>

      {/* Signal Log Table (Prompt Requirement 9: Time, Coin, Signal, Confidence, Entry, SL, TP, Action) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Coin</th>
                <th className="py-2.5 px-3">Signal</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Entry Price</th>
                <th className="py-2.5 px-3">Stop Loss</th>
                <th className="py-2.5 px-3">Take Profit</th>
                <th className="py-2.5 px-3">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs font-sans">
                    No signals logged matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const isLong = log.signal === 'LONG';
                  const isShort = log.signal === 'SHORT';
                  const isTradeAction = log.isTradeAction;
                  const isTp = log.action.includes('TP HIT') || log.action.includes('WIN');
                  const isSl = log.action.includes('SL HIT') || log.action.includes('LOSS');
                  const isBlocked = log.action.includes('BLOCKED');

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isTradeAction ? 'bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      {/* Time */}
                      <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>

                      {/* Coin */}
                      <td className="py-2 px-3 font-bold text-white">
                        {log.symbol}
                      </td>

                      {/* Signal */}
                      <td className="py-2 px-3 font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-1 ${
                            isLong
                              ? 'bg-emerald-950 text-emerald-400'
                              : isShort
                              ? 'bg-rose-950 text-rose-400'
                              : 'bg-slate-800 text-amber-300'
                          }`}
                        >
                          {isLong && <ArrowUpRight className="w-3 h-3 stroke-[3]" />}
                          {isShort && <ArrowDownRight className="w-3 h-3 stroke-[3]" />}
                          {log.signal}
                        </span>
                      </td>

                      {/* Confidence */}
                      <td className="py-2 px-3 text-slate-200">
                        {log.confidence > 0 ? `${log.confidence}%` : '—'}
                      </td>

                      {/* Entry Price */}
                      <td className="py-2 px-3 text-slate-300">
                        {log.entry > 0 ? `$${log.entry >= 1 ? log.entry.toFixed(2) : log.entry.toFixed(4)}` : '—'}
                      </td>

                      {/* Stop Loss */}
                      <td className="py-2 px-3 text-rose-400">
                        {log.sl > 0 ? `$${log.sl >= 1 ? log.sl.toFixed(2) : log.sl.toFixed(4)}` : '—'}
                      </td>

                      {/* Take Profit */}
                      <td className="py-2 px-3 text-emerald-400">
                        {log.tp > 0 ? `$${log.tp >= 1 ? log.tp.toFixed(2) : log.tp.toFixed(4)}` : '—'}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 font-sans">
                        <span
                          className={`text-xs font-semibold ${
                            isTp
                              ? 'text-emerald-400 font-bold'
                              : isSl
                              ? 'text-rose-400 font-bold'
                              : isBlocked
                              ? 'text-amber-400'
                              : isTradeAction
                              ? 'text-white font-bold'
                              : 'text-slate-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
