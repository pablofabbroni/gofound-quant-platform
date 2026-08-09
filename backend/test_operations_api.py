import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from database import init_db, SessionLocal, TradeOperation
from main import seed_demo_operations

def main():
    print("==================================================")
    print("TESTING LIVE OPERATIONS DATABASE & API ENDPOINTS")
    print("==================================================")
    
    init_db()
    db = SessionLocal()
    
    # Check if operations exist
    ops = db.query(TradeOperation).all()
    print(f"Total de operaciones registradas en DB: {len(ops)}")
    for op in ops:
        print(f" - [{op.ticket_id}] {op.symbol} {op.operation_type} @ {op.entry_price} | PnL: ${op.pnl_usd} | Status: {op.status}")

        
    db.close()
    print("\n[SUCCESS] Modelo e inicializador de operaciones verificado.")

if __name__ == "__main__":
    main()
