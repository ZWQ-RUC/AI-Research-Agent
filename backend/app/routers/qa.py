# -*- coding: utf-8 -*-
"""
API Router for Page-Grounded Paper Question Answering (P1).
"""
from typing import List
from fastapi import APIRouter, HTTPException

from app.database.db import get_db
from app.schemas.paper import QARequest, QAResponse
from app.services.rag_service import answer_paper_question

router = APIRouter(prefix="/api/qa", tags=["Paper QA (P1 论文智能问答)"])


@router.post("/ask", response_model=QAResponse)
def ask_paper_question(req: QARequest) -> QAResponse:
    db = get_db()
    paper = db.get_paper(req.paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"未找到 ID 为 {req.paper_id} 的论文记录。")

    answer, citations, has_evidence, method_name = answer_paper_question(
        question=req.question,
        pages_text=paper.pages_text,
        top_k=req.top_k,
    )
    saved = db.create_qa_record(
        paper_id=paper.id,
        question=req.question,
        answer=answer,
        citations=[c.model_dump() for c in citations],
        has_evidence=has_evidence,
    )
    return QAResponse(
        id=saved["id"],
        paper_id=paper.id,
        question=req.question,
        answer=answer,
        citations=citations,
        has_evidence=has_evidence,
        retrieval_method=method_name,
        created_at=saved["created_at"],
    )


@router.get("/history/{paper_id}", response_model=List[dict])
def get_qa_history(paper_id: int) -> List[dict]:
    db = get_db()
    paper = db.get_paper(paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail=f"未找到 ID 为 {paper_id} 的论文记录。")
    return db.list_qa_records(paper_id)
