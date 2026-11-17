# 第三份作业：AI Research Assistant 产品需求文档（PRD）

> **文档路径**：`docs/03_PRD.md`  
> **产品名称**：AI Research Assistant（Your AI-powered Research Assistant）  
> **文档版本**：v1.0.0  
> **更新日期**：2026-11-17

---

## 一、用户核心痛点（User Pain Points —— 置顶核心驱动力）

在进入任何功能定义之前，本产品首先锚定科研人员与学生在日常文献阅读中的**六大真实痛点**：

1. **单篇长文精读耗时极长**：一篇 10～20 页的英文顶会论文包含复杂的数学推导、架构图与多组对比实验表，人工通读并整理结构化笔记平均耗时 **2～4 小时**。
2. **论文结构复杂，核心脉络难以快速剥离**：不同学者写作风格各异，研究问题（Research Question）、方法创新边界（Methodology）与实验设置往往散落在冗长的段落中，初学者极易迷失在局部细节里。
3. **多篇文献缺少统一的整理与归档标准**：手工做笔记时格式随意，有时漏记数据集规模，有时漏记超参数或局限性，导致后续写综述或开题报告时仍需重新翻阅原 PDF。
4. **研究方法与实验设计理解门槛高**：面对复杂的模型架构（如多头自注意力、残差归一化、训练热身策略）和消融实验（Ablation Study），缺乏按模块拆解的清晰视图。
5. **实验数据缺少结构化对比分析**：科研人员在跑完自己的 Baseline 与实验组后，需要花费大量精力核对各项指标增减幅度、分析原因并对照论文局限性设计下一步实验。
6. **通用 AI 总结极易产生“幻觉”且缺乏原文依据**：通用聊天模型在总结论文时经常编造实验数字、混淆基线模型与本文模型的指标，且不提供原文页码与原句引用，导致科研用户无法核验真伪、不敢在学术工作中使用。

---

## 二、产品背景与对标竞品调研（Competitive Landscape）

### 1. 产品背景
随着大模型技术在学术领域的应用深化，科研人员不再满足于“泛泛而谈的全文摘要”，而是迫切需要一款**可本地部署、支持私有 PDF 上传、严格输出标准化学术字段、且每一个结论与数字都能追溯到原文页码**的轻量级 AI 研究助理。

### 2. 真实竞品对标调研（核实日期：2026-11-17）

我们选取了国际上三款真实运营的主流 AI 科研辅助产品（**Elicit**、**SciSpace**、**Scholarcy**）进行了公开资料核实与对比分析：

| 产品名称 | 核心公开功能（基于官方信息核实） | 可借鉴的产品设计亮点 | 与本产品（AI Research Assistant）的核心差异 | 官方信息来源链接与调研日期 |
| :--- | :--- | :--- | :--- | :--- |
| **Elicit** | 1. 面向 1.38 亿+学术论文与 54.5 万+临床试验的语义检索。<br>2. 自动从多篇论文中提取结构化数据生成带句子级引用的对比表格（Cited Tables）。<br>3. 支持对齐 PRISMA 2020 的系统性文献综述（Systematic Review）筛选工作流。 | - **表格化结构提取**：将非结构化论文转化为统一字段维度。<br>- **句子级引用溯源（Sentence-level citations）**：点击结论可直接查看原文依据，降低幻觉风险。 | - Elicit 重度依赖云端文献库订阅（免费版有严格次数限制），不支持本地无网/内网离线部署。<br>- **本产品**聚焦单篇本地 PDF 的 18 维深度解析、代码级数字一致性核验与本地 Ollama (`qwen3:4b`) / 自定义 API 灵活接入。 | - [Elicit Search](https://elicit.com/solutions/search)<br>- [Elicit Systematic Review](https://elicit.com/solutions/systematic-review)<br>- [Elicit Pricing](https://elicit.com/pricing)<br>- 调研日期：2026-11-17 |
| **SciSpace** *(原 Typeset)* | 1. 覆盖 2.8 亿+论文的学术检索与文献综述。<br>2. PDF 阅读伴侣（Chat with PDF），支持针对论文段落、数学公式与表格进行实时解释问答。<br>3. 集成 AI Writer、引用生成与 AI 文本检测等 150+ 学术工具。 | - **阅读与问答同屏联动**：在查看论文的同时随时针对特定方法或公式提问。<br>- **面向理工科公式与实验表的解释能力**。 | - SciSpace 功能庞杂（含写作自动补全、AI 检测等 150+ 工具），界面较重且核心高级模型需付费订阅。<br>- **本产品**坚持“克制、轻量、高信噪比”原则，专注“18 维论文解析 + 页码检索问答 + 实验数据分析”三大核心闭环，零冗余装饰。 | - [SciSpace 官网](https://scispace.com/)<br>- [SciSpace Super Agent Guide](https://scispace.com/guides/scispace-ai-research-super-agent)<br>- [SciSpace Pricing](https://scispace.com/pricing)<br>- 调研日期：2026-11-17 |
| **Scholarcy** | 1. 学术论文自动摘要生成器（Article Summarizer），识别关键术语、主张与研究发现。<br>2. 将长论文转化为可快速浏览的“摘要闪卡（Summary Flashcards）”。<br>3. 支持批量导入（Bulk Summarizer）以及导出 Markdown / Word / RIS 与 Zotero 联动。 | - **结构化闪卡（Flashcards）视图**：将长文拆解为 Methodology、Findings、Limitations 等独立信息块。<br>- **Markdown 导出能力**：方便科研人员沉淀到个人知识库（如 Obsidian）。 | - Scholarcy 偏向通用快速泛读卡片，对计算机/AI 论文的模型架构细节、实验数字原文逐项核验及本地自定义实验对比支持较弱。<br>- **本产品**专为 AI/理工科论文强化了模型架构、数据集、评价指标、代码级数字核验及 P2 实验数据对比分析。 | - [Scholarcy 官网](https://www.scholarcy.com/)<br>- [Scholarcy Article Summarizer](https://www.scholarcy.com/article-summarizer)<br>- [Scholarcy Features](https://www.scholarcy.com/scholarcy-features)<br>- 调研日期：2026-11-17 |

---

## 三、目标用户画像（Target Users）

| 用户类型 | 典型场景 | 核心诉求 |
| :--- | :--- | :--- |
| **硕士/博士研究生** | 每周组会需要精读 2～3 篇顶会论文（如 NeurIPS/ICLR/ACL），并对比自己实验的 Baseline 结果。 | 18 维结构化精读报告、原文页码溯源、Markdown 导出做组会汇报、实验结果对比分析。 |
| **高年级本科生 / AI 学习者** | 阅读经典文献（如 *Attention Is All You Need*），理解核心公式、架构设计及为什么这样设计。 | 清晰剥离 Research Question、Motivation、Methodology 与 Architecture，支持针对不懂的细节进行带页码问答。 |
| **科研人员 / 算法工程师** | 快速筛选候选技术方案，核实论文汇报的 SOTA 指标、训练算力成本与局限性。 | 零幻觉的数字一致性校验表、明确标注原文未提供信息、支持本地私有化运行保护数据安全。 |

---

## 四、产品目标与分级功能需求（P0 / P1 / P2）

### 1. 产品总体目标
提供一套可在 Windows 11 及 WSL2 Ubuntu 24.04 本地一键启动、基础功能无需 GPU 或外部数据库依赖、支持 OpenAI 兼容 API 与本地 Ollama 模型的轻量级科研助理系统。

### 2. 功能需求清单

#### P0：论文智能解析（核心必达，MVP 首要交付）
- **F0.1 PDF 安全上传**：
  - 仅接受 `.pdf` 扩展名且真实文件头为 `%PDF-` 的合法 PDF 文件。
  - 默认文件大小上限 **30MB**（可通过环境变量 `MAX_UPLOAD_SIZE_MB` 配置）。
  - 自动拦截空文件（0 字节）、非 PDF 伪装文件、损坏无法打开的 PDF 文件，并返回明确的中文错误提示。
  - 前端实时展示文件名、文件大小（KB/MB）、上传进度与解析状态。
- **F0.2 PDF 分页文本与元数据提取**：
  - 优先调用 `PyMuPDF (fitz)`（并在受限沙盒环境提供 `pypdf`/`pdfplumber` 无缝兼容引擎）按页提取文本。
  - 严格保留页码边界信息（`page_number: 1..N`）与每页字符统计，提取 PDF 元数据（Title、Author、CreationDate 等）。
  - 自动识别空白页面（`blank_pages`）并检测扫描版 PDF（当总字符数极低时，明确告知用户“检测到扫描版或纯图片 PDF，当前基础文本提取不包含 OCR，请上传文本型 PDF”，绝不假装已识别）。
- **F0.3 18 维结构化论文分析与防幻觉核验**：
  - 自动提取并生成 18 个标准维度：1.论文标题、2.作者、3.发表年份、4.发表期刊或会议、5.摘要、6.研究背景、7.研究问题、8.研究动机、9.核心方法、10.模型或系统架构、11.实验设计、12.数据集、13.评价指标、14.实验结果、15.创新点、16.论文局限性、17.结论、18.后续研究方向。
  - **缺失诚实标注**：原文未提及的信息统一标注为 `未在原文中找到 / 无法确认`。
  - **原文证据追溯与数字核验**：输出 `evidences`（含结论声明、原文片段、页码、章节、原文事实/AI推断标记）与 `number_checks`（自动核对报告中实验数字在原文中的出现页码）。
- **F0.4 结构化报告展示与 Markdown 导出**：
  - 采用学术报告布局展示全部分析结果，重点突出 Research Question、Methodology、Experiment、Results、Contribution、Limitation。
  - 支持一键导出并下载标准格式 `.md` 文件。
- **F0.5 历史报告持久化管理**：
  - 使用 SQLite（`data/research_assistant.db`）保存上传记录、文件元信息、分页文本、结构化分析结果、分析状态与创建时间，支持历史记录列表查看、切换与删除。

#### P1：论文智能问答（高优先级增强功能）
- **F1.1 页面级分块与轻量级本地检索**：
  - 将论文文本按页码与自然段切分为检索块（Chunks），支持零模型下载的本地 BM25 + TF-IDF 关键词相关性检索，同时预留可选的本地 `BAAI/bge-m3` / Ollama 向量检索扩展接口。
- **F1.2 带原文引用的问答生成**：
  - 根据用户提问检索 Top-K 相关页码段落，交由 LLM 或原文抽取引擎生成回答。
  - 每次回答强制附带引用来源列表（含页码 `[Page X]`、相关度得分及原文段落摘录）。
  - 当检索结果与问题无关或找不到原文依据时，明确回答：`无法从所上传论文原文中确认该问题的信息`。

#### P2：实验数据分析（简化实现功能）
- **F2.1 结构化实验数据录入**：
  - 支持用户输入：实验名称、实验目标、实验指标（支持多指标）、Baseline 数值、实验组数值、实验结果描述、备注。
- **F2.2 零编造实验对比分析报告**：
  - 自动计算并输出：实验结果概述、各项指标绝对差值与相对变化百分比、结果变化趋势、基于输入信息的可能原因分析、实验局限性及后续实验建议。
  - **硬性红线**：所有数字必须 100% 来自用户输入及基于输入数字的确定性数学计算；若用户输入数据不足或缺失数值，明确说明“当前输入数据不足，无法得出可靠定量结论”，严禁编造任何未输入的实验结果。

---

## 五、用户使用流程（User Journey）

```
[用户打开首页 http://localhost:3000]
        │
        ├──► 路径 A (P0 论文解析): 进入「论文工作台」 ──► 拖拽/选择 PDF 上传 (或一键加载示例论文)
        │         │
        │         ▼
        │    [后端执行文件安全校验 (扩展名/魔数/大小/损坏检测)]
        │         │
        │         ▼
        │    [PyMuPDF 按页提取文本 + 识别空白页/扫描版 + 存入 SQLite]
        │         │
        │         ▼
        │    [触发八模块结构化分析 + 原文证据绑定 + 数字一致性核验]
        │         │
        │         ▼
        │    [跳转「报告详情页」查看 18 维报告 / 原文证据卡 / 导出 Markdown]
        │
        ├──► 路径 B (P1 论文问答): 在已解析论文下进入「论文问答」 ──► 输入关于方法/实验的问题
        │         │
        │         ▼
        │    [按页检索相关段落 ──► 生成带 [Page N] 原文引用的回答 (无依据则明确告知)]
        │
        └──► 路径 C (P2 实验分析): 进入「实验分析」 ──► 录入实验名称、目标、指标、Baseline 与实验组数据
                  │
                  ▼
             [计算指标对比变化 ──► 生成包含概述、对比表、原因、局限与建议的结构化实验报告]
```

---

## 六、页面设计规范（Page Specifications）

1. **首页（`/` 或概览视图）**：包含导航栏、Hero 价值区、痛点对比、三大功能卡片、四步流程图、技术优势说明与开始使用入口。
2. **论文工作台（Workspace 视图）**：左侧为拖拽上传区（支持格式/大小校验提示）与历史分析记录列表（显示状态徽章、页数、时间）；右侧为当前论文摘要概览与快捷操作栏。
3. **论文报告详情页（Report Detail 视图）**：顶部为论文标题、作者、年份、会议、分析引擎徽章及“导出 Markdown”按钮；主体按学术报告网格展示 18 个维度，底部展示“原文溯源证据卡片”与“实验数字核验表”。
4. **论文问答页面（Paper QA 视图）**：顶部选择目标论文并展示快捷问题建议；中部为对话流，每条 AI 回复下方展开带页码徽章（`Page X`）的原文引用段落卡片；底部为提问输入框。
5. **实验分析页面（Experiment Analysis 视图）**：左侧为结构化实验表单（实验名称、目标、动态增删的多指标 Baseline vs 实验组输入行、备注）及预设真实示例填充按钮；右侧为实时生成的实验对比分析报告与 Markdown 导出。

---

## 七、核心数据结构设计（Database & Schema Design）

系统采用 SQLite 单文件数据库（`data/research_assistant.db`），核心表结构如下：

### 1. `papers` 表（论文上传与结构化分析主表）
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | 论文记录唯一自增 ID |
| `filename` | `VARCHAR(255)` | 原始上传文件名 |
| `stored_path` | `VARCHAR(512)` | 服务器安全重命名后的存储路径 |
| `file_size` | `INTEGER` | 文件字节大小 |
| `page_count` | `INTEGER` | PDF 总页数 |
| `blank_pages_json` | `TEXT (JSON)` | 识别出的空白页码列表 `[2, 10]` |
| `is_scanned` | `BOOLEAN` | 是否被判定为无文本的扫描版 PDF |
| `pdf_metadata_json` | `TEXT (JSON)` | PDF 原生元数据（Title, Author, Producer 等） |
| `pages_text_json` | `TEXT (JSON)` | 按页存储的文本数组 `[{"page": 1, "text": "...", "char_count": 3200}]` |
| `status` | `VARCHAR(32)` | 状态：`uploaded` / `extracting` / `analyzed` / `failed` / `scanned_warning` |
| `analysis_engine` | `VARCHAR(64)` | 实际使用的分析引擎标识（`openai:...` / `ollama:qwen3:4b` / `extractive-verified`） |
| `analysis_json` | `TEXT (JSON)` | 18 维结构化报告 + `evidences` 原文证据 + `number_checks` 数字核验表 |
| `error_message` | `TEXT` | 失败或异常原因说明 |
| `is_demo` | `BOOLEAN` | 是否为系统明确标注的演示数据 |
| `created_at` | `DATETIME` | 创建时间（ISO 8601） |

### 2. `qa_histories` 表（P1 论文问答记录表）
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | 问答记录 ID |
| `paper_id` | `INTEGER FOREIGN KEY` | 关联的 `papers.id` |
| `question` | `TEXT` | 用户提问内容 |
| `answer` | `TEXT` | 生成的回答内容 |
| `citations_json` | `TEXT (JSON)` | 引用来源数组 `[{"page": 3, "snippet": "...", "score": 0.89}]` |
| `has_evidence` | `BOOLEAN` | 是否在原文中找到依据 |
| `created_at` | `DATETIME` | 提问时间 |

### 3. `experiments` 表（P2 实验对比分析记录表）
| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY` | 实验分析记录 ID |
| `experiment_name` | `VARCHAR(255)` | 实验名称 |
| `objective` | `TEXT` | 实验目标 |
| `metrics_input_json` | `TEXT (JSON)` | 用户输入的指标、Baseline 与实验组数据列表 |
| `notes` | `TEXT` | 用户输入的实验备注與结果描述 |
| `report_json` | `TEXT (JSON)` | 生成的结构化实验分析报告（概述、对比表、变化、原因、局限、建议） |
| `created_at` | `DATETIME` | 创建时间 |

---

## 八、异常处理机制（Exception Handling）

| 异常场景 | 触发条件 | 系统处理方式与用户反馈 | HTTP 状态码 |
| :--- | :--- | :--- | :--- |
| **非 PDF 文件上传** | 扩展名非 `.pdf` 或文件头不含 `%PDF-` | 立即拦截并删除临时流，返回 `"文件格式错误：仅支持上传合法的 PDF 学术论文文件 (.pdf)"` | `400 Bad Request` |
| **空文件上传** | 文件字节数为 `0` | 立即拦截，返回 `"上传失败：文件为空（0 字节），请选择有效的 PDF 文件"` | `400 Bad Request` |
| **超大文件上传** | 文件超过 `MAX_UPLOAD_SIZE_MB`（默认 30MB） | 流式计数超限时立即终止接收，返回 `"文件大小超出限制：当前最大允许 30MB"` | `413 Payload Too Large` |
| **损坏或加密 PDF** | PDF 解析器无法读取交叉引用表或页面流 | 捕获解析异常，返回 `"PDF 文件已损坏或受密码保护，无法解析文本"` | `422 Unprocessable Entity` |
| **扫描版 / 纯图片 PDF** | PDF 可打开但全书有效提取字符极少（平均每页 < 30 字符） | 状态标记为 `scanned_warning`，明确提示 `"检测到该 PDF 为扫描版或纯图片文档，无法直接提取文本（当前基础版未启用 OCR）"` | `200 OK`（附带明确警告状态） |
| **未配置 LLM API Key** | `LLM_API_KEY` 为空且本地 Ollama 未启动 | 系统绝不崩溃，一方面提供 `/api/Papers/{id}/analyze?require_llm=true` 的明确配置错误提示，另一方面默认支持自动切换至**基于原文规则与页码定位的确定性结构化提取引擎**，并向用户透明展示当前运行模式 | `200 OK` / `503 Service Unavailable`（当强制指定远程 LLM 时） |
| **远程 LLM 调用超时或失败** | API Key 无效、网络断开或速率限制 | 捕获异常并脱敏日志（绝不打印 API Key），返回清晰的错误原因或安全回退结果 | `502 Bad Gateway` / 安全降级 |

---

## 九、非功能需求（Non-Functional Requirements）

1. **安全性（Security）**：
   - API Key 仅从后端环境变量读取，前端代码中零密钥，日志输出强制脱敏。
   - 上传文件名使用 UUID 安全重命名并锁定在 `data/uploads/` 目录内，彻底杜绝路径穿越（Path Traversal）漏洞。
   - 全局异常处理器拦截未捕获异常，不向客户端暴露服务器内部堆栈路径。
2. **性能与资源占用（Performance & Hardware Compatibility）**：
   - 基础功能纯 CPU 即可流畅运行，内存占用 < 300MB，完美适配用户 **Dell G15（i5 + RTX 3050 4GB 显存）** 环境。
   - 30MB 以内常规论文（10～20 页）PDF 文本提取耗时 < 1.5 秒。
3. **跨平台可移植性（Portability）**：
   - 同时支持 Windows 11 PowerShell 与 WSL2 Ubuntu 24.04 启动，无需安装 Docker、Redis、Milvus 或 Neo4j。

---

## 十、MVP 范围与验收标准（MVP Scope & Acceptance Criteria）

- **MVP 范围**：完整实现 **P0（论文智能解析全链路）** + **P1（基于页码分块的论文智能问答）** + **P2（零编造实验数据对比分析）**。
- **MVP 第一个核心功能**：**论文 PDF 安全上传与 18 维结构化解析**。
- **验收标准**：
  1. 后端 13+ 项自动化测试（含正常上传、非 PDF、空文件、超大文件、损坏 PDF、正常提取、缺 Key 处理、LLM 失败处理、Markdown 导出、QA 问答、实验分析）全部实际运行通过。
  2. 前后端真实联调跑通“打开首页 → 上传 PDF → 提取文本 → 触发分析 → 展示 18 维报告与原文页码证据 → 导出 Markdown”全流程。
