import sys
import os

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

from ai_agent_researcher import detect_ai_provider, generate_hypotheses_and_reasoning

def main():
    print("==================================================")
    print("AGENTE DE IA — PRUEBA DE PROVEEDOR DE RAZONAMIENTO")
    print("==================================================")
    
    provider_name, provider_url = detect_ai_provider()
    print(f"Proveedor detectado: {provider_name}")
    print(f"URL del servicio:   {provider_url}")
    
    analyst_name = "Quant-bb"
    current_params = {"rsi_period": "14", "rsi_oversold": "30", "rsi_overbought": "70"}
    baseline_metrics = {"sharpe_ratio": 1.45, "win_rate": 62.5, "net_profit_pct": 8.3}
    
    print("\nGenerando hipótesis con Gemini Cloud API...")
    variations, reasoning = generate_hypotheses_and_reasoning(
        analyst_name, current_params, baseline_metrics, provider_name
    )
    
    print(f"\n{reasoning}")
    print(f"\nVariaciones generadas para testing: {len(variations)} sugerencias")
    print("==================================================")

if __name__ == "__main__":
    main()
