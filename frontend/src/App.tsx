import { useState, useEffect, useCallback } from 'react';
import { api } from './api';
import type { UserResponse, TickerItem } from './types';
import AuthModal from './components/AuthModal';
import TickerBar from './components/TickerBar';
import Header from './components/Header';
import CommitteeTab from './components/CommitteeTab';
import CoverageTab from './components/CoverageTab';
import BacktestTab from './components/BacktestTab';

type Tab = 'committee' | 'coverage' | 'backtest';

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
    { key: 'coverage', label: 'Cobertura de Datos' },
    { key: 'backtest', label: 'Laboratorio Backtest' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TickerBar items={ticker} />
      <Header user={user} onLogout={handleLogout} />

      <nav className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                tab === t.key
                  ? 'text-accent-light'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {tab === 'committee' && <CommitteeTab />}
        {tab === 'coverage' && <CoverageTab />}
        {tab === 'backtest' && <BacktestTab />}
      </main>
    </div>
  );
}
