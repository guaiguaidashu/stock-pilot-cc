from fastapi import APIRouter
from typing import List, Optional
import random

router = APIRouter()

POSITIONS = [
    {"code": "000001", "name": "平安银行", "shares": 1000, "avg_cost": 12.5, "current_price": 13.2},
    {"code": "600519", "name": "贵州茅台", "shares": 100, "avg_cost": 1680.0, "current_price": 1720.0},
]

SIGNALS = [
    {"code": "000858", "name": "五粮液", "signal": "买入", "reason": "MACD 金叉", "price": 145.6},
    {"code": "002594", "name": "比亚迪", "signal": "卖出", "reason": "MA5 死叉", "price": 238.5},
]


@router.get("/signals")
def get_signals():
    """获取策略信号"""
    return SIGNALS


@router.get("/positions")
def get_positions():
    """获取模拟持仓"""
    result = []
    for pos in POSITIONS:
        pnl = (pos["current_price"] - pos["avg_cost"]) * pos["shares"]
        pnl_pct = (pos["current_price"] - pos["avg_cost"]) / pos["avg_cost"] * 100
        result.append({
            **pos,
            "pnl": round(pnl, 2),
            "pnl_percent": round(pnl_pct, 2),
        })
    return result


@router.post("/buy")
def simulate_buy(code: str, shares: int, price: float):
    """模拟买入"""
    return {"status": "ok", "code": code, "shares": shares, "price": price}


@router.post("/sell")
def simulate_sell(code: str, shares: int, price: float):
    """模拟卖出"""
    return {"status": "ok", "code": code, "shares": shares, "price": price}