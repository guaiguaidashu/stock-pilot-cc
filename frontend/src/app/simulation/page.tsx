"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { getSimulationPositions, getSimulationSignals } from "@/lib/api";
import type { Position, Signal } from "@/lib/api";

export default function SimulationPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [posData, sigData] = await Promise.all([
          getSimulationPositions(),
          getSimulationSignals(),
        ]);
        setPositions(Array.isArray(posData) ? posData : []);
        setSignals(Array.isArray(sigData) ? sigData : []);
      } catch {
        setPositions([]);
        setSignals([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 计算汇总
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.current_price * p.shares, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.avg_cost * p.shares, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--accent)] mb-4">模拟交易</h1>

          {loading ? (
            <div className="text-center py-20 text-[var(--foreground)]/60">加载中...</div>
          ) : (
            <>
              {/* 汇总面板 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "总持仓市值", value: `¥${totalValue.toFixed(2)}`, color: "var(--foreground)" },
                  { label: "总盈亏", value: `${totalPnL >= 0 ? "+" : ""}¥${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? "var(--green)" : "var(--red)" },
                  { label: "持仓盈亏率", value: `${totalCost > 0 ? ((totalValue - totalCost) / totalCost * 100).toFixed(2) : 0}%`, color: totalValue >= totalCost ? "var(--green)" : "var(--red)" },
                  { label: "持仓股票数", value: positions.length.toString(), color: "var(--accent)" },
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
                    <div className="text-xs text-[var(--foreground)]/60 mb-1">{stat.label}</div>
                    <div className="text-xl font-bold" style={{ color: stat.color as string }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 策略信号 */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <h2 className="text-base font-semibold mb-4 text-[var(--foreground)]">策略信号</h2>
                  {signals.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground)]/60 text-sm">暂无信号</div>
                  ) : (
                    <div className="space-y-2">
                      {signals.map((signal) => (
                        <div
                          key={signal.code}
                          className="flex items-center justify-between p-3 rounded border border-[var(--border)]"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/stock/${signal.code}`}
                                className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                              >
                                {signal.name}
                              </Link>
                              <span
                                className={`px-2 py-0.5 text-xs rounded ${
                                  signal.signal === "买入"
                                    ? "bg-[var(--green)]/20 text-[var(--green)]"
                                    : "bg-[var(--red)]/20 text-[var(--red)]"
                                }`}
                              >
                                {signal.signal}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--foreground)]/60 mt-1">
                              {signal.reason} · ¥{signal.price}
                            </div>
                          </div>
                          <div className="text-xs text-[var(--foreground)]/60">{signal.code}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 模拟持仓 */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                  <h2 className="text-base font-semibold mb-4 text-[var(--foreground)]">模拟持仓</h2>
                  {positions.length === 0 ? (
                    <div className="text-center py-8 text-[var(--foreground)]/60 text-sm">暂无持仓</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2 text-xs text-[var(--foreground)]/60 px-2 mb-1">
                        <span>股票</span>
                        <span className="text-right">持仓</span>
                        <span className="text-right">均价</span>
                        <span className="text-right">现价</span>
                        <span className="text-right">盈亏</span>
                      </div>
                      {positions.map((pos) => (
                        <Link
                          key={pos.code}
                          href={`/stock/${pos.code}`}
                          className="grid grid-cols-5 gap-2 items-center p-2 rounded hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-sm text-[var(--foreground)]">{pos.name}</div>
                            <div className="text-xs text-[var(--foreground)]/60">{pos.code}</div>
                          </div>
                          <span className="text-right text-sm">{pos.shares}</span>
                          <span className="text-right text-sm">¥{pos.avg_cost.toFixed(2)}</span>
                          <span className="text-right text-sm">¥{pos.current_price.toFixed(2)}</span>
                          <span
                            className="text-right text-sm font-medium"
                            style={{ color: pos.pnl >= 0 ? "var(--green)" : "var(--red)" }}
                          >
                            {pos.pnl >= 0 ? "+" : ""}
                            {pos.pnl.toFixed(0)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}