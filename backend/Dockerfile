# ============================================
# Dockerfile - Backend (Python API)
# ============================================

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements primeiro (cache)
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copia projeto
COPY . .

EXPOSE 5004

CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:5004", "--workers", "2", "--threads", "2"]