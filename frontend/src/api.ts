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
  AnalystParamsResponse,
  UpdateAnalystParamsRequest,
  LabExperimentsResponse,
  RunHypothesisRequest,
  AutoAgentStatusResponse,
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
  analysts: {
    getParams: () => request<AnalystParamsResponse>('/api/analysts/parameters'),
    updateParams: (data: UpdateAnalystParamsRequest) =>
      request<{ status: string; analyst_name: string; updated: string[] }>(
        '/api/analysts/parameters',
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      ),
    resetParams: (analyst_name?: string) =>
      request<{ status: string; reset: string }>(
        '/api/analysts/parameters/reset',
        {
          method: 'POST',
          body: JSON.stringify({ analyst_name }),
        }
      ),
  },
  lab: {
    getExperiments: () => request<LabExperimentsResponse>('/api/lab/experiments'),
    runHypothesis: (data: RunHypothesisRequest) =>
      request<{ status: string; experiment: any }>(
        '/api/lab/experiments/run-hypothesis',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
    applyExperiment: (id: number) =>
      request<{ status: string; analyst_name: string; applied_params: any }>(
        `/api/lab/experiments/${id}/apply`,
        { method: 'POST' }
      ),
    getAgentStatus: () => request<AutoAgentStatusResponse>('/api/lab/agent/status'),
    runAutoAgent: () =>
      request<{ status: string; message: string }>(
        '/api/lab/agent/run-auto-research',
        { method: 'POST' }
      ),
  },
};
