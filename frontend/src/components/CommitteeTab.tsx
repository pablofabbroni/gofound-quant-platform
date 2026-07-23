import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, Users } from 'lucide-react';
import type { Analyst, Decision, Signal } from '../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min}m`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.round(hrs / 24)}d`;
}

function formatNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return Number(n).toLocaleString('es');
}

const SIGNAL_ICONS: Record<string, typeof TrendingUp> = {
  BUY: TrendingUp,
  SELL: TrendingDown,
  VETO: AlertTriangle,
};

export default function CommitteeTab() {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      api.committee.status().then((r) => setAnalysts(r.data)).catch(() => {}),
      api.committee.decisions().then((r) => setDecisions(r.data)).catch(() => {}),
      api.committee.signals().then((r) => setSignals(r.data)).catch(() => {}),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const signalColor = (s: string | null) => {
    switch (s) {
      case 'BUY': return 'text-green';
      case 'SELL': return 'text-red';
      case 'VETO': return 'text-yellow-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Comité de Analistas</h1>
          <p className="text-sm text-gray-500">Estado en tiempo real de cada especialista del comité de IA</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {analysts.map((a) => {
          const Icon = a.last_signal ? SIGNAL_ICONS[a.last_signal] : Users;
          return (
            <div
              key={a.name}
              className={`glass p-4 transition-all duration-300 ${
                a.is_active ? 'ring-1 ring-accent/20' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`flex items-center gap-1.5 text-[11px] font-medium ${a.is_active ? 'text-green' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-green animate-pulse-dot' : 'bg-gray-600'}`} />
                  {a.is_active ? 'ACTIVO' : 'SIN SEÑAL'}
                </span>
                <span className="font-mono text-xs text-accent-light">{a.score !== null ? a.score : '—'}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{a.name}</h3>
              <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{a.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {a.last_signal_time ? relativeTime(a.last_signal_time) : 'Sin señal'}
                  {a.last_symbol && ` · ${a.last_symbol} ${a.last_timeframe || ''}`}
                </span>
                <span className={`signal-badge ${a.last_signal || 'wait'}`}>
                  {(a.last_signal || '—').toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Mesa de Decisiones</h3>
            <span className="badge-accent">Orquestador CEO</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Hora</th>
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Par</th>
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">TF</th>
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Decisión</th>
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Score</th>
                  <th className="text-left px-5 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">Razonamiento</th>
                </tr>
              </thead>
              <tbody>
                {decisions.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-600 text-sm">Sin decisiones registradas aún.</td></tr>
                ) : (
                  decisions.map((d, i) => (
                    <tr key={i} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(d.time).toLocaleDateString('es', { month: 'short', day: 'numeric' })}{' '}
                        {new Date(d.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 text-white font-semibold text-xs">{d.symbol}</td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{d.timeframe}</td>
                      <td className="px-5 py-3">
                        <span className={`signal-badge ${d.recommendation}`}>{d.recommendation}</span>
                      </td>
                      <td className="px-5 py-3 text-accent-light text-xs">{d.consensus_score ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px] truncate">{d.reasoning || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white">Feed de Señales</h3>
            <span className="badge-accent">Todos los analistas</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {signals.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">Sin señales activas registradas.</div>
            ) : (
              signals.map((s, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-2.5 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] text-xs">
                  <span className="text-gray-600 w-14 shrink-0">
                    {new Date(s.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-white font-medium w-28 shrink-0">{s.analyst_name}</span>
                  <span className="text-gray-400 w-20 shrink-0">{s.symbol} {s.timeframe}</span>
                  <span className={`signal-badge ${s.raw_signal} ml-auto`}>{s.raw_signal}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
