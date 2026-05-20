from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
from datetime import datetime

router = APIRouter()
DB_PATH = "watchlist.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_code TEXT NOT NULL,
            stock_name TEXT NOT NULL,
            group_name TEXT DEFAULT '默认',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

class WatchlistItem(BaseModel):
    stock_code: str
    stock_name: str
    group_name: Optional[str] = "默认"


@router.get("")
def get_watchlist():
    conn = get_db()
    rows = conn.execute("SELECT * FROM watchlist ORDER BY created_at DESC").fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "stock_code": row["stock_code"],
            "stock_name": row["stock_name"],
            "group_name": row["group_name"],
            "created_at": row["created_at"],
        }
        for row in rows
    ]


@router.post("")
def add_watchlist(item: WatchlistItem):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO watchlist (stock_code, stock_name, group_name) VALUES (?, ?, ?)",
        (item.stock_code, item.stock_name, item.group_name)
    )
    conn.commit()
    item_id = cursor.lastrowid
    conn.close()
    return {"id": item_id, **item.model_dump()}


@router.delete("/{item_id}")
def remove_watchlist(item_id: int):
    conn = get_db()
    conn.execute("DELETE FROM watchlist WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}