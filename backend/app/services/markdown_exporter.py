# -*- coding: utf-8 -*-
"""
Markdown Report Exporter Service (P0.4).
Converts a structured PaperRecord and its 18-dimension analysis + evidences + number checks
into a clean, publication-grade Markdown document ready for Obsidian / Notion / Zotero.
"""
from app.models.paper import PaperRecord


def export_paper_to_markdown(paper: PaperRecord) -> str:
    a = paper.analysis or {}
    title = a.get("title") or paper.filename
    authors = ", ".join(a.get("authors") or ["未在原文中找到 / 无法确认"])
    year = a.get("publication_year") or "未在原文中找到 / 无法确认"
    venue = a.get("venue") or "未在原文中找到 / 无法确认"

    lines = [
        f"# 论文结构化精读报告：{title}",
        "",
        f"> **生成工具**：AI Research Assistant (Your AI-powered Research Assistant)",
        f"> **原始文件名**：`{paper.filename}` | **总页数**：`{paper.page_count}` 页 | **分析状态**：`{paper.status}`",
        f"> **分析引擎**：`{paper.analysis_engine}` | **生成时间**：`{paper.created_at}`",
        "",
        "## 一、基本信息（Metadata）",
        "",
        f"- **论文标题**：{title}",
        f"- **作者列表**：{authors}",
        f"- **发表年份**：{year}",
        f"- **发表期刊/会议**：{venue}",
        "",
        "## 二、摘要与研究问题（Abstract & Research Question）",
        "",
        "### 1. 摘要（Abstract）",
        f"{a.get('abstract', '未在原文中找到 / 无法确认')}",
        "",
        "### 2. 研究背景（Background）",
        f"{a.get('background', '未在原文中找到 / 无法确认')}",
        "",
        "### 3. 核心研究问题（Research Question）",
        f"{a.get('research_question', '未在原文中找到 / 无法确认')}",
        "",
        "### 4. 研究动机（Motivation）",
        f"{a.get('motivation', '未在原文中找到 / 无法确认')}",
        "",
        "## 三、核心方法与系统架构（Methodology & Architecture）",
        "",
        "### 1. 核心方法（Methodology）",
        f"{a.get('methodology', '未在原文中找到 / 无法确认')}",
        "",
        "### 2. 模型或系统架构（Architecture）",
        f"{a.get('architecture', '未在原文中找到 / 无法确认')}",
        "",
        "## 四、实验设计与实验结果（Experiments & Results）",
        "",
        "### 1. 实验设计（Experimental Design）",
        f"{a.get('experimental_design', '未在原文中找到 / 无法确认')}",
        "",
        "### 2. 数据集（Datasets）",
    ]

    for ds in a.get("datasets") or ["未在原文中找到 / 无法确认"]:
        lines.append(f"- {ds}")

    lines.extend(["", "### 3. 评价指标（Metrics）"])
    for mt in a.get("metrics") or ["未在原文中找到 / 无法确认"]:
        lines.append(f"- {mt}")

    lines.extend(
        [
            "",
            "### 4. 实验结果（Results）",
            f"{a.get('results', '未在原文中找到 / 无法确认')}",
            "",
            "## 五、创新点、局限性与总结（Contributions, Limitations & Conclusion）",
            "",
            "### 1. 核心创新点（Contributions）",
        ]
    )
    for c in a.get("contributions") or ["未在原文中找到 / 无法确认"]:
        lines.append(f"- {c}")

    lines.extend(["", "### 2. 论文局限性（Limitations）"])
    for lim in a.get("limitations") or ["未在原文中找到 / 无法确认"]:
        lines.append(f"- {lim}")

    lines.extend(
        [
            "",
            "### 3. 结论（Conclusion）",
            f"{a.get('conclusion', '未在原文中找到 / 无法确认')}",
            "",
            "### 4. 后续研究方向（Future Work）",
            f"{a.get('future_work', '未在原文中找到 / 无法确认')}",
            "",
            "## 六、原文证据溯源清单（Verbatim Evidences）",
            "",
            "| 页码 | 章节 | 事实/推断 | AI 结论声明 | 原文逐字引用 (Quote) |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]
    )

    for ev in a.get("evidences") or []:
        pg = ev.get("page", 1)
        sec = ev.get("section", "正文")
        foi = ev.get("fact_or_inference", "原文事实")
        claim = str(ev.get("claim", "")).replace("|", "\\|")
        quote = str(ev.get("quote", "")).replace("|", "\\|")
        lines.append(f"| Page {pg} | {sec} | {foi} | {claim} | \"{quote}\" |")

    lines.extend(
        [
            "",
            "## 七、实验数字原文一致性核验表（Numerical Consistency Checks）",
            "",
            "| 提取数值 | 原文核实状态 | 匹配页码 | 原文上下文片段 |",
            "| :--- | :--- | :--- | :--- |",
        ]
    )
    for nc in a.get("number_checks") or []:
        num = nc.get("number", "")
        status_str = "已在原文核实" if nc.get("verified_in_source") else "待人工核实"
        pages_str = ", ".join(f"Page {p}" for p in (nc.get("matched_pages") or [])) or "-"
        snip = str(nc.get("source_snippet", "")).replace("|", "\\|")
        lines.append(f"| `{num}` | {status_str} | {pages_str} | {snip} |")

    lines.append("")
    return "\n".join(lines)
