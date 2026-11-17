# -*- coding: utf-8 -*-
"""
FastAPI Application Entry Point for AI Research Assistant.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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
