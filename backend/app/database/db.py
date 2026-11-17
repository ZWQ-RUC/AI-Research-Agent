# -*- coding: utf-8 -*-
"""
SQLite Database Access Layer (Repository Pattern).
Works out-of-the-box with Python built-in sqlite3 and maintains full schema
compatibility with SQLAlchemy ORM models defined in app/models/paper.py.
"""
import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.models.paper import PaperRecord


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class DatabaseManager:
    def __init__(self, db_path: Optional[Path] = None) -> None:
        self.db_path = db_path or get_settings().sqlite_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS papers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT NOT NULL,
                    stored_path TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    page_count INTEGER DEFAULT 0,
                    blank_pages_json TEXT DEFAULT '[]',
                    is_scanned INTEGER DEFAULT 0,
                    pdf_metadata_json TEXT DEFAULT '{}',
                    pages_text_json TEXT DEFAULT '[]',
                    status TEXT DEFAULT 'uploaded',
                    analysis_engine TEXT DEFAULT 'pending',
                    analysis_json TEXT DEFAULT '{}',
                    error_message TEXT,
                    is_demo INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS qa_histories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    paper_id INTEGER NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    citations_json TEXT DEFAULT '[]',
                    has_evidence INTEGER DEFAULT 1,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS experiments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    experiment_name TEXT NOT NULL,
                    objective TEXT NOT NULL,
                    metrics_input_json TEXT DEFAULT '[]',
                    notes TEXT DEFAULT '',
                    report_json TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL
                );
                """
            )
            conn.commit()

    def _row_to_paper(self, row: sqlite3.Row) -> PaperRecord:
        analysis_raw = json.loads(row["analysis_json"] or "{}")
        return PaperRecord(
            id=row["id"],
            filename=row["filename"],
            stored_path=row["stored_path"],
            file_size=row["file_size"],
            page_count=row["page_count"],
            blank_pages=json.loads(row["blank_pages_json"] or "[]"),
            is_scanned=bool(row["is_scanned"]),
            pdf_metadata=json.loads(row["pdf_metadata_json"] or "{}"),
            pages_text=json.loads(row["pages_text_json"] or "[]"),
            status=row["status"],
            analysis_engine=row["analysis_engine"] or "pending",
            analysis=analysis_raw if analysis_raw else None,
            error_message=row["error_message"],
            is_demo=bool(row["is_demo"]),
            created_at=row["created_at"],
        )

    def create_paper(
        self,
        filename: str,
        stored_path: str,
        file_size: int,
        page_count: int,
        blank_pages: List[int],
        is_scanned: bool,
        pdf_metadata: Dict[str, Any],
        pages_text: List[Dict[str, Any]],
        status: str = "uploaded",
        error_message: Optional[str] = None,
        is_demo: bool = False,
    ) -> PaperRecord:
        now = _utc_now_iso()
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO papers (
                    filename, stored_path, file_size, page_count,
                    blank_pages_json, is_scanned, pdf_metadata_json,
                    pages_text_json, status, analysis_engine,
                    analysis_json, error_message, is_demo, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    filename,
                    stored_path,
                    file_size,
                    page_count,
                    json.dumps(blank_pages, ensure_ascii=False),
                    1 if is_scanned else 0,
                    json.dumps(pdf_metadata, ensure_ascii=False),
                    json.dumps(pages_text, ensure_ascii=False),
                    status,
                    "pending",
                    "{}",
                    error_message,
                    1 if is_demo else 0,
                    now,
                ),
            )
            paper_id = cur.lastrowid
            conn.commit()
        return self.get_paper(paper_id)  # type: ignore

    def update_paper_analysis(
        self,
        paper_id: int,
        status: str,
        analysis_engine: str,
        analysis: Dict[str, Any],
        error_message: Optional[str] = None,
    ) -> Optional[PaperRecord]:
        with self._connect() as conn:
            conn.execute(
                """
                UPDATE papers
                SET status = ?, analysis_engine = ?, analysis_json = ?, error_message = ?
                WHERE id = ?
                """,
                (
                    status,
                    analysis_engine,
                    json.dumps(analysis, ensure_ascii=False),
                    error_message,
                    paper_id,
                ),
            )
            conn.commit()
        return self.get_paper(paper_id)

    def get_paper(self, paper_id: int) -> Optional[PaperRecord]:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM papers WHERE id = ?", (paper_id,)).fetchone()
            if not row:
                return None
            return self._row_to_paper(row)

    def list_papers(self) -> List[PaperRecord]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM papers ORDER BY id DESC").fetchall()
            return [self._row_to_paper(r) for r in rows]

    def delete_paper(self, paper_id: int) -> bool:
        with self._connect() as conn:
            conn.execute("DELETE FROM qa_histories WHERE paper_id = ?", (paper_id,))
            cur = conn.execute("DELETE FROM papers WHERE id = ?", (paper_id,))
            conn.commit()
            return cur.rowcount > 0

    def create_qa_record(
        self,
        paper_id: int,
        question: str,
        answer: str,
        citations: List[Dict[str, Any]],
        has_evidence: bool,
    ) -> Dict[str, Any]:
        now = _utc_now_iso()
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO qa_histories (paper_id, question, answer, citations_json, has_evidence, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    paper_id,
                    question,
                    answer,
                    json.dumps(citations, ensure_ascii=False),
                    1 if has_evidence else 0,
                    now,
                ),
            )
            qa_id = cur.lastrowid
            conn.commit()
        return {
            "id": qa_id,
            "paper_id": paper_id,
            "question": question,
            "answer": answer,
            "citations": citations,
            "has_evidence": has_evidence,
            "created_at": now,
        }

    def list_qa_records(self, paper_id: int) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM qa_histories WHERE paper_id = ? ORDER BY id DESC",
                (paper_id,),
            ).fetchall()
            return [
                {
                    "id": r["id"],
                    "paper_id": r["paper_id"],
                    "question": r["question"],
                    "answer": r["answer"],
                    "citations": json.loads(r["citations_json"] or "[]"),
                    "has_evidence": bool(r["has_evidence"]),
                    "created_at": r["created_at"],
                }
                for r in rows
            ]

    def create_experiment_record(
        self,
        experiment_name: str,
        objective: str,
        metrics_input: List[Dict[str, Any]],
        notes: str,
        report: Dict[str, Any],
    ) -> Dict[str, Any]:
        now = _utc_now_iso()
        with self._connect() as conn:
            cur = conn.execute(
                """
                INSERT INTO experiments (experiment_name, objective, metrics_input_json, notes, report_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    experiment_name,
                    objective,
                    json.dumps(metrics_input, ensure_ascii=False),
                    notes,
                    json.dumps(report, ensure_ascii=False),
                    now,
                ),
            )
            exp_id = cur.lastrowid
            conn.commit()
        return {
            "id": exp_id,
            "experiment_name": experiment_name,
            "objective": objective,
            "metrics": metrics_input,
            "notes": notes,
            "report": report,
            "created_at": now,
        }

    def list_experiments(self) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM experiments ORDER BY id DESC").fetchall()
            return [
                {
                    "id": r["id"],
                    "experiment_name": r["experiment_name"],
                    "objective": r["objective"],
                    "metrics": json.loads(r["metrics_input_json"] or "[]"),
                    "notes": r["notes"],
                    "report": json.loads(r["report_json"] or "{}"),
                    "created_at": r["created_at"],
                }
                for r in rows
            ]


_db_instance: Optional[DatabaseManager] = None


def get_db() -> DatabaseManager:
    global _db_instance
    current_path = get_settings().sqlite_path
    if _db_instance is None or _db_instance.db_path != current_path:
        _db_instance = DatabaseManager(current_path)
    return _db_instance
