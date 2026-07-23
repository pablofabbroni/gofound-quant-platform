from datetime import datetime
import MetaTrader5 as mt5

DATABASE="market_data.db"
BROKER_ID=1
SYMBOLS=["EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF","NZDUSD","EURGBP","EURJPY","GBPJPY","XAUUSD","XAGUSD"]
TIMEFRAMES={
"M1":(mt5.TIMEFRAME_M1,datetime(2020,1,1)),
"M5":(mt5.TIMEFRAME_M5,datetime(2020,1,1)),
"M15":(mt5.TIMEFRAME_M15,datetime(2020,1,1)),
"M30":(mt5.TIMEFRAME_M30,datetime(2020,1,1)),
"H1":(mt5.TIMEFRAME_H1,datetime(2015,1,1)),
"H4":(mt5.TIMEFRAME_H4,datetime(2010,1,1)),
"D1":(mt5.TIMEFRAME_D1,datetime(2010,1,1)),
}
