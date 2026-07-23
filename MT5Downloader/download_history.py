from datetime import datetime
from dateutil.relativedelta import relativedelta
import sqlite3,pandas as pd,MetaTrader5 as mt5
from config import *
if not mt5.initialize(): raise Exception(mt5.last_error())
conn=sqlite3.connect(DATABASE);cur=conn.cursor()
cur.executescript("""
CREATE TABLE IF NOT EXISTS symbols(id INTEGER PRIMARY KEY AUTOINCREMENT,symbol TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS timeframes(id INTEGER PRIMARY KEY AUTOINCREMENT,timeframe TEXT UNIQUE);
CREATE TABLE IF NOT EXISTS candles(time INTEGER,symbol_id INTEGER,timeframe_id INTEGER,broker_id INTEGER,open REAL,high REAL,low REAL,close REAL,volume INTEGER,PRIMARY KEY(time,symbol_id,timeframe_id,broker_id));
CREATE INDEX IF NOT EXISTS idx_symbol_tf_time ON candles(symbol_id,timeframe_id,time);
""")
for s in SYMBOLS: cur.execute("INSERT OR IGNORE INTO symbols(symbol) VALUES(?)",(s,))
for t in TIMEFRAMES: cur.execute("INSERT OR IGNORE INTO timeframes(timeframe) VALUES(?)",(t,))
conn.commit()
sid={b:a for a,b in cur.execute("SELECT id,symbol FROM symbols")}
tid={b:a for a,b in cur.execute("SELECT id,timeframe FROM timeframes")}
end=datetime.now()
for sym in SYMBOLS:
    print(sym)
    if not mt5.symbol_select(sym,True): continue
    for name,(tf,start) in TIMEFRAMES.items():
        curdt=start
        while curdt<end:
            nxt=min(curdt+relativedelta(months=1),end)
            rates=mt5.copy_rates_range(sym,tf,curdt,nxt)
            if rates is not None and len(rates):
                df=pd.DataFrame(rates)
                rows=[(int(r.time),sid[sym],tid[name],BROKER_ID,float(r.open),float(r.high),float(r.low),float(r.close),int(r.tick_volume)) for _,r in df.iterrows()]
                cur.executemany("INSERT OR IGNORE INTO candles VALUES(?,?,?,?,?,?,?,?,?)",rows)
                conn.commit()
                print(sym,name,curdt.strftime("%Y-%m"),len(rows))
            curdt=nxt
conn.close();mt5.shutdown()
print("Finalizado")
