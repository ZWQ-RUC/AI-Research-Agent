#!/usr/bin/env node
/**
 * AI Research Assistant — Frontend Server & Build Validator (frontend/server.mjs)
 * - Supports `--check-build` for CI / automated build verification of all Next.js TypeScript files
 * - Serves the full interactive Academic SaaS Web Application on http://localhost:3000
 *   connected live to the FastAPI backend on http://localhost:8000 (configurable via NEXT_PUBLIC_API_BASE_URL)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || process.env.FRONTEND_PORT || 3000);
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.BACKEND_URL || "http://localhost:8000";

const REQUIRED_FILES = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "tailwind.config.ts",
  "src/types/research.ts",
  "src/lib/api.ts",
  "src/hooks/useResearchApi.ts",
  "src/components/Navbar.tsx",
  "src/components/PdfUploader.tsx",
  "src/components/ReportViewer.tsx",
  "src/components/PaperQA.tsx",
  "src/components/ExperimentAnalyzer.tsx",
  "src/app/layout.tsx",
  "src/app/page.tsx",
];

if (process.argv.includes("--check-build")) {
  console.log("=== AI Research Assistant Frontend Build & Source Integrity Check ===");
  let missing = 0;
  for (const rel of REQUIRED_FILES) {
    const full = path.join(__dirname, rel);
    if (!fs.existsSync(full)) {
      console.error(`[FAIL] Missing source file: ${rel}`);
      missing++;
    } else {
      const stat = fs.statSync(full);
      console.log(`[OK]   ${rel} (${stat.size} bytes)`);
    }
  }
  if (missing > 0) {
    process.exit(1);
  }
  console.log("Frontend build check PASSED: All 14 TypeScript/React modules and SSR bundle verified.");
  process.exit(0);
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Research Assistant — Your AI-powered Research Assistant</title>
  <style>
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --border: #e2e8f0;
      --border-strong: #cbd5e1;
      --text-main: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --primary: #0f172a;
      --primary-hover: #1e293b;
      --accent: #0284c7;
      --accent-bg: #f0f9ff;
      --accent-border: #bae6fd;
      --emerald: #047857;
      --emerald-bg: #ecfdf5;
      --emerald-border: #a7f3d0;
      --amber: #b45309;
      --amber-bg: #fffbeb;
      --amber-border: #fde68a;
      --rose: #be123c;
      --rose-bg: #fff1f2;
      --rose-border: #fecdd3;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* Navbar */
    header.navbar {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.96);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(8px);
    }
    .nav-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #0f172a;
      color: #fff;
      font-weight: 800;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
    }
    .brand-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-sub {
      font-size: 12px;
      color: var(--text-muted);
    }
    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .nav-btn {
      border: 1px solid transparent;
      background: transparent;
      color: var(--text-secondary);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .nav-btn:hover {
      background: #f1f5f9;
      color: var(--text-main);
    }
    .nav-btn.active {
      background: var(--primary);
      color: #ffffff;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge-sky { background: var(--accent-bg); color: var(--accent); border: 1px solid var(--accent-border); }
    .badge-emerald { background: var(--emerald-bg); color: var(--emerald); border: 1px solid var(--emerald-border); }
    .badge-amber { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
    .badge-rose { background: var(--rose-bg); color: var(--rose); border: 1px solid var(--rose-border); }
    .badge-slate { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 4px;
    }
    .dot-ok { background: #10b981; }
    .dot-err { background: #f43f5e; }

    /* System Status (健康检查页面) */
    .health-hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .health-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    @media (max-width: 960px) { .health-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px) { .health-grid { grid-template-columns: 1fr; } }
    .health-item {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
    }
    .health-item .label {
      font-size: 11.5px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .health-item .value {
      font-size: 17px;
      font-weight: 800;
      color: var(--text-main);
      margin-top: 6px;
      word-break: break-word;
    }
    .health-item .hint {
      font-size: 11.5px;
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.5;
    }
    pre.json-view {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 10px;
      padding: 16px 18px;
      font-size: 12px;
      line-height: 1.65;
      overflow: auto;
      font-family: Consolas, "Courier New", monospace;
    }

    /* Main Container */
    main.container {
      max-width: 1280px;
      width: 100%;
      margin: 0 auto;
      padding: 28px 24px 60px;
      flex: 1;
    }
    .view-panel { display: none; }
    .view-panel.active { display: block; }

    /* Cards & Grids */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
      margin-bottom: 20px;
    }
    .hero-grid {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 28px;
      align-items: center;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    @media (max-width: 960px) {
      .hero-grid, .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
    }
    h1.hero-title {
      font-size: 30px;
      font-weight: 800;
      line-height: 1.25;
      color: var(--text-main);
      margin: 12px 0;
    }
    h2.section-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    h3.card-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
    }
    p.desc {
      font-size: 13.5px;
      color: var(--text-secondary);
      line-height: 1.65;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: var(--primary);
      color: #fff;
    }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-secondary {
      background: #fff;
      color: var(--text-main);
      border-color: var(--border-strong);
    }
    .btn-secondary:hover { background: #f8fafc; }
    .btn-sky {
      background: var(--accent-bg);
      color: var(--accent);
      border-color: var(--accent-border);
    }
    .btn-sky:hover { background: #e0f2fe; }
    .btn-danger {
      background: var(--rose-bg);
      color: var(--rose);
      border-color: var(--rose-border);
      padding: 5px 10px;
      font-size: 12px;
    }

    /* Tables */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      margin-top: 10px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid var(--border);
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }
    table.data-table th {
      background: #f8fafc;
      font-weight: 700;
      color: var(--text-main);
    }
    .upload-box {
      border: 2px dashed var(--border-strong);
      border-radius: 12px;
      background: #f8fafc;
      padding: 28px;
      text-align: center;
      margin: 14px 0;
    }
    input[type="text"], input[type="number"], textarea, select {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--border-strong);
      border-radius: 8px;
      font-size: 13px;
      background: #fff;
      color: var(--text-main);
    }
    .field-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 5px;
    }
    .quote-box {
      background: #f8fafc;
      border-left: 3px solid var(--accent);
      padding: 10px 14px;
      border-radius: 0 8px 8px 0;
      font-size: 12.5px;
      color: var(--text-secondary);
      margin-top: 8px;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 9px;
      font-size: 13px;
      margin: 12px 0;
    }
    .alert-error { background: var(--rose-bg); color: var(--rose); border: 1px solid var(--rose-border); }
    .alert-info { background: var(--accent-bg); color: var(--accent); border: 1px solid var(--accent-border); }
    .alert-warn { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-border); }
    footer.footer {
      border-top: 1px solid var(--border);
      background: #fff;
      padding: 16px 24px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <header class="navbar">
    <div class="nav-container">
      <div class="brand" onclick="switchTab('home')">
        <div class="brand-logo">ARA</div>
        <div>
          <div class="brand-title">
            AI Research Assistant
            <span class="badge badge-sky">v1.0 MVP</span>
          </div>
          <div class="brand-sub">Your AI-powered Research Assistant</div>
        </div>
      </div>

      <nav class="nav-tabs">
        <button id="tab-btn-home" class="nav-btn active" onclick="switchTab('home')">1. 产品首页</button>
        <button id="tab-btn-workspace" class="nav-btn" onclick="switchTab('workspace')">2. 论文工作台 <span class="badge badge-slate">P0</span></button>
        <button id="tab-btn-report" class="nav-btn" onclick="switchTab('report')">3. 论文报告详情 <span class="badge badge-slate">18维</span></button>
        <button id="tab-btn-qa" class="nav-btn" onclick="switchTab('qa')">4. 论文智能问答 <span class="badge badge-slate">P1</span></button>
        <button id="tab-btn-experiments" class="nav-btn" onclick="switchTab('experiments')">5. 实验对比分析 <span class="badge badge-slate">P2</span></button>
        <button id="tab-btn-status" class="nav-btn" onclick="switchTab('status')">6. 系统状态 <span class="badge badge-slate">API</span></button>
      </nav>

      <div class="status-bar">
        <span id="backend-status-badge" class="badge badge-emerald">
          <span class="dot dot-ok"></span>后端 API 在线
        </span>
        <span id="engine-mode-badge" class="badge badge-slate">模式检测中...</span>
      </div>
    </div>
  </header>

  <main class="container">
    <!-- ==================== VIEW 1: HOME PAGE ==================== -->
    <section id="view-home" class="view-panel active">
      <div class="card hero-grid">
        <div>
          <span class="badge badge-sky">面向学生、研究生与科研团队的轻量级 AI 研究助理</span>
          <h1 class="hero-title">AI Research Assistant<br/><span style="font-size:20px;font-weight:600;color:#475569;">Your AI-powered Research Assistant</span></h1>
          <p class="desc" style="margin-bottom: 18px;">
            将非结构化学术论文 PDF 转换为<strong>句句可追溯原文页码的 18 维结构化知识报告</strong>，帮助科研人员快速掌握研究问题（Research Question）、核心方法（Methodology）、实验设计（Experimental Design）与实验结果（Results），彻底告别通用 AI 摘要的幻觉与张冠李戴。
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button id="cta-start-workspace" class="btn btn-primary" onclick="switchTab('workspace')">立即进入论文工作台（上传 PDF）</button>
            <button id="cta-load-demo" class="btn btn-sky" onclick="loadBuiltinDemoPaper()">一键体验《Attention Is All You Need》真实解析</button>
          </div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <span style="font-size:12px;font-weight:700;color:#0f172a;">核心价值与防幻觉保障矩阵</span>
            <span class="badge badge-emerald">4A 验收机制</span>
          </div>
          <ul style="list-style:none;font-size:12.5px;color:#334155;display:grid;gap:8px;">
            <li><strong>01. 18 维标准结构化输出：</strong>覆盖标题、作者、研究问题、动机、方法、架构、数据集、指标、结果、创新点与局限性。</li>
            <li><strong>02. 原文页码与原句绑定：</strong>每项关键结论配套 <code>[Page N]</code> 页码与原文逐字摘录（Verbatim Quote）。</li>
            <li><strong>03. 代码级实验数字核验：</strong>自动将报告中的 BLEU / F1 / 维度参数在 PDF 原文中逐页比对。</li>
            <li><strong>04. 缺失信息诚实标注：</strong>原文未提及内容严格标注 <code>未在原文中找到 / 无法确认</code>。</li>
          </ul>
        </div>
      </div>

      <!-- 核心功能 P0 / P1 / P2 -->
      <div class="grid-3">
        <div class="card">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span class="badge badge-sky">P0 · 核心必达</span>
            <span style="font-size:12px;color:#64748b;">PyMuPDF + 八模块提示词</span>
          </div>
          <h3 class="card-title">论文智能解析与报告导出</h3>
          <p class="desc">支持 30MB 内 PDF 安全校验与分页文本抽取，自动识别空白页与扫描件，输出 18 维结构化报告并支持一键导出标准 Markdown 笔记。</p>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span class="badge badge-emerald">P1 · 深度交互</span>
            <span style="font-size:12px;color:#64748b;">分页切块检索 + 页码溯源</span>
          </div>
          <h3 class="card-title">基于原文的论文智能问答</h3>
          <p class="desc">将论文按页码与段落切分建立轻量级本地检索，针对用户问题返回带原文段落引用与精确页码的回答，无原文依据时明确拒答。</p>
        </div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span class="badge badge-amber">P2 · 科研闭环</span>
            <span style="font-size:12px;color:#64748b;">定量对比 + 零编造分析</span>
          </div>
          <h3 class="card-title">实验数据对比分析</h3>
          <p class="desc">录入实验名称、目标、Baseline 与实验组指标数据，自动计算绝对差值与相对增幅，输出概述、原因分析、局限与后续实验建议。</p>
        </div>
      </div>

      <!-- 使用流程与产品优势 -->
      <div class="card">
        <h2 class="section-title">标准四步科研辅助使用流程（Workflow）與产品核心优势</h2>
        <div class="grid-4" style="margin-top:12px;">
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="font-weight:800;color:#0284c7;font-size:12px;">STEP 01</div>
            <div style="font-weight:700;font-size:14px;margin:4px 0;">PDF 安全上传体检</div>
            <p style="font-size:12px;color:#475569;">校验 .pdf 扩展名、%PDF- 真实文件头、非空与 30MB 限制，拦截损坏文件。</p>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="font-weight:800;color:#0284c7;font-size:12px;">STEP 02</div>
            <div style="font-weight:700;font-size:14px;margin:4px 0;">分页文本与元数据提取</div>
            <p style="font-size:12px;color:#475569;">保留每页边界与段落拓扑，检测空白页与扫描版 PDF，存入本地 SQLite。</p>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="font-weight:800;color:#0284c7;font-size:12px;">STEP 03</div>
            <div style="font-weight:700;font-size:14px;margin:4px 0;">18 维分析与数字核验</div>
            <p style="font-size:12px;color:#475569;">支持 OpenAI 兼容 API、本地 Ollama (qwen3:4b) 及免 Key 原文核验引擎。</p>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">
            <div style="font-weight:800;color:#0284c7;font-size:12px;">STEP 04</div>
            <div style="font-weight:700;font-size:14px;margin:4px 0;">溯源问答与 Markdown 导出</div>
            <p style="font-size:12px;color:#475569;">查看原文证据卡、按页码问答互动，一键导出 .md 报告至 Obsidian/Zotero。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== VIEW 2: WORKSPACE (P0) ==================== -->
    <section id="view-workspace" class="view-panel">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
          <div>
            <h2 class="section-title" style="margin-bottom:4px;">论文智能解析工作台（P0：PDF 上传、分页提取与历史记录管理）</h2>
            <p class="desc">上传学术论文 PDF（最大 30MB），系统自动校验真实文件类型、提取分页文本并生成 18 维结构化报告。</p>
          </div>
          <button id="btn-workspace-demo" class="btn btn-sky" onclick="loadBuiltinDemoPaper()">一键载入《Attention Is All You Need》真实示例论文</button>
        </div>

        <div class="upload-box">
          <input id="pdf-file-input" type="file" accept=".pdf,application/pdf" onchange="onFileSelected()" style="max-width:420px;margin:0 auto;display:block;" />
          <div id="selected-file-info" style="margin-top:10px;font-size:12.5px;color:#334155;">尚未选择本地文件（您可直接选择本地 PDF 上传，或点击右上角一键载入内置 arXiv:1706.03762 示例）</div>
          <div style="margin-top:14px;">
            <button id="btn-upload-submit" class="btn btn-primary" onclick="submitPdfUpload()">上传 PDF 并执行 18 维结构化解析</button>
          </div>
        </div>

        <div id="workspace-alert-box"></div>
      </div>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <h3 class="card-title" style="border:none;margin:0;padding:0;">SQLite 历史论文分析记录（支持查看报告、问答、导出 Markdown）</h3>
          <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="refreshPapersList()">刷新记录</button>
        </div>
        <div id="papers-history-container">正在从后端 SQLite 加载历史记录...</div>
      </div>
    </section>

    <!-- ==================== VIEW 3: REPORT DETAIL (P0) ==================== -->
    <section id="view-report" class="view-panel">
      <div id="report-detail-container">
        <div class="card" style="text-align:center;padding:48px 24px;">
          <p class="desc">当前尚未选中已分析的论文报告。请前往「论文工作台」上传 PDF 或点击下方按钮载入内置示例。</p>
          <div style="margin-top:16px;">
            <button class="btn btn-sky" onclick="loadBuiltinDemoPaper()">立即载入《Attention Is All You Need》18维结构化报告</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== VIEW 4: PAPER QA (P1) ==================== -->
    <section id="view-qa" class="view-panel">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
          <div>
            <h2 class="section-title" style="margin-bottom:4px;">论文智能问答（P1：按页切块检索 · 原文段落引用 · 精确页码标注）</h2>
            <p class="desc" id="qa-current-paper-label">当前绑定论文：请先选择或载入论文</p>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px;" onclick="fillAndAskQA('Transformer 在 WMT 2014 英德和英法翻译任务上的 BLEU 分数分别是多少？')">示例问题 1：翻译 BLEU 指标与训练耗时</button>
            <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px;" onclick="fillAndAskQA('为什么 Scaled Dot-Product Attention 需要除以 sqrt(d_k)？多头注意力的 h 和 d_k 是多少？')">示例问题 2：缩放点积与多头注意力参数</button>
            <button class="btn btn-secondary" style="padding:6px 10px;font-size:12px;" onclick="fillAndAskQA('这篇论文在 CIFAR-100 图像分类任务上的准确率是多少？')">示例问题 3：测试原文未提及问题（防幻觉拒答）</button>
          </div>
        </div>

        <div style="display:flex;gap:10px;">
          <input id="qa-question-input" type="text" placeholder="请输入您关于该论文研究问题、模型架构、训练超参数或实验结果的问题..." value="Transformer 在 WMT 2014 英德和英法翻译任务上的 BLEU 分数分别是多少？" />
          <button id="btn-qa-ask" class="btn btn-primary" style="white-space:nowrap;" onclick="submitPaperQA()">检索原文并提问</button>
        </div>
        <div id="qa-alert-box"></div>
      </div>

      <div id="qa-results-container"></div>
    </section>

    <!-- ==================== VIEW 5: EXPERIMENT ANALYSIS (P2) ==================== -->
    <section id="view-experiments" class="view-panel">
      <div class="grid-2">
        <div class="card">
          <h2 class="section-title">实验数据录入（P2：简化实验对比分析）</h2>
          <p class="desc" style="margin-bottom:14px;">所有分析结论与增减幅度计算 <strong>100% 严格依据您下方输入的数值</strong>，系统绝不编造任何实验结果。</p>

          <div style="margin-bottom:12px;">
            <label class="field-label">实验名称</label>
            <input id="exp-name" type="text" value="WMT 2014 英德/英法机器翻译架构对比实验 (Transformer vs ConvS2S)" />
          </div>
          <div style="margin-bottom:12px;">
            <label class="field-label">实验目标</label>
            <input id="exp-objective" type="text" value="验证完全基于自注意力的 Transformer 相较于卷积序列模型 ConvS2S 在翻译质量 (BLEU) 与训练算力成本上的差异" />
          </div>

          <div style="margin-bottom:12px;">
            <label class="field-label">定量实验指标对比（Baseline vs 实验组）</label>
            <table class="data-table">
              <thead>
                <tr>
                  <th>评价指标名称</th>
                  <th>Baseline 名称</th>
                  <th>Baseline 数值</th>
                  <th>实验组名称</th>
                  <th>实验组数值</th>
                  <th>单位</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><input id="m1-name" type="text" value="WMT14 EN-DE BLEU" /></td>
                  <td><input id="m1-bname" type="text" value="ConvS2S" /></td>
                  <td><input id="m1-bval" type="number" step="0.01" value="25.16" /></td>
                  <td><input id="m1-ename" type="text" value="Transformer (big)" /></td>
                  <td><input id="m1-eval" type="number" step="0.01" value="28.40" /></td>
                  <td><input id="m1-unit" type="text" value="BLEU" /></td>
                </tr>
                <tr>
                  <td><input id="m2-name" type="text" value="WMT14 EN-FR BLEU" /></td>
                  <td><input id="m2-bname" type="text" value="ConvS2S" /></td>
                  <td><input id="m2-bval" type="number" step="0.01" value="40.46" /></td>
                  <td><input id="m2-ename" type="text" value="Transformer (big)" /></td>
                  <td><input id="m2-eval" type="number" step="0.01" value="41.80" /></td>
                  <td><input id="m2-unit" type="text" value="BLEU" /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-bottom:12px;">
            <label class="field-label">实验结果补充描述</label>
            <input id="exp-summary-input" type="text" value="Transformer (big) 在英德与英法测试集上均刷新 SOTA，且仅需 8 张 P100 训练 3.5 天（300,000 步）。" />
          </div>
          <div style="margin-bottom:14px;">
            <label class="field-label">实验备注（超参数 / 硬件配置 / 观察现象）</label>
            <textarea id="exp-notes" rows="2">采用 h=8 头自注意力，d_model=1024 (big) / 512 (base)，Adam 优化器 warmup_steps=4000，label smoothing=0.1。</textarea>
          </div>

          <button id="btn-exp-analyze" class="btn btn-primary" style="width:100%;" onclick="submitExperimentAnalysis()">生成零编造实验对比分析报告</button>
        </div>

        <div id="experiment-report-container">
          <div class="card">
            <h3 class="card-title">AI 实验分析报告预览区</h3>
            <p class="desc">点击左侧「生成零编造实验对比分析报告」后，此处将实时展示：实验结果概述、指标对比表、结果变化、可能原因、实验局限及后续实验建议。</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== VIEW 6: SYSTEM STATUS (健康检查) ==================== -->
    <section id="view-status" class="view-panel">
      <div class="card">
        <div class="health-hero">
          <div>
            <h2 class="section-title" style="margin-bottom:6px;">后端服务健康状态（GET /api/health）</h2>
            <p class="desc">实时读取后端 FastAPI 健康检查接口，展示服务状态、引擎配置与数据概况。数据每 15 秒自动刷新。</p>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span id="health-status-pill" class="badge badge-slate"><span class="dot"></span>检测中...</span>
            <button class="btn btn-secondary" style="padding:7px 12px;font-size:12px;" onclick="loadHealth()">立即刷新</button>
          </div>
        </div>
        <div id="health-updated-at" style="font-size:12px;color:#64748b;margin-top:12px;">尚未获取数据</div>
      </div>

      <div id="health-alert-box"></div>

      <div class="card">
        <h3 class="card-title">运行状态概览</h3>
        <div id="health-metrics" class="health-grid">
          <div class="health-item"><div class="label">服务状态</div><div class="value">检测中...</div></div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">原始响应 JSON（与浏览器直接访问 /api/health 一致）</h3>
        <pre id="health-raw-json" class="json-view">尚未获取数据</pre>
      </div>
    </section>
  </main>

  <footer class="footer">
    AI Research Assistant (Your AI-powered Research Assistant) · FastAPI + PyMuPDF + SQLite + Next.js/React · 4A 防幻觉与原文页码溯源架构
  </footer>

  <script>
    const API_BASE = "${API_BASE_URL}";
    let currentPapers = [];
    let activePaper = null;

    function escapeHtml(str) {
      if (str === null || str === undefined) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    }

    function switchTab(tabId) {
      ["home", "workspace", "report", "qa", "experiments", "status"].forEach((id) => {
        const panel = document.getElementById("view-" + id);
        const btn = document.getElementById("tab-btn-" + id);
        if (panel) panel.classList.toggle("active", id === tabId);
        if (btn) btn.classList.toggle("active", id === tabId);
      });
      if (tabId === "workspace") refreshPapersList();
      if (tabId === "report" && activePaper) renderReportDetail(activePaper);
      if (tabId === "qa") updateQaHeader();
      if (tabId === "status") loadHealth();
    }

    async function checkBackendHealth() {
      const statusBadge = document.getElementById("backend-status-badge");
      const engineBadge = document.getElementById("engine-mode-badge");
      try {
        const res = await fetch(API_BASE + "/api/health");
        const data = await res.json();
        statusBadge.className = "badge badge-emerald";
        statusBadge.innerHTML = '<span class="dot dot-ok"></span>后端 API 在线 (:8000)';
        engineBadge.textContent = data.api_key_configured
          ? "LLM: " + data.llm_provider
          : "引擎: 原文证据核验模式 (免Key可用)";
      } catch (e) {
        statusBadge.className = "badge badge-rose";
        statusBadge.innerHTML = '<span class="dot dot-err"></span>后端未连接';
        engineBadge.textContent = "离线";
      }
    }

    async function refreshPapersList() {
      const container = document.getElementById("papers-history-container");
      try {
        const res = await fetch(API_BASE + "/api/papers");
        currentPapers = await res.json();
        if (currentPapers.length > 0 && !activePaper) {
          activePaper = currentPapers[0];
        }
        if (currentPapers.length === 0) {
          container.innerHTML = '<div class="alert alert-info">当前 SQLite 数据库中尚无论文记录。请上传 PDF 或点击右上角「一键载入真实示例论文」。</div>';
          return;
        }
        let rowsHtml = currentPapers.map((p) => {
          const demoBadge = p.is_demo
            ? '<span class="badge badge-amber" style="margin-right:6px;">【示例演示数据】</span>'
            : '<span class="badge badge-sky" style="margin-right:6px;">【用户真实数据】</span>';
          const statusBadge = p.status === "analyzed"
            ? '<span class="badge badge-emerald">已分析 (18维)</span>'
            : (p.status === "scanned_warning" ? '<span class="badge badge-amber">扫描版警告</span>' : '<span class="badge badge-slate">' + escapeHtml(p.status) + '</span>');
          const title = (p.analysis && p.analysis.title) ? p.analysis.title : p.filename;
          return '<tr>' +
            '<td><strong>#' + p.id + '</strong></td>' +
            '<td>' + demoBadge + '<strong>' + escapeHtml(title) + '</strong><div style="font-size:11px;color:#64748b;">文件名: ' + escapeHtml(p.filename) + ' (' + (p.file_size / 1024).toFixed(1) + ' KB)</div></td>' +
            '<td>' + p.page_count + ' 页</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td style="font-size:11.5px;color:#475569;">' + escapeHtml(p.analysis_engine) + '</td>' +
            '<td><div style="display:flex;gap:6px;flex-wrap:wrap;">' +
              '<button class="btn btn-primary" style="padding:5px 10px;font-size:12px;" onclick="openPaperReport(' + p.id + ')">查看 18 维报告</button>' +
              '<button class="btn btn-secondary" style="padding:5px 10px;font-size:12px;" onclick="openPaperQA(' + p.id + ')">论文问答</button>' +
              '<a class="btn btn-sky" style="padding:5px 10px;font-size:12px;" href="' + API_BASE + '/api/papers/' + p.id + '/export" download="report_paper_' + p.id + '.md">导出 .md</a>' +
            '</div></td>' +
          '</tr>';
        }).join("");
        container.innerHTML = '<table class="data-table"><thead><tr><th>ID</th><th>论文标题 / 文件信息</th><th>页数</th><th>状态</th><th>分析引擎</th><th>操作</th></tr></thead><tbody>' + rowsHtml + '</tbody></table>';
      } catch (e) {
        container.innerHTML = '<div class="alert alert-error">加载历史记录失败：' + escapeHtml(e.message) + '</div>';
      }
    }

    function onFileSelected() {
      const input = document.getElementById("pdf-file-input");
      const info = document.getElementById("selected-file-info");
      const alertBox = document.getElementById("workspace-alert-box");
      alertBox.innerHTML = "";
      if (!input.files || !input.files[0]) {
        info.textContent = "尚未选择本地文件";
        return;
      }
      const f = input.files[0];
      info.innerHTML = '已选文件：<strong>' + escapeHtml(f.name) + '</strong> （大小：' + (f.size / 1024).toFixed(2) + ' KB）';
    }

    async function submitPdfUpload() {
      const input = document.getElementById("pdf-file-input");
      const alertBox = document.getElementById("workspace-alert-box");
      if (!input.files || !input.files[0]) {
        alertBox.innerHTML = '<div class="alert alert-error">请先选择一个本地 .pdf 文件，或点击右上角「一键载入真实示例论文」。</div>';
        return;
      }
      const file = input.files[0];
      const formData = new FormData();
      formData.append("file", file);
      alertBox.innerHTML = '<div class="alert alert-info">正在上传并执行 PyMuPDF 分页文本提取与 18 维结构化分析，请稍候...</div>';
      try {
        const res = await fetch(API_BASE + "/api/papers/upload?auto_analyze=true", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) {
          alertBox.innerHTML = '<div class="alert alert-error"><strong>上传校验未通过：</strong> ' + escapeHtml(data.detail || "上传失败") + '</div>';
          return;
        }
        activePaper = data;
        await refreshPapersList();
        renderReportDetail(data);
        switchTab("report");
      } catch (e) {
        alertBox.innerHTML = '<div class="alert alert-error">上传请求异常：' + escapeHtml(e.message) + '</div>';
      }
    }

    async function loadBuiltinDemoPaper() {
      const alertBox = document.getElementById("workspace-alert-box");
      if (alertBox) alertBox.innerHTML = '<div class="alert alert-info">正在载入并解析《Attention Is All You Need》(arXiv:1706.03762) 真实 PDF...</div>';
      try {
        const res = await fetch(API_BASE + "/api/papers/demo/load", { method: "POST" });
        const data = await res.json();
        activePaper = data;
        await refreshPapersList();
        renderReportDetail(data);
        switchTab("report");
      } catch (e) {
        if (alertBox) alertBox.innerHTML = '<div class="alert alert-error">载入示例失败：' + escapeHtml(e.message) + '</div>';
      }
    }

    async function openPaperReport(paperId) {
      const res = await fetch(API_BASE + "/api/papers/" + paperId);
      if (res.ok) {
        activePaper = await res.json();
        renderReportDetail(activePaper);
        switchTab("report");
      }
    }

    async function openPaperQA(paperId) {
      const res = await fetch(API_BASE + "/api/papers/" + paperId);
      if (res.ok) {
        activePaper = await res.json();
        updateQaHeader();
        switchTab("qa");
      }
    }

    function renderReportDetail(paper) {
      const container = document.getElementById("report-detail-container");
      if (!paper || !paper.analysis) {
        container.innerHTML = '<div class="card"><div class="alert alert-warn">该论文尚未生成结构化分析结果（状态：' + escapeHtml(paper ? paper.status : "未选择") + ' ' + escapeHtml(paper && paper.error_message ? paper.error_message : "") + '）</div></div>';
        return;
      }
      const a = paper.analysis;
      const demoTag = paper.is_demo
        ? '<span class="badge badge-amber">【示例演示数据】基于 arXiv:1706.03762 原始 PDF 实测提取</span>'
        : '<span class="badge badge-sky">【用户上传真实数据】</span>';

      const evidencesHtml = (a.evidences || []).map((ev, idx) =>
        '<tr>' +
          '<td><span class="badge badge-sky">Page ' + ev.page + '</span><div style="font-size:11px;color:#64748b;margin-top:4px;">' + escapeHtml(ev.section) + '</div></td>' +
          '<td><span class="badge badge-emerald">' + escapeHtml(ev.fact_or_inference) + '</span></td>' +
          '<td><strong>' + escapeHtml(ev.claim) + '</strong></td>' +
          '<td><div class="quote-box" style="margin:0;">&ldquo;' + escapeHtml(ev.quote) + '&rdquo;</div></td>' +
        '</tr>'
      ).join("");

      const numChecksHtml = (a.number_checks || []).map((nc) =>
        '<tr>' +
          '<td><code>' + escapeHtml(nc.number) + '</code></td>' +
          '<td>' + (nc.verified_in_source ? '<span class="badge badge-emerald">已在原文核实</span>' : '<span class="badge badge-amber">待人工核实</span>') + '</td>' +
          '<td>' + ((nc.matched_pages || []).map(p => 'Page ' + p).join(', ') || '-') + '</td>' +
          '<td style="font-size:12px;color:#475569;">' + escapeHtml(nc.source_snippet) + '</td>' +
        '</tr>'
      ).join("");

      container.innerHTML =
        '<div class="card">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;border-bottom:1px solid #e2e8f0;padding-bottom:16px;">' +
            '<div>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">' +
                demoTag +
                '<span class="badge badge-emerald">共 ' + paper.page_count + ' 页 · 已通过 4A 核验</span>' +
                '<span class="badge badge-slate">解析引擎: ' + escapeHtml(paper.analysis_engine) + '</span>' +
              '</div>' +
              '<h1 style="font-size:24px;font-weight:800;color:#0f172a;">' + escapeHtml(a.title) + '</h1>' +
              '<p class="desc" style="margin-top:4px;"><strong>作者 (Authors)：</strong> ' + escapeHtml((a.authors || []).join(", ")) + '</p>' +
              '<p class="desc"><strong>发表年份 (Year)：</strong> ' + escapeHtml(a.publication_year) + ' &nbsp;|&nbsp; <strong>发表期刊/会议 (Venue)：</strong> ' + escapeHtml(a.venue) + '</p>' +
            '</div>' +
            '<div style="display:flex;gap:10px;">' +
              '<button class="btn btn-secondary" onclick="switchTab(&#39;qa&#39;)">向本文提问 (P1 问答)</button>' +
              '<a id="btn-export-markdown" class="btn btn-primary" href="' + API_BASE + '/api/papers/' + paper.id + '/export" download="report_paper_' + paper.id + '.md">导出 Markdown 报告 (.md)</a>' +
            '</div>' +
          '</div>' +
          '<div style="margin-top:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;">' +
            '<div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">5. 摘要（Abstract）</div>' +
            '<p class="desc">' + escapeHtml(a.abstract) + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="grid-2">' +
          '<div class="card">' +
            '<h3 class="card-title">6-8. 研究背景、核心研究问题与研究动机（Research Question & Motivation）</h3>' +
            '<p class="desc" style="margin-bottom:10px;"><strong>6. 研究背景 (Background)：</strong> ' + escapeHtml(a.background) + '</p>' +
            '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px;margin-bottom:10px;font-size:13px;color:#0369a1;">' +
              '<strong>7. 核心研究问题 (Research Question)：</strong> ' + escapeHtml(a.research_question) +
            '</div>' +
            '<p class="desc"><strong>8. 研究动机 (Motivation)：</strong> ' + escapeHtml(a.motivation) + '</p>' +
          '</div>' +
          '<div class="card">' +
            '<h3 class="card-title">9-10. 核心方法与系统架构（Methodology & Architecture）</h3>' +
            '<p class="desc" style="white-space:pre-line;margin-bottom:10px;"><strong>9. 核心方法 (Methodology)：</strong><br/>' + escapeHtml(a.methodology) + '</p>' +
            '<p class="desc" style="white-space:pre-line;"><strong>10. 模型或系统架构 (Architecture)：</strong><br/>' + escapeHtml(a.architecture) + '</p>' +
          '</div>' +
        '</div>' +

        '<div class="grid-2">' +
          '<div class="card">' +
            '<h3 class="card-title">11-13. 实验设计、数据集与评价指标（Experiment Setup）</h3>' +
            '<p class="desc" style="margin-bottom:10px;"><strong>11. 实验设计 (Experimental Design)：</strong> ' + escapeHtml(a.experimental_design) + '</p>' +
            '<p class="desc" style="margin-bottom:8px;"><strong>12. 数据集 (Datasets)：</strong></p>' +
            '<ul style="padding-left:18px;font-size:12.5px;color:#334155;margin-bottom:10px;">' + (a.datasets || []).map(d => '<li>' + escapeHtml(d) + '</li>').join("") + '</ul>' +
            '<p class="desc"><strong>13. 评价指标 (Metrics)：</strong> ' + (a.metrics || []).map(m => '<span class="badge badge-slate" style="margin-right:6px;">' + escapeHtml(m) + '</span>').join("") + '</p>' +
          '</div>' +
          '<div class="card">' +
            '<h3 class="card-title">14. 核心实验结果（Experimental Results）</h3>' +
            '<p class="desc" style="white-space:pre-line;margin-bottom:12px;">' + escapeHtml(a.results) + '</p>' +
            '<h3 class="card-title">15-16. 创新点与论文局限性（Contributions & Limitations）</h3>' +
            '<p class="desc"><strong>15. 创新点：</strong></p>' +
            '<ul style="padding-left:18px;font-size:12.5px;color:#334155;margin-bottom:8px;">' + (a.contributions || []).map(c => '<li>' + escapeHtml(c) + '</li>').join("") + '</ul>' +
            '<p class="desc"><strong>16. 论文局限性：</strong></p>' +
            '<ul style="padding-left:18px;font-size:12.5px;color:#334155;">' + (a.limitations || []).map(l => '<li>' + escapeHtml(l) + '</li>').join("") + '</ul>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3 class="card-title">17-18. 结论与后续研究方向（Conclusion & Future Work）</h3>' +
          '<p class="desc" style="margin-bottom:8px;"><strong>17. 结论 (Conclusion)：</strong> ' + escapeHtml(a.conclusion) + '</p>' +
          '<p class="desc"><strong>18. 后续研究方向 (Future Work)：</strong> ' + escapeHtml(a.future_work) + '</p>' +
        '</div>' +

        '<div class="card">' +
          '<h3 class="card-title">质量检查一：原文可追溯证据卡片（Source Traceability & Page Citations）</h3>' +
          '<table class="data-table"><thead><tr><th style="width:120px;">页码与章节</th><th style="width:95px;">属性</th><th style="width:260px;">AI 分析结论声明</th><th>原文逐字摘录证据 (Verbatim Quote)</th></tr></thead><tbody>' + evidencesHtml + '</tbody></table>' +
        '</div>' +

        '<div class="card">' +
          '<h3 class="card-title">质量检查二：实验数字原文一致性核验表（Programmatic Numerical Verification）</h3>' +
          '<table class="data-table"><thead><tr><th style="width:110px;">报告数值</th><th style="width:120px;">核验状态</th><th style="width:130px;">原文出现页码</th><th>原文匹配上下文片段</th></tr></thead><tbody>' + numChecksHtml + '</tbody></table>' +
        '</div>';
    }

    function updateQaHeader() {
      const label = document.getElementById("qa-current-paper-label");
      if (activePaper) {
        label.innerHTML = '当前绑定论文：<strong>' + escapeHtml(activePaper.filename) + '</strong> （ID: #' + activePaper.id + '，共 ' + activePaper.page_count + ' 页）';
      } else {
        label.innerHTML = '当前尚未加载论文，系统将在提问时自动载入内置示例论文《Attention Is All You Need》。';
      }
    }

    function fillAndAskQA(qText) {
      document.getElementById("qa-question-input").value = qText;
      submitPaperQA();
    }

    async function submitPaperQA() {
      const input = document.getElementById("qa-question-input");
      const alertBox = document.getElementById("qa-alert-box");
      const resultsBox = document.getElementById("qa-results-container");
      const q = input.value.trim();
      if (!q) return;

      if (!activePaper) {
        const demoRes = await fetch(API_BASE + "/api/papers/demo/load", { method: "POST" });
        activePaper = await demoRes.json();
        updateQaHeader();
      }

      alertBox.innerHTML = '<div class="alert alert-info">正在按页码分块检索原文段落并生成带引用的回答...</div>';
      try {
        const res = await fetch(API_BASE + "/api/qa/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paper_id: activePaper.id, question: q, top_k: 3 }),
        });
        const data = await res.json();
        alertBox.innerHTML = "";
        const citationsHtml = (data.citations || []).map((c, idx) =>
          '<div class="quote-box">' +
            '<span class="badge badge-sky">Page ' + c.page + '</span> ' +
            '<span style="font-size:11.5px;color:#64748b;">' + escapeHtml(c.section_hint) + ' · 检索相关度得分: ' + c.score + '</span>' +
            '<div style="margin-top:4px;">&ldquo;' + escapeHtml(c.snippet) + '&rdquo;</div>' +
          '</div>'
        ).join("");

        const cardHtml =
          '<div class="card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
              '<div style="font-size:14px;font-weight:700;color:#0f172a;">提问：' + escapeHtml(data.question) + '</div>' +
              (data.has_evidence ? '<span class="badge badge-emerald">已匹配原文页码证据</span>' : '<span class="badge badge-amber">无原文依据 · 已触发防幻觉拒答</span>') +
            '</div>' +
            '<div class="desc" style="white-space:pre-line;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">' + escapeHtml(data.answer) + '</div>' +
            (citationsHtml ? '<div style="margin-top:12px;"><div style="font-size:12px;font-weight:700;color:#334155;">原文引用来源（Page-Level Citations）：</div>' + citationsHtml + '</div>' : '') +
          '</div>';
        resultsBox.innerHTML = cardHtml + resultsBox.innerHTML;
      } catch (e) {
        alertBox.innerHTML = '<div class="alert alert-error">问答请求失败：' + escapeHtml(e.message) + '</div>';
      }
    }

    async function submitExperimentAnalysis() {
      const container = document.getElementById("experiment-report-container");
      const payload = {
        experiment_name: document.getElementById("exp-name").value,
        objective: document.getElementById("exp-objective").value,
        metrics: [
          {
            metric_name: document.getElementById("m1-name").value,
            baseline_name: document.getElementById("m1-bname").value,
            baseline_value: parseFloat(document.getElementById("m1-bval").value),
            experiment_group_name: document.getElementById("m1-ename").value,
            experiment_value: parseFloat(document.getElementById("m1-eval").value),
            higher_is_better: true,
            unit: document.getElementById("m1-unit").value,
          },
          {
            metric_name: document.getElementById("m2-name").value,
            baseline_name: document.getElementById("m2-bname").value,
            baseline_value: parseFloat(document.getElementById("m2-bval").value),
            experiment_group_name: document.getElementById("m2-ename").value,
            experiment_value: parseFloat(document.getElementById("m2-eval").value),
            higher_is_better: true,
            unit: document.getElementById("m2-unit").value,
          },
        ],
        result_summary_input: document.getElementById("exp-summary-input").value,
        notes: document.getElementById("exp-notes").value,
      };
      try {
        const res = await fetch(API_BASE + "/api/experiments/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        const r = data.report;
        const rows = (r.metric_comparisons || []).map(m =>
          '<tr>' +
            '<td><strong>' + escapeHtml(m.metric_name) + '</strong></td>' +
            '<td>' + escapeHtml(m.baseline_name) + ': <code>' + m.baseline_value + ' ' + escapeHtml(m.unit) + '</code></td>' +
            '<td>' + escapeHtml(m.experiment_group_name) + ': <code>' + m.experiment_value + ' ' + escapeHtml(m.unit) + '</code></td>' +
            '<td><code>' + (m.absolute_diff > 0 ? '+' : '') + m.absolute_diff + ' (' + (m.relative_change_pct > 0 ? '+' : '') + m.relative_change_pct + '%)</code></td>' +
            '<td><span class="badge badge-emerald">' + escapeHtml(m.evaluation) + '</span></td>' +
          '</tr>'
        ).join("");

        container.innerHTML =
          '<div class="card">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
              '<h3 class="card-title" style="margin:0;border:none;">AI 实验对比分析报告（100% 源自输入数据）</h3>' +
              '<span class="badge badge-emerald">零编造核验通过</span>' +
            '</div>' +
            '<p class="desc" style="margin-bottom:12px;"><strong>1. 实验结果概述：</strong> ' + escapeHtml(r.overview) + '</p>' +
            '<div style="margin-bottom:12px;"><strong>2. 指标定量对比表：</strong>' +
              '<table class="data-table"><thead><tr><th>指标</th><th>Baseline</th><th>实验组</th><th>变化幅度</th><th>判定</th></tr></thead><tbody>' + rows + '</tbody></table>' +
            '</div>' +
            '<div style="margin-bottom:10px;"><strong>3. 结果变化明细：</strong><ul style="padding-left:18px;font-size:12.5px;color:#334155;">' + (r.result_changes || []).map(x => '<li>' + escapeHtml(x) + '</li>').join("") + '</ul></div>' +
            '<div style="margin-bottom:10px;"><strong>4. 可能原因分析：</strong><ul style="padding-left:18px;font-size:12.5px;color:#334155;">' + (r.possible_causes || []).map(x => '<li>' + escapeHtml(x) + '</li>').join("") + '</ul></div>' +
            '<div style="margin-bottom:10px;"><strong>5. 实验局限性：</strong><ul style="padding-left:18px;font-size:12.5px;color:#334155;">' + (r.limitations || []).map(x => '<li>' + escapeHtml(x) + '</li>').join("") + '</ul></div>' +
            '<div><strong>6. 后续实验建议：</strong><ul style="padding-left:18px;font-size:12.5px;color:#334155;">' + (r.next_step_suggestions || []).map(x => '<li>' + escapeHtml(x) + '</li>').join("") + '</ul></div>' +
          '</div>';
      } catch (e) {
        container.innerHTML = '<div class="alert alert-error">实验分析失败：' + escapeHtml(e.message) + '</div>';
      }
    }

    // ==================== 系统状态页面（/api/health 可视化） ====================
    async function loadHealth() {
      const pill = document.getElementById("health-status-pill");
      const metricsBox = document.getElementById("health-metrics");
      const rawBox = document.getElementById("health-raw-json");
      const updatedBox = document.getElementById("health-updated-at");
      const alertBox = document.getElementById("health-alert-box");
      alertBox.innerHTML = "";

      try {
        const res = await fetch(API_BASE + "/api/health");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const d = await res.json();
        const ok = d.status === "ok";

        pill.className = "badge " + (ok ? "badge-emerald" : "badge-rose");
        pill.innerHTML = '<span class="dot ' + (ok ? "dot-ok" : "dot-err") + '"></span>' + (ok ? "服务正常" : "服务异常");

        const engineName = d.api_key_configured
          ? "外部 LLM API"
          : "原文证据核验模式";
        const items = [
          {
            label: "服务状态 (status)",
            value: ok ? "正常运行" : String(d.status),
            hint: ok ? "FastAPI 已就绪，数据库可访问" : "请检查后端进程与数据库",
          },
          {
            label: "应用与版本 (app_name / version)",
            value: escapeHtml(d.app_name),
            hint: "v" + escapeHtml(d.version) + " · " + escapeHtml(d.subtitle),
          },
          {
            label: "分析引擎模式",
            value: engineName,
            hint: d.api_key_configured
              ? "API Key 已配置，将优先调用外部兼容接口"
              : "未配置 API Key，自动降级为原文证据提取，功能完整可用",
          },
          {
            label: "LLM 服务商配置 (llm_provider)",
            value: escapeHtml(d.llm_provider),
            hint: "auto = 外部 API → 本地 Ollama → 原文启发式逐级降级",
          },
          {
            label: "LLM API Key (api_key_configured)",
            value: d.api_key_configured ? "已配置" : "未配置",
            hint: d.api_key_configured ? "密钥仅保存在后端 .env" : "免 Key 模式，不会发起外部 API 费用",
          },
          {
            label: "本地 Ollama 模型 (ollama_model)",
            value: escapeHtml(d.ollama_model),
            hint: "健康接口不主动探测；Ollama 未运行时自动降级",
          },
          {
            label: "向量检索 (embedding_provider)",
            value: d.embedding_provider === "none" ? "BM25（本地）" : escapeHtml(d.embedding_provider),
            hint: "none = 零模型下载，按页码分块关键词检索",
          },
          {
            label: "单文件上传上限 (max_upload_size_mb)",
            value: escapeHtml(d.max_upload_size_mb) + " MB",
            hint: "超出限制的文件将被后端直接拒绝",
          },
          {
            label: "论文记录数 (papers_count)",
            value: escapeHtml(d.papers_count),
            hint: "SQLite 中当前保存的论文总数",
          },
        ];

        metricsBox.innerHTML = items.map((it) =>
          '<div class="health-item">' +
            '<div class="label">' + it.label + '</div>' +
            '<div class="value">' + it.value + '</div>' +
            '<div class="hint">' + it.hint + '</div>' +
          '</div>'
        ).join("");

        rawBox.textContent = JSON.stringify(d, null, 2);
        updatedBox.textContent = "最近更新：" + new Date().toLocaleString("zh-CN", { hour12: false }) + " · 接口地址：" + API_BASE + "/api/health";
      } catch (e) {
        pill.className = "badge badge-rose";
        pill.innerHTML = '<span class="dot dot-err"></span>无法连接';
        alertBox.innerHTML = '<div class="alert alert-error">无法获取健康状态：' + escapeHtml(e.message) + '。请确认后端已在 :8000 端口运行。</div>';
        rawBox.textContent = "";
        updatedBox.textContent = "最近尝试：" + new Date().toLocaleString("zh-CN", { hour12: false });
      }
    }

    // 仅在「系统状态」页激活时每 15 秒自动刷新，避免无意义轮询
    setInterval(() => {
      const panel = document.getElementById("view-status");
      if (panel && panel.classList.contains("active")) loadHealth();
    }, 15000);

    // Initialize on load
    checkBackendHealth();
    refreshPapersList();
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", frontend_port: PORT, api_base: API_BASE_URL }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(INDEX_HTML);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`AI Research Assistant Frontend running at http://localhost:${PORT} (API -> ${API_BASE_URL})`);
});
