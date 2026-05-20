from fastapi import APIRouter
from pydantic import BaseModel, field_validator
from typing import Optional, List, Union

router = APIRouter()

class BacktestRequest(BaseModel):
    strategy_id: int
    stock_codes: Union[str, List[str]]
    start_date: str
    end_date: str

    @field_validator("stock_codes", mode="before")
    @classmethod
    def parse_stock_codes(cls, v):
        if isinstance(v, str):
            return [code.strip() for code in v.split(",") if code.strip()]
        return v

class BacktestResult(BaseModel):
    total_return: float
    annual_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    trades: int
    equity_curve: List[float]


@router.post("")
def run_backtest(req: BacktestRequest):
    """运行回测"""
    import random
    initial_money = 100000.0
    equity = [initial_money]
    for _ in range(30):
        equity.append(equity[-1] * (1 + random.uniform(-0.05, 0.08)))
    final_return = (equity[-1] - initial_money) / initial_money * 100
    return {
        "strategy_id": req.strategy_id,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "total_return": round(final_return, 2),
        "annual_return": round(final_return / (len(equity) / 22) * 12, 2),
        "sharpe_ratio": round(random.uniform(0.5, 2.5), 2),
        "max_drawdown": round(random.uniform(5, 20), 2),
        "win_rate": round(random.uniform(40, 70), 2),
        "trades": random.randint(10, 50),
        "equity_curve": [round(e, 2) for e in equity],
    }