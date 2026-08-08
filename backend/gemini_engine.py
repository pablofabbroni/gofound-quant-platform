"""
gemini_engine.py — Motor de Inferencia de Inteligencia Artificial para Google Gemini API

Proporciona integración nativa de latencia ultra-baja y cero dependencias pesadas
con la API de Google Gemini (3.6 Flash / 2.0 Flash / 3.5 Flash).
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

def load_env_file():
    """Carga variables desde .env si no se han exportado en el entorno."""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    if key not in os.environ:
                        os.environ[key.strip()] = val.strip()

load_env_file()

DEFAULT_SYSTEM_PROMPT = (
    "Eres el Oficial Jefe de Gestión de Riesgos y CEO del Comité Cuantitativo en GoFound Quant Platform.\n"
    "TU OBJETIVO PRINCIPAL: Preservar el capital. NO estás aquí para buscar trades a la fuerza, "
    "sino para detectar CUALQUIER FALLA o RIESGO que invalide la operación.\n"
    "REGLAS DE EVALUACIÓN ESTRICTAS:\n"
    "1. Asume por defecto que el mercado está en RANGO o RUIDO a menos que la confluencia estadística sea incontestable.\n"
    "2. Si detectas contradicción entre los analistas técnicos o eventos macroeconómicos inminentes de alto impacto, tu decisión DEBE SER 'WAIT'.\n"
    "3. Ante la menor duda o falta de evidencia, emite 'WAIT'.\n"
    "4. Responde de forma fría, crítica y concisa."
)

def query_gemini(
    prompt: str,
    system_instruction: str = DEFAULT_SYSTEM_PROMPT,
    model: Optional[str] = None,
    temperature: Optional[float] = None
) -> Dict[str, Any]:
    """
    Envía una consulta a la API de Google Gemini usando REST nativo (urllib).
    Retorna un diccionario con {"success": bool, "text": str, "model_used": str, "error": str}.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        return {"success": False, "text": "", "model_used": "", "error": "GEMINI_API_KEY no encontrada en .env"}

    raw_model = model or os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")
    try:
        temp_val = float(os.environ.get("GEMINI_TEMPERATURE", "0.0")) if temperature is None else temperature
    except ValueError:
        temp_val = 0.0

    # Normalizar lista de candidatos con el prefijo models/
    candidate_models = []
    for m in [raw_model, "gemini-3.6-flash", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"]:
        formatted = m if m.startswith("models/") else f"models/{m}"
        if formatted not in candidate_models:
            candidate_models.append(formatted)

    last_error = ""
    for current_model in candidate_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/{current_model}:generateContent?key={api_key}"
        
        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temp_val,
                "topP": 0.95,
                "maxOutputTokens": 1024
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )

        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                if res.status == 200:
                    data = json.loads(res.read().decode("utf-8"))
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        text_output = "".join([p.get("text", "") for p in parts]).strip()
                        return {
                            "success": True,
                            "text": text_output,
                            "model_used": current_model.replace("models/", ""),
                            "error": ""
                        }
        except urllib.error.HTTPError as http_err:
            try:
                err_body = http_err.read().decode("utf-8")
            except Exception:
                err_body = str(http_err)
            last_error = f"HTTP {http_err.code} en modelo {current_model}: {err_body}"
            if http_err.code in (404, 400):
                continue
            break
        except Exception as e:
            last_error = f"Error en conexión con Gemini ({current_model}): {str(e)}"
            break

    return {
        "success": False,
        "text": "",
        "model_used": "",
        "error": last_error
    }
