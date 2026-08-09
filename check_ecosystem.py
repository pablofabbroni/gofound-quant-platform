"""
check_ecosystem.py — Script de Diagnóstico del Ecosistema GFQP
Ejecuta: python check_ecosystem.py
"""

import sys
import os
import sqlite3
import urllib.request
import json
from datetime import datetime, timezone

print("=" * 70)
print("🔍 DIAGNÓSTICO DEL ECOSISTEMA GOFOUND QUANT PLATFORM (GFQP)")
print("=" * 70)

# 1. Verificar Backend API (Puerto 8000)
backend_ok = False
try:
    req = urllib.request.Request("http://127.0.0.1:8000/docs", method="GET")
    res = urllib.request.urlopen(req, timeout=3)
    if res.status == 200:
        backend_ok = True
        print("🟢 Backend API (Puerto 8000):   [ACTIVO] (FastAPI respondiendo 200 OK)")
except Exception as e:
    print(f"🔴 Backend API (Puerto 8000):   [INACTIVO] ({e})")

# 2. Verificar Frontend Server (Puerto 5173)
frontend_ok = False
try:
    req = urllib.request.Request("http://127.0.0.1:5173/", method="GET")
    res = urllib.request.urlopen(req, timeout=3)
    if res.status == 200:
        frontend_ok = True
        print("🟢 Frontend Web (Puerto 5173):  [ACTIVO] (Servidor Vite respondiendo 200 OK)")
except Exception as e:
    print(f"🔴 Frontend Web (Puerto 5173):  [INACTIVO] ({e})")

# 3. Verificar Procesos en Ejecución (Windows)
try:
    import subprocess
    output = subprocess.check_output('wmic process get commandline,processid', shell=True).decode('utf-8', errors='ignore')
    
    live_loop_active = "live_market_loop.py" in output
    ai_researcher_active = "ai_agent_researcher.py" in output
    
    if live_loop_active:
        print("🟢 Recolector MT5 Mercado Live: [ACTIVO] (live_market_loop.py corriendo)")
    else:
        print("🟡 Recolector MT5 Mercado Live: [DETENIDO] (live_market_loop.py no detectado)")

    if ai_researcher_active:
        print("🟢 Agente Investigador IA:     [ACTIVO] (ai_agent_researcher.py corriendo)")
    else:
        print("🟡 Agente Investigador IA:     [EN ESPERA] (se ejecuta automáticamente cada 4h)")

except Exception as e:
    pass

# 4. Verificar Base de Datos market_data.db
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "market_data.db"))
if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        total_candles = cur.execute("SELECT COUNT(*) FROM candles").fetchone()[0]
        last_ts = cur.execute("SELECT MAX(time) FROM candles").fetchone()[0]
        last_dt = datetime.fromtimestamp(last_ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S") if last_ts else "N/A"
        conn.close()
        print(f"🟢 Base de Datos (SQLite):      [OK] ({total_candles:,} velas | Última: {last_dt} UTC)")
    except Exception as e:
        print(f"🔴 Base de Datos (SQLite):      [ERROR] ({e})")
else:
    print(f"🔴 Base de Datos (SQLite):      [NO ENCONTRADA]")

print("=" * 70)
if not frontend_ok:
    print("👉 ACCIÓN REQUERIDA: Inicia el Frontend ejecutando en la terminal:")
    print("   cd frontend")
    print("   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass")
    print("   npm run dev -- --host")
print("=" * 70)
