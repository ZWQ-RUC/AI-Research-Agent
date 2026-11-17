# ==============================================================================
# AI Research Assistant - Windows PowerShell 一键启动脚本 (scripts/start.ps1)
# 默认端口: 后端 http://localhost:8000 | 前端 http://localhost:3000
# ==============================================================================
$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AI Research Assistant - 启动前后端服务 (Windows PowerShell)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

if (-not (Test-Path "$ProjectRoot\.env")) {
    Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
}
if (-not (Test-Path "$ProjectRoot\data\uploads")) {
    New-Item -ItemType Directory -Force -Path "$ProjectRoot\data\uploads" | Out-Null
}

$PythonExe = "python"
if (Test-Path "$ProjectRoot\.venv\Scripts\python.exe") {
    $PythonExe = "$ProjectRoot\.venv\Scripts\python.exe"
}

Write-Host "[1/2] 正在后台启动 FastAPI 后端服务 (http://localhost:8000)..." -ForegroundColor Yellow
$BackendProc = Start-Process -FilePath $PythonExe -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory "$ProjectRoot\backend" -PassThru

Start-Sleep -Seconds 2

Write-Host "[2/2] 正在启动前端服务 (http://localhost:3000)..." -ForegroundColor Yellow
if (Test-Path "$ProjectRoot\frontend\node_modules\next") {
    $FrontendProc = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$ProjectRoot\frontend" -PassThru
} else {
    Write-Host "      使用零依赖高保真前端服务 (node frontend/server.mjs)..." -ForegroundColor Green
    $FrontendProc = Start-Process -FilePath "node" -ArgumentList "server.mjs" -WorkingDirectory "$ProjectRoot\frontend" -PassThru
}

Write-Host ""
Write-Host "服务已启动：" -ForegroundColor Green
Write-Host "  - 前端工作台: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - 后端 API:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  - Swagger文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "按 Enter 键停止所有服务..." -ForegroundColor Yellow
Read-Host | Out-Null

if ($BackendProc -and -not $BackendProc.HasExited) { Stop-Process -Id $BackendProc.Id -Force }
if ($FrontendProc -and -not $FrontendProc.HasExited) { Stop-Process -Id $FrontendProc.Id -Force }
Write-Host "已停止前后端服务。" -ForegroundColor Green
