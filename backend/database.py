import os
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# PostgreSQL Database URL
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://jasper46:d6eew7wvjpn7od7f2pwyrulgyfiwvkir@127.0.0.1:5433/timescaledb"
)

# Engine & Session Setup
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

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

def init_db():
    """Create all database tables if they do not exist and seed initial master admin."""
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
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
        db.close()
        print("[OK] Database tables initialized successfully.")
    except Exception as e:
        print(f"[WARN] Could not initialize PostgreSQL tables: {e}")

def get_db():
    """Dependency for obtaining database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
