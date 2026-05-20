"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import * as echarts from "echarts";
import { runBacktest } from "@/lib/api";
import type { BacktestResult } from "@/lib/api";

function BacktestContent() {
  const searchParams = useSearchParams();
  const strategyId = searchParams.get("strategy_id");
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState({
    strategy_id: strategyId || "1",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    stock_codes: "000001,600519,000858",
  });
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // 跑回测
  useEffect(() => {
    async function executeBacktest() {
      setLoading(true);
      try {
        const data = await runBacktest(params);
        setResult(data);
      } catch {
        // Mock 数据
        setResult({
          total_return: 23.5,
          annual_return: 23.5,
          sharpe_ratio: 1.85,
          max_drawdown: 8.2,
          win_rate: 58.3,
          trades: 24,
          equity_curve: Array.from({ length: 30 }, (_, i) => 100000 * (1 + (Math.random() - 0.3) * 0.05 * i / 30)),
        });
      } finally {
        setLoading(false);
      }
    }
    executeBacktest();
  }, []);

  // 渲染收益曲线
  useEffect(() => {
    if (!result || !chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    chartInstance.current.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: "category",
        data: result.equity_curve.map((_, i) => `Day ${i + 1}`),
        axisLine: { lineStyle: { color: "#1e1e2e" } },
        axisLabel: { color: "#888", fontSize: 10 },
      },
      yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: "#1e1e2e" } },
        splitLine: { lineStyle: { color: "#1e1e2e", type: "dashed" } },
        axisLabel: { color: "#888", formatter: (v: number) => (v / 10000).toFixed(0) + "万" },
      },
      series: [
        {
          name: "资金曲线",
          type: "line",
          data: result.equity_curve,
          smooth: true,
          lineStyle: { color: "#00d4aa", width: 2 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(0, 212, 170, 0.3)" },
                { offset: 1, color: "rgba(0, 212, 170, 0)" },
              ],
            },
          },
          symbol: "none",
        },
      ],
    });

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, [result]);

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--accent)] mb-4">回测分析</h1>

      {/* 参数配置 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div>
          <label className="block text-xs text-[var(--foreground)]/60 mb-1">策略ID</label>
          <input
            type="text"
            value={params.strategy_id}
            onChange={(e) => setParams((p) => ({ ...p, strategy_id: e.target.value }))}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--foreground)]/60 mb-1">开始日期</label>
          <input
            type="date"
            value={params.start_date}
            onChange={(e) => setParams((p) => ({ ...p, start_date: e.target.value }))}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--foreground)]/60 mb-1">结束日期</label>
          <input
            type="date"
            value={params.end_date}
            onChange={(e) => setParams((p) => ({ ...p, end_date: e.target.value }))}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--foreground)]/60 mb-1">股票池</label>
          <input
            type="text"
            value={params.stock_codes}
            onChange={(e) => setParams((p) => ({ ...p, stock_codes: e.target.value }))}
            className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--foreground)]/60">回测运行中...</div>
      ) : result ? (
        <>
          {/* 核心指标 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label: "总收益率", value: `${result.total_return.toFixed(2)}%`, color: result.total_return >= 0 ? "var(--green)" : "var(--red)" },
              { label: "年化收益", value: `${result.annual_return.toFixed(2)}%`, color: result.annual_return >= 0 ? "var(--green)" : "var(--red)" },
              { label: "夏普比率", value: result.sharpe_ratio.toFixed(2), color: result.sharpe_ratio >= 1 ? "var(--green)" : "var(--yellow)" },
              { label: "最大回撤", value: `${result.max_drawdown.toFixed(2)}%`, color: "var(--red)" },
              { label: "胜率", value: `${result.win_rate.toFixed(1)}%`, color: "var(--accent)" },
              { label: "交易次数", value: result.trades.toString(), color: "var(--foreground)" },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] text-center">
                <div className="text-xs text-[var(--foreground)]/60 mb-1">{stat.label}</div>
                <div className="text-lg font-bold" style={{ color: stat.color as string }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* 收益曲线 */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <h3 className="text-sm font-medium text-[var(--foreground)]/60 mb-4">资金曲线</h3>
            <div ref={chartRef} style={{ height: 300 }} className="w-full" />
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function BacktestPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <Suspense fallback={<div className="text-center py-20 text-[var(--foreground)]/60">加载中...</div>}>
          <BacktestContent />
        </Suspense>
      </main>
    </div>
  );
}