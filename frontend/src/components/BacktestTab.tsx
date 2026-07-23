import { useState } from 'react';
import { api } from '../api';
import { Play, BarChart3 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import type { BacktestResponse, EquityPoint } from '../types';

const SYMBOLS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'GBPJPY', 'EURCAD', 'XAUUSD', 'XAGUSD',
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

const COLORS = {
  positive: '#10b981',
  negative: '#ef4444',
  accent: '#06b6d4',
  muted: '#6b7280',
};

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400">{label}</p>
      <p className="text-white font-mono font-semibold">${formatNum(payload[0].value)}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="glass p-4">
      <div className="text-lg font-bold font-mono" style={{ color: color || COLORS.accent }}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function TradesTable({ trades }: { trades: BacktestResponse['trades'] }) {
  return (
    <div className="glass overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">
          Últimas {Math.min(trades.length, 50)} Operaciones
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {['Entrada', 'Salida', 'Dir.', 'P. Entrada', 'P. Salida', 'Lotes', 'P&L', 'Resultado'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((t, i) => (
              <tr key={i} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(t.entry_time).toLocaleDateString('es', { month: 'short', day: 'numeric' })}{' '}
                  {new Date(t.entry_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(t.exit_time).toLocaleDateString('es', { month: 'short', day: 'numeric' })}{' '}
                  {new Date(t.exit_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <span className={`signal-badge ${t.direction}`}>{t.direction}</span>
                </td>
                <td className="px-4 py-3 text-white text-xs font-mono">{t.entry_price}</td>
                <td className="px-4 py-3 text-white text-xs font-mono">{t.exit_price}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{t.size}</td>
                <td className={`px-4 py-3 text-xs font-semibold font-mono ${t.pnl >= 0 ? 'text-green' : 'text-red'}`}>
                  {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold ${t.result === 'TP' ? 'text-green' : 'text-red'}`}>
                    {t.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BacktestTab() {
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [days, setDays] = useState(15);
  const [balance, setBalance] = useState(10000);
  const [risk, setRisk] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState('');

  const handleRun = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.backtest.run({ symbol, timeframe, days, balance, risk });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;
  const trades = result?.trades || [];

  const chartData = result?.equity_curve?.map((p: EquityPoint) => ({
    time: new Date(p.time).toLocaleDateString('es', { month: 'short', day: 'numeric' }),
    equity: p.equity,
  })) || [];

  const isPositive = s?.net_profit ? s.net_profit >= 0 : true;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white">Laboratorio de Backtesting</h1>
        <p className="text-sm text-gray-500">Simula el comité de analistas en datos históricos reales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass p-5 space-y-4 lg:col-span-1">
          <h3 className="text-sm font-semibold text-white">Parámetros de Simulación</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Par / Activo</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
            >
              {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Temporalidad</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
            >
              {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Días de historia</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={5} max={365}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Capital inicial ($)</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              min={100}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Riesgo por operación (%)</label>
            <input
              type="number"
              value={risk}
              onChange={(e) => setRisk(Number(e.target.value))}
              min={0.1} max={5} step={0.1}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="btn-accent w-full"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Ejecutar Simulación
          </button>

          {loading && (
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              Simulando el comité...
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="glass p-5 text-red text-sm border border-red/20">
              Error: {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="glass p-12 flex flex-col items-center justify-center text-gray-600">
              <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Configura los parámetros y ejecuta la simulación para ver los resultados.</p>
            </div>
          )}

          {result && s && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Retorno Neto"
                  value={`${isPositive ? '+' : ''}${s.net_profit_pct.toFixed(2)}%`}
                  color={isPositive ? COLORS.positive : COLORS.negative}
                />
                <StatCard
                  label={`P&L Neto · ${s.symbol} ${s.timeframe}`}
                  value={`${isPositive ? '+' : ''}$${formatNum(Math.abs(s.net_profit))}`}
                  color={isPositive ? COLORS.positive : COLORS.negative}
                />
                <StatCard
                  label={`Win Rate · ${s.win_count}W / ${s.loss_count}L`}
                  value={`${s.win_rate}%`}
                  color={COLORS.accent}
                />
                <StatCard
                  label="Profit Factor"
                  value={s.profit_factor !== null ? String(s.profit_factor) : 'N/A'}
                  color={COLORS.accent}
                />
                <StatCard
                  label="Sharpe Ratio"
                  value={String(s.sharpe_ratio)}
                  color={COLORS.accent}
                />
                <StatCard
                  label="Max Drawdown"
                  value={`${s.max_drawdown_pct}%`}
                  color="#f59e0b"
                />
                <StatCard
                  label="Total Operaciones"
                  value={String(s.total_trades)}
                  color={COLORS.muted}
                />
                <StatCard
                  label="Balance Final"
                  value={`$${formatNum(s.final_balance)}`}
                  color={COLORS.accent}
                />
              </div>

              <div className="glass p-5">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Curva de Equity — {s.symbol} {s.timeframe} ({s.days} días)
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={isPositive ? COLORS.positive : COLORS.negative} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={isPositive ? COLORS.positive : COLORS.negative} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        minTickGap={40}
                      />
                      <YAxis
                        domain={['dataMin - 50', 'dataMax + 50']}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: number) => `$${(v).toLocaleString()}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="equity"
                        stroke={isPositive ? COLORS.positive : COLORS.negative}
                        strokeWidth={2}
                        fill="url(#equityGrad)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {trades.length > 0 && <TradesTable trades={trades} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
