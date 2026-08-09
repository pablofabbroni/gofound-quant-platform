# 🚀 GUÍA PASO A PASO: ACTIVACIÓN Y PUESTA EN MARCHA DEL ECOSISTEMA GFQP
**GoFound Quant Platform v2.0**

Esta guía contiene las instrucciones exactas para encender y dejar corriendo todo el ecosistema de investigación cuantitativa, inteligencia artificial (Gemini 3.6 Flash) y trading automático en tiempo real.

---

## 📊 PASO 0: VERIFICACIÓN Y ACTUALIZACIÓN DE VELAS HISTÓRICAS

Antes de encender el sistema, las velas del mercado deben estar almacenadas en la base de datos `market_data.db`.

1. **Estado Actual de las Velas:**
   - La base de datos ya cuenta con **+3,300,000 velas históricas** cargadas hasta el **07 de Agosto de 2026** (cierre de mercado del último viernes).
   - **No necesitas volver a descargar el historial completo cada vez que enciendas.**

2. **¿Cuándo actualizar las velas?**
   Si la computadora estuvo apagada durante varios días o semanas y deseas descargar todo el historial masivo de velas faltantes desde MT5, ejecuta:
   ```powershell
   & "$env:LocalAppData\Programs\Python\Python312\python.exe" MT5Downloader/download_history.py
   ```

---

## ⚙️ PASO A PASO: PUESTA EN MARCHA DEL SISTEMA

### 1️⃣ Abrir MetaTrader 5 (MT5)
- Inicia la aplicación **MetaTrader 5** en tu computadora.
- Verifica que el estado en la esquina inferior derecha muestre conexión activa con tu broker (cuenta demo o live).

---

### 2️⃣ Iniciar las Terminales de Ejecución (PowerShell)

Abre **3 o 4 ventanas de terminal PowerShell** en la carpeta del proyecto (`C:\Users\Albertingo\Desktop\GFQP`) y ejecuta cada comando:

#### 🟢 TERMINAL 1: Servidor Backend API (IA + Consenso)
```powershell
& "$env:LocalAppData\Programs\Python\Python312\python.exe" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
> **Función:** Es el núcleo del sistema. Servidor FastAPI que procesa el motor de decisiones de Gemini 3.6 Flash, los 5 analistas cuantitativos, telemetría y API.

---

#### 🟢 TERMINAL 2: Recolector de Mercado MT5 en Vivo
```powershell
& "$env:LocalAppData\Programs\Python\Python312\python.exe" live_market_loop.py
```
> **Función:** Conecta con MT5 y descarga automáticamente en tiempo real cada vela que cierra en los pares monitoreados (`EURUSD`, `GBPUSD`, `USDJPY`, `XAUUSD`, etc.).

---

#### 🟢 TERMINAL 3: Servidor Web Frontend (Acceso PC y Celular)
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
cd frontend
npm run dev -- --host
```
> **Función:** Servidor de desarrollo Vite de la plataforma web. Permite acceder a la interfaz tanto desde tu computadora como desde tu teléfono inteligente.

---

#### 🟢 TERMINAL 4 (Opcional): Agente Investigador Autónomo IA
```powershell
& "$env:LocalAppData\Programs\Python\Python312\python.exe" backend/ai_agent_researcher.py
```
> **Función:** Lanza un ciclo manual instantáneo donde Gemini 3.6 Flash evalúa y auto-aplica hipótesis de optimización de parámetros cuantitativos.

---

## 📱 ACCESO DESDE TU CELULAR (RED WI-FI LOCAL)

Para monitorear el sistema en tiempo real desde tu teléfono mientras la PC queda encendida:

1. Conecta tu celular a la **misma red Wi-Fi** que la computadora.
2. Abre tu navegador web en el teléfono (Chrome, Safari, Firefox, etc.).
3. Ingresa a la siguiente dirección:

👉 **`http://192.168.0.12:5173`**

---

## 🔍 DIAGNÓSTICO Y VERIFICACIÓN EN TIEMPO REAL

Para comprobar en cualquier momento si todos los componentes del sistema están funcionando correctamente:

Abre una terminal y ejecuta:
```powershell
& "$env:LocalAppData\Programs\Python\Python312\python.exe" check_ecosystem.py
```

El script te mostrará una tabla con el estado de:
- 🟢 Backend API (Puerto 8000)
- 🟢 Frontend Web (Puerto 5173)
- 🟢 Recolector MT5 Live
- 🟢 Base de Datos SQLite (Conteo y fecha de la última vela)
