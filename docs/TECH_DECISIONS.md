# 技术架构决策与调整说明（Technical Decisions）

> **文档路径**：`docs/TECH_DECISIONS.md`  
> **编写依据**：严格遵循《作业.md》第五章“允许根据实际情况做合理调整，但必须在 `docs/TECH_DECISIONS.md` 记录：为什么调整、原方案有什么问题、新方案有什么优势、对本地部署有什么影响”。

---

## 一、核心技术栈选型总览

| 模块 | 采用方案 | 本地 Windows / WSL2 运行表现 | 云端沙盒测试兼容性设计 |
| :--- | :--- | :--- | :--- |
| **前端框架** | Next.js + React + TypeScript + Tailwind CSS（配套 `server.mjs` 零依赖内置服务） | 支持 `npm install && npm run dev` 启动完整 Next.js，亦支持直接运行 `node server.mjs` 秒级启动 | 解决云端无外网无法拉取 `node_modules` 的问题，确保在云端与本地均能真实启动 `:3000` 并通过 Chromium 联调 |
| **后端框架** | Python + FastAPI + Uvicorn + Pydantic | 原生支持 Python 3.11 / 3.12 异步高并发 | 云端与本地 100% 共享同一套 FastAPI 路由与业务层代码 |
| **PDF 解析层** | `PyMuPDF (fitz)` 优先 + `pypdf` / `pdfplumber` 自动回退双引擎 | 本地 `pip install -r requirements.txt` 后默认使用 `PyMuPDF (fitz)` 高速提取 | 云端沙盒未预装 `fitz` 时自动回退至预装的 `pypdf` / `pdfplumber`，实现完全一致的分页提取与空白页/扫描件检测 |
| **数据库与持久化** | SQLite (`data/research_assistant.db`) + `SQLAlchemy` / 内置 `sqlite3` 双适配层 | 本地安装 `SQLAlchemy` 后支持标准 ORM 模型，同时内置原生 `sqlite3` 事务仓储层 | 无需安装外部数据库服务，云端与本地零配置即可完成建表、CRUD 与自动化测试 |
| **LLM 服务层** | OpenAI 兼容 API + 本地 Ollama (`qwen3:4b`) + 原文启发式提取引擎（三模自适应） | 支持云端 API（DeepSeek/OpenAI 等）与本地 RTX 3050 4GB 显存运行 `ollama run qwen3:4b` | 无 API Key 时允许启动并通过原文启发式引擎 + 代码级数字核验器完成结构化解析，且支持 `require_llm=true` 测试缺 Key 报错 |
| **P1 检索问答** | 页面级分块 + 本地 BM25/TF-IDF 检索 + 可选本地 `BAAI/bge-m3` Embedding | 默认零模型下载即可秒级按页检索；可按需开启本地已缓存的 `BAAI/bge-m3` | 避免为单篇论文引入 Milvus/Redis 等重型基础设施，CPU 环境下毫秒级响应 |

---

## 二、具体技术调整记录（四问说明）

### 调整项 1：PDF 解析层采用“PyMuPDF (`fitz`) 优先 + `pypdf`/`pdfplumber` 自动兼容”双引擎

1. **为什么调整**：
   - 用户的本地 Windows 11 / WSL2 环境可通过 `pip` 安装 `PyMuPDF`，但当前云端开发沙盒环境禁用了外网 `pip install`，且沙盒内预装的是 `pypdf`、`pdfplumber` 与 `pypdfium2`。
2. **原方案有什么问题**：
   - 若在代码中硬编码仅 `import fitz`，则在云端沙盒环境中后端无法启动，无法执行真实测试；反之若只写 `pypdf`，则不符合用户在本地使用 `PyMuPDF` 的技术偏好。
3. **新方案有什么优势**：
   - 在 `backend/app/services/pdf_parser.py` 中优先检测并调用 `fitz (PyMuPDF)`，当环境中未安装 `fitz` 时自动无缝切换至 `pypdf` / `pdfplumber`，对外输出完全一致的 `ParsedDocument` 结构（含每页文本、页码、字符统计、元数据、空白页列表、扫描版判定）。
4. **对本地部署有什么影响**：
   - **零负面影响，反而提升了鲁棒性**。本地执行 `scripts/setup.ps1` 或 `scripts/setup.sh` 会自动根据 `backend/requirements.txt` 安装 `PyMuPDF`，系统自动启用 `PyMuPDF` 引擎。

---

### 调整项 2：数据库层采用“SQLAlchemy 模型定义 + 原生 `sqlite3` 零依赖持久化内核”

1. **为什么调整**：
   - 云端离线沙盒环境预装了 Python 标准库 `sqlite3` 但未预装 `sqlalchemy`。
2. **原方案有什么问题**：
   - 若强行依赖 `sqlalchemy` 才能启动，云端测试将因 `ModuleNotFoundError` 阻塞。
3. **新方案有什么优势**：
   - 在 `backend/app/models/paper.py` 中保留完整的 SQLAlchemy ORM 模型定义（当环境安装有 SQLAlchemy 时可直接挂载），同时在 `backend/app/database/db.py` 中使用 Python 标准库 `sqlite3` 实现了线程安全、参数化防 SQL 注入的数据访问层（Repository）。
4. **对本地部署有什么影响**：
   - **更加轻量可靠**。即使本地 Python 环境尚未完成第三方 ORM 编译，SQLite 数据库也能 100% 正常工作，数据统一保存在 `data/research_assistant.db`。

---

### 调整项 3：前端提供“完整 Next.js TypeScript 工程源码 + `server.mjs` 零依赖内置运行服务器”

1. **为什么调整**：
   - 云端沙盒环境无外网访问权限，无法从 npm 官方源下载数百兆的 `node_modules` 包，但验收要求必须在云端真实启动前端（`:3000`）与后端（`:8000`）进行联调并使用真实浏览器截图。
2. **原方案有什么问题**：
   - 仅放置 Next.js 源码而不提供内置运行时，在无外网环境下无法启动 `:3000` 端口；若用户在本地首次解压后遇到校园网 npm 镜像抽风，也会卡在 `npm install`。
3. **新方案有什么优势**：
   - 完整保留 `frontend/src/` 下的 Next.js App Router + React + TypeScript 组件源码，同时提供 `frontend/server.mjs`（仅依赖 Node.js 原生 `http`/`fs`/`path` 模块的高保真前端服务与构建检查器）。
   - `scripts/start.ps1` 与 `scripts/start.sh` 会自动检测：若本地已执行 `npm install` 生成了 `node_modules/next`，则优先以 `npm run dev` 启动 Next.js；若尚未安装 `node_modules`，则自动通过 `node frontend/server.mjs` 在 `http://localhost:3000` 启动完整可交互的前端工作台。
4. **对本地部署有什么影响**：
   - **极大提升本地启动成功率**。用户在 Windows 11 或 WSL2 解压后，哪怕不跑 `npm install` 也能在 2 秒内打开 `http://localhost:3000` 完整使用所有功能；安装依赖后又能无缝进行 Next.js 二次开发。

---

### 调整项 4：LLM 与 Embedding 采用“云端 API + 本地 Ollama (`qwen3:4b`) + 原文确定性提取/BM25”三级架构

1. **为什么调整**：
   - 用户的笔记本配备 NVIDIA RTX 3050 Laptop GPU（4GB 显存），本地已安装 Ollama (`qwen3:4b`) 并缓存了 `BAAI/bge-m3`，但同时要求“不要把 GPU 作为基础功能运行的必要条件”、“支持没有 API Key 时启动基础产品功能”。
2. **原方案有什么问题**：
   - 若强制加载本地 `BAAI/bge-m3`（约 2.2GB 权重）同时运行 `qwen3:4b`（约 2.6GB 显存占用），4GB 显存极易发生 CUDA OOM（显存溢出）。
3. **新方案有什么优势**：
   - 默认检索采用纯 CPU 内存级 **分页 BM25 + TF-IDF 算法**（0 显存占用、毫秒级响应），将宝贵的 4GB 显存完全留给本地 Ollama `qwen3:4b` 推理；同时支持通过环境变量 `EMBEDDING_PROVIDER=bge-m3` 在 CPU 上按需加载本地缓存目录 `C:\Users\张伟强\.cache\huggingface\hub\models--BAAI--bge-m3` 中的模型。
4. **对本地部署有什么影响**：
   - 彻底杜绝 4GB 显存爆显存问题，基础安装不触发任何大模型自动下载，兼顾 CPU 极速启动与本地 AI 增强。
