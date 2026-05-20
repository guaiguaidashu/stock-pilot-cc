# StockPilot — 产品设计文档

**Version:** 1.0
**Last Updated:** 2026-05-19
**Status:** 需求确认，待开发

---

## 1. 产品定位

**一句话：** 个人股票复盘工作站，核心解决「策略回测 + AI 优化」的需求。

**目标用户：** 有一定经验的个人投资者，有明确的选股策略（技术指标驱动），需要一个工具来验证和优化策略。

---

## 2. 核心功能

### 2.1 热门股票 + 板块

| 功能 | 描述 |
|-----|------|
| 涨跌幅榜 | 展示沪深 A 股当日涨跌幅排行 |
| 板块轮动 | 按行业/概念分类，展示板块涨跌幅 |
| 点击跳转 | 点击任意股票 → 跳转 K 线详情页 |

### 2.2 自选股管理

| 功能 | 描述 |
|-----|------|
| 搜索添加 | 按股票代码/名称搜索，添加自选 |
| 自选列表 | 展示自选股当日行情（价格/涨跌幅） |
| 分类管理 | 支持分组（A股/港股/美股） |
| 点击跳转 | 点击 → K 线详情页 |

### 2.3 大盘走势

| 功能 | 描述 |
|-----|------|
| 指数选择 | 沪深 300、上证指数、创业板指、深证成指 |
| 日 K 线 | 叠加 MA5/10/20 均线 |
| 成交量 | 底部柱状图 |

### 2.4 K 线详情页（核心页面）

展示单只股票的完整技术分析：

| 图表 | 指标 |
|-----|------|
| **K 线** | 日 K，蜡烛图 |
| **均线** | MA5（白）、MA10（黄）、MA20（紫） |
| **MACD** | DIF（快线）、DEA（慢线）、柱状图（红绿） |
| **成交量** | 底部柱状图，配合 K 线颜色 |

### 2.5 策略管理 + AI 优化

| 功能 | 描述 |
|-----|------|
| 策略编辑器 | 可视化条件组合：成交量、均线、MACD 参数 |
| 目标设定 | 设置年化收益率目标 |
| AI 优化 | 遗传算法自动调参，迭代优化策略 |

### 2.6 回测验证分析

| 功能 | 描述 |
|-----|------|
| 参数配置 | 选择策略、时间范围、股票池 |
| 回测执行 | 跑策略，输出结果 |
| 结果展示 | 收益曲线、夏普比率、最大回撤 |

### 2.7 模拟交易

| 功能 | 描述 |
|-----|------|
| 实时信号 | 用当前行情跑策略，生成买入/卖出信号 |
| 模拟持仓 | 记录模拟买卖，跟踪盈亏 |
| 统计面板 | 总收益率、当日盈亏 |

---

## 3. 技术方案

### 3.1 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 前端框架 | Next.js (App Router) | SSR + CSR 混合 |
| UI 组件 | Tailwind CSS | 快速样式 |
| 图表库 | ECharts | K 线、MACD、成交量 |
| 后端框架 | Python FastAPI | REST API |
| 数据源 | AKShare | 免费股票数据 |
| 存储 | SQLite | 自选股、策略、回测记录 |
| AI 优化 | 遗传算法 (DEAP) | 策略参数空间搜索 |

### 3.2 项目结构

```
stock-pilot/
├── frontend/            # Next.js 前端
│   ├── app/
│   │   ├── page.tsx     # 首页（Dashboard）
│   │   ├── watchlist/   # 自选股管理
│   │   ├── stock/[code]/ # K 线详情页
│   │   ├── strategy/     # 策略管理
│   │   ├── backtest/     # 回测分析
│   │   └── simulation/   # 模拟交易
│   ├── components/
│   │   ├── KLineChart.tsx      # K 线主图
│   │   ├── MACDChart.tsx       # MACD 副图
│   │   ├── VolumeChart.tsx     # 成交量副图
│   │   └── StockCard.tsx       # 股票卡片
│   └── lib/
│       └── api.ts       # API 调用封装
├── backend/             # Python FastAPI 后端
│   ├── main.py          # 入口
│   ├── routers/
│   │   ├── stock.py     # 股票数据 API
│   │   ├── strategy.py  # 策略 API
│   │   └── backtest.py  # 回测 API
│   ├── services/
│   │   ├── akshare_service.py  # 数据获取
│   │   └── backtest_engine.py  # 回测引擎
│   └── models/
│       └── database.py  # SQLite 模型
└── README.md
```

### 3.3 API 协议

| 接口 | 方法 | 描述 |
|-----|------|------|
| `/api/stock/quote` | GET | 获取股票实时行情 |
| `/api/stock/kline` | GET | 获取 K 线数据（日 K） |
| `/api/stock/search` | GET | 搜索股票 |
| `/api/index/quotes` | GET | 大盘指数行情 |
| `/api/watchlist` | GET/POST | 自选股列表 |
| `/api/strategy` | GET/POST | 策略 CRUD |
| `/api/backtest` | POST | 跑回测 |
| `/api/optimize` | POST | AI 优化策略 |
| `/api/simulation/signals` | GET | 当前策略信号 |

### 3.4 数据模型

**自选股表**
```
watchlist: id, stock_code, group, created_at
```

**策略表**
```
strategy: id, name, rules(JSON), created_at, updated_at
```

**回测记录表**
```
backtest_record: id, strategy_id, start_date, end_date,
                 result(JSON), created_at
```

---

## 4. 页面路线图

```
[Phase 1] K 线核心（先行）
  首页大盘 + 热门股 → K 线详情页（均线 + MACD + 成交量）

[Phase 2] 自选股
  自选股管理 → 自选 K 线

[Phase 3] 策略 + 回测
  策略编辑器 → 回测引擎 → 结果图表

[Phase 4] AI 优化
  参数空间定义 → 遗传算法迭代 → 最优参数输出

[Phase 5] 模拟交易
  实时信号 → 模拟持仓 → 盈亏统计
```