import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { RefreshCw, Shield, Activity, Award, CheckCircle2, Sliders } from 'lucide-react';
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

  // Calculate live consensus metrics
  const buySignalsCount = analysts.filter(a => a.last_signal === 'BUY').length;
  const sellSignalsCount = analysts.filter(a => a.last_signal === 'SELL').length;
  const totalActive = analysts.length || 5;
  const consensusPct = Math.round(((buySignalsCount - sellSignalsCount) / totalActive) * 50 + 50);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Comité de Analistas IA</h1>
          <p className="text-sm text-slate-400">Estado en tiempo real y gobernanza del comité multi-agente de trading</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Estado
          </button>
        </div>
      </div>

      {/* Consensus Meter Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Termómetro de Consenso Global del Comité</h3>
              <p className="text-xs text-slate-400">Ponderación en vivo entre los 5 analistas especializados</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold">
            <span className="text-emerald-400 flex items-center gap-1">▲ BUY ({buySignalsCount})</span>
            <span className="text-rose-400 flex items-center gap-1">▼ SELL ({sellSignalsCount})</span>
            <span className="text-slate-400">NEUTRAL ({totalActive - buySignalsCount - sellSignalsCount})</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-yellow-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${consensusPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
          <span>0% STRONG SELL</span>
          <span className="text-cyan-400 font-bold">50% NEUTRAL</span>
          <span>100% STRONG BUY</span>
        </div>
      </div>

      {/* Analyst Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {analysts.map((a) => {
          const isBuy = a.last_signal === 'BUY';
          const isSell = a.last_signal === 'SELL';
          return (
            <div
              key={a.name}
              className={`bg-slate-900/90 border rounded-xl p-4 transition-all duration-300 hover:border-slate-600 shadow-lg ${
                a.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`flex items-center gap-1.5 text-[11px] font-bold ${a.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${a.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  {a.is_active ? 'ONLINE' : 'STANDBY'}
                </span>
                <span className="font-mono text-xs text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Score: {a.score !== null ? a.score : '—'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-cyan-400" />
                {a.name}
              </h3>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed min-h-[32px]">{a.description}</p>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-500 text-[10px]">
                  {a.last_signal_time ? relativeTime(a.last_signal_time) : 'Sin señal'}
                  {a.last_symbol && ` · ${a.last_symbol}`}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                  isBuy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  isSell ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {(a.last_signal || 'WAIT').toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Decisions Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Mesa de Decisiones del Orquestador CEO
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">CEO Engine</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90">
                  <th className="text-left px-4 py-3 text-[11px] text-slate-400 font-semibold uppercase">Hora</th>
                  <th className="text-left px-4 py-3 text-[11px] text-slate-400 font-semibold uppercase">Par / TF</th>
                  <th className="text-left px-4 py-3 text-[11px] text-slate-400 font-semibold uppercase">Decisión</th>
                  <th className="text-left px-4 py-3 text-[11px] text-slate-400 font-semibold uppercase">Consenso</th>
                  <th className="text-left px-4 py-3 text-[11px] text-slate-400 font-semibold uppercase">Razonamiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {decisions.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-xs font-mono">Sin decisiones registradas aún en el sistema.</td></tr>
                ) : (
                  decisions.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono whitespace-nowrap">
                        {new Date(d.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-white font-bold text-xs">{d.symbol} <span className="text-slate-400 font-normal">{d.timeframe}</span></td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.recommendation === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          d.recommendation === 'SELL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {d.recommendation}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-cyan-400 font-mono text-xs font-bold">{d.consensus_score ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">{d.reasoning || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signals Feed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Feed en Vivo de Señales de Analistas
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">5 Especialistas</span>
          </div>
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {signals.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-500 text-xs font-mono">Sin señales activas registradas.</div>
            ) : (
              signals.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/40 text-xs transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(s.time).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-white font-bold">{s.analyst_name}</span>
                    <span className="text-slate-400">{s.symbol} <span className="text-slate-500">{s.timeframe}</span></span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    s.raw_signal === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                    s.raw_signal === 'SELL' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {s.raw_signal}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
