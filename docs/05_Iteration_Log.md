# 第四份作业：产品真实迭代日志（Iteration Log）

> **文档路径**：`docs/05_Iteration_Log.md`  
> **说明**：以下四行迭代记录全部来自本项目在云端沙盒环境开发、联调与自动化测试过程中实际发现并修复的真实工程问题，绝无编造。

---

## 一、四行核心迭代记录表

| 版本 | 发现的问题 | 修改内容 | 修改结果 |
| :--- | :--- | :--- | :--- |
| **v0.1.0 → v0.2.0** | 仅校验 `.pdf` 文件扩展名时，恶意或误操作改名的文本文件（如 `fake.pdf`）及损坏的残缺 PDF 会进入解析层导致未捕获异常。 | 在 `backend/app/utils/file_validator.py` 中增加三层校验：扩展名检查 + 非空与 `MAX_UPLOAD_SIZE_MB` 字节上限检查 + `%PDF-` 文件头魔数校验，并在 `pdf_parser.py` 中捕获损坏异常统一返回 HTTP 422。 | 非 PDF 伪装文件与空文件 100% 返回 HTTP 400，超大文件返回 HTTP 413，损坏 PDF 返回 HTTP 422，消除了服务器 500 崩溃。 |
| **v0.2.0 → v0.3.0** | 当运行环境未配置 `LLM_API_KEY` 且本地 Ollama 未启动时，直接调用远程大模型会导致整个产品无法演示结构化解析流程，同时若强制要求配置又无法测试“缺少 API Key 报错”场景。 | 在 `backend/app/services/llm_service.py` 与 `/api/papers/{id}/analyze` 接口中设计双模式：当传入 `require_llm=true` 且无 Key 时明确返回 HTTP 503 缺少 API Key 错误；默认 `auto` 模式下自动切换至基于原文正则与页码定位的确定性结构化提取引擎，并在报告顶部透明标注运行引擎模式。 | 既通过了“缺少 API Key / LLM 调用失败”的自动化异常测试，又保证了用户在无 API Key 时仍能完整体验从上传到生成 18 维报告的全链路功能。 |
| **v0.3.0 → v0.4.0** | 分析报告中的实验数字（如 BLEU 28.4、41.8、层数 6、维度 512）如果仅靠文本展示，用户难以立即确认该数字是否真正在原 PDF 中出现过。 | 在 `llm_service.py` 中新增 `verify_numbers_against_text()` 函数，自动用正则抽取报告中的关键数值并在 PDF 分页原文中逐页匹配，生成包含 `number`、`verified`、`matched_pages` 与原文上下文片段的 `number_checks` 核验表。 | 报告详情页与导出的 Markdown 中均可直观看到每个核心实验数字对应的 PDF 原文页码与核验通过状态，实现了代码级数字一致性防幻觉。 |
| **v0.4.0 → v1.0.0** | 在受限网络或云端离线环境中无法从外网拉取 `node_modules` 或预装二进制包，导致前端 `:3000` 端口无法启动进行真实浏览器联调。 | 在保留完整 Next.js + TypeScript 源码工程的同时，编写零外部依赖的 `frontend/server.mjs` 本地前端服务与 `backend/app/database/db.py` 双引擎数据库适配层，并在 `scripts/start.ps1` 与 `scripts/start.sh` 中实现自动检测切换。 | 前后端在云端沙盒与本地 Windows/WSL2 环境中均可一键启动，成功通过 Chromium 真实浏览器走通全流程并完成 5 张真实界面截图。 |
