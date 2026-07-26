import { useState, useEffect } from 'react';
import { api } from '../api';
import { Bot, Zap, Play, CheckCircle2 } from 'lucide-react';
import type { LabExperimentItem } from '../types';

const SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'GBPJPY'];
const TIMEFRAMES = ['M15', 'H1', 'H4'];
const ANALYSTS = ['Quant-bb', 'Trend-Aligner', 'RSI-Divergence', 'ICT-Engine', 'News-Sentiment'];

export default function LabTab() {
  const [experiments, setExperiments] = useState<LabExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analystName, setAnalystName] = useState('Quant-bb');
  const [symbol, setSymbol] = useState('EURUSD');
  const [timeframe, setTimeframe] = useState('M15');
  const [days, setDays] = useState(15);
  const [runningHypothesis, setRunningHypothesis] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchExperiments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.lab.getExperiments();
      setExperiments(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleRunHypothesis = async () => {
    setRunningHypothesis(true);
    setMessage('');
    setError('');
    try {
      const res = await api.lab.runHypothesis({
        analyst_name: analystName,
        symbol,
        timeframe,
        days,
      });
      setMessage(`Experimento completado exitosamente: "${res.experiment.experiment_name}"`);
      fetchExperiments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningHypothesis(false);
    }
  };

  const handleRunAutoAgent = async () => {
    setRunningAgent(true);
    setMessage('');
    setError('');
    try {
      const res = await api.lab.runAutoAgent();
      setMessage(res.message || 'Ciclo de investigación autónoma iniciado por el agente IA.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningAgent(false);
    }
  };

  const handleApplyParams = async (expId: number) => {
    setApplyingId(expId);
    setMessage('');
    setError('');
    try {
      await api.lab.applyExperiment(expId);
      setMessage('Parámetros aplicados al analista activo correctamente.');
      fetchExperiments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Laboratorio de Investigación & Hipótesis de IA</h1>
          <p className="text-sm text-gray-500">Pruebas autónomas de optimización de parámetros e investigación cuantitativa</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAutoAgent}
            disabled={runningAgent}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors border border-indigo-500/30"
          >
            <Bot className="w-4 h-4" />
            {runningAgent ? 'Iniciando Agente...' : '🤖 Auto-Investigador (5 Analistas)'}
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

      {/* Config Form Card */}
      <div className="glass p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Configurar Nueva Hipótesis de Investigación</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Analista a Investigar</label>
            <select
              value={analystName}
              onChange={(e) => setAnalystName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              {ANALYSTS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Par / Activo</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Temporalidad</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-cyan-500/50"
            >
              {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Días de Historia</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min={5} max={365}
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div>
            <button
              onClick={handleRunHypothesis}
              disabled={runningHypothesis}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-cyan-500 text-black hover:bg-cyan-400 transition-colors flex items-center justify-center gap-1.5"
            >
              {runningHypothesis ? (
                <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              Iniciar Investigación
            </button>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="glass p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Historial de Experimentos e Hipótesis Probadas</h3>
        {loading ? (
          <div className="text-center py-10 text-xs text-gray-500">Cargando experimentos...</div>
        ) : experiments.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">No hay experimentos registrados aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Experimento / Hipótesis</th>
                  <th className="px-3 py-2">Analista</th>
                  <th className="px-3 py-2">Activo / TF</th>
                  <th className="px-3 py-2">Parámetros Ganadores</th>
                  <th className="px-3 py-2">Trades</th>
                  <th className="px-3 py-2">Win Rate</th>
                  <th className="px-3 py-2">P&L (%)</th>
                  <th className="px-3 py-2">Sharpe</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp) => (
                  <tr key={exp.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(exp.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 font-medium text-white max-w-[200px] truncate" title={exp.experiment_name}>
                      {exp.experiment_name}
                    </td>
                    <td className="px-3 py-3 text-cyan-400 font-mono">{exp.analyst_name}</td>
                    <td className="px-3 py-3 text-gray-300 font-mono">{exp.symbol} {exp.timeframe}</td>
                    <td className="px-3 py-3 text-gray-400 font-mono text-[10px]">
                      {JSON.stringify(exp.params_tested)}
                    </td>
                    <td className="px-3 py-3 text-gray-300">{exp.total_trades}</td>
                    <td className="px-3 py-3 text-cyan-300 font-semibold">{exp.win_rate}%</td>
                    <td className={`px-3 py-3 font-semibold ${exp.net_profit_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {exp.net_profit_pct >= 0 ? '+' : ''}{exp.net_profit_pct}% (${exp.net_profit_usd})
                    </td>
                    <td className="px-3 py-3 text-gray-300">{exp.sharpe_ratio}</td>
                    <td className="px-3 py-3 text-right">
                      {exp.status === 'APPLIED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Aplicado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyParams(exp.id)}
                          disabled={applyingId === exp.id}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-[10px] font-medium border border-cyan-500/30 transition-colors"
                        >
                          {applyingId === exp.id ? 'Aplicando...' : 'Aplicar Parámetros'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
