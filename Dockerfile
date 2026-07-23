FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy frontend static files
COPY index.html ./static/index.html
COPY styles.css ./static/styles.css
COPY app.js ./static/app.js

# Copy backend files to WORKDIR root so imports resolve cleanly
RUN cp backend/main.py . && cp backend/auth.py . && cp backend/database.py .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
