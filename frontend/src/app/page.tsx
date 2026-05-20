import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--accent)] mb-2">欢迎使用 StockPilot</h1>
          <p className="text-[var(--foreground)]/60">个人股票复盘工作站</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NavCard
            href="/hot"
            title="热门股票"
            desc="查看涨跌幅排行、板块轮动"
          />
          <NavCard
            href="/watchlist"
            title="自选股管理"
            desc="搜索添加、自选列表管理"
          />
          <NavCard
            href="/indices"
            title="大盘走势"
            desc="主要指数 K 线查看"
          />
          <NavCard
            href="/strategy"
            title="策略管理"
            desc="创建、编辑选股策略"
          />
          <NavCard
            href="/backtest"
            title="回测分析"
            desc="验证策略历史表现"
          />
          <NavCard
            href="/simulation"
            title="模拟交易"
            desc="策略信号、模拟持仓"
          />
        </div>
      </main>
    </div>
  );
}

function NavCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] transition-colors"
    >
      <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--foreground)]/60">{desc}</p>
    </a>
  );
}