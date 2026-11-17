# -*- coding: utf-8 -*-
"""
Pydantic data validation schemas for all API requests and responses.
Covers all 18 structured analysis dimensions, source evidences, number checks,
P1 QA, and P2 Experiment Analysis.
"""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel as _PydanticBaseModel, Field


class BaseModel(_PydanticBaseModel):
    def model_dump(self, *args, **kwargs):
        if hasattr(super(), "model_dump"):
            return super().model_dump(*args, **kwargs)
        return self.dict(*args, **kwargs)



class EvidenceItem(BaseModel):
    claim: str = Field(..., description="AI 总结的关键结论或实验指标声明")
    quote: str = Field(..., description="逐字摘录自原文的原句片段")
    page: int = Field(..., description="原文所在页码 (1-indexed)")
    section: str = Field(default="正文", description="所属章节名称")
    fact_or_inference: str = Field(default="原文事实", description="'原文事实' 或 'AI 推断'")


class NumberCheckItem(BaseModel):
    metric_or_context: str = Field(..., description="数字对应的指标或上下文描述")
    number: str = Field(..., description="报告中出现的数字字符串")
    verified_in_source: bool = Field(..., description="是否在原始 PDF 分页文本中核实到该数字")
    matched_pages: List[int] = Field(default_factory=list, description="匹配到该数字的 PDF 页码列表")
    source_snippet: str = Field(default="", description="包含该数字的原文片段")


class PaperAnalysisResult(BaseModel):
    # 18 mandatory structured fields from 作业.md Section 四.P0.3
    title: str = Field(default="未在原文中找到 / 无法确认")
    authors: List[str] = Field(default_factory=lambda: ["未在原文中找到 / 无法确认"])
    publication_year: str = Field(default="未在原文中找到 / 无法确认")
    venue: str = Field(default="未在原文中找到 / 无法确认")
    abstract: str = Field(default="未在原文中找到 / 无法确认")
    background: str = Field(default="未在原文中找到 / 无法确认")
    research_question: str = Field(default="未在原文中找到 / 无法确认")
    motivation: str = Field(default="未在原文中找到 / 无法确认")
    methodology: str = Field(default="未在原文中找到 / 无法确认")
    architecture: str = Field(default="未在原文中找到 / 无法确认")
    experimental_design: str = Field(default="未在原文中找到 / 无法确认")
    datasets: List[str] = Field(default_factory=lambda: ["未在原文中找到 / 无法确认"])
    metrics: List[str] = Field(default_factory=lambda: ["未在原文中找到 / 无法确认"])
    results: str = Field(default="未在原文中找到 / 无法确认")
    contributions: List[str] = Field(default_factory=lambda: ["未在原文中找到 / 无法确认"])
    limitations: List[str] = Field(default_factory=lambda: ["未在原文中找到 / 无法确认"])
    conclusion: str = Field(default="未在原文中找到 / 无法确认")
    future_work: str = Field(default="未在原文中找到 / 无法确认")

    # Anti-hallucination & quality checks
    evidences: List[EvidenceItem] = Field(default_factory=list)
    number_checks: List[NumberCheckItem] = Field(default_factory=list)
    engine_note: str = Field(default="")


class PaperSummaryResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    page_count: int
    blank_pages: List[int]
    is_scanned: bool
    pdf_metadata: Dict[str, Any]
    status: str
    analysis_engine: str
    analysis: Optional[PaperAnalysisResult] = None
    error_message: Optional[str] = None
    is_demo: bool = False
    created_at: str


class AnalyzeRequest(BaseModel):
    require_llm: bool = Field(
        default=False,
        description="若为 True，则强制要求远程/本地 LLM 可用，缺少 API Key 时返回 503 错误；若为 False，无 Key 时自动使用原文启发式提取引擎",
    )
    force_fail_llm: bool = Field(
        default=False,
        description="用于自动化测试模拟远程 LLM 调用异常失败",
    )


class QARequest(BaseModel):
    paper_id: int = Field(..., description="目标论文 ID")
    question: str = Field(..., min_length=2, max_length=1000, description="用户关于该论文的问题")
    top_k: int = Field(default=3, ge=1, le=6, description="检索返回的原文段落数量")


class QACitation(BaseModel):
    page: int
    score: float
    snippet: str
    section_hint: str = ""


class QAResponse(BaseModel):
    id: int
    paper_id: int
    question: str
    answer: str
    citations: List[QACitation]
    has_evidence: bool
    retrieval_method: str
    created_at: str


class ExperimentMetricInput(BaseModel):
    metric_name: str = Field(..., description="实验评价指标名称，如 BLEU / F1 / Accuracy / Latency")
    baseline_name: str = Field(default="Baseline", description="基线模型名称")
    baseline_value: Optional[float] = Field(default=None, description="基线数值（必须来自用户输入）")
    experiment_group_name: str = Field(default="实验组 (Ours)", description="实验组名称")
    experiment_value: Optional[float] = Field(default=None, description="实验组数值（必须来自用户输入）")
    higher_is_better: bool = Field(default=True, description="该指标是否越大越好")
    unit: str = Field(default="", description="单位，如 % / ms / BLEU")


class ExperimentAnalyzeRequest(BaseModel):
    experiment_name: str = Field(..., min_length=1, description="实验名称")
    objective: str = Field(default="", description="实验目标")
    metrics: List[ExperimentMetricInput] = Field(default_factory=list, description="实验指标与数值列表")
    result_summary_input: str = Field(default="", description="用户观察到的实验结果补充说明")
    notes: str = Field(default="", description="实验备注（如超参数、硬件环境、异常现象）")
