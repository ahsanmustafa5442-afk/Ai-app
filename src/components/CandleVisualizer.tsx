import React from 'react';
import { Candle, Timeframe } from '../types';

interface CandleVisualizerProps {
  candles: Candle[];
  timeframe: Timeframe;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  signal: 'LONG' | 'SHORT' | 'WAIT';
}

export const CandleVisualizer: React.FC<CandleVisualizerProps> = ({
  candles,
  timeframe,
  entryPrice,
  stopLoss,
  takeProfit,
  signal,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 600, height: 220 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: Math.max(300, entry.contentRect.width),
          height: 220,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const visibleCandles = React.useMemo(() => {
    return candles.slice(-38);
  }, [candles]);

  if (visibleCandles.length === 0) return null;

  // Calculate min and max price across candles + entry/sl/tp
  const allPrices = visibleCandles.flatMap((c) => [c.high, c.low]);
  if (entryPrice > 0) allPrices.push(entryPrice);
  if (stopLoss > 0) allPrices.push(stopLoss);
  if (takeProfit > 0) allPrices.push(takeProfit);

  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  const paddingY = 24;
  const paddingRight = 65;
  const chartHeight = dimensions.height - paddingY * 2;
  const chartWidth = dimensions.width - paddingRight;

  const getY = (price: number) => {
    return paddingY + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const candleWidth = Math.max(3, (chartWidth / visibleCandles.length) * 0.7);
  const candleGap = chartWidth / visibleCandles.length;

  return (
    <div className="bg-slate-950/90 rounded-xl border border-slate-800 p-3 relative overflow-hidden">
      {/* Top Header of Chart */}
      <div className="flex items-center justify-between mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white font-mono">Price Action & Order Zones</span>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
            {timeframe}
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-0.5 bg-cyan-400 inline-block"></span>
            <span>Entry</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-0.5 bg-emerald-400 inline-block border-t border-dashed"></span>
            <span>TP</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-0.5 bg-rose-400 inline-block border-t border-dashed"></span>
            <span>SL</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div ref={containerRef} className="w-full h-[220px]">
        <svg width={dimensions.width} height={dimensions.height} className="overflow-visible select-none">
          <defs>
            <linearGradient id="bullGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="bearGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#E11D48" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + chartHeight * pct;
            const priceAtY = maxPrice - priceRange * pct;
            return (
              <g key={idx}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth={0.7}
                />
                <text
                  x={chartWidth + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  ${priceAtY.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Candles */}
          {visibleCandles.map((c, i) => {
            const x = i * candleGap + candleGap / 2;
            const isGreen = c.close >= c.open;
            const openY = getY(c.open);
            const closeY = getY(c.close);
            const highY = getY(c.high);
            const lowY = getY(c.low);

            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

            return (
              <g key={c.time || i}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={isGreen ? '#10B981' : '#F43F5E'}
                  strokeWidth={1}
                />
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isGreen ? 'url(#bullGradient)' : 'url(#bearGradient)'}
                  rx={1}
                />
              </g>
            );
          })}

          {/* Entry Level Line */}
          {entryPrice > 0 && (
            <g>
              <line
                x1={0}
                y1={getY(entryPrice)}
                x2={chartWidth}
                y2={getY(entryPrice)}
                stroke="#06b6d4"
                strokeWidth={1.5}
              />
              <rect
                x={chartWidth}
                y={getY(entryPrice) - 8}
                width={56}
                height={16}
                fill="#0e7490"
                rx={3}
              />
              <text
                x={chartWidth + 4}
                y={getY(entryPrice) + 3}
                fill="#ffffff"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                ${entryPrice.toFixed(1)}
              </text>
            </g>
          )}

          {/* Take Profit Line */}
          {takeProfit > 0 && signal !== 'WAIT' && (
            <g>
              <line
                x1={0}
                y1={getY(takeProfit)}
                x2={chartWidth}
                y2={getY(takeProfit)}
                stroke="#10b981"
                strokeWidth={1.2}
                strokeDasharray="4 2"
              />
              <rect
                x={chartWidth}
                y={getY(takeProfit) - 8}
                width={56}
                height={16}
                fill="#065f46"
                rx={3}
              />
              <text
                x={chartWidth + 4}
                y={getY(takeProfit) + 3}
                fill="#34d399"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                TP ${takeProfit.toFixed(1)}
              </text>
            </g>
          )}

          {/* Stop Loss Line */}
          {stopLoss > 0 && signal !== 'WAIT' && (
            <g>
              <line
                x1={0}
                y1={getY(stopLoss)}
                x2={chartWidth}
                y2={getY(stopLoss)}
                stroke="#f43f5e"
                strokeWidth={1.2}
                strokeDasharray="4 2"
              />
              <rect
                x={chartWidth}
                y={getY(stopLoss) - 8}
                width={56}
                height={16}
                fill="#881337"
                rx={3}
              />
              <text
                x={chartWidth + 4}
                y={getY(stopLoss) + 3}
                fill="#fda4af"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                SL ${stopLoss.toFixed(1)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
