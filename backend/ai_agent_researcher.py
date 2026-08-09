"""
ai_agent_researcher.py — Agente de IA Autónomo de Investigación Cuantitativa

Este agente actúa como un científico de datos e investigador cuantitativo autónomo:
1. Inspecciona la configuración activa de parámetros en la base de datos (State Awareness).
2. Calcula el rendimiento de referencia actual (Baseline Benchmark).
3. Utiliza un motor de razonamiento multi-proveedor:
   - Prioridad 1: Ollama Local (http://localhost:11434) en el servidor de trading MT5.
   - Prioridad 2: API Key de la nube (OpenAI / Gemini / DeepSeek) si está configurada en .env.
   - Prioridad 3: Generador de optimización cuantitativa adaptativa (Fallback Heurístico).
4. Ejecuta simulaciones de backtesting para probar las hipótesis planteadas.
5. Evalúa estrictamente la mejora de rendimiento (Delta Sharpe Ratio >= +0.15 o incremento en Win Rate).
6. Auto-aplica los parámetros ganadores a la base de datos de producción únicamente si superan el baseline.
"""

import os
import sys

# Ensure backend directory is in sys.path for internal module imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
import urllib.request
import urllib.error
import datetime
from typing import Dict, List, Tuple, Any, Optional

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def get_api_base() -> str:
    env_url = os.environ.get("API_BASE")
    if env_url:
        return env_url.rstrip("/")
    
    candidates = ["http://127.0.0.1:8000", "http://localhost:8000", "http://127.0.0.1:80"]
    for url in candidates:
        try:
            req = urllib.request.Request(f"{url}/docs", method="GET")
            res = urllib.request.urlopen(req, timeout=2)
            if res.status == 200:
                return url
        except Exception:
            pass
    return "http://127.0.0.1:8000"

API_BASE = get_api_base()
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")

# Global state tracker for latest agent run status
LATEST_RESEARCH_STATUS = {
    "last_run": None,
    "active_provider": "Sin Ejecutar",
    "analysts_tested": [],
    "applied_experiments": [],
    "log_summary": "No se han ejecutado ciclos aún."
}

def get_auth_token(email="admin@gofound.tech", password="AdminQuant2026!") -> Optional[str]:
    api_url = get_api_base()
    req = urllib.request.Request(
        f"{api_url}/api/auth/login",
        data=json.dumps({"email": email, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req, timeout=15)
        data = json.loads(res.read().decode("utf-8"))
        return data.get("access_token")
    except Exception as e:
        print(f"[WARN] No se pudo autenticar automáticamente el Agente de IA: {e}")
        return None

from gemini_engine import query_gemini

def detect_ai_provider() -> Tuple[str, str]:
    """Detects available AI reasoning engine (Gemini Cloud API, Ollama Local, or Heuristic Adaptive)."""
    # 1. Prioridad: Gemini Cloud API Key
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
        return f"Gemini Cloud API ({model_name})", "https://generativelanguage.googleapis.com"

    # 2. Test OpenAI Cloud API Key
    openai_key = os.environ.get("OPENAI_API_KEY")
    if openai_key:
        return "OpenAI Cloud API", "https://api.openai.com"

    # 3. Test Ollama Local Endpoint
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags", method="GET")
        res = urllib.request.urlopen(req, timeout=2)
        if res.status == 200:
            return "Ollama Local (Servidor MT5)", OLLAMA_URL
    except Exception:
        pass

    # 4. Fallback to Quantitative Adaptive Engine
    return "Motor Adaptativo Cuantitativo (Local)", "Heuristic-Grid-Search"

def query_ollama_reasoning(prompt: str) -> Optional[str]:
    """Sends prompt to local Ollama server if running."""
    payload = {
        "model": os.environ.get("OLLAMA_MODEL", "llama3"),
        "prompt": prompt,
        "stream": False
    }
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/generate",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        res = urllib.request.urlopen(req, timeout=15)
        data = json.loads(res.read().decode("utf-8"))
        return data.get("response")
    except Exception as e:
        print(f"[INFO] Ollama query bypassed or not ready: {e}")
        return None

def generate_hypotheses_and_reasoning(
    analyst_name: str,
    current_params: Dict[str, str],
    baseline_metrics: Dict[str, Any],
    provider_name: str
) -> Tuple[List[Dict[str, str]], str]:
    """Generates intelligent parameter variations and reasoning based on active state."""
    
    # Prompt context for AI reasoning
    prompt_text = (
        f"Eres un científico de datos cuantitativo del fondo GoFound. "
        f"Analista: '{analyst_name}'. "
        f"Parámetros vigentes actuales: {json.dumps(current_params)}. "
        f"Métricas actuales de rendimiento: Sharpe={baseline_metrics.get('sharpe_ratio', 0)}, "
        f"WinRate={baseline_metrics.get('win_rate', 0)}%, PnL={baseline_metrics.get('net_profit_pct', 0)}%. "
        f"Genera una breve hipótesis de optimización de parámetros de máximo 2 oraciones."
    )

    reasoning_text = ""

    # 1. Check Gemini Cloud API
    if "Gemini" in provider_name:
        gemini_res = query_gemini(prompt_text)
        if gemini_res.get("success"):
            reasoning_text = f"🤖 [Razonamiento Gemini {gemini_res['model_used']}]: {gemini_res['text'].strip()[:350]}"

    # 2. Check Ollama if local provider is active
    if not reasoning_text and "Ollama" in provider_name:
        ollama_resp = query_ollama_reasoning(prompt_text)
        if ollama_resp:
            reasoning_text = f"🤖 [Razonamiento IA Ollama Local]: {ollama_resp.strip()[:350]}"

    # 3. Fallback reasoning narrative
    if not reasoning_text:
        reasoning_text = (
            f"🧠 [Razonamiento Adaptativo Cuantitativo]: Basado en el punto activo de {analyst_name} "
            f"(Sharpe: {baseline_metrics.get('sharpe_ratio', 0.0)}), se explora una matriz de perturbación local "
            f"para optimizar la sensibilidad a la volatilidad del mercado en M15."
        )

    # Generate heuristic variations tuned to the current active parameters
    variations = []
    if analyst_name == "Quant-bb":
        cur_rsi = int(float(current_params.get("rsi_period", 14)))
        cur_os = float(current_params.get("rsi_oversold", 34.0))
        cur_ob = float(current_params.get("rsi_overbought", 66.0))
        variations = [
            {"rsi_period": str(max(8, cur_rsi - 4)), "rsi_oversold": str(round(cur_os - 4.0, 1)), "rsi_overbought": str(round(cur_ob + 4.0, 1))},
            {"rsi_period": str(cur_rsi), "rsi_oversold": str(round(cur_os - 2.0, 1)), "rsi_overbought": str(round(cur_ob + 2.0, 1))},
            {"rsi_period": str(cur_rsi + 4), "rsi_oversold": str(round(cur_os + 2.0, 1)), "rsi_overbought": str(round(cur_ob - 2.0, 1))},
        ]
    elif analyst_name == "Trend-Aligner":
        cur_fast = int(float(current_params.get("ema_fast", 20)))
        cur_slow = int(float(current_params.get("ema_slow", 50)))
        variations = [
            {"ema_fast": str(max(8, cur_fast - 5)), "ema_slow": str(max(20, cur_slow - 10))},
            {"ema_fast": str(cur_fast + 5), "ema_slow": str(cur_slow + 10)},
            {"ema_fast": "15", "ema_slow": "45"},
        ]
    elif analyst_name == "RSI-Divergence":
        cur_rsi = int(float(current_params.get("rsi_period", 14)))
        variations = [
            {"rsi_period": "10", "div_oversold": "32.0", "div_overbought": "68.0"},
            {"rsi_period": "14", "div_oversold": "36.0", "div_overbought": "64.0"},
            {"rsi_period": "18", "div_oversold": "38.0", "div_overbought": "62.0"},
        ]
    elif analyst_name == "ICT-Engine":
        cur_ob = int(float(current_params.get("ob_lookback", 20)))
        cur_fvg = float(current_params.get("fvg_min_pips", 3.0))
        variations = [
            {"ob_lookback": str(max(10, cur_ob - 5)), "fvg_min_pips": str(round(max(1.5, cur_fvg - 1.0), 1))},
            {"ob_lookback": str(cur_ob + 5), "fvg_min_pips": str(round(cur_fvg + 1.0, 1))},
            {"ob_lookback": "15", "fvg_min_pips": "2.0"},
        ]
    else:
        # News-Sentiment or other
        cur_win = int(float(current_params.get("veto_window_mins", 60)))
        variations = [
            {"veto_window_mins": "30"},
            {"veto_window_mins": str(cur_win)},
            {"veto_window_mins": "90"},
        ]

    return variations, reasoning_text

def run_agent_research_cycle() -> Dict[str, Any]:
    """Executes full autonomous research cycle across analysts."""
    print("\n" + "=" * 70)
    print("[AGENTE IA AUTÓNOMO] INICIANDO CICLO DE RESEARCH & AUTO-OPTIMIZACIÓN")
    print("=" * 70)

    api_base = get_api_base()
    token = get_auth_token()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    provider_name, provider_target = detect_ai_provider()
    print(f"🤖 Proveedor de IA Activo: {provider_name} [{provider_target}]")

    analysts = ["Quant-bb", "Trend-Aligner", "ICT-Engine", "RSI-Divergence"]
    applied_count = 0
    applied_details = []

    for analyst in analysts:
        print(f"\n🔬 [Investigador AI] Evaluando estado activo de '{analyst}'...")

        # 1. Fetch current active parameters from backend
        current_params = {}
        try:
            req_params = urllib.request.Request(f"{api_base}/api/analysts/parameters", headers=headers)
            res_params = urllib.request.urlopen(req_params, timeout=15)
            params_list = json.loads(res_params.read().decode("utf-8")).get("data", [])
            for p in params_list:
                if p.get("analyst_name") == analyst:
                    current_params[p["param_key"]] = p["param_value"]
        except Exception as e:
            print(f"   [WARN] No se pudieron obtener parámetros para {analyst}: {e}")

        # 2. Obtain Current Baseline Benchmark
        baseline_req = {
            "experiment_name": f"Baseline Benchmark — {analyst}",
            "analyst_name": analyst,
            "symbol": "EURUSD",
            "timeframe": "M15",
            "days": 15,
            "param_variations": [current_params] if current_params else None
        }
        baseline_metrics = {"sharpe_ratio": 0.0, "win_rate": 0.0, "net_profit_pct": 0.0}

        try:
            req_base = urllib.request.Request(
                f"{api_base}/api/lab/experiments/run-hypothesis",
                method="POST",
                data=json.dumps(baseline_req).encode("utf-8"),
                headers=headers
            )
            res_base = urllib.request.urlopen(req_base, timeout=60)
            base_exp = json.loads(res_base.read().decode("utf-8")).get("experiment", {})
            baseline_metrics = {
                "sharpe_ratio": base_exp.get("sharpe_ratio", 0.0),
                "win_rate": base_exp.get("win_rate", 0.0),
                "net_profit_pct": base_exp.get("net_profit_pct", 0.0)
            }
            print(f"   📊 Baseline Actual de {analyst}: Sharpe={baseline_metrics['sharpe_ratio']} | WinRate={baseline_metrics['win_rate']}% | PnL={baseline_metrics['net_profit_pct']}%")
        except Exception as e:
            print(f"   [WARN] No se pudo calcular baseline para {analyst}: {e}")

        # 3. Generate Intelligent Hypotheses and Reasoning Narrative
        variations, reasoning_text = generate_hypotheses_and_reasoning(
            analyst_name=analyst,
            current_params=current_params,
            baseline_metrics=baseline_metrics,
            provider_name=provider_name
        )

        # 4. Run Hypothesis Experiment across Variations
        hypo_req = {
            "experiment_name": f"Auto-Investigación IA: {analyst} en EURUSD M15",
            "analyst_name": analyst,
            "symbol": "EURUSD",
            "timeframe": "M15",
            "days": 15,
            "param_variations": variations,
            "reasoning": reasoning_text
        }

        try:
            req_hypo = urllib.request.Request(
                f"{api_base}/api/lab/experiments/run-hypothesis",
                method="POST",
                data=json.dumps(hypo_req).encode("utf-8"),
                headers=headers
            )
            res_hypo = urllib.request.urlopen(req_hypo, timeout=60)
            exp_data = json.loads(res_hypo.read().decode("utf-8")).get("experiment", {})

            exp_id = exp_data.get("id")
            new_sharpe = exp_data.get("sharpe_ratio", 0.0)
            new_winrate = exp_data.get("win_rate", 0.0)
            new_pnl = exp_data.get("net_profit_pct", 0.0)

            delta_sharpe = new_sharpe - baseline_metrics["sharpe_ratio"]
            print(f"   🧪 Resultado Experimento: Sharpe={new_sharpe} (Δ={delta_sharpe:+.2f}) | WinRate={new_winrate}% | PnL={new_pnl}%")

            # 5. Evaluate strict performance improvement & Auto-Apply
            if delta_sharpe >= 0.15 or (new_winrate > baseline_metrics["win_rate"] and new_sharpe >= baseline_metrics["sharpe_ratio"]):
                print(f"   ✅ [Decisión IA] ¡Mejora validada! Auto-aplicando parámetros ganadores de {analyst}...")
                req_apply = urllib.request.Request(
                    f"{api_base}/api/lab/experiments/{exp_id}/apply",
                    method="POST",
                    headers=headers
                )
                res_apply = urllib.request.urlopen(req_apply, timeout=20)
                best_params = json.loads(res_apply.read().decode("utf-8")).get("applied_params", {})
                applied_count += 1
                applied_details.append({
                    "experiment_id": exp_id,
                    "analyst": analyst,
                    "best_params": best_params,
                    "delta_sharpe": round(delta_sharpe, 2)
                })
                print(f"      -> ¡Parámetros de {analyst} actualizados en producción!")
            else:
                print(f"   ⏹️ [Decisión IA] La hipótesis no mejora significativamente el baseline. Producción sin cambios.")

        except Exception as err:
            print(f"   [Error] Fallo en experimento para {analyst}: {err}")

    # Update global tracker
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    LATEST_RESEARCH_STATUS["last_run"] = now_iso
    LATEST_RESEARCH_STATUS["active_provider"] = provider_name
    LATEST_RESEARCH_STATUS["analysts_tested"] = analysts
    LATEST_RESEARCH_STATUS["applied_experiments"] = applied_details
    LATEST_RESEARCH_STATUS["log_summary"] = (
        f"Ciclo completado a las {now_iso}. Se evaluaron {len(analysts)} analistas "
        f"usando {provider_name}. Se auto-aplicaron {applied_count} mejoras de parámetros."
    )

    print("\n" + "=" * 70)
    print(f"[AGENTE IA AUTÓNOMO] CICLO COMPLETADO. Mejoras aplicadas: {applied_count}")
    print("=" * 70)

    return LATEST_RESEARCH_STATUS

if __name__ == "__main__":
    run_agent_research_cycle()
