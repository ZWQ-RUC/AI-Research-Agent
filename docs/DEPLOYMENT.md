# AI Research Assistant —— 安全与部署指南（Deployment Guide）

> **文档路径**：`docs/DEPLOYMENT.md`  
> **适用环境**：Windows 11 PowerShell / WSL2 Ubuntu 24.04 LTS / Linux 云服务器

---

## 一、本地快速部署方案（Windows 11 & WSL2 双平台）

### 方案 A：Windows 11 PowerShell 部署（推荐路径：`C:\Work\Papers\AI-Research-Agent`）

1. **解压项目**：将 `AI-Research-Agent.zip` 解压至 `C:\Work\Papers\AI-Research-Agent`。
2. **打开 PowerShell**：
   ```powershell
   cd C:\Work\Papers\AI-Research-Agent
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```
3. **执行环境初始化**：
   ```powershell
   .\scripts\setup.ps1
   ```
4. **（可选）配置 `.env` 环境变量**：
   编辑根目录下的 `.env` 文件，填入您的 OpenAI 兼容 API Key，或确认本地 Ollama (`http://localhost:11434`, `qwen3:4b`) 正在运行。即使不填任何 API Key，系统也可正常启动并运行基础解析功能。
5. **一键启动前后端**：
   ```powershell
   .\scripts\start.ps1
   ```

### 方案 B：WSL2 Ubuntu 24.04 部署（推荐路径：`/mnt/c/Work/Papers/AI-Research-Agent`）

1. **进入项目目录**：
   ```bash
   cd /mnt/c/Work/Papers/AI-Research-Agent
   ```
2. **执行初始化脚本**：
   ```bash
   bash scripts/setup.sh
   ```
3. **一键启动前后端服务**：
   ```bash
   bash scripts/start.sh
   ```
4. **浏览器访问地址**：
   - **前端工作台**：`http://localhost:3000`
   - **后端 API 根地址**：`http://localhost:8000`
   - **Swagger 接口文档**：`http://localhost:8000/docs`

---

## 二、生产环境部署架构方案（前端 + 后端）

> **说明**：公网部署非当前交付的强制前置条件，本项目不包含任何伪造的公网 URL。当您需要将本项目部署至校园网服务器或云服务器（如阿里云/腾讯云 Ubuntu 24.04 实例）时，请参考以下标准生产部署方案：

### 1. 前端部署方案
- **方式一（Node.js 独立进程 + Nginx 反向代理）**：
  - 在 `frontend/` 目录设置环境变量 `NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api-backend`，执行 `npm run build && npm run start -p 3000`（或使用 `pm2 start server.mjs --name research-frontend`）。
- **方式二（Vercel / 静态托管）**：
  - 将 `frontend/` 连接至托管平台，配置 `NEXT_PUBLIC_API_BASE_URL` 指向后端 HTTPS 域名。

### 2. 后端部署方案
- 使用 `systemd` 或 `supervisor` 守护 Gunicorn + Uvicorn Worker 进程：
  ```bash
  cd /opt/AI-Research-Agent/backend
  /opt/AI-Research-Agent/.venv/bin/gunicorn app.main:app \
      --workers 2 \
      --worker-class uvicorn.workers.UvicornWorker \
      --bind 127.0.0.1:8000 \
      --timeout 120
  ```

---

## 三、核心环境变量说明（Environment Variables）

| 变量名 | 默认值 | 作用说明 |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | `auto` | 模型路由策略：`auto`（自动检测 API Key -> Ollama -> 原文提取）、`openai`、`ollama`、`heuristic` |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | OpenAI 兼容接口地址（如 DeepSeek: `https://api.deepseek.com/v1`） |
| `LLM_API_KEY` | *(空)* | 仅在后端读取的 API 密钥，严禁暴露给前端 |
| `LLM_MODEL` | `gpt-4o-mini` | 远程调用的模型名称（如 `deepseek-chat`、`gpt-4o-mini`） |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | 本地 Ollama 服务地址（WSL2 访问宿主机 Ollama 可设为宿主机 IP 或 `localhost`） |
| `OLLAMA_MODEL` | `qwen3:4b` | 本地默认轻量级大模型（适配 4GB 显存） |
| `EMBEDDING_PROVIDER` | `none` | 检索策略：`none`（默认本地 BM25/TF-IDF）或 `bge-m3` |
| `DATABASE_URL` | `sqlite:///./data/research_assistant.db` | SQLite 数据库存储路径 |
| `MAX_UPLOAD_SIZE_MB` | `30` | 单个 PDF 上传大小上限（MB） |
| `CORS_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | 允许跨域访问的前端域名列表 |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | 前端请求后端的基准 URL |

---

## 四、安全策略与运维规范

1. **文件上传限制与隔离**：
   - Nginx 层配置 `client_max_body_size 30M;`，后端应用层 `file_validator.py` 同步校验 `MAX_UPLOAD_SIZE_MB=30`。
   - 仅允许 `.pdf` 扩展名且文件头前 5 字节为 `%PDF-` 的真实 PDF 文件。
   - 所有上传文件通过 `uuid4().hex + ".pdf"` 重命名后存入独立的 `data/uploads/` 目录，禁止直接执行或按用户输入路径读取文件。
2. **CORS 跨域控制**：
   - FastAPI `CORSMiddleware` 仅放行 `CORS_ORIGINS` 中明确配置的受信前端源，生产环境严禁配置为 `*` 同时开启凭据。
3. **HTTPS 传输加密**：
   - 公网部署时通过 Nginx / Caddy 配置 TLS 1.2/1.3 证书（Let's Encrypt），强制将 HTTP 301 重定向至 HTTPS。
4. **数据持久化与备份**：
   - 所有业务数据存储于 `data/research_assistant.db`，上传 PDF 存储于 `data/uploads/`。建议配置每日定时备份任务（`sqlite3 data/research_assistant.db ".backup 'data/backup.db'"`）。
5. **日志管理与 API Key 安全**：
   - 后端统一使用 `backend/app/utils/security.py` 中的 `mask_sensitive_text()` 过滤日志，自动将任何形如 `sk-...` 或 `Bearer ...` 的凭据脱敏为 `****`。
   - 全局异常拦截器屏蔽内部堆栈追踪（Traceback），仅记录在服务端安全日志中。

---

## 五、服务器与本地硬件资源需求

| 运行模式 | CPU 需求 | 内存需求 | GPU 显存需求 | 磁盘空间 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **基础模式 / 云端 API 模式** | 2 核及以上（如 Intel i5） | >= 2 GB | **无需 GPU（0 GB）** | >= 500 MB | 使用 OpenAI 兼容 API 或原文启发式解析 + 本地 BM25 问答 |
| **本地 Ollama 增强模式** | 4 核及以上（Intel i5） | >= 8 GB | **NVIDIA RTX 3050 (4GB 显存)** | >= 5 GB（含 Ollama 模型） | 本地离线运行 `qwen3:4b`（Q4 量化约占 2.5~2.8GB 显存），建议将 `EMBEDDING_PROVIDER` 保持为 `none`（使用 CPU BM25 检索）以避免显存争用 |

---

## 六、常见错误排查指南（Troubleshooting）

1. **端口被占用（Port 8000 or 3000 already in use）**：
   - Windows PowerShell 查看并释放端口：`Get-NetTCPConnection -LocalPort 8000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
   - WSL2 Ubuntu 查看并释放端口：`lsof -ti:8000 | xargs kill -9`
2. **WSL2 中无法访问 Windows 宿主机的 Ollama (`localhost:11434`)**：
   - 在 WSL2 Ubuntu 24.04 中，若未开启 `networkingMode=mirrored`，可将 `.env` 中的 `OLLAMA_BASE_URL` 改为宿主机 IP（通过 `ip route show | awk '/default/ {print $3}'` 获取），并在 Windows 环境变量中设置 `OLLAMA_HOST=0.0.0.0:11434`。
3. **上传 PDF 提示“检测到扫描版或纯图片 PDF”**：
   - 说明该 PDF 内不含可提取的文字图层（全是扫描图片），请更换原生排版的文本型学术 PDF（如从 arXiv / IEEE / ACM 直接下载的论文）。
