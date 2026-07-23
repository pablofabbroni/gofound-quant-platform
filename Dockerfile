# Stage 1: Build React frontend
FROM node:20-alpine AS frontend
WORKDIR /build
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
RUN cp backend/main.py . && cp backend/auth.py . && cp backend/database.py .

COPY --from=frontend /build/dist ./static

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
