"""
verify_mt5_demo.py — Script de Verificación de Conexión a MetaTrader 5 (Cuenta Demo)

Este script verifica:
1. Conexión limpia con la terminal de MetaTrader 5 instalada en el servidor local.
2. Información de la cuenta activa (Login, Servidor, Balance, Equidad, Tipo de Cuenta: Demo vs Real).
3. Habilitación de Trading Algoritmitco (Algo Trading Allowed).
4. Descarga de prueba de velas recientes para EURUSD y XAUUSD.
"""

import sys
import os

# Enforce UTF-8 encoding for stdout on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
from datetime import datetime

try:
    import MetaTrader5 as mt5
except ImportError:
    print("ERROR: La libreria MetaTrader5 no esta instalada en el entorno Python.")
    print("Ejecuta: pip install MetaTrader5")
    sys.exit(1)

def verify_connection():
    print("=" * 60)
    print("GOFOUND QUANT PLATFORM - VERIFICADOR DE CONEXION MT5 DEMO")
    print("=" * 60)
    
    # 1. Inicializar conexión con MT5
    if not mt5.initialize():
        error_code, error_msg = mt5.last_error()
        print(f"[ERROR] No se pudo conectar con MetaTrader 5: [{error_code}] {error_msg}")
        print("Asegurate de tener la aplicacion MetaTrader 5 abierta y logueada.")
        return False
        
    terminal_info = mt5.terminal_info()
    print(f"[OK] Conexion con MT5 establecida con exito (Version MT5: {mt5.version()})")
    print(f"   -> Ruta de instalacion: {terminal_info.path}")
    print(f"   -> Algo Trading Habilitado: {'SI' if terminal_info.trade_allowed else 'NO (Habilitar en MT5: Herramientas -> Opciones -> Asesores Expertos)'}")

    # 2. Consultar información de la cuenta
    account_info = mt5.account_info()
    if account_info is None:
        print("[ERROR] No se pudo obtener la informacion de la cuenta activa en MT5.")
        mt5.shutdown()
        return False
        
    trade_mode_str = "DEMO [Pruebas]" if account_info.trade_mode == mt5.ACCOUNT_TRADE_MODE_DEMO else "REAL [Cuidado]"
    
    print("\nINFORMACION DE LA CUENTA CONECTADA:")
    print(f"   - Numero de Cuenta (Login): {account_info.login}")
    print(f"   - Servidor Broker:           {account_info.server}")
    print(f"   - Nombre del Titular:        {account_info.name}")
    print(f"   - Moneda de Cuenta:          {account_info.currency}")
    print(f"   - Tipo de Cuenta:            {trade_mode_str}")
    print(f"   - Apalancamiento:            1:{account_info.leverage}")
    print(f"   - Balance de Cuenta:         ${account_info.balance:,.2f}")
    print(f"   - Equidad Actual:            ${account_info.equity:,.2f}")
    print(f"   - Margen Libre:              ${account_info.margin_free:,.2f}")

    # 3. Probar extracción de velas recientes (EURUSD y XAUUSD)
    print("\nPRUEBA DE EXTRACCION DE VELAS DE MERCADO (M30):")
    for symbol in ["EURUSD", "XAUUSD"]:
        selected = mt5.symbol_select(symbol, True)
        if not selected:
            print(f"   [AVISO] Simbolo {symbol} no encontrado o no habilitado en Market Watch.")
            continue
            
        rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M30, 0, 5)
        if rates is not None and len(rates) > 0:
            df = pd.DataFrame(rates)
            df['time'] = pd.to_datetime(df['time'], unit='s')
            last_candle = df.iloc[-1]
            print(f"   [OK] {symbol} (M30) - Ultima Vela ({last_candle['time']}): Open={last_candle['open']}, High={last_candle['high']}, Low={last_candle['low']}, Close={last_candle['close']}")
        else:
            print(f"   [ERROR] No se pudieron descargar velas M30 para {symbol}.")

    mt5.shutdown()
    print("\n" + "=" * 60)
    print("PRUEBA DE CONEXION COMPLETADA CON EXITO.")
    print("=" * 60)
    return True

if __name__ == "__main__":
    verify_connection()
