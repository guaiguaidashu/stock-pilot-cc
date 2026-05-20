from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stock, index, watchlist, strategy, backtest, simulation

app = FastAPI(title="StockPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock.router, prefix="/api/stock", tags=["stock"])
app.include_router(index.router, prefix="/api/index", tags=["index"])
app.include_router(watchlist.router, prefix="/api/watchlist", tags=["watchlist"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["strategy"])
app.include_router(backtest.router, prefix="/api/backtest", tags=["backtest"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])


@app.get("/")
def root():
    return {"message": "StockPilot API", "version": "1.0.0"}


@app.get("/api/health")
def health():
    return {"status": "ok"}