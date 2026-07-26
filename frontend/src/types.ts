export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  email: string;
  full_name: string;
  role: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface TickerItem {
  symbol: string;
  asset_class: string;
  current_price: number | null;
  change_pct_24h: number | null;
  last_update: string | null;
}

export interface TickerResponse {
  data: TickerItem[];
  timestamp: string;
}

export interface Analyst {
  name: string;
  description: string;
  is_active: boolean;
  last_signal: string | null;
  score: number | null;
  last_signal_time: string | null;
  last_symbol: string | null;
  last_timeframe: string | null;
}

export interface CommitteeStatusResponse {
  data: Analyst[];
}

export interface Decision {
  time: string;
  symbol: string;
  timeframe: string;
  recommendation: string;
  consensus_score: number | null;
  reasoning: string | null;
}

export interface DecisionsResponse {
  data: Decision[];
}

export interface Signal {
  time: string;
  analyst_name: string;
  symbol: string;
  timeframe: string;
  raw_signal: string;
  score: number | null;
}

export interface SignalsResponse {
  data: Signal[];
}

export interface CoverageItem {
  symbol: string;
  asset_class: string;
  timeframe: string;
  tf_seconds: number;
  min_date: string | null;
  max_date: string | null;
  candle_count: number;
  staleness_minutes: number | null;
  is_fresh: boolean;
}

export interface CoverageResponse {
  data: CoverageItem[];
}

export interface BacktestRequest {
  symbol: string;
  timeframe: string;
  days: number;
  balance: number;
  risk: number;
  selected_analysts?: string[];
}

export interface BacktestSummary {
  symbol: string;
  timeframe: string;
  days: number;
  selected_analysts?: string[];
  initial_balance: number;
  final_balance: number;
  net_profit: number;
  net_profit_pct: number;
  total_trades: number;
  win_count: number;
  loss_count: number;
  win_rate: number;
  profit_factor: number | null;
  sharpe_ratio: number;
  max_drawdown_pct: number;
}

export interface BacktestTrade {
  entry_time: string;
  exit_time: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  size: number;
  pnl: number;
  result: string;
}

export interface EquityPoint {
  time: string;
  equity: number;
}

export interface BacktestResponse {
  summary: BacktestSummary;
  trades: BacktestTrade[];
  equity_curve: EquityPoint[];
}

export interface AnalystParamItem {
  id?: number;
  param_key: string;
  param_value: string;
  description: string;
  updated_at?: string;
}

export interface AnalystParamsResponse {
  data: Record<string, AnalystParamItem[]>;
}

export interface UpdateAnalystParamsRequest {
  analyst_name: string;
  parameters: Record<string, string>;
}

export interface LabExperimentItem {
  id: number;
  experiment_name: string;
  symbol: string;
  timeframe: string;
  analyst_name: string;
  params_tested: Record<string, string>;
  days: number;
  total_trades: number;
  win_rate: number;
  net_profit_pct: number;
  net_profit_usd: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  status: string;
  created_at: string;
}

export interface LabExperimentsResponse {
  data: LabExperimentItem[];
}

export interface RunHypothesisRequest {
  experiment_name?: string;
  analyst_name: string;
  symbol: string;
  timeframe: string;
  days: number;
  param_variations?: Record<string, string>[];
}
