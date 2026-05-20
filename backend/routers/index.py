from fastapi import APIRouter
import random
from datetime import datetime, timedelta

from services.akshare_service import get_index_quote, get_index_kline

router = APIRouter()

INDICES = [
    {"code": "000300", "name": "沪深300"},
    {"code": "000001", "name": "上证指数"},
    {"code": "399006", "name": "创业板指"},
    {"code": "399001", "name": "深证成指"},
]


@router.get("/quotes")
def get_quotes():
    """获取大盘指数行情"""
    result = []
    for idx in INDICES:
        data = get_index_quote(idx["code"])
        if data and data.get("price", 0) > 0:
            result.append(data)
        else:
            # Fallback mock
            price = random.uniform(2000, 5000)
            change = random.uniform(-50, 50)
            result.append({
                **idx,
                "price": round(price, 2),
                "change": round(change, 2),
                "changePercent": round(change / price * 100, 2),
            })
    return result


@router.get("/kline")
def get_kline(code: str, period: str = "daily"):
    """获取指数 K 线数据"""
    data = get_index_kline(code, period)
    if data:
        return data
    # Fallback mock
    base_prices = {"000300": 3500.0, "000001": 3200.0, "399006": 2000.0, "399001": 10000.0}
    base = base_prices.get(code, 3000.0)
    return generate_mock_kline(days=120, base_price=base)


def generate_mock_kline(days: int = 100, base_price: float = 3000.0):
    """生成模拟 K 线数据（备用）"""
    data = []
    price = base_price
    for i in range(days):
        date = (datetime.now() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        change_pct = random.uniform(-0.02, 0.02)
        open_price = price
        close_price = price * (1 + change_pct)
        high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.01))
        low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.01))
        volume = random.randint(10000000, 50000000)
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