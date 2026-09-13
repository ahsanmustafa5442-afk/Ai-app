import React from 'react';
import { ArrowDownRight, ArrowUpRight, Clock, DollarSign, Layers, Percent } from 'lucide-react';
import { MarketStats } from '../types';

interface MarketStatsProps {
  stats: MarketStats;
  priceTickDirection: 'UP' | 'DOWN' | null;
}

export const MarketStatsBar: React.FC<MarketStatsProps> = ({ stats, priceTickDirection }) => {
  const isPositive = stats.change24h >= 0;

  const formatUsdtCompact = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  const formatPrice = (val: number) => {
    if (val >= 1000) return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (val >= 1) return val.toFixed(3);
    return val.toFixed(4);
  };

  return (
    <section aria-label="Market Overview" className="bg-slate-900 border-b border-slate-800 px-3 py-2.5 sm:px-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* 1. Current Price */}
        <div className="bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
            <span>Current Price</span>
            <span className="text-[9px] text-slate-500 font-mono">PERP</span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-base sm:text-lg font-black font-mono tracking-tight transition-colors duration-200 ${
                priceTickDirection === 'UP'
                  ? 'text-emerald-400'
                  : priceTickDirection === 'DOWN'
                  ? 'text-rose-400'
                  : 'text-white'
              }`}
            >
              ${formatPrice(stats.currentPrice)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
            <span>Mark:</span>
            <span className="text-slate-400">${formatPrice(stats.markPrice)}</span>
          </div>
        </div>

        {/* 2. 24h Change */}
        <div className="bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-semibold text-slate-400">24h Change</div>
          <div
            className={`flex items-center gap-0.5 mt-0.5 text-sm sm:text-base font-bold font-mono ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-4 h-4 shrink-0" /> : <ArrowDownRight className="w-4 h-4 shrink-0" />}
            <span>
              {isPositive ? '+' : ''}
              {stats.change24h.toFixed(2)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            High: ${formatPrice(stats.high24h)}
          </div>
        </div>

        {/* 3. 24h Volume */}
        <div className="bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <DollarSign className="w-2.5 h-2.5 text-slate-500" />
            <span>24h Volume</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-slate-200 mt-0.5">
            {formatUsdtCompact(stats.volume24h)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Low: ${formatPrice(stats.low24h)}
          </div>
        </div>

        {/* 4. Open Interest */}
        <div className="bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-amber-500/80" />
            <span>Open Interest</span>
          </div>
          <div className="text-sm sm:text-base font-bold font-mono text-slate-200 mt-0.5">
            {formatUsdtCompact(stats.openInterest)}
          </div>
          <div
            className={`text-[10px] font-mono font-medium ${
              stats.openInterestChange24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {stats.openInterestChange24h >= 0 ? '+' : ''}
            {stats.openInterestChange24h.toFixed(1)}% (24h)
          </div>
        </div>

        {/* 5. Funding Rate */}
        <div className="bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Percent className="w-2.5 h-2.5 text-cyan-400/80" />
            <span>Funding Rate</span>
          </div>
          <div
            className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${
              stats.fundingRate >= 0 ? 'text-amber-300' : 'text-emerald-400'
            }`}
          >
            {(stats.fundingRate * 100).toFixed(4)}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            In 8h interval
          </div>
        </div>

        {/* 6. Mark Price & Next Countdown */}
        <div className="bg-slate-950/60 p-2 sm:p-2.5 rounded-lg border border-slate-800/80">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-purple-400/80" />
            <span>Funding Cycle</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold font-mono text-slate-300 mt-1 truncate">
            {stats.nextFundingTime.split('(')[0]}
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            Countdown: ~2h 45m
          </div>
        </div>
      </div>
    </section>
  );
};
