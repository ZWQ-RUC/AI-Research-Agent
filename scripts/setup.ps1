# ==============================================================================
# AI Research Assistant - Windows PowerShell 环境初始化脚本 (scripts/setup.ps1)
# 适配环境: Windows 11 + Python 3.12 + Node.js 24 + npm 12
# 目标路径: C:\Work\Papers\AI-Research-Agent
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AI Research Assistant - Windows 本地环境初始化 (setup.ps1)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot
Write-Host "[1/6] 当前项目目录: $ProjectRoot" -ForegroundColor Green

# 1. 检查 Python
Write-Host "[2/6] 检查 Python 环境..." -ForegroundColor Yellow
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pyVer = python --version
    Write-Host "      已检测到: $pyVer" -ForegroundColor Green
} else {
    Write-Error "未检测到 python 命令，请确认已安装 Python 3.11/3.12 并加入 PATH。"
}

# 2. 检查 Node.js 与 npm
Write-Host "[3/6] 检查 Node.js 与 npm 环境..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    $npmVer = npm -v
    Write-Host "      已检测到 Node.js: $nodeVer, npm: $npmVer" -ForegroundColor Green
} else {
    Write-Error "未检测到 node 命令，请确认已安装 Node.js。"
}

# 3. 准备环境变量文件 .env 和数据目录
Write-Host "[4/6] 初始化环境变量与数据存储目录..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectRoot\.env")) {
    Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
    Write-Host "      已从 .env.example 生成默认 .env 配置文件" -ForegroundColor Green
} else {
    Write-Host "      .env 已存在，跳过覆盖" -ForegroundColor Gray
}

if (-not (Test-Path "$ProjectRoot\data\uploads")) {
    New-Item -ItemType Directory -Force -Path "$ProjectRoot\data\uploads" | Out-Null
}

# 4. 创建 Python 虚拟环境并安装后端依赖
Write-Host "[5/6] 配置 Python 虚拟环境 (.venv) 并安装后端依赖..." -ForegroundColor Yellow
if (-not (Test-Path "$ProjectRoot\.venv")) {
    python -m venv "$ProjectRoot\.venv"
    Write-Host "      已创建虚拟环境: $ProjectRoot\.venv" -ForegroundColor Green
}

& "$ProjectRoot\.venv\Scripts\python.exe" -m pip install --upgrade pip
& "$ProjectRoot\.venv\Scripts\pip.exe" install -r "$ProjectRoot\backend\requirements.txt"
Write-Host "      后端 Python 依赖安装完成" -ForegroundColor Green

# 5. 安装前端依赖
Write-Host "[6/6] 检查前端依赖 (frontend)..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
if (Test-Path "package.json") {
    Write-Host "      正在执行 npm install (若网络受限，start.ps1 亦支持零依赖内置服务模式)..." -ForegroundColor Gray
    try {
        npm install
        Write-Host "      前端 npm 依赖安装完成" -ForegroundColor Green
    } catch {
        Write-Host "      提示: npm install 未完成，启动时将自动使用内置前端服务 server.mjs" -ForegroundColor Yellow
    }
}
Set-Location $ProjectRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  初始化完成！请运行 .\scripts\start.ps1 启动前后端服务" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
