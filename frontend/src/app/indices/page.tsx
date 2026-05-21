"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import * as echarts from "echarts";
import { getIndexQuotes, getIndexKLine } from "@/lib/api";

const INDICES = [
  { code: "000300", name: "沪深300" },
  { code: "000001", name: "上证指数" },
  { code: "399006", name: "创业板指" },
  { code: "399001", name: "深证成指" },
];

interface IndexQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const upColor = "#e53e3e";
const downColor = "#38a169";

export default function IndicesPage() {
  const [activeIndex, setActiveIndex] = useState(INDICES[0]);
  const [quotes, setQuotes] = useState<IndexQuote[]>([]);
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingKLine, setLoadingKLine] = useState(false);
  const klineRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const klineChartRef = useRef<echarts.ECharts | null>(null);
  const volumeChartRef = useRef<echarts.ECharts | null>(null);

  // 初始化图表（只执行一次）
  useEffect(() => {
    if (!klineRef.current || !volumeRef.current) return;
    klineChartRef.current = echarts.init(klineRef.current);
    volumeChartRef.current = echarts.init(volumeRef.current);

    const handleResize = () => {
      klineChartRef.current?.resize();
      volumeChartRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      klineChartRef.current?.dispose();
      volumeChartRef.current?.dispose();
    };
  }, []);

  // 加载指数行情
  useEffect(() => {
    async function loadQuotes() {
      setLoadingQuotes(true);
      try {
        const data = await getIndexQuotes();
        setQuotes(Array.isArray(data) ? data : []);
      } catch {
        setQuotes([]);
      } finally {
        setLoadingQuotes(false);
      }
    }
    loadQuotes();
  }, []);

  // 加载 K 线数据
  useEffect(() => {
    async function loadKLine() {
      setLoadingKLine(true);
      try {
        const data = await getIndexKLine(activeIndex.code);
        setKlineData(data);
      } catch {
        setKlineData([]);
      } finally {
        setLoadingKLine(false);
      }
    }
    loadKLine();
  }, [activeIndex]);

  const renderCharts = useCallback((data: KLineData[]) => {
    if (!data.length || !klineChartRef.current || !volumeChartRef.current) return;

    const dates = data.map((d) => d.date);
    const kData = data.map((d) => [d.open, d.close, d.low, d.high]);
    const ma5 = calculateMA(data, 5);
    const ma10 = calculateMA(data, 10);
    const ma20 = calculateMA(data, 20);
    const volumes = data.map((d) => ({
      value: d.volume,
      itemStyle: { color: d.close >= d.open ? upColor : downColor },
    }));

    klineChartRef.current.setOption({
      tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
      grid: { left: 60, right: 20, top: 10, bottom: 40 },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: "#1e1e2e" } },
        axisLabel: { color: "#888", fontSize: 10 },
      },
      yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: "#1e1e2e" } },
        splitLine: { lineStyle: { color: "#1e1e2e", type: "dashed" } },
        axisLabel: { color: "#888" },
      },
      series: [
        { name: "K线", type: "candlestick", data: kData, itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor } },
        { name: "MA5", type: "line", data: ma5, smooth: true, lineStyle: { color: "#ffffff", width: 1 }, symbol: "none" },
        { name: "MA10", type: "line", data: ma10, smooth: true, lineStyle: { color: "#d69e2e", width: 1 }, symbol: "none" },
        { name: "MA20", type: "line", data: ma20, smooth: true, lineStyle: { color: "#9f7aea", width: 1 }, symbol: "none" },
      ],
    });

    volumeChartRef.current.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 5, bottom: 30 },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: "#1e1e2e" } },
        axisLabel: { color: "#888", fontSize: 10 },
      },
      yAxis: {
        scale: true,
        axisLine: { lineStyle: { color: "#1e1e2e" } },
        splitLine: { show: false },
        axisLabel: { color: "#888", fontSize: 10 },
      },
      series: [{ name: "成交量", type: "bar", data: volumes }],
    });
  }, []);

  useEffect(() => {
    if (klineData.length > 0) {
      renderCharts(klineData);
    }
  }, [klineData, renderCharts]);

  const activeQuote = quotes.find((q) => q.code === activeIndex.code);

  function calculateMA(data: KLineData[], period: number): (number | null)[] {
    return data.map((_, idx) => {
      if (idx < period - 1) return null;
      const sum = data.slice(idx - period + 1, idx + 1).reduce((acc, d) => acc + d.close, 0);
      return sum / period;
    });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[var(--accent)] mb-4">大盘走势</h1>

          {/* 指数选择器 */}
          <div className="flex gap-2 mb-4">
            {INDICES.map((idx) => (
              <button
                key={idx.code}
                onClick={() => setActiveIndex(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeIndex.code === idx.code
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "bg-[var(--card)] text-[var(--foreground)] hover:bg-white/5 border border-[var(--border)]"
                }`}
              >
                {idx.name}
              </button>
            ))}
          </div>

          {/* 当前指数行情 */}
          <div className="mb-4 flex items-center gap-6">
            {loadingQuotes ? (
              <div className="text-lg text-[var(--foreground)]/60">加载中...</div>
            ) : activeQuote ? (
              <>
                <div className="text-2xl font-bold">{activeQuote.price.toFixed(2)}</div>
                <div
                  className="text-lg font-medium"
                  style={{ color: activeQuote.change >= 0 ? "var(--green)" : "var(--red)" }}
                >
                  {activeQuote.change >= 0 ? "+" : ""}
                  {activeQuote.change.toFixed(2)} ({activeQuote.changePercent.toFixed(2)}%)
                </div>
              </>
            ) : (
              <div className="text-lg text-[var(--foreground)]/60">{activeIndex.name}</div>
            )}
          </div>

          {/* K 线图 */}
          <div className="grid grid-rows-2 gap-2" style={{ height: "calc(100vh - 320px)" }}>
            {loadingKLine ? (
              <div className="w-full flex items-center justify-center bg-[var(--card)] rounded-lg">
                <div className="text-[var(--foreground)]/60">加载中...</div>
              </div>
            ) : (
              <>
                <div ref={klineRef} className="w-full" />
                <div ref={volumeRef} className="w-full" />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}