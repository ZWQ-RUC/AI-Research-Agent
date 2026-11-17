# -*- coding: utf-8 -*-
"""
Automated Backend & Full-Stack Test Suite for AI Research Assistant.
Compatible with both `pytest` (in local venv) and `python3 backend/tests/run_all_tests.py`.
"""
import io
import os
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_ROOT.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from fastapi.testclient import TestClient
from reportlab.pdfgen import canvas
from app.main import create_app
from app.database.db import get_db


def _make_blank_pdf_bytes() -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    c.showPage()
    c.save()
    return buf.getvalue()


class TestAIResearchAssistantBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.temp_dir = tempfile.TemporaryDirectory(prefix="ara_test_")
        db_file = Path(cls.temp_dir.name) / "test_research.db"
        upload_dir = Path(cls.temp_dir.name) / "uploads"
        os.environ["DATABASE_URL"] = f"sqlite:///{db_file.as_posix()}"
        os.environ["UPLOAD_DIR"] = str(upload_dir)
        os.environ["MAX_UPLOAD_SIZE_MB"] = "30"
        os.environ["LLM_API_KEY"] = ""
        cls.app = create_app()
        cls.client = TestClient(cls.app)
        cls.sample_pdf_path = PROJECT_ROOT / "demo" / "sample_attention_is_all_you_need.pdf"

    @classmethod
    def tearDownClass(cls) -> None:
        cls.temp_dir.cleanup()

    def test_01_fastapi_startup_and_health_check(self) -> None:
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["app_name"], "AI Research Assistant")

    def test_02_database_initialization(self) -> None:
        db = get_db()
        self.assertTrue(db.db_path.exists())
        papers = db.list_papers()
        self.assertIsInstance(papers, list)

    def test_03_api_routes_registered(self) -> None:
        openapi = self.client.get("/openapi.json")
        self.assertEqual(openapi.status_code, 200)
        paths = openapi.json().get("paths", {})
        for expected in [
            "/api/health",
            "/api/papers",
            "/api/papers/upload",
            "/api/papers/{paper_id}/analyze",
            "/api/papers/{paper_id}/export",
            "/api/qa/ask",
            "/api/experiments/analyze",
        ]:
            self.assertIn(expected, paths)

    def test_04_non_pdf_file_upload_rejected(self) -> None:
        files = {"file": ("notes.txt", b"Hello world, this is not a PDF.", "text/plain")}
        resp = self.client.post("/api/papers/upload", files=files)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("PDF", resp.json()["detail"])

    def test_05_fake_pdf_extension_rejected(self) -> None:
        files = {"file": ("disguised.pdf", b"NOT_A_PDF_HEADER_CONTENT", "application/pdf")}
        resp = self.client.post("/api/papers/upload", files=files)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("%PDF-", resp.json()["detail"])

    def test_06_empty_file_upload_rejected(self) -> None:
        files = {"file": ("empty.pdf", b"", "application/pdf")}
        resp = self.client.post("/api/papers/upload", files=files)
        self.assertEqual(resp.status_code, 400)
        self.assertIn("0 字节", resp.json()["detail"])

    def test_07_oversized_file_upload_rejected(self) -> None:
        old_val = os.environ.get("MAX_UPLOAD_SIZE_MB", "30")
        os.environ["MAX_UPLOAD_SIZE_MB"] = "1"
        try:
            oversized_bytes = b"%PDF-1.4\n" + (b"0" * (1024 * 1024 + 512))
            files = {"file": ("huge_paper.pdf", oversized_bytes, "application/pdf")}
            resp = self.client.post("/api/papers/upload", files=files)
            self.assertEqual(resp.status_code, 413)
            self.assertIn("超出限制", resp.json()["detail"])
        finally:
            os.environ["MAX_UPLOAD_SIZE_MB"] = old_val

    def test_08_corrupted_pdf_upload_rejected(self) -> None:
        corrupted = b"%PDF-1.7\nCorrupted binary stream without xref or trailer %%%%EOF"
        files = {"file": ("corrupted.pdf", corrupted, "application/pdf")}
        resp = self.client.post("/api/papers/upload", files=files)
        self.assertEqual(resp.status_code, 422)

    def test_09_scanned_or_blank_pdf_detection(self) -> None:
        blank_pdf = _make_blank_pdf_bytes()
        files = {"file": ("scanned_blank.pdf", blank_pdf, "application/pdf")}
        resp = self.client.post("/api/papers/upload?auto_analyze=true", files=files)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["is_scanned"])
        self.assertEqual(data["status"], "scanned_warning")
        self.assertIn(1, data["blank_pages"])

    def test_10_normal_pdf_upload_extraction_and_18_dim_analysis(self) -> None:
        pdf_bytes = self.sample_pdf_path.read_bytes()
        files = {"file": ("Attention_Is_All_You_Need.pdf", pdf_bytes, "application/pdf")}
        resp = self.client.post("/api/papers/upload?auto_analyze=true", files=files)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["page_count"], 6)
        self.assertEqual(data["status"], "analyzed")
        analysis = data["analysis"]
        self.assertIsNotNone(analysis)
        self.assertEqual(analysis["title"], "Attention Is All You Need")
        self.assertEqual(analysis["publication_year"], "2017")
        self.assertIn("28.4", analysis["results"])
        self.assertIn("41.8", analysis["results"])
        self.assertGreaterEqual(len(analysis["evidences"]), 5)
        self.assertGreaterEqual(len(analysis["number_checks"]), 5)
        self.__class__.uploaded_paper_id = data["id"]

    def test_11_analyze_missing_api_key_handling(self) -> None:
        paper_id = getattr(self.__class__, "uploaded_paper_id", 1)
        resp = self.client.post(
            f"/api/papers/{paper_id}/analyze",
            json={"require_llm": True, "force_fail_llm": False},
        )
        self.assertEqual(resp.status_code, 503)
        self.assertIn("缺少 API Key", resp.json()["detail"])

    def test_12_analyze_llm_failure_handling(self) -> None:
        paper_id = getattr(self.__class__, "uploaded_paper_id", 1)
        resp = self.client.post(
            f"/api/papers/{paper_id}/analyze",
            json={"require_llm": False, "force_fail_llm": True},
        )
        self.assertEqual(resp.status_code, 502)
        self.assertIn("调用失败", resp.json()["detail"])

    def test_13_markdown_export(self) -> None:
        paper_id = getattr(self.__class__, "uploaded_paper_id", 1)
        resp = self.client.get(f"/api/papers/{paper_id}/export")
        self.assertEqual(resp.status_code, 200)
        md_text = resp.text
        self.assertIn("# 论文结构化精读报告：Attention Is All You Need", md_text)
        self.assertIn("28.4", md_text)
        self.assertIn("Page 1", md_text)

    def test_14_paper_qa_with_citations_and_ungrounded_rejection(self) -> None:
        paper_id = getattr(self.__class__, "uploaded_paper_id", 1)
        resp1 = self.client.post(
            "/api/qa/ask",
            json={
                "paper_id": paper_id,
                "question": "What BLEU score did the Transformer achieve on WMT 2014 English-to-German and English-to-French?",
                "top_k": 3,
            },
        )
        self.assertEqual(resp1.status_code, 200)
        d1 = resp1.json()
        self.assertTrue(d1["has_evidence"])
        self.assertGreaterEqual(len(d1["citations"]), 1)
        self.assertIn("28.4", d1["answer"])

        resp2 = self.client.post(
            "/api/qa/ask",
            json={
                "paper_id": paper_id,
                "question": "量子纠缠超导材料在零下200度下的折射率是多少？",
                "top_k": 3,
            },
        )
        self.assertEqual(resp2.status_code, 200)
        d2 = resp2.json()
        self.assertFalse(d2["has_evidence"])
        self.assertIn("无法从所上传论文原文中确认", d2["answer"])

    def test_15_experiment_analysis_valid_and_insufficient_guard(self) -> None:
        resp1 = self.client.post(
            "/api/experiments/analyze",
            json={
                "experiment_name": "WMT14 EN-DE Translation Experiment",
                "objective": "Compare Transformer (big) with ConvS2S baseline",
                "metrics": [
                    {
                        "metric_name": "BLEU",
                        "baseline_name": "ConvS2S",
                        "baseline_value": 25.16,
                        "experiment_group_name": "Transformer (big)",
                        "experiment_value": 28.4,
                        "higher_is_better": True,
                        "unit": "BLEU",
                    }
                ],
                "result_summary_input": "Significant gain on newstest2014",
                "notes": "8 P100 GPUs, 3.5 days",
            },
        )
        self.assertEqual(resp1.status_code, 200)
        r1 = resp1.json()["report"]
        self.assertTrue(r1["sufficient_data"])
        self.assertEqual(r1["metric_comparisons"][0]["absolute_diff"], 3.24)

        resp2 = self.client.post(
            "/api/experiments/analyze",
            json={
                "experiment_name": "Empty Experiment",
                "objective": "Test insufficient data guard",
                "metrics": [],
                "result_summary_input": "",
                "notes": "",
            },
        )
        self.assertEqual(resp2.status_code, 200)
        r2 = resp2.json()["report"]
        self.assertFalse(r2["sufficient_data"])
        self.assertIn("无法得出可靠的定量对比结论", r2["overview"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
