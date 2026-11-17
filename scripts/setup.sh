#!/usr/bin/env bash
# ==============================================================================
# AI Research Assistant - WSL2 Ubuntu 24.04 环境初始化脚本 (scripts/setup.sh)
# 适配环境: WSL2 Ubuntu 24.04 LTS + Python 3.12 + Node.js 24
# 目标路径: /mnt/c/Work/Papers/AI-Research-Agent
# ==============================================================================
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================================"
echo "  AI Research Assistant - WSL2 Ubuntu 环境初始化 (setup.sh)"
echo "============================================================"
echo "[1/6] 当前项目目录: $PROJECT_ROOT"

# 1. 检查 Python
echo "[2/6] 检查 Python 环境..."
if command -v python3 >/dev/null 2>&1; then
    PY_VER=$(python3 --version)
    echo "      已检测到: $PY_VER"
else
    echo "错误: 未检测到 python3，请先执行 sudo apt update && sudo apt install -y python3 python3-venv python3-pip"
    exit 1
fi

# 2. 检查 Node.js
echo "[3/6] 检查 Node.js 环境..."
if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "      已检测到 Node.js: $NODE_VER"
else
    echo "错误: 未检测到 node，请先安装 Node.js (>=18)"
    exit 1
fi

# 3. 初始化 .env 与数据目录
echo "[4/6] 初始化环境变量与数据存储目录..."
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo "      已从 .env.example 生成默认 .env"
else
    echo "      .env 已存在，跳过覆盖"
fi
mkdir -p "$PROJECT_ROOT/data/uploads"

# 4. 创建 Python 虚拟环境并安装依赖
echo "[5/6] 创建 Python 虚拟环境 (.venv) 并安装后端依赖..."
if [ ! -d "$PROJECT_ROOT/.venv" ]; then
    python3 -m venv "$PROJECT_ROOT/.venv" || true
fi

if [ -f "$PROJECT_ROOT/.venv/bin/pip" ]; then
    "$PROJECT_ROOT/.venv/bin/pip" install --upgrade pip || true
    "$PROJECT_ROOT/.venv/bin/pip" install -r "$PROJECT_ROOT/backend/requirements.txt" || echo "      提示: 离线环境下使用系统已安装 Python 包运行"
else
    pip3 install -r "$PROJECT_ROOT/backend/requirements.txt" || echo "      提示: 离线环境下使用系统已安装 Python 包运行"
fi

# 5. 安装前端依赖
echo "[6/6] 配置前端依赖 (frontend)..."
cd "$PROJECT_ROOT/frontend"
if command -v npm >/dev/null 2>&1; then
    npm install || echo "      提示: 离线或受限网络下将自动使用 node frontend/server.mjs 启动前端"
fi
cd "$PROJECT_ROOT"

echo "============================================================"
echo "  初始化完成！请运行 bash scripts/start.sh 启动服务"
echo "============================================================"
