import os
import json
import numpy as np
from datetime import datetime, timedelta

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import psycopg2
import psycopg2.extras

from database import init_db, get_db, User, DATABASE_URL
from auth import hash_password, verify_password, create_access_token, get_current_user_email

app = FastAPI(
    title="GoFound Quant Platform API",
    description="API de investigación cuantitativa, comité de analistas y datos de mercado en tiempo real.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── TimescaleDB connection ────────────────────────────────────────────────────
# In Docker: uses internal service name. Locally: uses SSH tunnel (127.0.0.1:5433)
TIMESCALE_URL = os.environ.get("TIMESCALE_URL", DATABASE_URL)

def get_ts_conn():
    return psycopg2.connect(TIMESCALE_URL)


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup():
    init_db()

# Serve frontend static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse)
def serve_frontend():
    return FileResponse("static/index.html")


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    full_name: str
    role: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool


# ── Auth Endpoints ────────────────────────────────────────────────────────────

@app.get("/api/status")
def root():
    return {"status": "online", "app": "GoFound Quant Platform API v2.0"}

@app.post("/api/auth/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    existing_user = db.query(User).filter(User.email == email_clean).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado")
    new_user = User(
        email=email_clean,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role="quant_analyst",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    token = create_access_token({"sub": new_user.email, "role": new_user.role})
    return TokenResponse(access_token=token, email=new_user.email, full_name=new_user.full_name or "", role=new_user.role)

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    token = create_access_token({"sub": user.email, "role": user.role})
    return TokenResponse(access_token=token, email=user.email, full_name=user.full_name or "", role=user.role)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name or "", role=user.role, is_active=user.is_active)


# ── Market Ticker ─────────────────────────────────────────────────────────────

@app.get("/api/market/ticker")
def get_ticker(email: str = Depends(get_current_user_email)):
    """
    Returns current price and 24h change % for all active symbols.
    Uses M1 candles (most recent resolution available).
    Change % = (current_close - close_24h_ago) / close_24h_ago * 100
    """
    try:
        conn = get_ts_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    s.symbol,
                    s.asset_class,
                    s.digits,
                    (
                        SELECT c.close FROM quant_market.candles c
                        JOIN quant_market.timeframes tf ON c.timeframe_id = tf.id
                        WHERE c.symbol_id = s.id AND tf.code = 'M1'
                        ORDER BY c.time DESC LIMIT 1
                    ) AS current_price,
                    (
                        SELECT c.close FROM quant_market.candles c
                        JOIN quant_market.timeframes tf ON c.timeframe_id = tf.id
                        WHERE c.symbol_id = s.id AND tf.code = 'M1'
                          AND c.time <= NOW() - INTERVAL '24 hours'
                        ORDER BY c.time DESC LIMIT 1
                    ) AS price_24h_ago,
                    (
                        SELECT c.time FROM quant_market.candles c
                        JOIN quant_market.timeframes tf ON c.timeframe_id = tf.id
                        WHERE c.symbol_id = s.id AND tf.code = 'M1'
                        ORDER BY c.time DESC LIMIT 1
                    ) AS last_update
                FROM quant_market.symbols s
                WHERE s.active = TRUE
                ORDER BY s.asset_class, s.symbol;
            """)
            rows = cur.fetchall()
        conn.close()

        result = []
        for row in rows:
            current = float(row["current_price"]) if row["current_price"] else None
            ago24h = float(row["price_24h_ago"]) if row["price_24h_ago"] else None
            change_pct = None
            if current and ago24h and ago24h != 0:
                change_pct = round((current - ago24h) / ago24h * 100, 4)
            result.append({
                "symbol": row["symbol"],
                "asset_class": row["asset_class"],
                "current_price": current,
                "change_pct_24h": change_pct,
                "last_update": row["last_update"].isoformat() if row["last_update"] else None,
            })
        return {"data": result, "timestamp": datetime.utcnow().isoformat()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticker: {str(e)}")


# ── Committee Status ──────────────────────────────────────────────────────────

@app.get("/api/committee/status")
def get_committee_status(email: str = Depends(get_current_user_email)):
    """
    Returns the status of each analyst: last signal, direction, score, and timestamp.
    An analyst is ACTIVE if it emitted a signal in the last 2 hours.
    """
    ANALYST_DESCRIPTIONS = {
        "Quant-bb":       "Reversión a la media · Bollinger Bands + RSI",
        "Trend-Aligner":  "Alineación de tendencias · EMA H1 / H4 / D1",
        "RSI-Divergence": "Divergencias de momentum · Picos y valles RSI",
        "ICT-Engine":     "Smart Money Concepts · Order Blocks + FVG",
        "News-Sentiment": "Filtro fundamental · Veto de noticias de alto impacto",
    }
    try:
        conn = get_ts_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    a.name,
                    s.raw_signal,
                    s.score,
                    s.time,
                    sym.symbol,
                    tf.code AS timeframe
                FROM quant_ai.analysts a
                LEFT JOIN LATERAL (
                    SELECT sig.raw_signal, sig.score, sig.time, sig.symbol_id, sig.timeframe_id
                    FROM quant_ai.signals sig
                    WHERE sig.analyst_id = a.id
                    ORDER BY sig.time DESC LIMIT 1
                ) s ON TRUE
                LEFT JOIN quant_market.symbols sym ON s.symbol_id = sym.id
                LEFT JOIN quant_market.timeframes tf ON s.timeframe_id = tf.id
                ORDER BY a.name;
            """)
            rows = cur.fetchall()
        conn.close()

        two_hours_ago = datetime.utcnow() - timedelta(hours=2)
        result = []
        for row in rows:
            last_time = row["time"]
            is_active = last_time is not None and last_time.replace(tzinfo=None) > two_hours_ago
            result.append({
                "name": row["name"],
                "description": ANALYST_DESCRIPTIONS.get(row["name"], ""),
                "is_active": is_active,
                "last_signal": row["raw_signal"],
                "score": row["score"],
                "last_signal_time": last_time.isoformat() if last_time else None,
                "last_symbol": row["symbol"],
                "last_timeframe": row["timeframe"],
            })
        return {"data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching committee status: {str(e)}")


# ── Committee Decisions ───────────────────────────────────────────────────────

@app.get("/api/committee/decisions")
def get_decisions(limit: int = 50, email: str = Depends(get_current_user_email)):
    """Returns the latest N orchestrator decisions from quant_ai.decision_engine."""
    try:
        conn = get_ts_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    d.time,
                    sym.symbol,
                    tf.code AS timeframe,
                    d.recommendation,
                    d.consensus_score,
                    d.reasoning
                FROM quant_ai.decision_engine d
                JOIN quant_market.symbols sym ON d.symbol_id = sym.id
                JOIN quant_market.timeframes tf ON d.timeframe_id = tf.id
                ORDER BY d.time DESC
                LIMIT %s;
            """, (limit,))
            rows = cur.fetchall()
        conn.close()

        return {
            "data": [
                {
                    "time": r["time"].isoformat(),
                    "symbol": r["symbol"],
                    "timeframe": r["timeframe"],
                    "recommendation": r["recommendation"],
                    "consensus_score": r["consensus_score"],
                    "reasoning": r["reasoning"],
                }
                for r in rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching decisions: {str(e)}")


# ── Committee Signals Feed ────────────────────────────────────────────────────

@app.get("/api/committee/signals")
def get_signals(limit: int = 100, email: str = Depends(get_current_user_email)):
    """Returns the latest analyst signals feed."""
    try:
        conn = get_ts_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    sig.time,
                    a.name AS analyst_name,
                    sym.symbol,
                    tf.code AS timeframe,
                    sig.raw_signal,
                    sig.score
                FROM quant_ai.signals sig
                JOIN quant_ai.analysts a ON sig.analyst_id = a.id
                JOIN quant_market.symbols sym ON sig.symbol_id = sym.id
                JOIN quant_market.timeframes tf ON sig.timeframe_id = tf.id
                WHERE sig.raw_signal IN ('BUY', 'SELL', 'VETO')
                ORDER BY sig.time DESC
                LIMIT %s;
            """, (limit,))
            rows = cur.fetchall()
        conn.close()

        return {
            "data": [
                {
                    "time": r["time"].isoformat(),
                    "analyst_name": r["analyst_name"],
                    "symbol": r["symbol"],
                    "timeframe": r["timeframe"],
                    "raw_signal": r["raw_signal"],
                    "score": r["score"],
                }
                for r in rows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching signals: {str(e)}")


# ── Data Coverage ─────────────────────────────────────────────────────────────

@app.get("/api/market/coverage")
def get_coverage(email: str = Depends(get_current_user_email)):
    """
    Returns the data coverage for each symbol x timeframe.
    Includes min/max date, candle count, and freshness indicator.
    """
    try:
        conn = get_ts_conn()
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT
                    sym.symbol,
                    sym.asset_class,
                    tf.code AS timeframe,
                    tf.seconds AS tf_seconds,
                    MIN(c.time) AS min_time,
                    MAX(c.time) AS max_time,
                    COUNT(*) AS candle_count,
                    EXTRACT(EPOCH FROM (NOW() - MAX(c.time))) AS staleness_seconds
                FROM quant_market.candles c
                JOIN quant_market.symbols sym ON c.symbol_id = sym.id
                JOIN quant_market.timeframes tf ON c.timeframe_id = tf.id
                WHERE sym.active = TRUE
                GROUP BY sym.symbol, sym.asset_class, tf.code, tf.seconds
                ORDER BY sym.symbol, tf.seconds;
            """)
            rows = cur.fetchall()
        conn.close()

        result = []
        for r in rows:
            staleness_s = float(r["staleness_seconds"]) if r["staleness_seconds"] else None
            staleness_min = round(staleness_s / 60, 1) if staleness_s else None
            is_fresh = staleness_s is not None and staleness_s < 600  # < 10 minutes
            result.append({
                "symbol": r["symbol"],
                "asset_class": r["asset_class"],
                "timeframe": r["timeframe"],
                "tf_seconds": r["tf_seconds"],
                "min_date": r["min_time"].isoformat() if r["min_time"] else None,
                "max_date": r["max_time"].isoformat() if r["max_time"] else None,
                "candle_count": r["candle_count"],
                "staleness_minutes": staleness_min,
                "is_fresh": is_fresh,
            })
        return {"data": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching coverage: {str(e)}")


# ── Backtest Runner ───────────────────────────────────────────────────────────

class BacktestRequest(BaseModel):
    symbol: str = "EURUSD"
    timeframe: str = "M15"
    days: int = 30
    balance: float = 10000.0
    risk: float = 1.0

@app.post("/api/backtest/run")
def run_backtest(payload: BacktestRequest, email: str = Depends(get_current_user_email)):
    """Executes the backtest simulation using committee signals against historical data."""
    try:
        conn = get_ts_conn()

        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(
                "SELECT id, contract_size, digits FROM quant_market.symbols WHERE symbol = %s AND active = TRUE;",
                (payload.symbol,)
            )
            sym_row = cur.fetchone()
            if not sym_row:
                raise HTTPException(status_code=404, detail=f"Symbol '{payload.symbol}' not found.")

            cur.execute("SELECT id FROM quant_market.timeframes WHERE code = %s;", (payload.timeframe,))
            tf_row = cur.fetchone()
            if not tf_row:
                raise HTTPException(status_code=404, detail=f"Timeframe '{payload.timeframe}' not found.")

            symbol_id = sym_row["id"]
            timeframe_id = tf_row["id"]
            contract_size = float(sym_row["contract_size"])
            digits = int(sym_row["digits"])

            cur.execute("""
                SELECT time, open, high, low, close
                FROM quant_market.candles
                WHERE symbol_id = %s AND timeframe_id = %s
                  AND time >= NOW() - (%s * INTERVAL '1 day')
                ORDER BY time ASC;
            """, (symbol_id, timeframe_id, payload.days))
            candles = cur.fetchall()

            if len(candles) < 55:
                raise HTTPException(status_code=422, detail="Datos insuficientes para el backtest. Aumenta el rango de días.")

            cur.execute("""
                SELECT sig.time, a.name AS analyst_name, sig.raw_signal, sig.score
                FROM quant_ai.signals sig
                JOIN quant_ai.analysts a ON sig.analyst_id = a.id
                WHERE sig.symbol_id = %s AND sig.timeframe_id = %s
                  AND sig.time >= NOW() - (%s * INTERVAL '1 day')
                ORDER BY sig.time ASC;
            """, (symbol_id, timeframe_id, payload.days))
            signals = cur.fetchall()

        conn.close()

        # Index signals by time
        signals_by_time = {}
        for sig in signals:
            t = sig["time"]
            if t not in signals_by_time:
                signals_by_time[t] = []
            signals_by_time[t].append(sig)

        balance = payload.balance
        risk_pct = payload.risk / 100.0
        ATR_MULT_SL = 1.5
        ATR_MULT_TP = 2.5

        open_position = None
        closed_trades = []
        equity_curve = [{"time": candles[0]["time"].isoformat(), "equity": balance}]

        for idx in range(50, len(candles)):
            row = candles[idx]
            h = float(row["high"])
            l = float(row["low"])
            c_price = float(row["close"])
            t = row["time"]

            # Update open position
            if open_position:
                d = open_position["direction"]
                sl = open_position["sl"]
                tp = open_position["tp"]
                size = open_position["size"]
                entry = open_position["entry_price"]
                closed = False
                result_str = ""
                exit_p = 0.0

                if d == "BUY":
                    if l <= sl:
                        closed, exit_p, result_str = True, sl, "SL"
                    elif h >= tp:
                        closed, exit_p, result_str = True, tp, "TP"
                else:
                    if h >= sl:
                        closed, exit_p, result_str = True, sl, "SL"
                    elif l <= tp:
                        closed, exit_p, result_str = True, tp, "TP"

                if closed:
                    pnl = (exit_p - entry) * size * contract_size if d == "BUY" else (entry - exit_p) * size * contract_size
                    balance += pnl
                    closed_trades.append({
                        "entry_time": open_position["entry_time"].isoformat(),
                        "exit_time": t.isoformat(),
                        "direction": d,
                        "entry_price": round(entry, digits),
                        "exit_price": round(exit_p, digits),
                        "size": round(size, 2),
                        "pnl": round(pnl, 2),
                        "result": result_str,
                    })
                    open_position = None

            equity_curve.append({"time": t.isoformat(), "equity": round(balance, 2)})

            if open_position:
                continue

            votes = signals_by_time.get(t, [])
            if not votes:
                continue

            vetos = [v for v in votes if v["raw_signal"] == "VETO"]
            if vetos:
                continue

            buys = [v for v in votes if v["raw_signal"] == "BUY"]
            sells = [v for v in votes if v["raw_signal"] == "SELL"]

            if len(buys) >= 2 and len(sells) == 0:
                direction = "BUY"
            elif len(sells) >= 2 and len(buys) == 0:
                direction = "SELL"
            else:
                continue

            # ATR-based SL/TP
            recent_hi = [float(candles[i]["high"]) for i in range(max(0, idx-14), idx)]
            recent_lo = [float(candles[i]["low"]) for i in range(max(0, idx-14), idx)]
            recent_cl = [float(candles[i]["close"]) for i in range(max(0, idx-15), idx-1)]
            if len(recent_cl) < 5:
                continue
            trs = [max(recent_hi[i]-recent_lo[i], abs(recent_hi[i]-recent_cl[i]), abs(recent_lo[i]-recent_cl[i])) for i in range(len(recent_cl))]
            atr = sum(trs) / len(trs)

            if direction == "BUY":
                sl = c_price - atr * ATR_MULT_SL
                tp = c_price + atr * ATR_MULT_TP
            else:
                sl = c_price + atr * ATR_MULT_SL
                tp = c_price - atr * ATR_MULT_TP

            sl_dist = abs(c_price - sl)
            if sl_dist == 0:
                continue

            risk_amount = balance * risk_pct
            size = max(0.01, round(risk_amount / (sl_dist * contract_size), 2))

            open_position = {
                "entry_time": t,
                "direction": direction,
                "entry_price": c_price,
                "sl": sl,
                "tp": tp,
                "size": size,
            }

        # Summary stats
        total = len(closed_trades)
        wins = [t for t in closed_trades if t["result"] == "TP"]
        losses = [t for t in closed_trades if t["result"] == "SL"]
        gross_profit = sum(t["pnl"] for t in wins)
        gross_loss = sum(t["pnl"] for t in losses)
        net_profit = gross_profit + gross_loss
        profit_factor = round(gross_profit / abs(gross_loss), 2) if gross_loss else None
        win_rate = round(len(wins) / total * 100, 2) if total else 0

        # Max Drawdown
        peak = payload.balance
        max_dd = 0.0
        eq_val = payload.balance
        for trade in closed_trades:
            eq_val += trade["pnl"]
            if eq_val > peak:
                peak = eq_val
            dd = (peak - eq_val) / peak * 100
            if dd > max_dd:
                max_dd = dd

        returns = [t["pnl"] / payload.balance for t in closed_trades]
        sharpe = 0
        if len(returns) > 1:
            std_r = float(np.std(returns))
            mean_r = float(np.mean(returns))
            sharpe = round((mean_r / std_r * (252 ** 0.5)), 2) if std_r > 0 else 0

        # Downsample equity curve to max 300 points for the chart
        step = max(1, len(equity_curve) // 300)
        eq_downsampled = equity_curve[::step]

        return {
            "summary": {
                "symbol": payload.symbol,
                "timeframe": payload.timeframe,
                "days": payload.days,
                "initial_balance": payload.balance,
                "final_balance": round(balance, 2),
                "net_profit": round(net_profit, 2),
                "net_profit_pct": round(net_profit / payload.balance * 100, 2),
                "total_trades": total,
                "win_count": len(wins),
                "loss_count": len(losses),
                "win_rate": win_rate,
                "profit_factor": profit_factor,
                "sharpe_ratio": sharpe,
                "max_drawdown_pct": round(max_dd, 2),
            },
            "trades": closed_trades[-50:],
            "equity_curve": eq_downsampled,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest error: {str(e)}")
