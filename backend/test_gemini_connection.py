"""
test_gemini_connection.py — Script de verificación de conexión directa con la API Key de Gemini
"""

import sys
import os

# Set stdout encoding for Windows console compatibility
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from gemini_engine import query_gemini

def main():
    print("==================================================")
    print("GOFOUND QUANT PLATFORM — GEMINI API TEST")
    print("==================================================")
    
    prompt = (
        "Evalúa la siguiente situación hipotética:\n"
        "- Par: EURUSD M15\n"
        "- Analista Quant-bb: BUY (RSI = 28 SOBREVENTA)\n"
        "- Analista Trend-Aligner: SELL (EMA 20 < EMA 50 Tendencia bajista)\n"
        "- Noticia Macro: Anuncio de Tasas de Interés FED en 15 minutos.\n"
        "Emite tu dictamen de Orquestador/Riesgo en 2 oraciones."
    )
    
    print("\nEnviando consulta de prueba a Gemini...")
    res = query_gemini(prompt)
    
    if res["success"]:
        print("\n[SUCCESS] ¡CONEXIÓN EXITOSA CON GEMINI API!")
        print(f"Modelo utilizado: {res['model_used']}")
        print(f"\nRespuesta del Agente Gemini:\n{res['text']}")
        print("\n==================================================")
        sys.exit(0)
    else:
        print("\n[ERROR] FALLO EN LA CONEXIÓN:")
        print(f"Error: {res['error']}")
        print("==================================================")
        sys.exit(1)

if __name__ == "__main__":
    main()
