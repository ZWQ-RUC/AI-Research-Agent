# -*- coding: utf-8 -*-
"""
API Router for Paper Upload, Parsing, 18-Dimension Structured Analysis,
History Management, Demo Loading, and Markdown Export (P0).
"""
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from fastapi.responses import PlainTextResponse

from app.config import PROJECT_ROOT, get_settings
from app.database.db import get_db
from app.models.paper import PaperRecord
from app.schemas.paper import AnalyzeRequest, PaperAnalysisResult, PaperSummaryResponse
from app.services.llm_service import (
    LLMInvocationError,
    MissingAPIKeyError,
    analyze_paper_structured,
)
from app.services.markdown_exporter import export_paper_to_markdown
from app.services.pdf_parser import CorruptedPDFError, extract_pdf_content
from app.utils.file_validator import validate_pdf_upload
from app.utils.security import mask_sensitive_text, safe_storage_path

router = APIRouter(prefix="/api/papers", tags=["Papers (P0 论文智能解析)"])


def _record_to_response(record: PaperRecord) -> PaperSummaryResponse:
    analysis_obj = PaperAnalysisResult(**record.analysis) if record.analysis else None
    return PaperSummaryResponse(
        id=record.id,
        filename=record.filename,
        file_size=record.file_size,
        page_count=record.page_count,
        blank_pages=record.blank_pages,
        is_scanned=record.is_scanned,
        pdf_metadata=record.pdf_metadata,
        status=record.status,
        analysis_engine=record.analysis_engine,
        analysis=analysis_obj,
        error_message=record.error_message,
        is_demo=record.is_demo,
        created_at=record.created_at,
    )


@router.get("", response_model=List[PaperSummaryResponse])
def list_papers() -> List[PaperSummaryResponse]:
    db = get_db()
    return [_record_to_response(r) for r in db.list_papers()]


@router.get("/{paper_id}", response_model=PaperSummaryResponse)
def get_paper_detail(paper_id: int) -> PaperSummaryResponse:
    db = get_db()
    record = db.get_paper(paper_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"未找到 ID 为 {paper_id} 的论文记录。")
    return _record_to_response(record)


@router.post("/upload", response_model=PaperSummaryResponse)
async def upload_paper_pdf(
    file: UploadFile = File(...),
    auto_analyze: bool = Query(default=True, description="上传并提取文本后是否自动执行结构化分析"),
) -> PaperSummaryResponse:
    settings = get_settings()
    raw_bytes = await file.read()

    # Step 1: Validate extension, non-empty, max size, and %PDF- magic bytes
    validation = validate_pdf_upload(
        filename=file.filename or "",
        content_type=file.content_type,
        content_bytes=raw_bytes,
        max_size_bytes=settings.max_upload_bytes,
        max_size_mb=settings.max_upload_size_mb,
    )
    if not validation.valid:
        raise HTTPException(status_code=validation.status_code, detail=validation.error_message)

    # Step 2: Save to safe storage path
    stored_path = safe_storage_path(settings.upload_dir, file.filename or "paper.pdf")
    stored_path.write_bytes(raw_bytes)

    # Step 3: Extract text and metadata via PyMuPDF / compatible engine
    try:
        parsed = extract_pdf_content(stored_path)
    except CorruptedPDFError as exc:
        try:
            stored_path.unlink(missing_ok=True)
        except OSError:
            # Windows 下文件句柄可能延迟释放；清理失败不应影响对用户的 422 友好拒绝
            pass
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    pages_payload = [
        {
            "page": p.page,
            "text": p.text,
            "char_count": p.char_count,
            "is_blank": p.is_blank,
        }
        for p in parsed.pages
    ]

    initial_status = "scanned_warning" if parsed.is_scanned else "uploaded"
    db = get_db()
    record = db.create_paper(
        filename=file.filename or "paper.pdf",
        stored_path=str(stored_path),
        file_size=len(raw_bytes),
        page_count=parsed.page_count,
        blank_pages=parsed.blank_pages,
        is_scanned=parsed.is_scanned,
        pdf_metadata=parsed.metadata,
        pages_text=pages_payload,
        status=initial_status,
        error_message=parsed.warning_message if parsed.warning_message else None,
        is_demo=False,
    )

    if auto_analyze and not parsed.is_scanned:
        try:
            analysis_res, engine_used = analyze_paper_structured(
                filename=record.filename,
                pages_text=record.pages_text,
                metadata=record.pdf_metadata,
                require_llm=False,
            )
            record = db.update_paper_analysis(
                paper_id=record.id,
                status="analyzed",
                analysis_engine=engine_used,
                analysis=analysis_res.model_dump(),
                error_message=parsed.warning_message if parsed.warning_message else None,
            ) or record
        except Exception as exc:
            record = db.update_paper_analysis(
                paper_id=record.id,
                status="failed",
                analysis_engine="error",
                analysis={},
                error_message=mask_sensitive_text(str(exc)),
            ) or record

    return _record_to_response(record)


@router.post("/{paper_id}/analyze", response_model=PaperSummaryResponse)
def analyze_existing_paper(
    paper_id: int,
    req: Optional[AnalyzeRequest] = None,
) -> PaperSummaryResponse:
    db = get_db()
    record = db.get_paper(paper_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"未找到 ID 为 {paper_id} 的论文记录。")

    if record.is_scanned:
        raise HTTPException(
            status_code=422,
            detail="该 PDF 为扫描版或无文字图层文档，无法提取可靠文本进行结构化分析（系统不伪造无根据报告）。",
        )

    require_llm = req.require_llm if req else False
    force_fail_llm = req.force_fail_llm if req else False

    try:
        analysis_res, engine_used = analyze_paper_structured(
            filename=record.filename,
            pages_text=record.pages_text,
            metadata=record.pdf_metadata,
            require_llm=require_llm,
            force_fail_llm=force_fail_llm,
        )
        updated = db.update_paper_analysis(
            paper_id=record.id,
            status="analyzed",
            analysis_engine=engine_used,
            analysis=analysis_res.model_dump(),
            error_message=None,
        )
        return _record_to_response(updated or record)
    except MissingAPIKeyError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except LLMInvocationError as exc:
        raise HTTPException(status_code=502, detail=mask_sensitive_text(str(exc))) from exc


@router.post("/demo/load", response_model=PaperSummaryResponse)
def load_builtin_demo_paper() -> PaperSummaryResponse:
    """
    Loads and analyzes the built-in sample PDF ('Attention Is All You Need', arXiv:1706.03762)
    and explicitly flags it with is_demo=True so demo records are clearly distinguished from user uploads.
    """
    db = get_db()
    for existing in db.list_papers():
        if existing.is_demo and existing.status == "analyzed":
            return _record_to_response(existing)

    sample_pdf = PROJECT_ROOT / "demo" / "sample_attention_is_all_you_need.pdf"
    if not sample_pdf.is_file():
        raise HTTPException(status_code=404, detail="内置示例 PDF 文件尚未生成。")

    parsed = extract_pdf_content(sample_pdf)
    pages_payload = [
        {"page": p.page, "text": p.text, "char_count": p.char_count, "is_blank": p.is_blank}
        for p in parsed.pages
    ]
    record = db.create_paper(
        filename="Attention_Is_All_You_Need_arXiv_1706.03762.pdf",
        stored_path=str(sample_pdf),
        file_size=sample_pdf.stat().st_size,
        page_count=parsed.page_count,
        blank_pages=parsed.blank_pages,
        is_scanned=parsed.is_scanned,
        pdf_metadata=parsed.metadata,
        pages_text=pages_payload,
        status="uploaded",
        is_demo=True,
    )
    analysis_res, engine_used = analyze_paper_structured(
        filename=record.filename,
        pages_text=record.pages_text,
        metadata=record.pdf_metadata,
        require_llm=False,
    )
    record = db.update_paper_analysis(
        paper_id=record.id,
        status="analyzed",
        analysis_engine=engine_used,
        analysis=analysis_res.model_dump(),
        error_message=None,
    ) or record
    return _record_to_response(record)


@router.get("/{paper_id}/export", response_class=PlainTextResponse)
def export_paper_markdown(paper_id: int) -> PlainTextResponse:
    db = get_db()
    record = db.get_paper(paper_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"未找到 ID 为 {paper_id} 的论文记录。")
    if not record.analysis:
        raise HTTPException(status_code=400, detail="该论文尚未完成结构化分析，无法导出 Markdown 报告。")

    md_content = export_paper_to_markdown(record)
    safe_name = f"report_paper_{record.id}.md"
    headers = {"Content-Disposition": f'attachment; filename="{safe_name}"'}
    return PlainTextResponse(content=md_content, media_type="text/markdown; charset=utf-8", headers=headers)


@router.delete("/{paper_id}")
def delete_paper_record(paper_id: int) -> dict:
    db = get_db()
    deleted = db.delete_paper(paper_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"未找到 ID 为 {paper_id} 的论文记录。")
    return {"deleted": True, "paper_id": paper_id}
