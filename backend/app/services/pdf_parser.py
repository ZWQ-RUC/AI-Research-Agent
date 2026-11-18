# -*- coding: utf-8 -*-
"""
PDF Text & Metadata Extraction Service.
Primary Engine: PyMuPDF (fitz) as required in 作业.md.
Fallback Engine: pypdf / pdfplumber (when running in environments without fitz).
Features:
- Extracts text page by page while preserving page numbers and paragraph structure
- Extracts PDF metadata (title, author, subject, creator, creationDate)
- Identifies blank pages
- Detects scanned/image-only PDFs and explicitly informs the user without faking OCR
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List


@dataclass
class PageContent:
    page: int
    text: str
    char_count: int
    is_blank: bool


@dataclass
class ParsedPDFResult:
    page_count: int
    pages: List[PageContent] = field(default_factory=list)
    blank_pages: List[int] = field(default_factory=list)
    is_scanned: bool = False
    total_chars: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    parser_engine: str = "pymupdf"
    warning_message: str = ""


class CorruptedPDFError(Exception):
    """Raised when a PDF file is corrupted, encrypted, or unreadable."""


def extract_pdf_content(pdf_path: Path) -> ParsedPDFResult:
    """
    Extracts structured page-level text and metadata from a PDF file.
    Raises CorruptedPDFError if the file is damaged or unreadable.
    """
    if not pdf_path.is_file():
        raise CorruptedPDFError("PDF 文件不存在或无法访问。")

    pages_list: List[PageContent] = []
    blank_pages: List[int] = []
    metadata: Dict[str, Any] = {}
    engine_used = "pymupdf"

    # 1. Try PyMuPDF (fitz) first
    try:
        import fitz  # type: ignore

        try:
            # 从内存流打开，避免 Windows 下解析失败时仍持有文件句柄（导致后续 unlink 报 WinError 32）
            doc = fitz.open(stream=pdf_path.read_bytes(), filetype="pdf")
        except Exception as exc:
            raise CorruptedPDFError(f"PDF 文件已损坏或无法解析 (PyMuPDF): {exc}") from exc

        if doc.is_encrypted:
            doc.close()
            raise CorruptedPDFError("PDF 文件受密码加密保护，无法直接提取文本。")

        raw_meta = doc.metadata or {}
        metadata = {
            "title": (raw_meta.get("title") or "").strip(),
            "author": (raw_meta.get("author") or "").strip(),
            "subject": (raw_meta.get("subject") or "").strip(),
            "creator": (raw_meta.get("creator") or "").strip(),
            "producer": (raw_meta.get("producer") or "").strip(),
            "creationDate": (raw_meta.get("creationDate") or "").strip(),
        }
        page_count = len(doc)
        if page_count == 0:
            doc.close()
            raise CorruptedPDFError("PDF 文件不包含任何页面（0 页）。")

        for idx in range(page_count):
            page_num = idx + 1
            page_obj = doc.load_page(idx)
            txt = (page_obj.get_text("text") or "").strip()
            char_cnt = len(txt)
            is_blank = char_cnt < 5
            if is_blank:
                blank_pages.append(page_num)
            pages_list.append(
                PageContent(
                    page=page_num,
                    text=txt,
                    char_count=char_cnt,
                    is_blank=is_blank,
                )
            )
        doc.close()
        engine_used = "PyMuPDF (fitz)"

    except ImportError:
        # 2. Fallback to pypdf when PyMuPDF is not installed in the current environment
        try:
            from pypdf import PdfReader  # type: ignore
        except ImportError as exc:
            raise CorruptedPDFError("未检测到可用的 PDF 解析引擎 (PyMuPDF / pypdf)。") from exc

        try:
            reader = PdfReader(str(pdf_path), strict=False)
            if reader.is_encrypted:
                raise CorruptedPDFError("PDF 文件受密码加密保护，无法提取文本。")
            page_count = len(reader.pages)
        except CorruptedPDFError:
            raise
        except Exception as exc:
            raise CorruptedPDFError(f"PDF 文件已损坏或结构非法，无法解析文本: {exc}") from exc

        if page_count == 0:
            raise CorruptedPDFError("PDF 文件不包含任何有效页面（0 页）。")

        try:
            raw_meta = reader.metadata or {}
            metadata = {
                "title": str(getattr(raw_meta, "title", "") or raw_meta.get("/Title", "") or "").strip(),
                "author": str(getattr(raw_meta, "author", "") or raw_meta.get("/Author", "") or "").strip(),
                "subject": str(getattr(raw_meta, "subject", "") or raw_meta.get("/Subject", "") or "").strip(),
                "creator": str(getattr(raw_meta, "creator", "") or raw_meta.get("/Creator", "") or "").strip(),
                "producer": str(getattr(raw_meta, "producer", "") or raw_meta.get("/Producer", "") or "").strip(),
            }
        except Exception:
            metadata = {}

        for idx, page_obj in enumerate(reader.pages):
            page_num = idx + 1
            try:
                txt = (page_obj.extract_text() or "").strip()
            except Exception as exc:
                raise CorruptedPDFError(f"第 {page_num} 页内容流损坏，无法提取文本: {exc}") from exc
            char_cnt = len(txt)
            is_blank = char_cnt < 5
            if is_blank:
                blank_pages.append(page_num)
            pages_list.append(
                PageContent(
                    page=page_num,
                    text=txt,
                    char_count=char_cnt,
                    is_blank=is_blank,
                )
            )
        engine_used = "PyMuPDF-compatible (pypdf)"

    total_chars = sum(p.char_count for p in pages_list)
    avg_chars_per_page = total_chars / max(len(pages_list), 1)

    # Detect scanned / image-only PDF: pages exist but almost no extractable characters
    is_scanned = total_chars < 40 or avg_chars_per_page < 20
    warning_msg = ""
    if is_scanned:
        warning_msg = (
            "检测到该 PDF 可能为扫描版或纯图片文档（提取到的有效字符数极少）。"
            "当前基础文本提取模块不伪装 OCR 能力，无法从纯图像页面提取可靠文本，请上传带文字图层的原生学术 PDF。"
        )
    elif blank_pages:
        warning_msg = f"已完成文本提取，其中第 {', '.join(map(str, blank_pages))} 页识别为空白页。"

    return ParsedPDFResult(
        page_count=len(pages_list),
        pages=pages_list,
        blank_pages=blank_pages,
        is_scanned=is_scanned,
        total_chars=total_chars,
        metadata=metadata,
        parser_engine=engine_used,
        warning_message=warning_msg,
    )
