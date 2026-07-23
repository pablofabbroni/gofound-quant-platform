import MetaTrader5 as mt5
if not mt5.initialize():
    print(mt5.last_error()); raise SystemExit
print("Conectado", mt5.version())
mt5.shutdown()
