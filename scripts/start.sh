#!/usr/bin/env bash
# ==============================================================================
# AI Research Assistant - WSL2 Ubuntu 24.04 启动脚本 (scripts/start.sh)
# 默认端口: 后端 http://localhost:8000 | 前端 http://localhost:3000
# ==============================================================================
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
fi
mkdir -p "$PROJECT_ROOT/data/uploads"

PYTHON_BIN="python3"
if [ -f "$PROJECT_ROOT/.venv/bin/python" ]; then
    PYTHON_BIN="$PROJECT_ROOT/.venv/bin/python"
fi

echo "============================================================"
echo "  AI Research Assistant - 启动前后端服务 (WSL2 / Linux)"
echo "============================================================"

cleanup() {
    echo ""
    echo "正在停止前后端服务..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "[1/2] 启动 FastAPI 后端服务 (http://localhost:8000)..."
(cd "$PROJECT_ROOT/backend" && PYTHONPATH="$PROJECT_ROOT/backend" "$PYTHON_BIN" -m uvicorn app.main:app --host 0.0.0.0 --port 8000) &
BACKEND_PID=$!

sleep 2

echo "[2/2] 启动前端服务 (http://localhost:3000)..."
if [ -d "$PROJECT_ROOT/frontend/node_modules/next" ]; then
    (cd "$PROJECT_ROOT/frontend" && npm run dev) &
    FRONTEND_PID=$!
else
    (cd "$PROJECT_ROOT/frontend" && BACKEND_URL="http://localhost:8000" PORT=3000 node server.mjs) &
    FRONTEND_PID=$!
fi

echo ""
echo "服务已成功启动："
echo "  - 前端界面:   http://localhost:3000"
echo "  - 后端接口:   http://localhost:8000"
echo "  - API 文档:   http://localhost:8000/docs"
echo "按 Ctrl+C 停止所有服务..."

wait
