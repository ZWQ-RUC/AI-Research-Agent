# 第四份作业通关记录：可演示 MVP 产品与质量护栏交付（Challenge 3）

> **文档路径**：`docs/04_Challenge3.md`  
> **关联文档**：`docs/05_Iteration_Log.md`、`docs/06_User_Test.md`、`tests/TEST_REPORT.md`

---

## 一、MVP 全栈产品功能完成情况

按照《作业.md》规定的 9 步开发顺序，本项目已完成全部 P0、P1、P2 模块的编码与联调：

| 开发顺序 | 功能模块 | 优先级 | 实现路径（后端 + 前端） | 实际完成状态 |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **PDF 上传与安全校验** | P0 | `backend/app/utils/file_validator.py` + `frontend/src/components/PdfUploader.tsx` | **已完成并实测通过** |
| **2** | **PDF 文本与元数据提取** | P0 | `backend/app/services/pdf_parser.py`（支持页码保留、空白页与扫描版识别） | **已完成并实测通过** |
| **3** | **18 维结构化论文分析** | P0 | `backend/app/services/llm_service.py`（含八模块提示词、缺失项标注与证据链） | **已完成并实测通过** |
| **4** | **LLM API 与本地模型接入** | P0 | 支持 OpenAI 兼容 API、本地 Ollama (`qwen3:4b`) 及无 Key 原文启发式提取引擎 | **已完成并实测通过** |
| **5** | **分析结果展示** | P0 | `frontend/src/components/ReportViewer.tsx`（学术报告布局 + 证据卡 + 数字核验表） | **已完成并实测通过** |
| **6** | **Markdown 导出** | P0 | `backend/app/services/markdown_exporter.py` + `/api/papers/{id}/export` | **已完成并实测通过** |
| **7** | **历史报告管理（SQLite）** | P0 | `backend/app/database/db.py` + `backend/app/models/paper.py` | **已完成并实测通过** |
| **8** | **论文智能问答（Paper QA）** | P1 | `backend/app/services/rag_service.py` + `backend/app/routers/qa.py`（按页切块检索 + 页码引用 + 无依据拒答） | **已完成并实测通过** |
| **9** | **简化实验对比分析** | P2 | `backend/app/services/experiment_service.py` + `backend/app/routers/experiments.py`（零编造定量对比） | **已完成并实测通过** |

---

## 二、两大质量检查与安全护栏落实情况

### 1. 质量检查一：原文可追溯（Source Traceability）
- 每份结构化分析报告包含 `evidences` 数组，每条证据明确记录：
  - `claim`：AI 分析得出的结论声明；
  - `quote`：逐字摘录自 PDF 原文的句子片段；
  - `page`：精确对应的 PDF 页码（`1..N`）；
  - `section`：所属章节名称；
  - `fact_or_inference`：明确标记 `原文事实` 或 `AI 推断`。

### 2. 质量检查二：数字一致性（Numerical Consistency）
- 后端 `verify_numbers_against_text()` 函数自动用正则抽取报告中的实验数字（如 BLEU 分数、F1 值、层数、维度、训练时长），并在 PDF 原始分页文本中进行逐页子串核验，生成 `number_checks` 核验报告。
- 在原文中核实到的数字标记为 `verified: true` 并附带所在页码列表；无法从原文直接确认的数字标记为 `verified: false` 并提示待人工核实。

### 3. 安全护栏（Security Guardrails）
- **API Key 隔离与脱敏**：API Key 仅在后端 `config.py` 读取，前端无任何密钥；日志工具 `utils/security.py` 自动将 `sk-...` 等密钥掩码为 `sk-****`。
- **配置文件保护**：提供完整的 `.env.example` 与 `.gitignore`，确保 `.env` 与运行生成的临时文件不进入版本库与交付 ZIP。
- **上传安全防护**：强制校验 `.pdf` 后缀、`%PDF-` 魔数、非空及 30MB 上限；存储文件名采用 UUID 重命名并校验目标路径位于 `data/uploads/` 目录内，防止任意文件读取或路径穿越。
- **全局异常脱敏**：`main.py` 注册全局异常处理器，对外返回结构化 JSON 错误提示，绝不暴露服务器内部堆栈。

---

## 三、Git 版本管理与本关文档索引

1. **Git 提交记录**：已按照开发阶段在本地 Git 仓库完成分模块提交（Initial project setup → Frontend homepage → PDF upload → PDF parser → LLM analyzer → Report UI → Markdown export → Paper QA & Experiment Analysis → Final testing），可通过 `git log --oneline` 查看。
2. **产品迭代日志**：详见 [`docs/05_Iteration_Log.md`](./05_Iteration_Log.md)。
3. **用户试用反馈模板**：详见 [`docs/06_User_Test.md`](./06_User_Test.md)。
