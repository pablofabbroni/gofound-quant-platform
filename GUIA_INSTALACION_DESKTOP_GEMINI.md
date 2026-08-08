# 📄 Guía de Despliegue y Configuración en la PC de Escritorio (Servidor MT5)

**Proyecto:** GoFound Quant Platform  
**Motor de IA:** Google Gemini API (Modelo: `gemini-3.6-flash`)  
**Fecha de Creación:** Agosto 2026  

---

## 📌 Objetivo
Esta guía detalla los pasos exactos para configurar la **PC de Escritorio** (que actúa como servidor local de trading y MetaTrader 5) con la integración de **Google Gemini 3.6 Flash** desarrollada en la Notebook, liberando el 100% de la memoria RAM/VRAM al eliminar la necesidad de LM Studio u Ollama local.

---

## 🛠️ Paso 1: Sincronizar el Código (Notebook ➔ PC de Escritorio)

En tu **Notebook**, asegúrate de haber subido o guardado los cambios:
```bash
git add .
git commit -m "feat: Integracion de Google Gemini 3.6 Flash en el Agente Cuantitativo"
git push origin main
```

En tu **PC de Escritorio**, abre la terminal en la carpeta de `QuantPlatform` y descarga los cambios:
```bash
git pull origin main
```

---

## 🔑 Paso 2: Crear el archivo `.env` en la PC de Escritorio

Por motivos de seguridad, los archivos de claves (`.env`) no se suben al repositorio. Debes crear manualmente el archivo en la PC de escritorio.

Navega a la carpeta `QuantPlatform/backend/` y crea (o edita) el archivo `.env` incluyendo la siguiente configuración:

```env
# GoFound Quant Platform Backend Environment Settings

# Environment & Server Port
PORT=8000
ENVIRONMENT=development

# Database Settings
DATABASE_URL=postgresql://jasper46:d6eew7wvjpn7od7f2pwyrulgyfiwvkir@127.0.0.1:5433/timescaledb

# Security & Auth
SECRET_KEY=gofound_quant_secret_key_2026_super_secure

# AI Reasoning Engines (Google Gemini Cloud API)
GEMINI_API_KEY=AIzaSyA8nav8Tn3YOM5vd4dB4SJJO9DQ0mQK8uQ
GEMINI_MODEL=gemini-3.6-flash
GEMINI_TEMPERATURE=0.0

# Legacy Local Server Fallbacks
OLLAMA_URL=http://127.0.0.1:1234
OLLAMA_MODEL=DeepSeek-R1-Distill-Llama-8B
```

---

## 🧪 Paso 3: Probar la Conexión en Vivo en la PC de Escritorio

Una vez creado el archivo `.env`, ejecuta la prueba rápida de conexión desde la terminal de la PC de escritorio:

```bash
python backend/test_gemini_connection.py
```

### ✅ Resultado Esperado:
Deberás ver en pantalla una salida similar a esta:

```text
==================================================
GOFOUND QUANT PLATFORM — GEMINI API TEST
==================================================

Enviando consulta de prueba a Gemini...

[SUCCESS] ¡CONEXIÓN EXITOSA CON GEMINI API!
Modelo utilizado: gemini-3.6-flash

Respuesta del Agente Gemini:
**DICTAMEN: WAIT.** Existe una contradicción insalvable entre los analistas y un riesgo macroeconómico crítico por el anuncio de la FED en 15 minutos...
==================================================
```

---

## 🚀 Paso 4: Iniciar los Servicios en la PC de Escritorio

1. **Iniciar el servidor FastAPI Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
2. **Iniciar el Terminal MetaTrader 5** y el recolector de mercado.
3. **Cerrar LM Studio / Ollama:** Ya no es necesario mantenerlos abiertos. Tu PC funcionará fluida y rápida.
