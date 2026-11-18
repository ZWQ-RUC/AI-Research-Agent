# -*- coding: utf-8 -*-
"""
FastAPI Application Entry Point for AI Research Assistant.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.config import get_settings
from app.database.db import get_db
from app.routers import experiments, papers, qa
from app.utils.security import mask_sensitive_text


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        description=f"{settings.app_subtitle} — 学术论文智能解析 (P0)、页码溯源问答 (P1) 与实验对比分析 (P2) 后端服务",
        version=settings.version,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Never expose internal server stack trace or API keys to clients
        safe_msg = mask_sensitive_text(str(exc))
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"服务器处理请求时发生内部错误: {safe_msg}",
                "path": request.url.path,
            },
        )

    @app.on_event("startup")
    def on_startup() -> None:
        get_db().init_db()

    @app.get("/", include_in_schema=False)
    def root() -> HTMLResponse:
        # 后端服务入口页：避免浏览器直接访问 8000 端口时只看到 {"detail":"Not Found"}
        s = get_settings()
        html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>__APP_NAME__ · 后端服务</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
         font-family: -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
         background: #f8fafc; color: #0f172a; }
  .card { width: min(560px, 92vw); padding: 36px 40px; background: #fff; border-radius: 16px;
          border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
  h1 { margin: 0 0 6px; font-size: 22px; }
  .sub { margin: 0 0 22px; color: #64748b; font-size: 14px; }
  .status { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 24px;
            padding: 4px 12px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 13px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
  a.item { display: flex; justify-content: space-between; align-items: center; gap: 12px;
           padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 10px;
           color: inherit; text-decoration: none; transition: border-color .15s, background .15s; }
  a.item:hover { border-color: #38bdf8; background: #f0f9ff; }
  .label { font-size: 14px; font-weight: 600; }
  .hint { font-size: 12px; color: #64748b; }
  code { font-family: Consolas, monospace; font-size: 12px; color: #0369a1; }
  .note { margin-top: 18px; font-size: 12px; color: #94a3b8; line-height: 1.6; }
</style>
</head>
<body>
  <div class="card">
    <h1>__APP_NAME__</h1>
    <p class="sub">__SUBTITLE__ · 后端 API 服务 v__VERSION__</p>
    <span class="status"><span class="dot"></span>后端服务运行中（:8000）</span>
    <a class="item" href="http://localhost:3000">
      <span><span class="label">前端工作台</span><br><span class="hint">论文解析、页码问答与实验对比界面</span></span>
      <code>:3000</code>
    </a>
    <a class="item" href="/docs">
      <span><span class="label">Swagger 接口文档</span><br><span class="hint">在线调试全部 API</span></span>
      <code>/docs</code>
    </a>
    <a class="item" href="/api/health">
      <span><span class="label">健康检查</span><br><span class="hint">服务状态与配置概览</span></span>
      <code>/api/health</code>
    </a>
    <p class="note">提示：本地址是后端 API，不带界面。请先启动前端（<code>node server.mjs</code>，端口 3000）再访问网页界面。</p>
  </div>
</body>
</html>"""
        html = (
            html.replace("__APP_NAME__", s.app_name)
            .replace("__SUBTITLE__", s.app_subtitle)
            .replace("__VERSION__", s.version)
        )
        return HTMLResponse(content=html)

    @app.get("/api/health", tags=["System"])
    def health_check() -> dict:
        s = get_settings()
        db = get_db()
        return {
            "status": "ok",
            "app_name": s.app_name,
            "subtitle": s.app_subtitle,
            "version": s.version,
            "llm_provider": s.llm_provider,
            "api_key_configured": s.has_api_key,
            "ollama_model": s.ollama_model,
            "embedding_provider": s.embedding_provider,
            "max_upload_size_mb": s.max_upload_size_mb,
            "papers_count": len(db.list_papers()),
        }

    app.include_router(papers.router)
    app.include_router(qa.router)
    app.include_router(experiments.router)

    return app


app = create_app()
