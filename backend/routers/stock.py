from fastapi import APIRouter
from typing import Optional
import random
from datetime import datetime, timedelta

from services.akshare_service import (
    get_stock_quote,
    get_stock_kline,
    search_stocks,
    get_hot_stocks,
)

router = APIRouter()


@router.get("/quote")
def get_quote(code: str):
    """获取股票实时行情"""
    data = get_stock_quote(code)
    if data:
        return data
    # Fallback to mock
    price = random.uniform(5, 100)
    change = random.uniform(-5, 5)
    return {
        "code": code,
        "name": f"股票{code}",
        "price": round(price, 2),
        "change": round(change, 2),
        "changePercent": round(change / price * 100, 2),
        "volume": random.randint(1000000, 10000000),
        "turnover": round(random.uniform(0.5, 5.0), 2),
    }


@router.get("/kline")
def get_kline(code: str, period: str = "daily", adjust: str = "qfq"):
    """获取 K 线数据"""
    data = get_stock_kline(code, period, adjust)
    if data:
        return data
    return generate_kline_data(days=120, base_price=random.uniform(10, 50))


@router.get("/search")
def search(keyword: str):
    """搜索股票"""
    data = search_stocks(keyword)
    if data:
        return data
    return [
        {"code": "000001", "name": "平安银行", "market": "SZ"},
        {"code": "000002", "name": "万科A", "market": "SZ"},
        {"code": "600000", "name": "浦发银行", "market": "SH"},
        {"code": "600519", "name": "贵州茅台", "market": "SH"},
        {"code": "000858", "name": "五粮液", "market": "SZ"},
    ][:3]


@router.get("/hot")
def get_hot(limit: int = 20):
    """获取热门股票"""
    data = get_hot_stocks(limit)
    if data:
        return data
    # Fallback mock
    stocks = []
    names = ["平安银行", "万科A", "浦发银行", "贵州茅台", "五粮液", "宁德时代", "比亚迪", "招商银行"]
    for i in range(min(limit, len(names))):
        code = f"{'000' if i < 4 else '600'}{'0' * (6 - len(str(i)))}{i}"
        price = random.uniform(10, 300)
        change = random.uniform(-10, 10)
        stocks.append({
            "code": code,
            "name": names[i % len(names)],
            "price": round(price, 2),
            "change": round(change, 2),
            "changePercent": round(change / price * 100, 2),
            "volume": random.randint(1000000, 50000000),
            "turnover": round(random.uniform(0.5, 10.0), 2),
        })
    return stocks


def generate_kline_data(days: int = 100, base_price: float = 10.0):
    """生成模拟 K 线数据（备用）"""
    data = []
    price = base_price
    for i in range(days):
        date = (datetime.now() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        change_pct = random.uniform(-0.05, 0.05)
        open_price = price
        close_price = price * (1 + change_pct)
        high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.02))
        low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.02))
        volume = random.randint(1000000, 10000000)
        data.append({
            "date": date,
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": volume,
        })
        price = close_price
    return data