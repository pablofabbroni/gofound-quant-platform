import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# PostgreSQL Database URL
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://jasper46:d6eew7wvjpn7od7f2pwyrulgyfiwvkir@127.0.0.1:5433/timescaledb"
)

# Engine & Session Setup
SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "market_data.db"))

def create_db_engine():
    try:
        pg_engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            connect_args={"connect_timeout": 3}
        )
        with pg_engine.connect() as conn:
            pass
        return pg_engine
    except Exception:
        print("[INFO] TimescaleDB PostgreSQL not reachable. Using local SQLite database (market_data.db).")
        return create_engine(f"sqlite:///{SQLITE_DB_PATH}", connect_args={"check_same_thread": False})

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="quant_analyst")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AnalystParam(Base):
    __tablename__ = "analysts_parameters"

    id = Column(Integer, primary_key=True, index=True)
    analyst_name = Column(String(50), nullable=False, index=True)
    param_key = Column(String(50), nullable=False)
    param_value = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LabExperiment(Base):
    __tablename__ = "lab_experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_name = Column(String(120), nullable=False)
    symbol = Column(String(20), nullable=False, default="EURUSD")
    timeframe = Column(String(10), nullable=False, default="M15")
    analyst_name = Column(String(50), nullable=False)
    params_tested = Column(String(1000), nullable=False) # JSON string of parameters dict
    days = Column(Integer, default=15)
    total_trades = Column(Integer, default=0)
    win_rate = Column(Float, default=0.0)
    net_profit_pct = Column(Float, default=0.0)
    net_profit_usd = Column(Float, default=0.0)
    sharpe_ratio = Column(Float, default=0.0)
    max_drawdown_pct = Column(Float, default=0.0)
    status = Column(String(20), default="COMPLETED") # COMPLETED, APPLIED, REJECTED
    reasoning = Column(String(1000), nullable=True) # Textual AI reasoning/justification
    created_at = Column(DateTime, default=datetime.utcnow)

DEFAULT_ANALYST_PARAMS = [
    # Quant-bb
    {"analyst_name": "Quant-bb", "param_key": "rsi_period", "param_value": "14", "description": "Período del oscilador RSI (barras)"},
    {"analyst_name": "Quant-bb", "param_key": "rsi_oversold", "param_value": "34.0", "description": "Umbral de sobreventa RSI para COMPRA"},
    {"analyst_name": "Quant-bb", "param_key": "rsi_overbought", "param_value": "66.0", "description": "Umbral de sobrecompra RSI para VENTA"},
    {"analyst_name": "Quant-bb", "param_key": "bb_period", "param_value": "20", "description": "Período de las Bandas de Bollinger"},
    {"analyst_name": "Quant-bb", "param_key": "bb_std", "param_value": "2.0", "description": "Desviaciones estándar para las bandas"},

    # Trend-Aligner
    {"analyst_name": "Trend-Aligner", "param_key": "ema_fast", "param_value": "20", "description": "Período de la EMA rápida"},
    {"analyst_name": "Trend-Aligner", "param_key": "ema_slow", "param_value": "50", "description": "Período de la EMA lenta"},
    {"analyst_name": "Trend-Aligner", "param_key": "ema_trend", "param_value": "200", "description": "Período de la EMA de tendencia macro"},

    # RSI-Divergence
    {"analyst_name": "RSI-Divergence", "param_key": "rsi_period", "param_value": "14", "description": "Período del RSI para divergencias"},
    {"analyst_name": "RSI-Divergence", "param_key": "div_oversold", "param_value": "36.0", "description": "Nivel mínimo para divergencia alcista"},
    {"analyst_name": "RSI-Divergence", "param_key": "div_overbought", "param_value": "64.0", "description": "Nivel máximo para divergencia bajista"},

    # ICT-Engine
    {"analyst_name": "ICT-Engine", "param_key": "fvg_min_pips", "param_value": "3.0", "description": "Tamaño mínimo del Fair Value Gap (FVG) en pips"},
    {"analyst_name": "ICT-Engine", "param_key": "ob_lookback", "param_value": "20", "description": "Períodos hacia atrás para Order Blocks"},

    # News-Sentiment
    {"analyst_name": "News-Sentiment", "param_key": "veto_window_mins", "param_value": "60", "description": "Ventana de minutos pre/post noticia para VETO"},
    {"analyst_name": "News-Sentiment", "param_key": "impact_threshold", "param_value": "HIGH", "description": "Nivel de impacto mínimo para VETO"},
]

def init_db():
    """Create all database tables if they do not exist and seed master admin + analyst parameters."""
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()

        # Add missing column if table was created previously without reasoning
        try:
            db.execute("ALTER TABLE lab_experiments ADD COLUMN IF NOT EXISTS reasoning VARCHAR(1000);")
            db.commit()
        except Exception:
            db.rollback()

        admin_email = "admin@gofound.tech"
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            from auth import hash_password
            admin_user = User(
                email=admin_email,
                password_hash=hash_password("AdminQuant2026!"),
                full_name="Master Admin Quant",
                role="quant_admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("[OK] Default master admin created: admin@gofound.tech / AdminQuant2026!")

        # Seed Analyst Parameters
        for p in DEFAULT_ANALYST_PARAMS:
            existing_p = db.query(AnalystParam).filter(
                AnalystParam.analyst_name == p["analyst_name"],
                AnalystParam.param_key == p["param_key"]
            ).first()
            if not existing_p:
                db.add(AnalystParam(
                    analyst_name=p["analyst_name"],
                    param_key=p["param_key"],
                    param_value=p["param_value"],
                    description=p["description"]
                ))
        db.commit()

        # Seed initial sample experiments
        if db.query(LabExperiment).count() == 0:
            import json
            db.add(LabExperiment(
                experiment_name="Optimización RSI Period & Oversold (Quant-bb en EUR/USD M15)",
                symbol="EURUSD",
                timeframe="M15",
                analyst_name="Quant-bb",
                params_tested=json.dumps({"rsi_period": "10", "rsi_oversold": "30.0", "rsi_overbought": "70.0"}),
                days=15,
                total_trades=109,
                win_rate=38.53,
                net_profit_pct=2.12,
                net_profit_usd=212.03,
                sharpe_ratio=0.24,
                max_drawdown_pct=11.28,
                status="APPLIED"
            ))
            db.add(LabExperiment(
                experiment_name="Prueba de Crossover EMA 20/50 (Trend-Aligner en GBP/USD H1)",
                symbol="GBPUSD",
                timeframe="H1",
                analyst_name="Trend-Aligner",
                params_tested=json.dumps({"ema_fast": "15", "ema_slow": "45"}),
                days=30,
                total_trades=84,
                win_rate=41.67,
                net_profit_pct=1.85,
                net_profit_usd=185.40,
                sharpe_ratio=0.31,
                max_drawdown_pct=8.40,
                status="COMPLETED"
            ))
            db.commit()

        db.close()
        print("[OK] Database tables, analyst parameters & lab experiments initialized successfully.")
    except Exception as e:
        print(f"[WARN] Could not initialize database tables: {e}")

def get_db():
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

