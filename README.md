# StockPilot

个人股票复盘工作站。

## 功能

- **热门股票** — 涨跌幅排行、板块轮动
- **自选股管理** — 搜索添加、分类管理
- **大盘走势** — 沪深300、上证指数、创业板指、深证成指 K 线
- **K 线详情** — 日 K + MA5/10/20 + MACD + 成交量
- **策略管理** — 可视化条件编辑器
- **回测分析** — 收益率、夏普比率、最大回撤、资金曲线
- **模拟交易** — 策略信号、模拟持仓

## 启动

```bash
# 前端
cd frontend
npm install
npm run dev -- --port 3456

# 后端
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

或使用一键脚本：

```bash
./start.sh
```

## 访问

- 前端：http://localhost:3456
- 后端 API：http://localhost:8000/docs
- K 线详情：http://localhost:3456/stock/000001

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | Next.js + Tailwind + ECharts |
| 后端 | Python FastAPI |
| 数据 | AKShare（真实数据） / Mock（网络不通时） |
| 存储 | SQLite（自选股、策略） |

## 项目结构

```
stock-pilot/
├── frontend/
│   └── src/
│       ├── app/              # 页面
│       │   ├── page.tsx      # 首页
│       │   ├── hot/          # 热门股票
│       │   ├── watchlist/   # 自选股
│       │   ├── indices/     # 大盘走势
│       │   ├── stock/[code]/# K 线详情
│       │   ├── strategy/     # 策略管理
│       │   ├── backtest/    # 回测分析
│       │   └── simulation/  # 模拟交易
│       ├── components/       # 组件
│       └── lib/api.ts       # API 调用
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── routers/            # API 路由
│   │   ├── stock.py         # 股票数据
│   │   ├── index.py         # 大盘指数
│   │   ├── watchlist.py     # 自选股
│   │   ├── strategy.py      # 策略
│   │   ├── backtest.py      # 回测
│   │   └── simulation.py   # 模拟交易
│   └── services/
│       └── akshare_service.py # AKShare 数据服务
└── start.sh                 # 启动脚本
```

## 数据说明

- 股票数据来源于 [AKShare](https://akshare.akfamily.xyz/)
- AKShare 网络不通时自动 fallback 到模拟数据
- 自选股、策略数据存储在 SQLite 数据库

## 下一步

- [ ] 接入 AI 优化模块（遗传算法调参）
- [ ] 添加更多技术指标（RSI、KDJ、布林带）
- [ ] 支持港股、美股数据