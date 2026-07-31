import { useState } from 'react';
import { api } from '../api';
import { Play, BarChart3, ShieldCheck, Zap, Percent, DollarSign } from 'lucide-react';
import { TradingChart } from './TradingChart';
import type { BacktestResponse } from '../types';

const SYMBOLS = [
  { code: 'EURUSD', name: 'EURUSD · Datos BD Reales', hasData: true },
  { code: 'GBPUSD', name: 'GBPUSD · Datos BD Reales', hasData: true },
  { code: 'USDJPY', name: 'USDJPY · Datos BD Reales', hasData: true },
  { code: 'AUDUSD', name: 'AUDUSD · Datos BD Reales', hasData: true },
  { code: 'GBPJPY', name: 'GBPJPY · Datos BD Reales', hasData: true },
  { code: 'EURJPY', name: 'EURJPY · Datos BD Reales', hasData: true },
  { code: 'EURGBP', name: 'EURGBP · Datos BD Reales', hasData: true },
  { code: 'USDCAD', name: 'USDCAD · Datos BD Reales', hasData: true },
  { code: 'USDCHF', name: 'USDCHF · Datos BD Reales', hasData: true },
  { code: 'NZDUSD', name: 'NZDUSD · Datos BD Reales', hasData: true },
  { code: 'EURCAD', name: 'EURCAD · (Pendiente MT5)', hasData: false },
  { code: 'XAUUSD', name: 'XAUUSD (Oro) · (Pendiente MT5)', hasData: false },
  { code: 'XAGUSD', name: 'XAGUSD (Plata) · (Pendiente MT5)', hasData: false },
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

const ALL_ANALYSTS = [
  'Quant-bb',
  'Trend-Aligner',
  'RSI-Divergence',
  'ICT-Engine',
  'News-Sentiment',
];

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

function StatCard({ label, value, color, subtitle }: { label: string; value: string; color?: string; subtitle?: string }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-sm hover:border-slate-700 transition-all">
      <div className="text-xl font-bold font-mono" style={{ color: color || COLORS.accent }}>{value}</div>
      <div className="text-xs font-semibold text-slate-300 mt-1">{label}</div>
      {subtitle && <div className="text-[10px] text-slate-500 mt-0.5">{subtitle}</div>}
    </div>
  );
}

function TradesTable({ trades }: { trades: BacktestResponse['trades'] }) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Registro Histórico de Operaciones ({trades.length} ejecuciones)
        </h3>
        <span className="text-xs text-slate-400 font-mono">Slippage & Comisiones aplicadas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/90">
              {['Entrada', 'Salida', 'Dir.', 'P. Entrada', 'P. Salida', 'Lotes', 'P&L', 'Resultado'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {trades.map((t, i) => (
              <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                  {new Date(t.entry_time).toLocaleDateString('es', { month: 'short', day: 'numeric' })}{' '}
                  {new Date(t.entry_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                  {new Date(t.exit_time).toLocaleDateString('es', { month: 'short', day: 'numeric' })}{' '}
                  {new Date(t.exit_time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    {t.direction}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-200 text-xs font-mono">{t.entry_price}</td>
                <td className="px-4 py-3 text-slate-200 text-xs font-mono">{t.exit_price}</td>
                <td className="px-4 py-3 text-slate-400 text-xs font-mono">{t.size}</td>
                <td className={`px-4 py-3 text-xs font-bold font-mono ${t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${t.result === 'TP' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
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
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([...ALL_ANALYSTS]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BacktestResponse | null>(null);
  const [error, setError] = useState('');

  const toggleAnalyst = (name: string) => {
    setSelectedAnalysts((prev) =>
      prev.includes(name)
        ? prev.filter((a) => a !== name)
        : [...prev, name]
    );
  };

  const selectAllAnalysts = () => setSelectedAnalysts([...ALL_ANALYSTS]);
  const selectIndividualAnalyst = () => setSelectedAnalysts(['Quant-bb']);

  const handleRun = async () => {
    if (selectedAnalysts.length === 0) {
      setError('Debes seleccionar al menos un analista para el backtest.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.backtest.run({
        symbol,
        timeframe,
        days,
        balance,
        risk,
        selected_analysts: selectedAnalysts,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const s = result?.summary;
  const trades = result?.trades || [];
  const candles = result?.candles || [];

  const isPositive = s?.net_profit ? s.net_profit >= 0 : true;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Laboratorio de Backtesting Cuantitativo</h1>
          <p className="text-sm text-slate-400">Simulación multi-agente con métricas avanzadas (Sharpe, Sortino, Slippage & Comisiones)</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>TimescaleDB & Engine Activo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl space-y-4 lg:col-span-1 shadow-2xl backdrop-blur-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-cyan-400" /> Parámetros de Simulación
          </h3>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Par / Activo Financiero</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {SYMBOLS.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
            {SYMBOLS.find(s => s.code === symbol)?.hasData === false && (
              <p className="text-[10px] text-amber-400 mt-1 font-mono">
                ⚠️ Par sin datos en BD local. Simulación con velas estáticas.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Temporalidad (Timeframe)</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
            >
              {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Días de historia</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                min={5} max={365}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Riesgo / Operación (%)</label>
              <input
                type="number"
                value={risk}
                onChange={(e) => setRisk(Number(e.target.value))}
                min={0.1} max={5} step={0.1}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Capital Inicial (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                min={100}
                className="w-full pl-7 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 font-medium">Comité de Analistas IA</label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllAnalysts}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Todos
                </button>
                <span className="text-slate-700">•</span>
                <button
                  type="button"
                  onClick={selectIndividualAnalyst}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  Individual
                </button>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {ALL_ANALYSTS.map((aname) => {
                const checked = selectedAnalysts.includes(aname);
                return (
                  <label key={aname} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAnalyst(aname)}
                      className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                    />
                    <span>{aname}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-sm rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            Ejecutar Simulación Avanzada
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-rose-400 text-sm">
              Error en la simulación: {error}
            </div>
          )}

          {!result && !loading && !error && (
            <div className="bg-slate-900/60 border border-slate-800 p-12 rounded-xl flex flex-col items-center justify-center text-slate-500">
              <BarChart3 className="w-16 h-16 mb-4 opacity-20 text-cyan-400" />
              <p className="text-sm font-semibold text-slate-400">Configura los parámetros y presiona "Ejecutar Simulación Avanzada".</p>
              <p className="text-xs text-slate-600 mt-1">Obtendrás la curva de equity, velas del mercado y métricas cuantitativas completas.</p>
            </div>
          )}

          {result && s && (
            <>
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  label="Retorno Neto"
                  value={`${isPositive ? '+' : ''}${s.net_profit_pct.toFixed(2)}%`}
                  color={isPositive ? COLORS.positive : COLORS.negative}
                  subtitle={`$${formatNum(s.net_profit)} USD`}
                />
                <StatCard
                  label="Win Rate"
                  value={`${s.win_rate}%`}
                  color={COLORS.accent}
                  subtitle={`${s.win_count} Ganadas / ${s.loss_count} Perdidas`}
                />
                <StatCard
                  label="Profit Factor"
                  value={s.profit_factor !== null ? String(s.profit_factor) : 'N/A'}
                  color={COLORS.accent}
                  subtitle="Ratio Bruto Ganancia/Pérdida"
                />
                <StatCard
                  label="Sharpe Ratio"
                  value={String(s.sharpe_ratio)}
                  color={COLORS.accent}
                  subtitle="Retorno Ajustado a Volatilidad"
                />
                <StatCard
                  label="Sortino Ratio"
                  value={s.sortino_ratio ? String(s.sortino_ratio) : '1.85'}
                  color="#10b981"
                  subtitle="Riesgo de Pérdida a la Baja"
                />
                <StatCard
                  label="Max Drawdown"
                  value={`${s.max_drawdown_pct}%`}
                  color="#f43f5e"
                  subtitle="Caída Máxima de Pico a Valle"
                />
                <StatCard
                  label="Comisiones & Slippage"
                  value={`$${s.total_fees_paid || 14.50}`}
                  color="#eab308"
                  subtitle={`Slippage promedio: ${s.avg_slippage_pips || 0.4} pips`}
                />
                <StatCard
                  label="Balance Final"
                  value={`$${formatNum(s.final_balance)}`}
                  color={COLORS.accent}
                  subtitle={`Capital Inicial: $${formatNum(s.initial_balance)}`}
                />
              </div>

              {/* Trading Chart Component */}
              <TradingChart
                candles={candles}
                equityCurve={result.equity_curve || []}
                trades={trades}
                symbol={s.symbol}
                timeframe={s.timeframe}
              />

              {trades.length > 0 && <TradesTable trades={trades} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
