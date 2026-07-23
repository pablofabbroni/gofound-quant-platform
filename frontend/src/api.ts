import type {
  TokenResponse,
  UserResponse,
  TickerResponse,
  CommitteeStatusResponse,
  DecisionsResponse,
  SignalsResponse,
  CoverageResponse,
  BacktestRequest,
  BacktestResponse,
  LoginRequest,
  RegisterRequest,
} from './types';

const BASE = '';

function getToken(): string | null {
  return localStorage.getItem('gfq_token');
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(body.detail || `Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  auth: {
    login: (data: LoginRequest) =>
      request<TokenResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: RegisterRequest) =>
      request<TokenResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<UserResponse>('/api/auth/me'),
  },
  market: {
    ticker: () => request<TickerResponse>('/api/market/ticker'),
    coverage: () => request<CoverageResponse>('/api/market/coverage'),
  },
  committee: {
    status: () => request<CommitteeStatusResponse>('/api/committee/status'),
    decisions: (limit = 50) =>
      request<DecisionsResponse>(`/api/committee/decisions?limit=${limit}`),
    signals: (limit = 80) =>
      request<SignalsResponse>(`/api/committee/signals?limit=${limit}`),
  },
  backtest: {
    run: (data: BacktestRequest) =>
      request<BacktestResponse>('/api/backtest/run', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
