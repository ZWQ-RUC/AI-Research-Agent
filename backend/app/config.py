# -*- coding: utf-8 -*-
"""
Configuration layer for AI Research Assistant Backend.
Reads environment variables safely without exposing API keys in logs or frontend.
"""
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List


def _load_dotenv_file() -> None:
    """Lightweight .env loader without external dependency requirement."""
    env_candidates = [
        Path.cwd() / ".env",
        Path.cwd().parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]
    for env_path in env_candidates:
        if env_path.is_file():
            try:
                for raw_line in env_path.read_text(encoding="utf-8").splitlines():
                    line = raw_line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val
            except Exception:
                pass
            break


_load_dotenv_file()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


def _resolve_project_path(raw_path: str) -> Path:
    """将相对路径解析到项目根目录下，保证无论从哪个工作目录启动位置一致。"""
    p = Path(raw_path).expanduser()
    if not p.is_absolute():
        p = PROJECT_ROOT / p
    return p.resolve()


@dataclass
class Settings:
    app_name: str = "AI Research Assistant"
    app_subtitle: str = "Your AI-powered Research Assistant"
    version: str = "1.0.0"

    # LLM settings
    llm_provider: str = field(default_factory=lambda: os.getenv("LLM_PROVIDER", "auto").strip().lower())
    llm_base_url: str = field(default_factory=lambda: os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").strip())
    llm_api_key: str = field(default_factory=lambda: os.getenv("LLM_API_KEY", "").strip())
    llm_model: str = field(default_factory=lambda: os.getenv("LLM_MODEL", "gpt-4o-mini").strip())
    llm_timeout_seconds: int = field(default_factory=lambda: int(os.getenv("LLM_TIMEOUT_SECONDS", "45")))

    # Local Ollama settings
    ollama_base_url: str = field(default_factory=lambda: os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip())
    ollama_model: str = field(default_factory=lambda: os.getenv("OLLAMA_MODEL", "qwen3:4b").strip())

    # Embedding settings
    embedding_provider: str = field(default_factory=lambda: os.getenv("EMBEDDING_PROVIDER", "none").strip().lower())
    embedding_model: str = field(default_factory=lambda: os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3").strip())
    hf_bge_m3_cache_dir: str = field(
        default_factory=lambda: os.getenv(
            "HF_BGE_M3_CACHE_DIR",
            r"C:\Users\张伟强\.cache\huggingface\hub\models--BAAI--bge-m3",
        )
    )

    # Storage & Database
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL", f"sqlite:///{(PROJECT_ROOT / 'data' / 'research_assistant.db').as_posix()}"
        )
    )
    upload_dir: Path = field(
        # 相对路径统一以项目根目录为基准，避免从 backend/ 或根目录启动时落到不同位置
        default_factory=lambda: _resolve_project_path(
            os.getenv("UPLOAD_DIR", str(PROJECT_ROOT / "data" / "uploads"))
        )
    )
    max_upload_size_mb: int = field(default_factory=lambda: int(os.getenv("MAX_UPLOAD_SIZE_MB", "30")))

    # CORS
    cors_origins: List[str] = field(
        default_factory=lambda: [
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000",
            ).split(",")
            if origin.strip()
        ]
    )

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def sqlite_path(self) -> Path:
        raw = self.database_url
        if raw.startswith("sqlite:///"):
            rel_or_abs = raw[len("sqlite:///") :]
            p = Path(rel_or_abs)
            if not p.is_absolute():
                p = (PROJECT_ROOT / p).resolve()
            return p
        return (PROJECT_ROOT / "data" / "research_assistant.db").resolve()

    @property
    def has_api_key(self) -> bool:
        return bool(self.llm_api_key and len(self.llm_api_key.strip()) > 3)


def get_settings() -> Settings:
    settings = Settings()
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    return settings
