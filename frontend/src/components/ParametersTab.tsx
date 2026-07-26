import { useState, useEffect } from 'react';
import { api } from '../api';
import { RefreshCw, Save, RotateCcw } from 'lucide-react';
import type { AnalystParamItem } from '../types';

export default function ParametersTab() {
  const [paramsGrouped, setParamsGrouped] = useState<Record<string, AnalystParamItem[]>>({});
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [savingAnalyst, setSavingAnalyst] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchParams = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.analysts.getParams();
      setParamsGrouped(res.data);
      const initial: Record<string, Record<string, string>> = {};
      for (const [aname, items] of Object.entries(res.data)) {
        initial[aname] = {};
        for (const item of items) {
          initial[aname][item.param_key] = item.param_value;
        }
      }
      setFormData(initial);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const handleChange = (aname: string, key: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [aname]: {
        ...(prev[aname] || {}),
        [key]: val,
      },
    }));
  };

  const handleSave = async (aname: string) => {
    setSavingAnalyst(aname);
    setMessage('');
    setError('');
    try {
      const parameters = formData[aname] || {};
      await api.analysts.updateParams({ analyst_name: aname, parameters });
      setMessage(`Parámetros de ${aname} actualizados correctamente.`);
      fetchParams();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingAnalyst(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('¿Restablecer todos los parámetros de analistas a los valores de fábrica?')) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.analysts.resetParams();
      setMessage('Parámetros restablecidos a valores de fábrica.');
      fetchParams();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Parámetros de Analistas de IA</h1>
          <p className="text-sm text-gray-500">Configura manualmente o permite que los agentes de IA auto-optimicen las reglas operativas</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            API REST & AI Agent Ready
          </span>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] transition-colors border border-white/[0.08]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Fábrica
          </button>
        </div>
      </div>

      {message && (
        <div className="glass p-4 text-emerald-400 text-sm border border-emerald-500/20">
          {message}
        </div>
      )}

      {error && (
        <div className="glass p-4 text-red-400 text-sm border border-red-500/20">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="glass p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(paramsGrouped).map(([aname, items]) => (
            <div key={aname} className="glass p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
                  <h3 className="text-sm font-semibold text-white">{aname}</h3>
                  <span className="text-[10px] text-gray-500">{items.length} parámetros</span>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.param_key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <label className="text-gray-400 font-mono">{item.param_key}</label>
                        <span className="text-[10px] text-gray-500" title={item.description}>
                          {item.description}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData[aname]?.[item.param_key] ?? item.param_value}
                        onChange={(e) => handleChange(aname, item.param_key, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  {items[0]?.updated_at ? `Act. ${new Date(items[0].updated_at).toLocaleDateString()}` : 'Por defecto'}
                </span>
                <button
                  onClick={() => handleSave(aname)}
                  disabled={savingAnalyst === aname}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-colors border border-cyan-500/30"
                >
                  {savingAnalyst === aname ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
