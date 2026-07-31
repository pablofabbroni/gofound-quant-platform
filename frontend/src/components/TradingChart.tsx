import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CandleData, EquityPoint, BacktestTrade } from '../types';
import { TrendingUp, BarChart2, Activity, Layers } from 'lucide-react';

interface TradingChartProps {
  candles: CandleData[];
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
  symbol: string;
  timeframe: string;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  equityCurve,
  trades,
  symbol,
  timeframe,
}) => {
  const [activeView, setActiveView] = useState<'candles' | 'equity' | 'combined'>('combined');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if ((!candles || candles.length === 0) && (!equityCurve || equityCurve.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-72 border border-slate-800 rounded-xl bg-slate-900/50 p-6 text-slate-400">
        <Activity className="w-10 h-10 mb-2 opacity-40 text-emerald-400 animate-pulse" />
        <p className="text-sm font-medium">Sin datos de gráfico para visualizar.</p>
        <p className="text-xs text-slate-500">Ejecuta una simulación de Backtest para generar el gráfico de mercado.</p>
      </div>
    );
  }

  // Pre-calculate price min/max for candle scaling
  const visibleCandles = (candles || []).slice(-80);
  const minPrice = visibleCandles.length > 0 ? Math.min(...visibleCandles.map(c => c.low)) * 0.998 : 0;
  const maxPrice = visibleCandles.length > 0 ? Math.max(...visibleCandles.map(c => c.high)) * 1.002 : 100;
  const priceRange = maxPrice - minPrice || 1;

  // Max volume for height bar scaling
  const maxVolume = visibleCandles.length > 0 ? Math.max(...visibleCandles.map(c => c.volume || 1)) : 1;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <BarChart2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              {symbol} <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">{timeframe}</span>
            </h3>
            <p className="text-xs text-slate-400">Laboratorio Gráfico Interactivo de Precios y Rendimiento</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveView('combined')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeView === 'combined'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Combinado
          </button>
          <button
            onClick={() => setActiveView('candles')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeView === 'candles'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Velas (OHLC)
          </button>
          <button
            onClick={() => setActiveView('equity')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
              activeView === 'equity'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Curva Equity
          </button>
        </div>
      </div>

      {/* Candlestick Canvas View */}
      {(activeView === 'candles' || activeView === 'combined') && visibleCandles.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Acción del Precio & Señales del Comité (Últimas {visibleCandles.length} velas)</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Vela Alcista</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Vela Bajista</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400"></span> ▲ BUY</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-400"></span> ▼ SELL</span>
            </div>
          </div>

          <div className="relative h-64 w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 overflow-hidden flex flex-col justify-between">
            {/* Candle Rendering via SVG */}
            <svg className="w-full h-48 overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
              {/* Background Grid */}
              <line x1="0" y1="50" x2="800" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="150" x2="800" y2="150" stroke="#1e293b" strokeDasharray="3 3" />

              {visibleCandles.map((candle, idx) => {
                const step = 800 / visibleCandles.length;
                const x = idx * step + step / 2;
                const candleWidth = Math.max(2, step * 0.65);

                const isBull = candle.close >= candle.open;
                const color = isBull ? '#10b981' : '#f43f5e';

                // Y scale mapping (200px height)
                const getY = (val: number) => 190 - ((val - minPrice) / priceRange) * 180;

                const yHigh = getY(candle.high);
                const yLow = getY(candle.low);
                const yOpen = getY(candle.open);
                const yClose = getY(candle.close);

                const bodyTop = Math.min(yOpen, yClose);
                const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

                return (
                  <g key={idx} className="transition-opacity hover:opacity-80 cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)}>
                    {/* Wick */}
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1.2" opacity="0.8" />
                    {/* Candle Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={bodyHeight}
                      fill={color}
                      rx="1"
                    />
                    {/* Signals overlay */}
                    {candle.signal === 'BUY' && (
                      <g>
                        <circle cx={x} cy={yLow + 12} r="4" fill="#10b981" />
                        <text x={x} y={yLow + 22} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">BUY</text>
                      </g>
                    )}
                    {candle.signal === 'SELL' && (
                      <g>
                        <circle cx={x} cy={yHigh - 12} r="4" fill="#f43f5e" />
                        <text x={x} y={yHigh - 16} textAnchor="middle" fill="#f43f5e" fontSize="9" fontWeight="bold">SELL</text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Volume Histogram Sub-chart */}
            <div className="h-10 border-t border-slate-800/80 pt-1 flex items-end justify-between px-1">
              {visibleCandles.map((candle, idx) => {
                const isBull = candle.close >= candle.open;
                const volHeight = Math.max(3, (candle.volume / maxVolume) * 32);
                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-t transition-all ${isBull ? 'bg-emerald-500/40 hover:bg-emerald-400' : 'bg-rose-500/40 hover:bg-rose-400'}`}
                    style={{ height: `${volHeight}px` }}
                    title={`Vol: ${candle.volume}`}
                  />
                );
              })}
            </div>

            {/* Hover Tooltip display */}
            {hoveredIndex !== null && visibleCandles[hoveredIndex] && (
              <div className="absolute top-2 left-2 bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded text-xs text-slate-300 font-mono shadow-lg flex gap-4">
                <span><strong className="text-slate-400">O:</strong> {visibleCandles[hoveredIndex].open.toFixed(5)}</span>
                <span><strong className="text-slate-400">H:</strong> {visibleCandles[hoveredIndex].high.toFixed(5)}</span>
                <span><strong className="text-slate-400">L:</strong> {visibleCandles[hoveredIndex].low.toFixed(5)}</span>
                <span><strong className="text-slate-400">C:</strong> {visibleCandles[hoveredIndex].close.toFixed(5)}</span>
                <span><strong className="text-slate-400">Vol:</strong> {visibleCandles[hoveredIndex].volume}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Equity Curve Area Chart View */}
      {(activeView === 'equity' || activeView === 'combined') && equityCurve.length > 0 && (
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Evolución del Balance de la Cuenta (Curva de Equity USD)</span>
            <span className="text-emerald-400 font-bold">
              Balance Inicial: ${equityCurve[0]?.equity.toLocaleString() || '10,000'} → Final: ${equityCurve[equityCurve.length - 1]?.equity.toLocaleString() || '10,000'}
            </span>
          </div>

          <div className="h-56 w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityCurve} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#equityGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
