import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { TradeOperation, OperationsSummary } from '../types';

export const OperationsTab: React.FC = () => {
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [operations, setOperations] = useState<TradeOperation[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [selectedOp, setSelectedOp] = useState<TradeOperation | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, listRes] = await Promise.all([
        api.operations.getSummary(),
        api.operations.getList(filter),
      ]);
      setSummary(sumRes.summary);
      setOperations(listRes.data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos de operaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await api.operations.seedDemo();
      await fetchData();
    } catch (err: any) {
      alert('Error al inicializar datos demostrativos: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const formatPrice = (val: number | null) => (val !== null && val !== undefined ? val.toFixed(4) : '—');
  const formatMoney = (val: number) => (val >= 0 ? `+$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── HEADER DE SECCIÓN ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--panel-bg, #1a1e29)',
          padding: '16px 24px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>
            📊 Telemetría de Operaciones & Rendimiento PnL
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#a0aec0' }}>
            Monitoreo en tiempo real de órdenes ejecutadas por el Comité de IA (Gemini 3.6 Flash + Algoritmos Quant)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(245, 101, 101, 0.15)',
            border: '1px solid #f56565',
            color: '#feb2b2',
            padding: '12px 16px',
            borderRadius: '8px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* ── TARJETAS DE KPIS PRINCIPALES ── */}
      {summary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {/* Win Rate */}
          <div
            style={{
              background: 'var(--panel-bg, #1a1e29)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '6px' }}>Win Rate (%)</div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: summary.win_rate >= 50 ? '#48bb78' : '#f56565',
              }}
            >
              {summary.win_rate}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
              {summary.win_count} Ganadas / {summary.loss_count} Perdidas
            </div>
          </div>

          {/* Profit Factor */}
          <div
            style={{
              background: 'var(--panel-bg, #1a1e29)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '6px' }}>Profit Factor</div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: summary.profit_factor >= 1.5 ? '#48bb78' : summary.profit_factor >= 1.0 ? '#ed8936' : '#f56565',
              }}
            >
              {summary.profit_factor}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
              Objetivo Cuantitativo: ≥ 1.50
            </div>
          </div>

          {/* Net PnL USD */}
          <div
            style={{
              background: 'var(--panel-bg, #1a1e29)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '6px' }}>PnL Neto Acumulado</div>
            <div
              style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: summary.net_profit_usd >= 0 ? '#48bb78' : '#f56565',
              }}
            >
              {formatMoney(summary.net_profit_usd)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
              {summary.net_profit_pct >= 0 ? `+${summary.net_profit_pct}%` : `${summary.net_profit_pct}%`} ({summary.total_pips} pips)
            </div>
          </div>

          {/* Total Operaciones */}
          <div
            style={{
              background: 'var(--panel-bg, #1a1e29)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '6px' }}>Operaciones Registradas</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#63b3ed' }}>
              {summary.total_trades}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
              {summary.open_trades} Abiertas | {summary.closed_trades} Cerradas
            </div>
          </div>

          {/* Max Drawdown */}
          <div
            style={{
              background: 'var(--panel-bg, #1a1e29)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '18px',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '6px' }}>Máximo Drawdown</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#e53e3e' }}>
              {summary.max_drawdown_pct}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
              Ratio Risk:Reward medio {summary.avg_risk_reward}
            </div>
          </div>
        </div>
      )}

      {/* ── FILTROS Y TABLA DE OPERACIONES ── */}
      <div
        style={{
          background: 'var(--panel-bg, #1a1e29)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#edf2f7' }}>Historial y Órdenes en Vivo</h3>
          
          {/* Botones de filtro */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '8px' }}>
            {[
              { id: 'ALL', label: 'Todas' },
              { id: 'OPEN', label: 'Abiertas' },
              { id: 'CLOSED_TP', label: 'Ganadas (TP)' },
              { id: 'CLOSED_SL', label: 'Perdidas (SL)' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  background: filter === f.id ? '#3182ce' : 'transparent',
                  color: filter === f.id ? '#fff' : '#a0aec0',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* TABLA */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>Cargando operaciones...</div>
        ) : operations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>
            No hay operaciones registradas para este filtro. Haz clic en "Simular Operación Demo".
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#a0aec0' }}>
                  <th style={{ padding: '12px' }}>Ticket</th>
                  <th style={{ padding: '12px' }}>Par / TF</th>
                  <th style={{ padding: '12px' }}>Tipo</th>
                  <th style={{ padding: '12px' }}>Entrada</th>
                  <th style={{ padding: '12px' }}>SL</th>
                  <th style={{ padding: '12px' }}>TP</th>
                  <th style={{ padding: '12px' }}>Lotes</th>
                  <th style={{ padding: '12px' }}>PnL ($ USD)</th>
                  <th style={{ padding: '12px' }}>Estado</th>
                  <th style={{ padding: '12px' }}>Detalles IA</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr
                    key={op.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#e2e8f0' }}>
                      {op.ticket_id}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 600, color: '#fff' }}>
                      {op.symbol} <span style={{ fontSize: '0.75rem', color: '#718096' }}>{op.timeframe}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          background: op.operation_type === 'BUY' ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)',
                          color: op.operation_type === 'BUY' ? '#68d391' : '#fc8181',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        {op.operation_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace' }}>{formatPrice(op.entry_price)}</td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#fc8181' }}>
                      {formatPrice(op.stop_loss)}
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: '#68d391' }}>
                      {formatPrice(op.take_profit)}
                    </td>
                    <td style={{ padding: '12px' }}>{op.lot_size}</td>
                    <td
                      style={{
                        padding: '12px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        color: op.pnl_usd > 0 ? '#48bb78' : op.pnl_usd < 0 ? '#f56565' : '#a0aec0',
                      }}
                    >
                      {formatMoney(op.pnl_usd)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          background:
                            op.status === 'OPEN'
                              ? 'rgba(66, 153, 225, 0.2)'
                              : op.status === 'CLOSED_TP'
                              ? 'rgba(72, 187, 120, 0.2)'
                              : 'rgba(245, 101, 101, 0.2)',
                          color:
                            op.status === 'OPEN'
                              ? '#63b3ed'
                              : op.status === 'CLOSED_TP'
                              ? '#48bb78'
                              : '#f56565',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        {op.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => setSelectedOp(op)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          color: '#63b3ed',
                          border: '1px solid rgba(99, 179, 237, 0.3)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        🧠 Ver Razonamiento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL DETALLE DE RAZONAMIENTO GEMINI ── */}
      {selectedOp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#1a1e29',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '550px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: '#fff' }}>
              🤖 Justificación IA: {selectedOp.symbol} ({selectedOp.operation_type})
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <strong style={{ color: '#a0aec0', fontSize: '0.85rem' }}>Consenso del Comité:</strong>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px', color: '#48bb78', marginTop: '4px' }}>
                {selectedOp.committee_consensus || 'Validado por el Comité'}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#a0aec0', fontSize: '0.85rem' }}>Dictamen y Riesgo (Gemini 3.6 Flash):</strong>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', color: '#e2e8f0', marginTop: '4px', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {selectedOp.ai_reasoning || 'Operación validada por ausencia de veto macroeconómico.'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setSelectedOp(null)}
                style={{
                  background: '#3182ce',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
