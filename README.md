# AI Research Assistant —— Your AI-powered Research Assistant

> **一款面向学生、研究生与科研团队的轻量级 AI 学术论文解析、页码溯源问答与实验对比分析系统**  
> 完整包含：全栈可运行产品（FastAPI + Next.js/React + SQLite）+ 配套 AI 员工课程五份完整作业文档 + 自动化测试套件 + Windows 11 / WSL2 Ubuntu 24.04 双平台启动脚本。

---

## 一、核心功能概览（P0 / P1 / P2）

### 1. P0：论文智能解析（核心必达）
- **安全 PDF 上传与校验**：支持默认 30MB（可配置）PDF 上传，严格校验 `.pdf` 扩展名、真实文件头魔数（`%PDF-`）、拒绝空文件与损坏文件。
- **分页文本与元数据提取**：基于 `PyMuPDF (fitz)`（并提供 `pypdf` 自动兼容引擎）按页提取全文与元数据，保留精确页码边界，自动识别空白页并检测扫描版 PDF（不伪装 OCR）。
- **18 维结构化论文分析**：自动输出标题、作者、年份、会议/期刊、摘要、研究背景、研究问题、研究动机、核心方法、模型架构、实验设计、数据集、评价指标、实验结果、创新点、局限性、结论、后续研究方向。原文未提供信息严格标注 `未在原文中找到 / 无法确认`。
- **原文可追溯与数字一致性核验**：每条核心结论绑定原文原句引用（Quote）与页码（Page），内置代码级数字一致性核验器自动核对实验指标在原文中的出现页码。
- **报告管理与导出**：基于 SQLite 保存历史分析记录，支持一键导出标准 Markdown（`.md`）精读笔记。

### 2. P1：论文智能问答（Page-Grounded QA）
- 将论文文本按页码与段落切分，建立轻量级本地 BM25/TF-IDF 检索（并支持可选接入本地 `BAAI/bge-m3` Embedding）。
- 针对用户问题返回带精确页码 `[Page N]` 与原文段落摘录的回答；找不到原文依据时明确拒答（告知无法从论文中确认）。

### 3. P2：实验对比分析（Experiment Analyzer）
- 录入实验名称、实验目标、评价指标、Baseline 数值、实验组数值与备注。
- 严格基于用户输入数值计算绝对变化与相对百分比，生成实验结果概述、指标对比表、变化分析、可能原因、局限性与后续建议，绝不编造实验数据。

---

## 二、快速启动指南（Windows 11 & WSL2 Ubuntu 24.04）

本项目目标部署目录：
- **Windows 路径**：`C:\Work\Papers\AI-Research-Agent`
- **WSL2 路径**：`/mnt/c/Work/Papers/AI-Research-Agent`

### 方式 A：Windows 11 PowerShell 启动

```powershell
cd C:\Work\Papers\AI-Research-Agent
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 1. 初始化虚拟环境、配置文件与前后端依赖
.\scripts\setup.ps1

# 2. 一键启动后端 (:8000) 与前端 (:3000)
.\scripts\start.ps1
```

### 方式 B：WSL2 Ubuntu 24.04 启动

```bash
cd /mnt/c/Work/Papers/AI-Research-Agent

# 1. 初始化虚拟环境、配置文件与依赖
bash scripts/setup.sh

# 2. 一键启动后端 (:8000) 与前端 (:3000)
bash scripts/start.sh
```

### 访问地址
- **前端工作台**：[http://localhost:3000](http://localhost:3000)
- **后端 API 根地址**：[http://localhost:8000](http://localhost:8000)
- **Swagger 接口文档**：[http://localhost:8000/docs](http://localhost:8000/docs)

---

## 三、本地 AI 环境配置（可选增强）

在根目录 `.env`（由 `.env.example` 复制生成）中可灵活切换：
1. **免 API Key 基础模式（默认开箱即用）**：无需配置任何 API Key 或 GPU，即可完整运行 PDF 上传、分页解析、原文启发式 18 维提取、代码级数字核验、按页问答与实验对比分析。
2. **本地 Ollama 模式（适配 RTX 3050 4GB 显存）**：
   ```ini
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen3:4b
   ```
3. **OpenAI 兼容云端 API 模式**：
   ```ini
   LLM_PROVIDER=openai
   LLM_BASE_URL=https://api.openai.com/v1
   LLM_API_KEY=sk-your-key
   LLM_MODEL=gpt-4o-mini
   ```

---

## 四、五份课程作业与工程文档导航

| 作业/文档类别 | 文件路径 | 核心内容说明 |
| :--- | :--- | :--- |
| **第一份作业：AI 员工作品** | [`docs/01_AI_Employee.md`](./docs/01_AI_Employee.md) | 黄金圈、岗位说明、八模块提示词、4A 验收机制、防幻觉机制 |
| **第一份作业：真实论文分析 Demo** | [`demo/01_paper_analysis.md`](./demo/01_paper_analysis.md) | 基于《Attention Is All You Need》(arXiv:1706.03762) 原文的完整分析与核验 |
| **第二份作业：项目主页提示词** | [`docs/02_Project_Prompt.md`](./docs/02_Project_Prompt.md) | 八模块结构化主页开发提示词与视觉规范 |
| **第二份作业：Challenge 1 记录** | [`docs/02_Challenge1.md`](./docs/02_Challenge1.md) | 主页开发修改过程、自检对比与验收结果 |
| **第三份作业：产品需求文档 (PRD)** | [`docs/03_PRD.md`](./docs/03_PRD.md) | 六大痛点置顶、Elicit/SciSpace/Scholarcy 竞品调研、数据结构与异常处理 |
| **第三份作业：开发计划与三问审查** | [`docs/04_Development_Plan.md`](./docs/04_Development_Plan.md) | MVP 第一功能锁定、任务拆解与三问审查 |
| **第三份作业：Challenge 2 记录** | [`docs/03_Challenge2.md`](./docs/03_Challenge2.md) | PRD、开发计划与第一个功能原型真实验收 |
| **第四份作业：真实迭代日志** | [`docs/05_Iteration_Log.md`](./docs/05_Iteration_Log.md) | 四行真实工程问题发现与修复迭代记录 |
| **第四份作业：用户试用模板** | [`docs/06_User_Test.md`](./docs/06_User_Test.md) | 三位真实用户画像试用反馈预留模板（待填写） |
| **第四份作业：Challenge 3 记录** | [`docs/04_Challenge3.md`](./docs/04_Challenge3.md) | MVP 交付、原文追溯、数字一致性、安全护栏与 Git 记录汇总 |
| **第五份作业：Demo 演示脚本** | [`demo/README.md`](./demo/README.md) | 30～60 秒六步产品标准演示脚本 |
| **第五份作业：BP 一页纸** | [`docs/07_BP.md`](./docs/07_BP.md) | 痛点、方案、核心价值、实现方式与未来方向（零编造商业数据） |
| **第五份作业：四把尺评价** | [`docs/08_Project_Evaluation.md`](./docs/08_Project_Evaluation.md) | 四把尺评价表及课程标准待核对预留区 |
| **第五份作业：三分钟路演脚本** | [`docs/09_Pitch_Script.md`](./docs/09_Pitch_Script.md) | 自然口语化的三分钟产品路演逐字稿 |
| **第五份作业：Challenge 4 总结** | [`docs/05_Challenge4.md`](./docs/05_Challenge4.md) | 五份课程作业最终参赛包总览 |
| **工程技术决策说明** | [`docs/TECH_DECISIONS.md`](./docs/TECH_DECISIONS.md) | 技术选型与兼容性调整四问记录 |
| **安全与部署文档** | [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | 本地与服务器安全部署、CORS、上传限制与故障排查 |
| **自动化测试报告** | [`tests/TEST_REPORT.md`](./tests/TEST_REPORT.md) | 后端、前端与前后端联调真实测试结果记录 |
| **最终交付验收清单** | [`docs/FINAL_DELIVERY_CHECKLIST.md`](./docs/FINAL_DELIVERY_CHECKLIST.md) | 产品功能、工程质量、课程作业与打包完整性核对表 |
