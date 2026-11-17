# -*- coding: utf-8 -*-
"""
Security utilities: log redaction, path traversal protection, and safe filenames.
"""
import re
import uuid
from pathlib import Path


_SECRET_PATTERNS = [
    re.compile(r"(sk-[A-Za-z0-9_\-]{6,})"),
    re.compile(r"(Bearer\s+[A-Za-z0-9_.\-]{6,})", re.IGNORECASE),
    re.compile(r"(api[_-]?key\s*[:=]\s*['\"]?[A-Za-z0-9_\-]{6,}['\"]?)", re.IGNORECASE),
]


def mask_sensitive_text(text: str) -> str:
    """Redacts any API key or token from logs or error messages."""
    if not text:
        return ""
    masked = str(text)
    for pattern in _SECRET_PATTERNS:
        masked = pattern.sub("[REDACTED_SECRET]", masked)
    return masked


def safe_storage_path(upload_dir: Path, original_filename: str) -> Path:
    """
    Generates a safe UUID-based path inside upload_dir and prevents path traversal.
    """
    upload_root = upload_dir.resolve()
    upload_root.mkdir(parents=True, exist_ok=True)
    clean_stem = re.sub(r"[^A-Za-z0-9_\-\u4e00-\u9fa5]", "_", Path(original_filename or "paper.pdf").stem)[:48]
    unique_name = f"{clean_stem or 'paper'}_{uuid.uuid4().hex[:12]}.pdf"
    candidate = (upload_root / unique_name).resolve()
    if not str(candidate).startswith(str(upload_root)):
        raise ValueError("检测到非法文件路径访问请求（Path Traversal 被拦截）")
    return candidate
