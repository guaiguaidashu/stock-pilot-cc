"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getWatchlist, addToWatchlist as apiAddToWatchlist, removeFromWatchlist as apiRemoveFromWatchlist, searchStock } from "@/lib/api";
import type { WatchlistItem } from "@/lib/api";

interface SearchResult {
  code: string;
  name: string;
  market: string;
  alreadyAdded?: boolean;
}

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载自选股
  async function loadWatchlist() {
    try {
      const data = await getWatchlist();
      setWatchlist(Array.isArray(data) ? data : []);
    } catch {
      setWatchlist([]);
    }
  }

  useEffect(() => {
    loadWatchlist();
  }, []);

  // 搜索股票（防抖 300ms）
  const handleSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      const data = await searchStock(keyword);
      const addedCodes = new Set(watchlist.map((w) => w.stock_code));
      const resultsWithAdded = data.map((s: SearchResult) => ({
        ...s,
        alreadyAdded: addedCodes.has(s.code),
      }));
      setSearchResults(resultsWithAdded.slice(0, 6));
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [watchlist]);

  // 输入处理（分离显示值和搜索触发）
  function onInputChange(value: string) {
    setInputValue(value);
    setIsSearching(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(value), 300);
  }

  // 添加自选
  async function addToWatchlist(stock: SearchResult & { alreadyAdded?: boolean }) {
    // 检查是否已存在（前端防重）
    if (watchlist.some((w) => w.stock_code === stock.code)) {
      alert("该股票已在自选列表中");
      return;
    }
    try {
      await apiAddToWatchlist(stock.code, stock.name, "默认");
      setShowSearch(false);
      setInputValue("");
      setSearchResults([]);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      loadWatchlist();
    } catch {
      alert("添加失败，请重试");
    }
  }

  // 删除自选
  async function removeFromWatchlist(id: number) {
    try {
      await apiRemoveFromWatchlist(id);
      loadWatchlist();
    } catch {
      alert("删除失败，请重试");
    }
  }

  // 格式化日期
  function formatDate(dateStr: string) {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("zh-CN");
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--accent)]">自选股管理</h1>
          <button
            onClick={() => setShowSearch(true)}
            className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + 添加股票
          </button>
        </div>

        {/* 自选股列表 */}
        {watchlist.length === 0 ? (
          <div className="text-center py-20 text-[var(--foreground)]/60">
            <p className="mb-2">暂无自选股</p>
            <button
              onClick={() => setShowSearch(true)}
              className="text-[var(--accent)] underline text-sm"
            >
              添加第一只股票
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm text-[var(--foreground)]/60">
              <span>股票</span>
              <span className="text-right">分组</span>
              <span className="text-right col-span-2">添加日期</span>
              <span className="text-right">操作</span>
            </div>
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-6 gap-4 px-4 py-3 items-center rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors"
              >
                <Link
                  href={`/stock/${item.stock_code}`}
                  className="hover:text-[var(--accent)] transition-colors"
                >
                  <div className="font-medium text-[var(--foreground)]">{item.stock_name}</div>
                  <div className="text-xs text-[var(--foreground)]/60">{item.stock_code}</div>
                </Link>
                <span className="text-right text-sm text-[var(--foreground)]/60">
                  {item.group_name}
                </span>
                <span className="text-right text-sm text-[var(--foreground)]/60 col-span-2">
                  {formatDate(item.created_at)}
                </span>
                <button
                  onClick={() => removeFromWatchlist(item.id)}
                  className="text-right text-sm hover:underline"
                  style={{ color: "var(--red)" }}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 搜索弹窗 */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div
              ref={searchRef}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md mx-4 overflow-hidden"
            >
              <div className="p-4 border-b border-[var(--border)]">
                <input
                  autoFocus
                  type="text"
                  placeholder="搜索股票代码或名称..."
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div className="max-h-80 overflow-y-auto">
                {isSearching && inputValue && (
                  <div className="p-4 text-center text-[var(--foreground)]/60 text-sm">
                    搜索中...
                  </div>
                )}
                {!isSearching && searchResults.length === 0 && inputValue && (
                  <div className="p-4 text-center text-[var(--foreground)]/60 text-sm">
                    未找到相关股票
                  </div>
                )}
                {searchResults.map((result) => (
                  <button
                    key={result.code}
                    onClick={() => addToWatchlist(result)}
                    disabled={result.alreadyAdded}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors border-b border-[var(--border)] last:border-0 ${
                      result.alreadyAdded
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-medium text-[var(--foreground)]">{result.name}</div>
                      <div className="text-xs text-[var(--foreground)]/60">{result.code} · {result.market}</div>
                    </div>
                    <span className="text-sm" style={{ color: result.alreadyAdded ? 'var(--foreground)/40' : 'var(--accent)' }}>
                      {result.alreadyAdded ? '已添加' : '+ 添加'}
                    </span>
                  </button>
                ))}
                {!inputValue && (
                  <div className="p-4 text-center text-[var(--foreground)]/60 text-sm">
                    输入股票代码或名称搜索
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-[var(--border)]">
                <button
                  onClick={() => { setShowSearch(false); setInputValue(""); setSearchResults([]); if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }}
                  className="w-full py-2 text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
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