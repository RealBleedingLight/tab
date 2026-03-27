FROM python:3.11-slim

WORKDIR /app

# System deps (gcc needed for some Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*

# Install local packages first (better layer caching)
COPY gp2tab/ ./gp2tab/
COPY guitar-teacher/ ./guitar-teacher/
RUN pip install --no-cache-dir -e ./gp2tab
RUN pip install --no-cache-dir -e ./guitar-teacher

# Install backend deps
COPY web/backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY web/backend/ ./web/backend/
COPY web/__init__.py ./web/__init__.py

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data/songs

EXPOSE 8000
CMD ["uvicorn", "web.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
