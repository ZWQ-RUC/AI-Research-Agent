# -*- coding: utf-8 -*-
"""
API Router for Experiment Data Comparison & Analysis (P2).
"""
from typing import List
from fastapi import APIRouter

from app.database.db import get_db
from app.schemas.paper import ExperimentAnalyzeRequest
from app.services.experiment_service import analyze_experiment_data

router = APIRouter(prefix="/api/experiments", tags=["Experiment Analysis (P2 实验数据分析)"])


@router.post("/analyze")
def create_experiment_analysis(req: ExperimentAnalyzeRequest) -> dict:
    report = analyze_experiment_data(req)
    db = get_db()
    saved = db.create_experiment_record(
        experiment_name=req.experiment_name,
        objective=req.objective,
        metrics_input=[m.model_dump() for m in req.metrics],
        notes=req.notes,
        report=report,
    )
    return saved


@router.get("")
def list_experiment_analyses() -> List[dict]:
    return get_db().list_experiments()
