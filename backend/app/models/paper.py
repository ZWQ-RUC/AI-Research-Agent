# -*- coding: utf-8 -*-
"""
Data models for Papers, QA Histories, and Experiment Analyses.
Supports SQLAlchemy declarative mapping when SQLAlchemy is installed,
and provides clean dataclass representations for the repository layer.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

try:
    from sqlalchemy import Boolean, Column, Integer, String, Text
    from sqlalchemy.orm import declarative_base

    Base = declarative_base()

    class PaperORM(Base):
        __tablename__ = "papers"
        id = Column(Integer, primary_key=True, index=True, autoincrement=True)
        filename = Column(String(255), nullable=False)
        stored_path = Column(String(512), nullable=False)
        file_size = Column(Integer, nullable=False)
        page_count = Column(Integer, default=0)
        blank_pages_json = Column(Text, default="[]")
        is_scanned = Column(Boolean, default=False)
        pdf_metadata_json = Column(Text, default="{}")
        pages_text_json = Column(Text, default="[]")
        status = Column(String(32), default="uploaded")
        analysis_engine = Column(String(64), default="pending")
        analysis_json = Column(Text, default="{}")
        error_message = Column(Text, nullable=True)
        is_demo = Column(Boolean, default=False)
        created_at = Column(String(64), nullable=False)

    class QAHistoryORM(Base):
        __tablename__ = "qa_histories"
        id = Column(Integer, primary_key=True, index=True, autoincrement=True)
        paper_id = Column(Integer, nullable=False, index=True)
        question = Column(Text, nullable=False)
        answer = Column(Text, nullable=False)
        citations_json = Column(Text, default="[]")
        has_evidence = Column(Boolean, default=True)
        created_at = Column(String(64), nullable=False)

    class ExperimentORM(Base):
        __tablename__ = "experiments"
        id = Column(Integer, primary_key=True, index=True, autoincrement=True)
        experiment_name = Column(String(255), nullable=False)
        objective = Column(Text, nullable=False)
        metrics_input_json = Column(Text, default="[]")
        notes = Column(Text, default="")
        report_json = Column(Text, default="{}")
        created_at = Column(String(64), nullable=False)

    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False


@dataclass
class PaperRecord:
    id: int
    filename: str
    stored_path: str
    file_size: int
    page_count: int
    blank_pages: List[int] = field(default_factory=list)
    is_scanned: bool = False
    pdf_metadata: Dict[str, Any] = field(default_factory=dict)
    pages_text: List[Dict[str, Any]] = field(default_factory=list)
    status: str = "uploaded"
    analysis_engine: str = "pending"
    analysis: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    is_demo: bool = False
    created_at: str = ""
