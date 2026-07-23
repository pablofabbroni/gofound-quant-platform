# GoFound Quant Platform — Frontend & API

Plataforma web de trading cuantitativo con comité de analistas de IA.

## Stack
- **Frontend:** HTML + CSS + JavaScript vanilla
- **Backend:** FastAPI + psycopg2 → TimescaleDB
- **Auth:** JWT (pyjwt) + bcrypt

## Credenciales por defecto
- Email: `admin@gofound.tech`
- Password: `AdminQuant2026!`

## Levantar localmente
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Requiere el túnel SSH activo hacia el VPS TimescaleDB:
```bash
ssh -L 5433:172.16.2.2:5432 root@<VPS_IP> -N
```

## Secciones
1. **Comité de Analistas** — Estado en tiempo real de los 5 analistas IA
2. **Cobertura de Datos** — Rango histórico por par/temporalidad con indicador de collector activo
3. **Laboratorio Backtest** — Simulación histórica con curva de equity y métricas completas
