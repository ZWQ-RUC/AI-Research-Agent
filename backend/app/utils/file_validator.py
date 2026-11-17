# -*- coding: utf-8 -*-
"""
PDF file validation utility (extension, non-empty, size limit, magic bytes).
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class ValidationOutcome:
    valid: bool
    status_code: int = 200
    error_message: Optional[str] = None


def validate_pdf_upload(
    filename: str,
    content_type: Optional[str],
    content_bytes: bytes,
    max_size_bytes: int,
    max_size_mb: int,
) -> ValidationOutcome:
    """
    Validates uploaded PDF file:
    1. Checks file extension (.pdf)
    2. Rejects empty files (0 bytes)
    3. Checks max upload size (default 30MB)
    4. Checks actual PDF magic header (%PDF-)
    """
    if not filename or not filename.strip().lower().endswith(".pdf"):
        return ValidationOutcome(
            valid=False,
            status_code=400,
            error_message="文件格式错误：仅支持扩展名为 .pdf 的 PDF 学术论文文件。",
        )

    if content_bytes is None or len(content_bytes) == 0:
        return ValidationOutcome(
            valid=False,
            status_code=400,
            error_message="上传失败：文件为空（0 字节），请选择包含有效内容的 PDF 论文文件。",
        )

    if len(content_bytes) > max_size_bytes:
        actual_mb = round(len(content_bytes) / (1024 * 1024), 2)
        return ValidationOutcome(
            valid=False,
            status_code=413,
            error_message=f"文件大小超出限制：当前文件为 {actual_mb} MB，系统最大允许上传 {max_size_mb} MB。",
        )

    # Check PDF magic bytes (%PDF-) within first 1024 bytes
    head_slice = content_bytes[:1024]
    if b"%PDF-" not in head_slice:
        return ValidationOutcome(
            valid=False,
            status_code=400,
            error_message="真实文件类型校验失败：该文件不包含合法的 %PDF- 文件头，请勿将非 PDF 文件直接改名上传。",
        )

    return ValidationOutcome(valid=True, status_code=200, error_message=None)
