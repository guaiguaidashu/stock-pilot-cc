from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter()

class StrategyRule(BaseModel):
    indicator: str
    operator: str
    value: str | float

class Strategy(BaseModel):
    id: Optional[int] = None
    name: str
    rules: List[StrategyRule]
    description: Optional[str] = ""

STRATEGIES = [
    {
        "id": 1,
        "name": "均线金叉",
        "description": "MA5 上穿 MA20",
        "rules": [
            {"indicator": "MA5", "operator": "cross_above", "value": "MA20"}
        ]
    },
    {
        "id": 2,
        "name": "MACD 买入",
        "description": "DIF 上穿 DEA",
        "rules": [
            {"indicator": "DIF", "operator": "cross_above", "value": "DEA"}
        ]
    },
    {
        "id": 3,
        "name": "放量上涨",
        "description": "成交量放大 1.5 倍且涨幅 > 2%",
        "rules": [
            {"indicator": "volume", "operator": "gt", "value": 1.5},
            {"indicator": "change_percent", "operator": "gt", "value": 2.0}
        ]
    }
]


@router.get("")
def get_strategies():
    return STRATEGIES


@router.post("")
def create_strategy(strategy: Strategy):
    new_id = max(s["id"] for s in STRATEGIES) + 1
    new_strategy = {"id": new_id, **strategy.model_dump()}
    STRATEGIES.append(new_strategy)
    return new_strategy


@router.put("/{strategy_id}")
def update_strategy(strategy_id: int, strategy: Strategy):
    for i, s in enumerate(STRATEGIES):
        if s["id"] == strategy_id:
            STRATEGIES[i] = {"id": strategy_id, **strategy.model_dump()}
            return STRATEGIES[i]
    return {"error": "Strategy not found"}, 404