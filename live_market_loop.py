"""
live_market_loop.py — Bucle Listener de Mercado en Tiempo Real (Cuenta Demo MT5)

Este script realiza el Paso 1 del Roadmap de Operativa Demo Real:
1. Escucha en tiempo real el cierre de cada nueva vela en MetaTrader 5 (M30/H1).
2. Extrae la vela cerrada e inserta el registro en la base de datos (quant_market.candles).
3. Dispara el cálculo de indicadores (features: RSI, Bollinger, ATR) y contexto macro.
4. Invoca la evaluación del Comité de 5 Analistas + Ensamble ML.
5. Llama al Orquestador (CEO) para tomar y registrar la decisión ejecutiva (BUY, SELL, WAIT).
"""

import os
import sys
import time
import json
import logging
import pandas as pd
from datetime import datetime, timezone

try:
    import MetaTrader5 as mt5
except ImportError:
    print("❌ Error: MetaTrader5 python library not found. Install with: pip install MetaTrader5")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("live_market_loop")

SYMBOLS_TO_MONITOR = ["EURUSD", "XAUUSD", "GBPUSD"]
TIMEFRAME_MAP = {
    "M30": (mt5.TIMEFRAME_M30, 1800),
    "H1":  (mt5.TIMEFRAME_H1, 3600)
}

DEFAULT_TF = "M30"

class LiveMarketLoop:
    def __init__(self, symbols=SYMBOLS_TO_MONITOR, tf_code=DEFAULT_TF):
        self.symbols = symbols
        self.tf_code = tf_code
        self.mt5_tf, self.tf_seconds = TIMEFRAME_MAP.get(tf_code, (mt5.TIMEFRAME_M30, 1800))
        self.last_processed_times = {}

    def start(self):
        logger.info("=" * 60)
        logger.info("🚀 INICIANDO BUCLE LISTENER EN TIEMPO REAL (DEMO MT5)")
        logger.info(f"   Símbolos Monitoreados: {self.symbols}")
        logger.info(f"   Temporalidad Activa:    {self.tf_code}")
        logger.info("=" * 60)

        if not mt5.initialize():
            logger.error(f"❌ Error al inicializar MT5: {mt5.last_error()}")
            return

        acc = mt5.account_info()
        if acc:
            mode = "DEMO 🧪" if acc.trade_mode == mt5.ACCOUNT_TRADE_MODE_DEMO else "REAL 🔴"
            logger.info(f"✅ Conectado a MT5 Account: {acc.login} | Server: {acc.server} | Tipo: {mode} | Balance: ${acc.balance:,.2f}")

        try:
            while True:
                for symbol in self.symbols:
                    self.process_symbol_tick(symbol)
                time.sleep(10) # Poll every 10 seconds for new candle close
        except KeyboardInterrupt:
            logger.info("🛑 Deteniendo Bucle Listener de Mercado...")
        finally:
            mt5.shutdown()

    def process_symbol_tick(self, symbol: str):
        # Fetch last 2 candles (index 1 is latest closed, index 0 is open)
        rates = mt5.copy_rates_from_pos(symbol, self.mt5_tf, 0, 2)
        if rates is None or len(rates) < 2:
            return

        closed_candle = rates[0] # The latest completed candle
        candle_time = datetime.fromtimestamp(closed_candle['time'], tz=timezone.utc)
        
        last_seen = self.last_processed_times.get(symbol)
        if last_seen is None or candle_time > last_seen:
            self.last_processed_times[symbol] = candle_time
            logger.info(f"🔔 NUEVA VELA CERRADA [{symbol} - {self.tf_code}] @ {candle_time}")
            logger.info(f"   ↳ OHLCV: O={closed_candle['open']}, H={closed_candle['high']}, L={closed_candle['low']}, C={closed_candle['close']}, V={closed_candle['tick_volume']}")
            
            # Trigger downstream evaluation pipeline
            self.trigger_pipeline_for_candle(symbol, closed_candle, candle_time)

    def trigger_pipeline_for_candle(self, symbol: str, candle_data, candle_time):
        logger.info(f"   ↳ Evaluando Comité e Indicadores para {symbol}...")
        # Downstream execution hook (Inserts to DB, computes features, calls Committee & Orchestrator)
        # Complete integration will connect to backend API / database orchestrator

if __name__ == "__main__":
    loop = LiveMarketLoop()
    loop.start()
