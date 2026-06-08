FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" nats-py asyncpg
COPY apps/web-chat/src/ ./src/
CMD ["python", "src/main.py"]
