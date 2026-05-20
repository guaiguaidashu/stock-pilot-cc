import akshare as ak
import pandas as pd
import baostock as bs
import requests
from datetime import datetime, timedelta
from typing import Optional
import sqlite3
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DB_DIR, "..", "stock_kline.db")

_baostock_logged_in = False

# 腾讯财经常用股票池（按市值/流动性筛选的代表性A股）
TENXUN_POOL = [
    "sz000001", "sz000002", "sz000004", "sz000008", "sz000009", "sz000027",
    "sz000060", "sz000063", "sz000066", "sz000100", "sz000138", "sz000157",
    "sz000166", "sz000333", "sz000338", "sz000425", "sz000568", "sz000596",
    "sz000651", "sz000661", "sz000708", "sz000725", "sz000768", "sz000858",
    "sz000876", "sz000895", "sz000938", "sz001979",
    "sh600000", "sh600009", "sh600016", "sh600019", "sh600028", "sh600030",
    "sh600031", "sh600036", "sh600048", "sh600050", "sh600104", "sh600109",
    "sh600111", "sh600150", "sh600160", "sh600176", "sh600183", "sh600196",
    "sh600276", "sh600309", "sh600406", "sh600436", "sh600438", "sh600487",
    "sh600519", "sh600547", "sh600570", "sh600585", "sh600690", "sh600700",
    "sh600745", "sh600760", "sh600809", "sh600837", "sh600887", "sh600893",
    "sh600901", "sh600905", "sh600918", "sh600926", "sh600989", "sh601006",
    "sh601012", "sh601066", "sh601088", "sh601118", "sh601138", "sh601166",
    "sh601186", "sh601225", "sh601236", "sh601288", "sh601318", "sh601319",
    "sh601328", "sh601336", "sh601390", "sh601398", "sh601601", "sh601628",
    "sh601658", "sh601668", "sh601688", "sh601728", "sh601766", "sh601818",
    "sh601857", "sh601888", "sh601899", "sh601919", "sh601939", "sh601985",
    "sh601988", "sh601993", "sh603259", "sh603288", "sh603501", "sh603799",
    "sh603986",
]

def _ensure_baostock_login():
    global _baostock_logged_in
    if not _baostock_logged_in:
        bs.login()
        _baostock_logged_in = True


def tencent_realtime_batch(codes: list[str]) -> list[dict]:
    """从腾讯财经获取实时行情（批量）"""
    try:
        import requests
        # 支持两种格式：带前缀("sz000001")或不带("000001")
        sz_codes = []
        sh_codes = []
        for c in codes:
            if c.startswith(("sz", "SZ")):
                sz_codes.append(c[2:])  # strip "sz" prefix
            elif c.startswith(("sh", "SH")):
                sh_codes.append(c[2:])  # strip "sh" prefix
            elif c.startswith(("000", "001", "002", "003")):
                sz_codes.append(c)
            elif c.startswith("6"):
                sh_codes.append(c)

        market_map = {"sz": sz_codes, "sh": sh_codes}
        results = []
        for market, symbols in market_map.items():
            if not symbols:
                continue
            prefixed = [f"{market}{c}" for c in symbols]
            url = f"https://qt.gtimg.cn/q={','.join(prefixed)}"
            r = requests.get(url, timeout=10)
            for line in r.text.strip().split('\n'):
                if '~' not in line:
                    continue
                parts = line.split('~')
                if len(parts) < 40:
                    continue
                full_code = parts[0].replace("v_", "")  # e.g. sz000001
                stock_code = parts[2]
                name = parts[1]
                price = float(parts[3]) if parts[3] else 0
                yesterday_close = float(parts[4]) if parts[4] else 0
                change = price - yesterday_close
                change_pct = (change / yesterday_close * 100) if yesterday_close else 0
                volume = int(parts[6]) if parts[6] else 0
                turnover = float(parts[37]) / 1e8 if parts[37] else 0
                results.append({
                    "code": stock_code,
                    "name": name,
                    "price": price,
                    "change": round(change, 2),
                    "changePercent": round(change_pct, 2),
                    "volume": volume,
                    "turnover": round(turnover, 2),
                })
        return results
    except Exception as e:
        print(f"Tencent realtime error: {e}")
        return []

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS stock_kline (
            code TEXT NOT NULL,
            date TEXT NOT NULL,
            open REAL, high REAL, low REAL,
            close REAL, volume INTEGER,
            turnover_rate REAL DEFAULT 0,
            period TEXT DEFAULT 'daily',
            adjust TEXT DEFAULT 'qfq',
            fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (code, date, period, adjust)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_code_date ON stock_kline(code, date)")
    conn.commit()
    return conn

def get_cached_kline(code: str, period: str = "daily", adjust: str = "qfq", days: int = 180) -> list:
    """从本地缓存获取K线，返回空列表表示需要更新"""
    conn = get_db()
    cutoff = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    rows = conn.execute(
        "SELECT date,open,high,low,close,volume,turnover_rate FROM stock_kline "
        "WHERE code=? AND period=? AND adjust=? AND date>=? ORDER BY date ASC",
        (code, period, adjust, cutoff)
    ).fetchall()
    conn.close()
    return [
        {"date": r[0], "open": r[1], "high": r[2], "low": r[3], "close": r[4], "volume": r[5], "turnoverRate": r[6] or 0}
        for r in rows
    ]

def save_kline(code: str, klines: list, period: str = "daily", adjust: str = "qfq"):
    """保存K线到本地缓存，仅保留最近180天"""
    if not klines:
        return
    conn = get_db()
    for k in klines:
        conn.execute(
            "INSERT OR REPLACE INTO stock_kline (code,date,open,high,low,close,volume,turnover_rate,period,adjust) "
            "VALUES (?,?,?,?,?,?,?,?,?,?)",
            (code, k["date"], k["open"], k["high"], k["low"], k["close"], k["volume"], k.get("turnoverRate", 0), period, adjust)
        )
    # 裁剪：仅保留最近180天
    cutoff = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    conn.execute(
        "DELETE FROM stock_kline WHERE code=? AND period=? AND adjust=? AND date<?",
        (code, period, adjust, cutoff)
    )
    conn.commit()
    conn.close()

def get_stock_quote(code: str) -> dict:
    """获取股票实时行情 — 腾讯财经优先"""
    # 1. 腾讯财经
    stocks = tencent_realtime_batch([code])
    if stocks:
        return stocks[0]
    # 2. AKShare fallback
    try:
        df = ak.stock_zh_a_spot_em()
        row = df[df['代码'] == code]
        if row.empty:
            return None
        row = row.iloc[0]
        return {
            "code": code,
            "name": row['名称'],
            "price": float(row['最新价']),
            "change": float(row['涨跌额']),
            "changePercent": float(row['涨跌幅']),
            "volume": int(row['成交量']),
            "turnover": float(row['成交额']) / 100000000 if pd.notna(row['成交额']) else 0,
        }
    except Exception as e:
        print(f"Error fetching quote for {code}: {e}")
        return None


def get_stock_kline(code: str, period: str = "daily", adjust: str = "qfq") -> list:
    """获取K线数据，baostock优先，回调更新本地缓存"""
    # 1. 先查本地缓存
    cached = get_cached_kline(code, period, adjust)
    today = datetime.now().strftime("%Y-%m-%d")
    needs_refresh = not cached or (len(cached) > 0 and cached[-1]["date"] < today)

    if not needs_refresh:
        return cached

    # 2. 尝试 baostock
    _ensure_baostock_login()
    market = "sz" if code.startswith(("000", "001", "002", "003")) else "sh"
    bs_code = f"{market}.{code}"
    cutoff = (datetime.now() - timedelta(days=200)).strftime("%Y-%m-%d")
    try:
        rs = bs.query_history_k_data_plus(bs_code, "date,open,high,low,close,volume,amount,turn", start_date=cutoff, end_date=today, frequency="d")
        klines = []
        while rs.next():
            row = rs.get_row_data()
            klines.append({
                "date": row[0], "open": float(row[1]), "high": float(row[2]),
                "low": float(row[3]), "close": float(row[4]), "volume": int(row[5]),
                "turnoverRate": float(row[7]) if row[7] else 0,
            })
        if klines:
            save_kline(code, klines, period, adjust)
            return klines
    except Exception as e:
        print(f"baostock error for {code}: {e}")

    # 3. AKShare fallback
    try:
        df = ak.stock_zh_a_hist(symbol=code, period="daily", adjust=adjust)
        klines = [
            {"date": row['日期'], "open": float(row['开盘']), "high": float(row['最高']),
             "low": float(row['最低']), "close": float(row['收盘']), "volume": int(row['成交量'])}
            for _, row in df.iterrows()
        ]
        save_kline(code, klines, period, adjust)
        return klines
    except Exception as e:
        print(f"AKShare error for {code}: {e}")

    # 4. 都不行且有缓存，返回缓存
    if cached:
        return cached
    return []


def search_stocks(keyword: str) -> list:
    """搜索股票 — 东方财富搜索API（全市场）"""
    try:
        url = "http://searchapi.eastmoney.com/api/suggest/get"
        params = {
            "input": keyword,
            "type": "14",
            "token": "D43BF722C8E33BDC906FB84D85E326E8",
            "count": "10",
        }
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            items = data.get("QuotationCodeTable", {}).get("Data", [])
            return [
                {
                    "code": item["Code"],
                    "name": item["Name"],
                    "market": "SH" if item.get("JYS") in ("1", "2") and item.get("MarketType") == "1" else "SZ",
                }
                for item in items
                if item.get("Classify") == "AStock"
            ][:10]
    except Exception as e:
        print(f"Error searching stocks: {e}")
    return []


def get_hot_stocks(limit: int = 20) -> list:
    """获取热门股票（涨幅榜）— 腾讯财经优先，AKShare备选"""
    # 1. 腾讯财经实时数据
    stocks = tencent_realtime_batch(TENXUN_POOL)
    if stocks:
        return sorted(stocks, key=lambda x: x["changePercent"], reverse=True)[:limit]

    # 2. AKShare fallback
    try:
        df = ak.stock_zh_a_spot_em()
        df = df.sort_values('涨跌幅', ascending=False).head(limit)
        return [
            {
                "code": row['代码'],
                "name": row['名称'],
                "price": float(row['最新价']),
                "change": float(row['涨跌额']),
                "changePercent": float(row['涨跌幅']),
                "volume": int(row['成交量']),
                "turnover": float(row['成交额']) / 100000000 if pd.notna(row['成交额']) else 0,
            }
            for _, row in df.iterrows()
        ]
    except Exception as e:
        print(f"Error fetching hot stocks: {e}")
        return []


def get_index_quote(code: str) -> dict:
    """获取指数行情"""
    index_map = {
        "000300": "沪深300",
        "000001": "上证指数",
        "399006": "创业板指",
        "399001": "深证成指",
    }
    try:
        name = index_map.get(code, code)
        df = ak.stock_zh_index_spot_em()
        row = df[df['代码'] == code]
        if row.empty:
            return {"code": code, "name": name, "price": 0, "change": 0, "changePercent": 0}
        row = row.iloc[0]
        return {
            "code": code,
            "name": name,
            "price": float(row['最新价']),
            "change": float(row['涨跌额']),
            "changePercent": float(row['涨跌幅']),
        }
    except Exception as e:
        print(f"Error fetching index {code}: {e}")
        return {"code": code, "name": index_map.get(code, code), "price": 0, "change": 0, "changePercent": 0}


def get_index_kline(code: str, period: str = "daily") -> list:
    """获取指数K线，baostock优先"""
    symbol_map = {"000300": "sh.000300", "000001": "sh.000001", "399006": "sz.399006", "399001": "sz.399001"}
    bs_code = symbol_map.get(code, f"sh.{code}")

    # 1. 先查本地缓存
    conn = get_db()
    cutoff = (datetime.now() - timedelta(days=200)).strftime("%Y-%m-%d")
    rows = conn.execute(
        "SELECT date,open,high,low,close,volume,turnover_rate FROM stock_kline "
        "WHERE code=? AND period=? AND adjust='none' AND date>=? ORDER BY date ASC",
        (code, period, cutoff)
    ).fetchall()
    conn.close()
    cached = [{"date": r[0], "open": r[1], "high": r[2], "low": r[3], "close": r[4], "volume": r[5], "turnoverRate": r[6] or 0} for r in rows]
    today = datetime.now().strftime("%Y-%m-%d")
    needs_refresh = not cached or (len(cached) > 0 and cached[-1]["date"] < today)

    if not needs_refresh:
        return cached

    # 2. 尝试 baostock
    _ensure_baostock_login()
    try:
        rs = bs.query_history_k_data_plus(bs_code, "date,open,high,low,close,volume", start_date=cutoff, end_date=today, frequency="d")
        klines = []
        while rs.next():
            row = rs.get_row_data()
            klines.append({"date": row[0], "open": float(row[1]), "high": float(row[2]), "low": float(row[3]), "close": float(row[4]), "volume": int(row[5]), "turnoverRate": 0})
        if klines:
            conn = get_db()
            for k in klines:
                conn.execute("INSERT OR REPLACE INTO stock_kline (code,date,open,high,low,close,volume,turnover_rate,period,adjust) VALUES (?,?,?,?,?,?,?,?,?,?)", (code, k["date"], k["open"], k["high"], k["low"], k["close"], k["volume"], 0, period, "none"))
            conn.commit()
            conn.close()
            return klines
    except Exception as e:
        print(f"baostock index error for {code}: {e}")

    # 3. AKShare fallback
    try:
        ak_symbol = {"000300": "000300", "000001": "000001", "399006": "399006", "399001": "399001"}.get(code, code)
        df = ak.index_zh_a_hist(symbol=ak_symbol, period="daily")
        klines = [{"date": row['日期'], "open": float(row['开盘']), "high": float(row['最高']), "low": float(row['最低']), "close": float(row['收盘']), "volume": int(row['成交量'])} for _, row in df.iterrows()]
        conn = get_db()
        for k in klines:
            conn.execute("INSERT OR REPLACE INTO stock_kline (code,date,open,high,low,close,volume,period,adjust) VALUES (?,?,?,?,?,?,?,?,?)", (code, k["date"], k["open"], k["high"], k["low"], k["close"], k["volume"], period, "none"))
        conn.commit()
        conn.close()
        return klines
    except Exception as e:
        print(f"AKShare index error for {code}: {e}")

    if cached:
        return cached
    return []