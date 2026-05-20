"use client";

import { useEffect, useRef, useState } from "react";
import * as echarts from "echarts";

interface KLineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Props {
  data: KLineData[];
}

export default function KLineChart({ data }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const dates = data.map((d) => d.date);
    const kData = data.map((d) => [d.open, d.close, d.low, d.high]);
    const volumes = data.map((d) => d.volume);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      axisPointer: {
        link: [{ xAxisIndex: [0, 1] }],
      },
      grid: [
        { left: 60, right: 20, top: 20, height: "60%" },
        { left: 60, right: 20, top: "75%", height: "15%" },
      ],
      xAxis: [
        {
          type: "category",
          data: dates,
          gridIndex: 0,
          axisLine: { lineStyle: { color: "#1e1e2e" } },
          axisLabel: { show: false },
        },
        {
          type: "category",
          data: dates,
          gridIndex: 1,
          axisLine: { lineStyle: { color: "#1e1e2e" } },
        },
      ],
      yAxis: [
        {
          scale: true,
          gridIndex: 0,
          axisLine: { lineStyle: { color: "#1e1e2e" } },
          splitLine: { lineStyle: { color: "#1e1e2e", type: "dashed" } },
        },
        {
          scale: true,
          gridIndex: 1,
          axisLine: { lineStyle: { color: "#1e1e2e" } },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: "K线",
          type: "candlestick",
          data: kData,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: "#e53e3e",
            color0: "#38a169",
            borderColor: "#e53e3e",
            borderColor0: "#38a169",
          },
        },
        {
          name: "成交量",
          type: "bar",
          data: volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
          itemStyle: { color: "#38a169" },
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartInstance.current?.dispose();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full h-full" />;
}