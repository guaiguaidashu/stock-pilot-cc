"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getHotStocks } from "@/lib/api";
import { API_BASE } from "@/lib/api";

interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  turnover: number;
}

type TabType = "gainers" | "losers" | "sectors";

const SECTORS = [
  { name: "银行", change: 1.23 },
  { name: "白酒", change: -0.87 },
  { name: "新能源", change: 3.45 },
  { name: "半导体", change: 2.11 },
  { name: "医药", change: -1.54 },
  { name: "房地产", change: 0.67 },
  { name: "军工", change: 4.21 },
  { name: "消费", change: -0.32 },
];

export default function HotStocksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("gainers");
  const [stocks, setStocks] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHotStocks(20)
      .then(setStocks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sortedStocks = [...stocks].sort((a, b) => {
    if (activeTab === "gainers") return b.changePercent - a.changePercent;
    return a.changePercent - b.changePercent;
  });

  async function addToWatchlist(stock: StockQuote, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock_code: stock.code,
          stock_name: stock.name,
          group_name: "默认",
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      alert(`已添加 ${stock.name} 到自选股`);
    } catch {
      alert("添加失败，请重试");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--accent)] mb-4">热门股票</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            {(["gainers", "losers", "sectors"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--card)] text-[var(--foreground)] hover:bg-white/5"
                }`}
              >
                {tab === "gainers" ? "涨幅榜" : tab === "losers" ? "跌幅榜" : "板块轮动"}
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === "sectors" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SECTORS.map((sector) => (
                <div
                  key={sector.name}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
                >
                  <div className="text-sm text-[var(--foreground)]/60 mb-1">{sector.name}</div>
                  <div
                    className="text-lg font-bold"
                    style={{ color: sector.change >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {sector.change >= 0 ? "+" : ""}
                    {sector.change}%
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="text-center py-20 text-[var(--foreground)]/60">加载中...</div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm text-[var(--foreground)]/60">
                <span>股票</span>
                <span className="text-right">现价</span>
                <span className="text-right">涨跌</span>
                <span className="text-right">涨跌幅</span>
                <span className="text-right">成交量</span>
                <span className="text-right">操作</span>
              </div>

              {/* Stock Rows */}
              {sortedStocks.map((stock) => (
                <div
                  key={stock.code}
                  className="grid grid-cols-6 gap-4 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors items-center"
                >
                  <Link href={`/stock/${stock.code}`}>
                    <div className="font-medium text-[var(--foreground)]">{stock.name}</div>
                    <div className="text-xs text-[var(--foreground)]/60">{stock.code}</div>
                  </Link>
                  <span className="text-right font-medium">{stock.price}</span>
                  <span
                    className="text-right"
                    style={{ color: stock.change >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change}
                  </span>
                  <span
                    className="text-right font-medium"
                    style={{ color: stock.changePercent >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent}%
                  </span>
                  <span className="text-right text-[var(--foreground)]/60">
                    {(stock.volume / 10000).toFixed(0)}万
                  </span>
                  <button
                    onClick={(e) => addToWatchlist(stock, e)}
                    className="text-right text-sm text-[var(--accent)] hover:underline"
                  >
                    + 自选
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}