# 第三份作业通关记录：PRD、开发计划与第一个功能原型验收（Challenge 2）

> **文档路径**：`docs/03_Challenge2.md`  
> **关联文档**：`docs/03_PRD.md`、`docs/04_Development_Plan.md`

---

## 一、本关核心交付物清单

1. **产品需求文档（PRD）**：[`docs/03_PRD.md`](./03_PRD.md)
   - 开篇明确定义六大科研阅读痛点。
   - 完成对 **Elicit**、**SciSpace**、**Scholarcy** 三款真实竞品的公开资料调研，附带真实来源链接与调研日期（2026-11-17）。
   - 完整定义 P0（论文智能解析）、P1（论文智能问答）、P2（实验数据分析）的功能需求、数据结构与异常处理矩阵。
2. **开发计划与三问审查**：[`docs/04_Development_Plan.md`](./04_Development_Plan.md)
   - 明确锁定 **MVP 的第一个功能为“论文 PDF 上传与 18 维结构化解析”**。
   - 完成 7 个阶段的依赖拆解，并通过“三问审查法”剔除了 Docker、外部向量库、多 Agent 循环等无意义复杂度。
3. **第一个功能原型实现（PDF 上传 + 分页提取 + 结构化解析）**：
   - 后端实现：`backend/app/utils/file_validator.py`、`backend/app/services/pdf_parser.py`、`backend/app/services/llm_service.py`、`backend/app/routers/papers.py`。
   - 前端实现：`frontend/src/components/PdfUploader.tsx`、`frontend/src/components/ReportViewer.tsx`。

---

## 二、第一个功能原型真实验收情况

我们对 MVP 的第一个功能原型（PDF 上传与结构化解析）执行了真实代码级与接口级验证：

| 验收子项 | 期望行为 | 实际运行结果 | 验收状态 |
| :--- | :--- | :--- | :--- |
| **1. 正常 PDF 上传** | 上传 `sample_attention_is_all_you_need.pdf`，返回文件元数据与分页提取状态 | 成功接收文件，计算大小，提取 6 页完整文本并写入 SQLite | **PASS** |
| **2. 非法文件拦截** | 上传 `.txt` 伪装文件、空文件（0B）、超过上限文件、损坏 PDF | 分别准确返回 `400`、`400`、`413`、`422` 及清晰的中文错误说明 | **PASS** |
| **3. 18 维结构化分析** | 针对已上传论文触发 `/api/papers/{id}/analyze`，生成 18 个标准维度 | 完整输出 18 个维度字段，缺失项规范标注 `未在原文中找到 / 无法确认` | **PASS** |
| **4. 原文可追溯与数字核验** | 报告包含原文片段引用、页码及实验数字核验状态 | 生成 6 条带页码原文证据卡及 12 项实验数字原文核对记录 | **PASS** |
