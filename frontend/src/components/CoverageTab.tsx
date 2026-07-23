import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { RefreshCw } from 'lucide-react';
import type { CoverageItem } from '../types';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es', { year: '2-digit', month: 'numeric', day: 'numeric' });
}

function formatNum(n: number): string {
  return n.toLocaleString('es');
}

const TF_ORDER = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export default function CoverageTab() {
  const [items, setItems] = useState<CoverageItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.market.coverage();
      setItems(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const tfs = [...new Set(items.map((i) => i.timeframe))]
    .sort((a, b) => TF_ORDER.indexOf(a) - TF_ORDER.indexOf(b));

  const symbols = [...new Set(items.map((i) => i.symbol))].sort();

  const map: Record<string, CoverageItem> = {};
  items.forEach((i) => { map[`${i.symbol}_${i.timeframe}`] = i; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Cobertura de Datos Históricos</h1>
          <p className="text-sm text-gray-500">Rango de velas disponibles por par y temporalidad</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse-dot" /> Activo (&lt;10 min)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-yellow-600" /> Sin actualizar
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-700" /> Sin datos
        </span>
      </div>

      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider sticky left-0 bg-surface-card">Par</th>
                {tfs.map((tf) => (
                  <th key={tf} className="text-center px-3 py-3 text-[11px] text-gray-500 font-medium uppercase tracking-wider">{tf}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {symbols.map((sym) => (
                <tr key={sym} className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white font-semibold text-xs sticky left-0 bg-surface-card">{sym}</td>
                  {tfs.map((tf) => {
                    const item = map[`${sym}_${tf}`];
                    if (!item) {
                      return (
                        <td key={tf} className="px-3 py-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                            <span className="text-[10px] text-gray-600">Sin datos</span>
                          </div>
                        </td>
                      );
                    }
                    const staleMin = item.staleness_minutes;
                    const staleText = staleMin !== null
                      ? (staleMin < 60 ? `${Math.round(staleMin)}m` : `${Math.round(staleMin / 60)}h`)
                      : '';
                    return (
                      <td key={tf} className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_fresh ? 'bg-green animate-pulse-dot' : 'bg-yellow-600'}`} />
                          <span className="text-[11px] text-white font-mono">{formatNum(item.candle_count)}</span>
                          <span className="text-[9px] text-gray-600">{formatDate(item.min_date)}</span>
                          <span className="text-[9px] text-green/70">{formatDate(item.max_date)}{staleText && ` · ${staleText}`}</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
