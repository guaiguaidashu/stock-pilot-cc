"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "首页" },
  { href: "/hot", label: "热门股票" },
  { href: "/watchlist", label: "自选股" },
  { href: "/indices", label: "大盘走势" },
  { href: "/strategy", label: "策略管理" },
  { href: "/backtest", label: "回测分析" },
  { href: "/simulation", label: "模拟交易" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-1 px-4 h-12 max-w-7xl mx-auto">
        <span className="text-[var(--accent)] font-bold text-lg mr-4">StockPilot</span>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              pathname === item.href
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--foreground)] hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}