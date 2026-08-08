import urllib.request
import json
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

env_path = os.path.join(os.path.dirname(__file__), ".env")
key = ""
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("GEMINI_API_KEY="):
                key = line.split("=", 1)[1].strip()

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode("utf-8"))
        print("MODELOS DISPONIBLES EN TU API KEY:")
        for m in data.get("models", []):
            name = m.get("name", "")
            methods = m.get("supportedGenerationMethods", [])
            if "generateContent" in methods:
                print(f" - {name}")
except Exception as e:
    print(f"Error listando modelos: {e}")
