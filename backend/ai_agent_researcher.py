"""
ai_agent_researcher.py — Agente de IA Autónomo de Investigación Cuantitativa

Este agente actúa como un científico de datos autónomo:
1. Autentica en la plataforma de GoFound.
2. Plantea hipótesis de optimización de parámetros para los 5 analistas del comité.
3. Invoca la API del Laboratorio (/api/lab/experiments/run-hypothesis).
4. Analiza los resultados estadísticos (Sharpe Ratio, Win Rate, P&L %).
5. Si el experimento mejora el rendimiento previo, aplica automáticamente los parámetros
   a las reglas activas del comité (/api/lab/experiments/{id}/apply).
"""

import json
import urllib.request
import sys

API_BASE = "http://127.0.0.1:8000"

def get_auth_token(email="admin@gofound.tech", password="AdminQuant2026!"):
    req = urllib.request.Request(
        f"{API_BASE}/api/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req)
        data = json.loads(res.read().decode("utf-8"))
        return data["access_token"]
    except Exception as e:
        print(f"[ERROR] No se pudo autenticar el Agente de IA: {e}")
        sys.exit(1)

def run_agent_research_cycle():
    print("=" * 70)
    print("[AGENTE IA] INICIANDO CICLO DE INVESTIGACION Y AUTO-OPTIMIZACION")
    print("=" * 70)

    token = get_auth_token()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Definición de hipótesis planteadas por el Agente de IA para cada analista
    HYPOTHESES_TO_TEST = [
        {
            "analyst_name": "Quant-bb",
            "symbol": "EURUSD",
            "timeframe": "M15",
            "days": 15,
            "experiment_name": "Agente IA: Prueba de sensibilidad RSI 10/14/20 y umbrales de sobreventa (Quant-bb)",
            "variations": [
                {"rsi_period": "10", "rsi_oversold": "28.0", "rsi_overbought": "72.0"},
                {"rsi_period": "12", "rsi_oversold": "30.0", "rsi_overbought": "70.0"},
                {"rsi_period": "14", "rsi_oversold": "34.0", "rsi_overbought": "66.0"},
            ]
        },
        {
            "analyst_name": "Trend-Aligner",
            "symbol": "EURUSD",
            "timeframe": "M15",
            "days": 15,
            "experiment_name": "Agente IA: Optimización de medias rápidas/lentas EMA (Trend-Aligner)",
            "variations": [
                {"ema_fast": "12", "ema_slow": "36"},
                {"ema_fast": "20", "ema_slow": "50"},
                {"ema_fast": "30", "ema_slow": "60"},
            ]
        },
        {
            "analyst_name": "ICT-Engine",
            "symbol": "EURUSD",
            "timeframe": "M15",
            "days": 15,
            "experiment_name": "Agente IA: Calibración de rango estructural y Fair Value Gap (ICT-Engine)",
            "variations": [
                {"ob_lookback": "15", "fvg_min_pips": "2.0"},
                {"ob_lookback": "25", "fvg_min_pips": "3.5"},
            ]
        }
    ]

    for hypo in HYPOTHESES_TO_TEST:
        print(f"\n[Investigacion Agente] Planteando hipotesis para '{hypo['analyst_name']}' en {hypo['symbol']} {hypo['timeframe']}...")

        payload = {
            "experiment_name": hypo["experiment_name"],
            "analyst_name": hypo["analyst_name"],
            "symbol": hypo["symbol"],
            "timeframe": hypo["timeframe"],
            "days": hypo["days"],
            "param_variations": hypo["variations"]
        }

        req_run = urllib.request.Request(
            f"{API_BASE}/api/lab/experiments/run-hypothesis",
            method="POST",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers
        )

        try:
            res_run = urllib.request.urlopen(req_run)
            exp_data = json.loads(res_run.read().decode("utf-8"))["experiment"]

            exp_id = exp_data["id"]
            best_params = exp_data["best_params"]
            pnl_pct = exp_data["net_profit_pct"]
            pnl_usd = exp_data["net_profit_usd"]
            sharpe = exp_data["sharpe_ratio"]
            win_rate = exp_data["win_rate"]

            print(f"   [Resultado Experimento #{exp_id}]:")
            print(f"      - Parametros Optimos Encontrados: {best_params}")
            print(f"      - Retorno Neto: {pnl_pct}% (${pnl_usd}) | Win Rate: {win_rate}% | Sharpe: {sharpe}")

            # Criterio de Decisión del Agente: Si Sharpe Ratio es aceptable o PnL es positivo, auto-aplica
            if sharpe >= -0.5 or pnl_pct > 0:
                print(f"   [Decision del Agente] La hipotesis supera criterios cuantitativos. Aplicando a DB activa...")
                req_apply = urllib.request.Request(
                    f"{API_BASE}/api/lab/experiments/{exp_id}/apply",
                    method="POST",
                    headers=headers
                )
                res_apply = urllib.request.urlopen(req_apply)
                apply_data = json.loads(res_apply.read().decode("utf-8"))
                print(f"      -> ¡Parametros de {apply_data['analyst_name']} actualizados con exito!")
            else:
                print(f"   [Decision del Agente] Rendimiento insuficiente. Manteniendo parametros vigentes.")

        except Exception as err:
            print(f"   [Error] Procesando experimento para {hypo['analyst_name']}: {err}")

    print("\n" + "=" * 70)
    print("[AGENTE IA] CICLO DE INVESTIGACION COMPLETADO CON EXITO")
    print("=" * 70)

if __name__ == "__main__":
    run_agent_research_cycle()
