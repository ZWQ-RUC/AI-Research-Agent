# 第三份作业：AI Research Assistant 开发计划与三问审查（Development Plan）

> **文档路径**：`docs/04_Development_Plan.md`  
> **关联文档**：`docs/03_PRD.md`、`docs/03_Challenge2.md`

---

## 一、核心原则：明确 MVP 的第一个功能

本项目 **MVP 的第一个核心功能** 明确锁定为：
> **学术论文 PDF 的安全上传、分页文本提取与 18 维防幻觉结构化解析（P0 核心链路）**。

只有当用户能够稳定上传一篇真实 PDF、准确提取出带页码的文本、并获得有原文依据的结构化分析报告后，后续的历史归档、Markdown 导出、论文智能问答（P1）和实验对比分析（P2）才具备坚实的工程底座。

---

## 二、任务拆分、执行顺序、依赖关系与交付物

| 阶段编号 | 任务模块名称 | 执行顺序 | 前置依赖 | 核心开发内容 | 明确交付物（Deliverables） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 1** | **工程初始化与配置层** | Step 1 | 无 | 建立前后端目录、环境变量模板、SQLite 数据库连接池与跨平台启动脚本。 | `.env.example`, `.gitignore`, `backend/app/config.py`, `backend/app/database/db.py`, `scripts/*` |
| **Phase 2** | **MVP 第一功能：PDF 上传与分页解析（P0-A）** | Step 2 | Phase 1 | 实现文件大小/扩展名/魔数校验、安全路径存储、PyMuPDF（及兼容引擎）逐页文本与元数据提取、空白页与扫描版检测。 | `backend/app/utils/file_validator.py`, `backend/app/services/pdf_parser.py` |
| **Phase 3** | **MVP 第一功能：18 维结构化分析与原文核验（P0-B）** | Step 3 | Phase 2 | 集成八模块提示词，支持 OpenAI 兼容 API、Ollama (`qwen3:4b`) 与无 Key 原文启发式结构化提取，实现原文证据卡绑定与实验数字代码级核验。 | `backend/app/services/llm_service.py`, `backend/app/schemas/paper.py`, `backend/app/routers/papers.py` |
| **Phase 4** | **前端主页、论文工作台与报告详情页（P0-C）** | Step 4 | Phase 3 | 开发现代学术 SaaS 首页、PDF 上传组件、18 维结构化报告详情页、原文证据卡展示、历史记录管理与 Markdown 导出。 | `frontend/src/app/page.tsx`, `frontend/src/components/*`, `backend/app/services/markdown_exporter.py` |
| **Phase 5** | **论文智能问答模块（P1）** | Step 5 | Phase 2, 3 | 实现按页码与段落切块的轻量级本地检索器（BM25/TF-IDF + 可选 BGE-M3），生成带 `[Page N]` 原文引用的问答回复及无依据诚实拒答。 | `backend/app/services/rag_service.py`, `backend/app/routers/qa.py`, `frontend/src/components/PaperQA.tsx` |
| **Phase 6** | **实验对比分析模块（P2）** | Step 6 | Phase 1 | 实现用户实验数据录入、Baseline 与实验组指标变化精确计算、零编造实验分析报告生成。 | `backend/app/services/experiment_service.py`, `backend/app/routers/experiments.py`, `frontend/src/components/ExperimentAnalyzer.tsx` |
| **Phase 7** | **自动化测试、前后端联调、截图与打包** | Step 7 | Phase 1~6 | 编写并执行后端自动化测试、前端构建与联调测试、Chromium 真实界面截图、Git 分模块提交与最终 `AI-Research-Agent.zip` 打包验证。 | `backend/tests/test_api.py`, `tests/TEST_REPORT.md`, `screenshots/*`, `AI-Research-Agent.zip` |

---

## 三、“三问审查法”对开发计划的严格审查

在正式进入编码前，我们使用课程要求的**“三问审查”**对上述开发计划进行了逐项审视与裁剪：

### 第一问：是否直接解决用户的核心痛点？
- **审查结论**：**是，100% 聚焦核心痛点。**
- **具体映射**：
  - 针对“阅读耗时长、结构复杂难抓重点” → **Phase 2 & Phase 3** 直接将几十页 PDF 解析为标准 18 维结构化报告。
  - 针对“AI 总结容易产生幻觉、缺少原文依据” → **Phase 3 & Phase 5** 强制要求每条结论附带 PDF 页码与原文逐字片段，并通过代码核对实验数字是否在原文中真实存在。
  - 针对“读完多篇论文缺乏统一整理” → **Phase 4** 提供 SQLite 历史归档与一键导出标准 Markdown 笔记。
  - 针对“实验结果缺少结构化分析” → **Phase 6** 提供基于用户输入数据的 Baseline vs 实验组定量对比分析。

### 第二问：是否存在不必要的功能或为了炫技而引入的技术复杂度？
- **审查结论**：**已主动砍掉所有无意义的技术复杂度，保持极简稳健架构。**
- **主动剔除的过度设计**：
  1. **不引入重型外部向量数据库（如 Milvus / Qdrant / Chroma 服务）**：单篇或数十篇论文的问答检索（每篇约 10～30 页），使用按页分块的内存级 BM25/TF-IDF 检索（配合可选本地 BGE-M3 向量余弦相似度）即可在 10 毫秒内完成精准页码召回，无需让用户在本地额外启动 Docker 容器。
  2. **不引入 Redis / Celery 消息队列与多 Agent 互聊循环**：单人科研桌面工具无需分布式任务队列，避免無意义地增加 Agent 数量导致延迟翻倍与 Token 浪费。
  3. **不强制依赖 PyTorch CUDA 或大型本地模型下载**：基础功能在纯 CPU + SQLite 下开箱即用，本地已有的 Ollama (`qwen3:4b`) 与 `BAAI/bge-m3` 缓存作为可选增强无缝挂载。

### 第三问：每个阶段是否具有明确、可量化的验收标准？
- **审查结论**：**是，所有阶段均定义了自动化测试断言与前后端实测指标。**
- **量化验收矩阵**：
  - **PDF 上传与解析**：合法 PDF 返回 `200 OK` 并准确提取页数与各页文本；非 PDF 返回 `400`；空文件返回 `400`；超 30MB 文件返回 `413`；损坏 PDF 返回 `422`。
  - **18 维结构化分析**：返回 JSON 必须完整包含 18 个規定字段、`evidences` 原文证据数组与 `number_checks` 数字核验表；原文未提及内容必须标注 `未在原文中找到 / 无法确认`。
  - **论文问答（P1）**：有效问题返回带 `page` 页码和 `snippet` 原文片段的引用；无关问题（如询问论文作者的个人银行卡号或未提及的无关实验）必须明确返回无法从论文中确认。
  - **实验分析（P2）**：输出报告中的所有对比数字必须与用户输入的 Baseline 和实验组数值完全吻合，数据不足时明确提示无法得出可靠结论。
