import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import type { UserResponse, TickerItem } from './types';
import AuthModal from './components/AuthModal';
import TickerBar from './components/TickerBar';
import Header from './components/Header';
import CommitteeTab from './components/CommitteeTab';
import CoverageTab from './components/CoverageTab';
import BacktestTab from './components/BacktestTab';
import ParametersTab from './components/ParametersTab';
import LabTab from './components/LabTab';
import { OperationsTab } from './components/OperationsTab';

type Tab = 'committee' | 'operations' | 'coverage' | 'backtest' | 'parameters' | 'lab';

export default function App() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [tab, setTab] = useState<Tab>('committee');
  const [ticker, setTicker] = useState<TickerItem[]>([]);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await api.market.ticker();
      setTicker(res.data);
    } catch { /* ticker is non-critical */ }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('gfq_token');
    if (token) {
      api.auth.me()
        .then((u) => { setUser(u); setShowAuth(false); })
        .catch(() => { localStorage.removeItem('gfq_token'); setShowAuth(true); });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchTicker();
    const interval = setInterval(fetchTicker, 30000);
    return () => clearInterval(interval);
  }, [user, fetchTicker]);

  const handleAuthSuccess = (u: UserResponse) => {
    setUser(u);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('gfq_token');
    setUser(null);
    setShowAuth(true);
  };

  if (!user) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'committee', label: 'Comité de Analistas' },
    { key: 'operations', label: '📊 Operaciones & PnL' },
    { key: 'coverage', label: 'Cobertura de Datos' },
    { key: 'backtest', label: 'Laboratorio Backtest' },
    { key: 'parameters', label: 'Parámetros de Analistas' },
    { key: 'lab', label: 'Laboratorio de IA' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TickerBar items={ticker} />
      <Header user={user} onLogout={handleLogout} />

      <nav className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                tab === t.key
                  ? 'text-cyan-400 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {tab === 'committee' && <CommitteeTab />}
        {tab === 'operations' && <OperationsTab />}
        {tab === 'coverage' && <CoverageTab />}
        {tab === 'backtest' && <BacktestTab />}
        {tab === 'parameters' && <ParametersTab />}
        {tab === 'lab' && <LabTab />}
      </main>
    </div>
  );
}
