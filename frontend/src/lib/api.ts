export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
}

export interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  code: string;
  name: string;
  market: string;
}

export interface IndexQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getStockQuote(code: string): Promise<StockQuote> {
  return fetchJSON(`${API_BASE}/stock/quote?code=${code}`);
}

export async function getStockKLine(
  code: string,
  period: string = "daily",
  adjust: string = "qfq"
): Promise<KLineData[]> {
  return fetchJSON(
    `${API_BASE}/stock/kline?code=${code}&period=${period}&adjust=${adjust}`
  );
}

export async function searchStock(keyword: string): Promise<StockSearchResult[]> {
  return fetchJSON(`${API_BASE}/stock/search?keyword=${encodeURIComponent(keyword)}`);
}

export async function getHotStocks(limit: number = 20): Promise<StockQuote[]> {
  return fetchJSON(`${API_BASE}/stock/hot?limit=${limit}`);
}

export async function getIndexQuotes(): Promise<IndexQuote[]> {
  return fetchJSON(`${API_BASE}/index/quotes`);
}

export async function getIndexKLine(
  code: string,
  period: string = "daily"
): Promise<KLineData[]> {
  return fetchJSON(`${API_BASE}/index/kline?code=${code}&period=${period}`);
}

// Watchlist
export interface WatchlistItem {
  id: number;
  stock_code: string;
  stock_name: string;
  group_name: string;
  created_at: string;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  return fetchJSON(`${API_BASE}/watchlist`);
}

export async function addToWatchlist(
  stockCode: string,
  stockName: string,
  groupName: string = "默认"
): Promise<void> {
  await fetchJSON(`${API_BASE}/watchlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock_code: stockCode, stock_name: stockName, group_name: groupName }),
  });
}

export async function removeFromWatchlist(id: number): Promise<void> {
  await fetchJSON(`${API_BASE}/watchlist/${id}`, { method: "DELETE" });
}

// Strategy
export interface StrategyRule {
  indicator: string;
  operator: string;
  value: string;
}

export interface Strategy {
  id: number;
  name: string;
  description: string;
  rules: StrategyRule[];
}

export async function getStrategies(): Promise<Strategy[]> {
  return fetchJSON(`${API_BASE}/strategy`);
}

export async function createStrategy(data: {
  name: string;
  description: string;
  rules: StrategyRule[];
}): Promise<Strategy> {
  return fetchJSON(`${API_BASE}/strategy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateStrategy(
  id: number,
  data: { name: string; description: string; rules: StrategyRule[] }
): Promise<Strategy> {
  return fetchJSON(`${API_BASE}/strategy/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

// Backtest
export interface BacktestParams {
  strategy_id: string;
  start_date: string;
  end_date: string;
  stock_codes: string;
}

export interface BacktestResult {
  total_return: number;
  annual_return: number;
  sharpe_ratio: number;
  max_drawdown: number;
  win_rate: number;
  trades: number;
  equity_curve: number[];
}

export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  return fetchJSON(`${API_BASE}/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

// Simulation
export interface Position {
  code: string;
  name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
}

export interface Signal {
  code: string;
  name: string;
  signal: "买入" | "卖出";
  reason: string;
  price: number;
}

export async function getSimulationPositions(): Promise<Position[]> {
  return fetchJSON(`${API_BASE}/simulation/positions`);
}

export async function getSimulationSignals(): Promise<Signal[]> {
  return fetchJSON(`${API_BASE}/simulation/signals`);
}