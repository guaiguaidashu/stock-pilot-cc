"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { getStrategies, createStrategy, updateStrategy } from "@/lib/api";
import type { Strategy, StrategyRule } from "@/lib/api";

const INDICATORS = [
  { value: "MA5", label: "MA5" },
  { value: "MA10", label: "MA10" },
  { value: "MA20", label: "MA20" },
  { value: "MACD", label: "MACD" },
  { value: "DIF", label: "DIF" },
  { value: "DEA", label: "DEA" },
  { value: "volume", label: "成交量" },
  { value: "change_percent", label: "涨跌幅" },
];

const OPERATORS = [
  { value: "cross_above", label: "上穿" },
  { value: "cross_below", label: "下穿" },
  { value: "gt", label: "大于" },
  { value: "lt", label: "小于" },
  { value: "eq", label: "等于" },
];

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: [{ indicator: "MA5", operator: "cross_above", value: "MA10" }],
  });

  // 加载策略列表
  useEffect(() => {
    async function loadStrategies() {
      try {
        const data = await getStrategies();
        setStrategies(Array.isArray(data) ? data : []);
      } catch {
        setStrategies([]);
      }
    }
    loadStrategies();
  }, []);

  // 打开新建
  function handleNew() {
    setEditingStrategy(null);
    setFormData({
      name: "",
      description: "",
      rules: [{ indicator: "MA5", operator: "cross_above", value: "MA10" }],
    });
    setShowEditor(true);
  }

  // 打开编辑
  function handleEdit(strategy: Strategy) {
    setEditingStrategy(strategy);
    setFormData({
      name: strategy.name,
      description: strategy.description,
      rules: strategy.rules,
    });
    setShowEditor(true);
  }

  // 添加规则
  function addRule() {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, { indicator: "MA5", operator: "gt", value: "0" }],
    }));
  }

  // 删除规则
  function removeRule(index: number) {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  }

  // 更新规则
  function updateRule(index: number, field: keyof StrategyRule, value: string) {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  }

  // 保存
  async function handleSave() {
    try {
      if (editingStrategy) {
        await updateStrategy(editingStrategy.id, formData);
      } else {
        await createStrategy(formData);
      }
      setShowEditor(false);
      // 重新加载
      const data = await getStrategies();
      setStrategies(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  }

  // 运行回测
  async function handleBacktest(strategy: Strategy) {
    window.location.href = `/backtest?strategy_id=${strategy.id}`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--accent)]">策略管理</h1>
          <button
            onClick={handleNew}
            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + 新建策略
          </button>
        </div>

        {/* 策略列表 */}
        {strategies.length === 0 ? (
          <div className="text-center py-20 text-[var(--foreground)]/60">
            <p className="mb-2">暂无策略</p>
            <button onClick={handleNew} className="text-[var(--accent)] underline text-sm">
              创建第一个策略
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{strategy.name}</h3>
                    <p className="text-sm text-[var(--foreground)]/60 mt-1">
                      {strategy.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBacktest(strategy)}
                      className="px-3 py-1 text-xs bg-[var(--accent)] text-[var(--accent-foreground)] rounded hover:opacity-90"
                    >
                      回测
                    </button>
                    <button
                      onClick={() => handleEdit(strategy)}
                      className="px-3 py-1 text-xs border border-[var(--border)] rounded hover:bg-white/5"
                    >
                      编辑
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {strategy.rules.map((rule, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-xs bg-white/5 rounded text-[var(--foreground)]/80"
                    >
                      {rule.indicator} {rule.operator.replace("_", "")} {rule.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 编辑弹窗 */}
        {showEditor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-lg mx-4">
              <div className="p-4 border-b border-[var(--border)]">
                <h2 className="text-lg font-semibold">
                  {editingStrategy ? "编辑策略" : "新建策略"}
                </h2>
              </div>
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm text-[var(--foreground)]/60 mb-1">
                    策略名称
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="例如：均线金叉策略"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--foreground)]/60 mb-1">
                    描述
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="简要描述策略逻辑"
                    className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-[var(--foreground)]/60">规则</label>
                    <button
                      onClick={addRule}
                      className="text-sm text-[var(--accent)] hover:underline"
                    >
                      + 添加条件
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.rules.map((rule, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={rule.indicator}
                          onChange={(e) => updateRule(i, "indicator", e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
                        >
                          {INDICATORS.map((ind) => (
                            <option key={ind.value} value={ind.value}>
                              {ind.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={rule.operator}
                          onChange={(e) => updateRule(i, "operator", e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
                        >
                          {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(i, "value", e.target.value)}
                          placeholder="值"
                          className="w-20 px-2 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded text-sm text-[var(--foreground)]"
                        />
                        {formData.rules.length > 1 && (
                          <button
                            onClick={() => removeRule(i)}
                            className="text-sm text-[var(--red)] hover:underline"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-[var(--border)] flex gap-3">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg text-sm font-medium hover:opacity-90"
                >
                  保存
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="flex-1 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-white/5"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}