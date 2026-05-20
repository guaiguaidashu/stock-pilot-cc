"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import * as echarts from "echarts";
import { getStockKLine, getStockQuote } from "@/lib/api";

interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  turnoverRate?: number;
}

function calculateMA(data: KLineData[], period: number): (number | null)[] {
  return data.map((_, idx) => {
    if (idx < period - 1) return null;
    const sum = data.slice(idx - period + 1, idx + 1).reduce((acc, d) => acc + d.close, 0);
    return sum / period;
  });
}

function calculateMACD(data: KLineData[]) {
  const closes = data.map((d) => d.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const dif = ema12.map((v, i) => (v !== null && ema26[i] !== null ? v - ema26[i] : null));
  const deaValues = dif.filter((v): v is number => v !== null);
  const dea = calculateEMA(deaValues, 9);
  const macd = dif.map((v, i) => {
    const deaVal = dea[i % dea.length];
    return v !== null && deaVal !== null ? (v - deaVal) * 2 : null;
  });
  return { dif, dea, macd };
}

function calculateEMA(data: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const ema: (number | null)[] = [];
  let prevEma = data[0];
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema.push(data[0]);
    } else {
      const val = data[i] * k + prevEma * (1 - k);
      ema.push(val);
      prevEma = val;
    }
  }
  return ema;
}

export default function StockDetailPage() {
  const params = useParams();
  const code = params.code as string;
  const klineRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const klineChartRef = useRef<echarts.ECharts | null>(null);
  const macdChartRef = useRef<echarts.ECharts | null>(null);
  const volumeChartRef = useRef<echarts.ECharts | null>(null);
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [quote, setQuote] = useState({ code, name: code, price: 0, change: 0, changePercent: 0 });
  const [selectedKLine, setSelectedKLine] = useState<KLineData | null>(null);
  const [maValues, setMaValues] = useState<{ ma5: number | null; ma10: number | null; ma20: number | null; ma60: number | null }>({ ma5: null, ma10: null, ma20: null, ma60: null });

  const renderCharts = useCallback((data: KLineData[]) => {
    if (!data.length || !klineChartRef.current || !macdChartRef.current || !volumeChartRef.current) return;

    const dates = data.map((d) => d.date);
    const kData = data.map((d) => [d.open, d.close, d.low, d.high]);
    const ma5 = calculateMA(data, 5);
    const ma10 = calculateMA(data, 10);
    const ma20 = calculateMA(data, 20);
    const ma60 = calculateMA(data, 60);
    const { dif, dea, macd } = calculateMACD(data);

    // 默认显示最新一天的数据
    const lastIdx = data.length - 1;
    const lastData = data[lastIdx];
    const lastMA5 = ma5[lastIdx];
    const lastMA10 = ma10[lastIdx];
    const lastMA20 = ma20[lastIdx];
    const lastMA60 = ma60[lastIdx];
    setSelectedKLine(lastData);
    setMaValues({ ma5: lastMA5, ma10: lastMA10, ma20: lastMA20, ma60: lastMA60 });
    // 红涨绿跌（涨=红 color，跌=绿 color0）
    const upColor = "#e53e3e";
    const downColor = "#38a169";
    const volumes = data.map((d) => ({
      value: d.volume,
      itemStyle: { color: d.close >= d.open ? upColor : downColor },
    }));

    klineChartRef.current.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
        formatter: (params: any) => {
          if (!params || !params[0]) return "";
          const idx = params[0].dataIndex;
          const d = data[idx];
          const m5 = ma5[idx];
          const m10 = ma10[idx];
          const m20 = ma20[idx];
          const m60 = ma60[idx];
          setSelectedKLine(d);
          setMaValues({ ma5: m5, ma10: m10, ma20: m20, ma60: m60 });
          return `${d.date}<br/>开盘: ${d.open.toFixed(2)}<br/>收盘: ${d.close.toFixed(2)}<br/>最高: ${d.high.toFixed(2)}<br/>最低: ${d.low.toFixed(2)}<br/>成交量: ${(d.volume / 10000).toFixed(0)}万<br/>换手率: ${d.turnoverRate != null ? d.turnoverRate.toFixed(2) + "%" : "—"}`;
        },
      },
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
        { name: "MA60", type: "line", data: ma60, smooth: true, lineStyle: { color: "#00d4aa", width: 1 }, symbol: "none" },
      ],
    });

    macdChartRef.current.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 10, bottom: 30 },
      xAxis: { type: "category", data: dates, axisLine: { lineStyle: { color: "#1e1e2e" } }, axisLabel: { show: false } },
      yAxis: { axisLine: { lineStyle: { color: "#1e1e2e" } }, splitLine: { show: false }, axisLabel: { color: "#888", fontSize: 10 } },
      series: [
        { name: "DIF", type: "line", data: dif, smooth: true, lineStyle: { color: "#00d4aa", width: 1 }, symbol: "none" },
        { name: "DEA", type: "line", data: dea, smooth: true, lineStyle: { color: "#e53e3e", width: 1 }, symbol: "none" },
        { name: "MACD", type: "bar", data: macd, barWidth: 6, itemStyle: { color: (p: any) => p.data >= 0 ? upColor : downColor } },
      ],
    });

    volumeChartRef.current.setOption({
      tooltip: { trigger: "axis" },
      grid: { left: 60, right: 20, top: 5, bottom: 30 },
      xAxis: { type: "category", data: dates, axisLine: { lineStyle: { color: "#1e1e2e" } }, axisLabel: { color: "#888", fontSize: 10 } },
      yAxis: { scale: true, axisLine: { lineStyle: { color: "#1e1e2e" } }, splitLine: { show: false }, axisLabel: { color: "#888", fontSize: 10 } },
      series: [{ name: "成交量", type: "bar", data: volumes }],
    });
  }, []);

  // 初始化图表（只需一次）
  useEffect(() => {
    if (!klineRef.current || !macdRef.current || !volumeRef.current) return;
    klineChartRef.current = echarts.init(klineRef.current);
    macdChartRef.current = echarts.init(macdRef.current);
    volumeChartRef.current = echarts.init(volumeRef.current);

    const handleResize = () => {
      klineChartRef.current?.resize();
      macdChartRef.current?.resize();
      volumeChartRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      klineChartRef.current?.dispose();
      macdChartRef.current?.dispose();
      volumeChartRef.current?.dispose();
    };
  }, []);

  // 加载数据和渲染图表
  useEffect(() => {
    async function load() {
      try {
        const [kline, quoteData] = await Promise.all([
          getStockKLine(code),
          getStockQuote(code),
        ]);
        if (kline && kline.length > 0) {
          setKlineData(kline);
          setQuote(quoteData);
        }
      } catch (e) {
        console.error("Failed to load stock data:", e);
      }
    }
    load();
  }, [code]);

  useEffect(() => {
    if (klineData.length > 0) {
      renderCharts(klineData);
    }
  }, [klineData, renderCharts]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">{quote.name}</h1>
            <span className="text-sm text-[var(--foreground)]/60">{quote.code}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{quote.price > 0 ? quote.price.toFixed(2) : "—"}</div>
            <div className="text-sm" style={{ color: quote.change >= 0 ? "var(--green)" : "var(--red)" }}>
              {quote.change !== 0 ? `${quote.change >= 0 ? "+" : ""}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)` : "—"}
            </div>
          </div>
        </div>

        {/* 选中日期数据面板 */}
        {selectedKLine && (
          <div className="mb-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
            <div className="text-sm text-[var(--foreground)]/60 mb-2">{selectedKLine.date}</div>
            <div className="grid grid-cols-6 gap-4">
              <div>
                <div className="text-xs text-[var(--foreground)]/60">开盘</div>
                <div className="text-lg font-medium">{selectedKLine.open.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground)]/60">收盘</div>
                <div className="text-lg font-medium">{selectedKLine.close.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground)]/60">最高</div>
                <div className="text-lg font-medium text-[var(--red)]">{selectedKLine.high.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground)]/60">最低</div>
                <div className="text-lg font-medium text-[var(--green)]">{selectedKLine.low.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground)]/60">成交量</div>
                <div className="text-lg font-medium">{(selectedKLine.volume / 10000).toFixed(0)}万</div>
              </div>
              <div>
                <div className="text-xs text-[var(--foreground)]/60">换手率</div>
                <div className="text-lg font-medium">{selectedKLine.turnoverRate != null ? `${selectedKLine.turnoverRate.toFixed(2)}%` : "—"}</div>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-white"></span>
                <span className="text-[var(--foreground)]/60">MA5:</span>
                <span className="font-medium">{maValues.ma5 !== null ? maValues.ma5.toFixed(2) : "—"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ background: "#d69e2e" }}></span>
                <span className="text-[var(--foreground)]/60">MA10:</span>
                <span className="font-medium">{maValues.ma10 !== null ? maValues.ma10.toFixed(2) : "—"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ background: "#9f7aea" }}></span>
                <span className="text-[var(--foreground)]/60">MA20:</span>
                <span className="font-medium">{maValues.ma20 !== null ? maValues.ma20.toFixed(2) : "—"}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ background: "#00d4aa" }}></span>
                <span className="text-[var(--foreground)]/60">MA60:</span>
                <span className="font-medium">{maValues.ma60 !== null ? maValues.ma60.toFixed(2) : "—"}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-rows-3 gap-2" style={{ height: "calc(100vh - 380px)" }}>
          <div ref={klineRef} className="w-full" />
          <div ref={macdRef} className="w-full" />
          <div ref={volumeRef} className="w-full" />
        </div>
      </main>
    </div>
  );
}