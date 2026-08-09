"""
reset_production_trades.py — Limpia 100% las operaciones de prueba para la Puesta en Producción
"""

import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from database import init_db, SessionLocal, TradeOperation

def wipe_all_trades():
    print("==================================================")
    print("🧹 LIMPIEZA DE OPERACIONES PARA PUESTA EN PRODUCCIÓN")
    print("==================================================")
    
    init_db()
    db = SessionLocal()
    
    try:
        deleted = db.query(TradeOperation).delete()
        db.commit()
        print(f"✅ Se han eliminado exitosamente {deleted} operaciones de la base de datos.")
        print("📌 La tabla 'trade_operations' ha quedado 100% limpia en 0.")
    except Exception as e:
        print(f"❌ Error al limpiar operaciones: {e}")
        db.rollback()
    finally:
        db.close()
    print("==================================================")

if __name__ == "__main__":
    wipe_all_trades()
