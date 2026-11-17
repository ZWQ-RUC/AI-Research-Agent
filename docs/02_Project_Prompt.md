# 第二份作业：项目主页开发完整提示词（八模块结构）

> **文档路径**：`docs/02_Project_Prompt.md`  
> **对应产物**：`frontend/src/app/page.tsx` 及完整前端工作台界面  
> **视觉定位**：现代学术 SaaS 风格（简洁、专业、学术、科技感、清晰、桌面端优先）

---

## 一、产品主页设计总览

### 1. 产品目标
构建 **AI Research Assistant（Your AI-powered Research Assistant）** 的产品门户主页与一站式科研工作台入口，让用户在 10 秒内理解产品“将非结构化论文 PDF 转化为可溯源、零幻觉的 18 维结构化知识报告”的核心价值，并能一键进入论文解析工作台、论文智能问答与实验数据分析模块。

### 2. 目标用户
- 计算机科学、人工智能及理工科**硕士/博士研究生**（高频精读顶会论文、撰写开题报告与综述）。
- **高年级本科生与科研入门学习者**（需要拆解经典论文如 *Attention Is All You Need* 的问题、方法与实验设计）。
- **高校课题组与企业 AI 研发工程师**（需要批量管理阅读记录、核对 Baseline 指标并导出 Markdown 笔记到 Obsidian/Zotero）。

### 3. 用户痛点
1. 英文长文阅读耗时长，抓不住核心研究问题（Research Question）与方法边界。
2. 通用 AI 聊天工具总结论文缺乏统一结构，经常编造实验数字或张冠李戴。
3. 读完多篇论文后笔记散乱，缺少统一的 18 维结构化归档与原文页码溯源卡片。

### 4. 产品核心价值
- **结构化深度拆解**：覆盖标题、作者、研究问题、核心方法、系统架构、实验设计、数据集、指标、结果、创新点、局限性等 18 个标准维度。
- **句句有据可查（Page-Level Grounding）**：每项核心结论与实验数字自动绑定 PDF 页码与原文英文/中文片段。
- **本地私有与多引擎适配**：支持 OpenAI 兼容 API、本地 Ollama（`qwen3:4b`）及无 API Key 原文启发式解析，数据落地本地 SQLite。

### 5. 页面结构设计
1. **顶部学术导航栏（Navbar）**：品牌 Logo + 产品主副标题 + 四大核心模块导航（产品首页、论文工作台 P0、论文智能问答 P1、实验对比分析 P2）+ 后端连接健康状态指示灯。
2. **Hero 首屏核心价值区**：中英文产品名称、核心主张、三大防幻觉特性徽章、立即开始上传入口（CTA）与经典论文一键体验入口，右侧配备实时可交互的“结构化报告 + 原文页码溯源”预览面板。
3. **核心痛点 vs 产品价值对比区**：直击传统论文阅读与通用 AI 幻觉痛点。
4. **三大核心功能矩阵（P0 / P1 / P2）**：
   - **P0 论文智能解析**：PDF 安全校验、PyMuPDF 分页提取、18 维结构化报告、数字一致性校验、Markdown 导出。
   - **P1 论文智能问答**：按页切块检索、原文段落高亮引用、无依据诚实拒答。
   - **P2 实验数据分析**：Baseline 与实验组指标对比、相对增幅计算、严禁编造数据。
5. **四步标准使用流程（Workflow）**：上传 PDF 校验 → 分页解析提取 → 结构化分析与原文核验 → 问答交互与 Markdown 导出。
6. **技术架构与安全护栏说明区**：展示本地 SQLite、API Key 后端隔离、30MB 上传安全校验及 RTX 3050 4GB 轻量化本地适配优势。

### 6. 视觉设计要求
- **配色系统**：采用深海学术蓝（`#0F172A` Slate-900 / `#1E3A8A` Indigo-Blue）搭配科研青（`#0284C7` Sky-600）与纯净纸张白（`#F8FAFC`），传递严谨、冷静、可信的学术工具质感。
- **排版层次**：标题清晰有力，正文行高舒展，代码与公式区域采用等宽字体，标签采用高对比度语义徽章（如 `原文事实` 翠绿徽章、`页码 Page N` 靛蓝徽章）。
- **克制设计**：杜绝刺眼的霓虹渐变、无意义悬浮动画、冗余装饰卡片与模板化营销口号；桌面端宽屏双栏/三栏网格布局优先，同时完美适配移动端与平板。

### 7. 技术要求
- **技术栈**：Next.js + React + TypeScript + Tailwind CSS。
- **前后端分离**：所有接口请求统一收敛于 `frontend/src/lib/api.ts`，通过 `NEXT_PUBLIC_API_BASE_URL` 配置后端地址。
- **真实数据驱动**：首页与工作台直接联通 FastAPI 后端（`http://localhost:8000`），提供加载状态（Loading）、空状态（Empty）、错误状态（Error）及明确的内置示例演示标注。

### 8. 验收标准
- 首页在桌面端（1440×900）与移动端下布局整洁、无横向溢出、控制台零报错。
- 包含完整 8 个规定模块（Logo、产品名称、产品介绍、核心价值、核心功能、使用流程、产品优势、开始使用入口）。
- 点击“开始使用 / 进入论文工作台”可直接跳转或切换至真实可用的 PDF 上传与解析工作台。

---

## 二、用于生成项目主页的八模块完整开发提示词

```markdown
### [模块 1：角色定义 (Role)]
你是一位资深 AI 产品 UI/UX 设计师兼全栈前端架构师，精通 Next.js (App Router)、React、TypeScript 与 Tailwind CSS，擅长设计如 Elicit、Semantic Scholar、Linear 般兼具学术严谨感与现代 SaaS 交互体验的科研生产力工具。

### [模块 2：任务背景与目标 (Context & Goal)]
我们要为「AI Research Assistant（Your AI-powered Research Assistant）」开发产品主页与一体化学术工作台。该产品面向研究生与科研人员，用于上传学术论文 PDF 并生成带原文页码引用的 18 维结构化分析报告、进行基于原文的论文问答（Paper QA）以及实验数据对比分析。

### [模块 3：目标用户与核心痛点 (Target Users & Pain Points)]
目标用户每天需要阅读大量英文顶会 PDF，痛点在于阅读耗时长、结构复杂难抓重点、通用 LLM 总结容易产生幻觉且缺少原文页码依据。页面设计必须第一眼传递“结构化、可溯源、零幻觉、本地友好”的专业信任感。

### [模块 4：页面信息架构与功能模块 (Information Architecture)]
请构建包含以下完整区域的首页与导航体系：
1. 顶部固定导航栏：Logo + "AI Research Assistant" + 英文副标题 "Your AI-powered Research Assistant" + 模块切换（首页概览、论文工作台、报告详情、论文问答、实验分析）+ 后端 API 在线状态。
2. Hero 区域：产品定位标题、核心价值阐述、主操作按钮（“立即上传论文 PDF”、“加载 Attention Is All You Need 真实示例”）及右侧结构化分析卡片预览。
3. 核心功能展示区：清晰呈现 P0（论文智能解析 18 维报告 + Markdown 导出）、P1（带页码引用的论文智能问答）、P2（零编造实验数据对比分析）。
4. 四步科研工作流区：01 安全上传与 PDF 校验 -> 02 PyMuPDF 逐页文本提取 -> 03 八模块防幻觉结构化分析 -> 04 原文证据溯源与 Markdown 导出。
5. 产品核心优势对比区：展示“原文页码溯源”、“实验数字代码级核验”、“本地 Ollama (qwen3:4b) 与云端 API 双模支持”、“API Key 后端安全隔离”。

### [模块 5：视觉与交互设计规范 (Visual & UX Guidelines)]
- 采用 Slate/Indigo 学术冷色调，背景 `#F8FAFC`，卡片纯白 `#FFFFFF` 配 `1px solid #E2E8F0` 细边框。
- 严禁使用夸张的多彩霓虹渐变或无意义的旋转动画。
- 所有交互组件必须具备完整的 Loading 加载态、Empty 空数据引导态、Error 异常提示框。

### [模块 6：技术实现与接口规范 (Technical Constraints)]
- 使用 TypeScript 严格定义数据结构（`frontend/src/types/research.ts`）。
- 所有后端请求统一封装在 `frontend/src/lib/api.ts`，读取 `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'`。
- 严禁在前端代码中硬编码任何 LLM API Key。
- 严禁用静态假数据冒充实时分析结果；内置的《Attention Is All You Need》示例必须明确标记【示例演示数据】徽章，并与用户真实上传记录区分。

### [模块 7：代码结构输出要求 (Deliverable Structure)]
输出完整的组件化前端代码，包括：
- `src/app/layout.tsx` 与 `src/app/page.tsx`
- `src/components/Navbar.tsx`、`PdfUploader.tsx`、`ReportViewer.tsx`、`PaperQA.tsx`、`ExperimentAnalyzer.tsx`
- `src/lib/api.ts` 与 `src/types/research.ts`

### [模块 8：质量验收标准 (Acceptance Checklist)]
- [ ] 包含首页要求的全部 8 项核心要素（Logo、名称、介绍、核心价值、核心功能、使用流程、产品优势、开始使用入口）。
- [ ] 真实对接后端 `/api/health`、`/api/papers/upload`、`/api/papers`、`/api/qa/ask`、`/api/experiments/analyze` 接口。
- [ ] 页面响应式表现在桌面端与移动端均无错位，浏览器控制台无报错。
```
