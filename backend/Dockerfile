# Backend image (FastAPI + LangGraph). Build context is the project root.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install dependencies first so this layer is cached until requirements change
COPY requirements.txt .
RUN pip install -r requirements.txt

# Run as a non-root user
RUN useradd --create-home --uid 1000 appuser

COPY --chown=appuser:appuser backend/ ./backend/

USER appuser

# The code imports modules relative to backend/ (agents, config, tools)
WORKDIR /app/backend

EXPOSE 8000

# 0.0.0.0 so the port is reachable from outside the container
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
