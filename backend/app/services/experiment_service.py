# -*- coding: utf-8 -*-
"""
Experiment Data Comparison & Analysis Service (P2).
Rules from 作业.md Section 四.P2:
- User inputs: experiment_name, objective, metrics, baseline, experiment_group, results, notes.
- AI outputs: 实验结果概述, 指标对比, 结果变化, 可能原因, 实验局限, 后续实验建议.
- All numbers MUST come strictly from user input (or exact arithmetic deltas of user inputs).
- Never fabricate experimental results.
- If insufficient data is provided, explicitly state that a reliable conclusion cannot be drawn.
"""
from typing import Any, Dict, List
from app.schemas.paper import ExperimentAnalyzeRequest


def analyze_experiment_data(req: ExperimentAnalyzeRequest) -> Dict[str, Any]:
    """
    Analyzes user-input experimental data without fabricating any numbers.
    """
    valid_metrics = [
        m
        for m in req.metrics
        if m.metric_name.strip() and m.baseline_value is not None and m.experiment_value is not None
    ]

    if not valid_metrics:
        return {
            "sufficient_data": False,
            "overview": (
                f"实验「{req.experiment_name}」当前未提供完整的 Baseline 与实验组配对数值指标。"
                "根据防幻觉与真实数据原则，当前输入数据不足，无法得出可靠的定量对比结论（系统绝不编造实验数字）。"
            ),
            "metric_comparisons": [],
            "result_changes": ["当前缺少完整的 Baseline 与实验组数值输入，无法计算指标增减幅度。"],
            "possible_causes": ["待补充完整定量实验指标与消融记录后方可分析原因。"],
            "limitations": [
                "当前输入的实验数据样本或定量指标不足，无法验证实验假设的显著性。",
                "尚未提供多次随机种子方差或消融对比项。"
            ],
            "next_step_suggestions": [
                "请补充至少 1 组包含明确 Baseline 数值与实验组数值的评价指标（如 BLEU、F1、Accuracy 或推理延迟）。",
                "建议补充具体的实验超参数配置与数据集规模备注后再重新触发分析。"
            ],
        }

    comparisons: List[Dict[str, Any]] = []
    change_bullets: List[str] = []
    improved_count = 0
    degraded_count = 0

    for m in valid_metrics:
        b_val = float(m.baseline_value)  # type: ignore
        e_val = float(m.experiment_value)  # type: ignore
        abs_diff = round(e_val - b_val, 4)
        rel_pct = round(((e_val - b_val) / abs(b_val)) * 100.0, 2) if b_val != 0 else None

        if abs_diff == 0:
            direction = "持平 (No Change)"
            is_better = None
        elif (abs_diff > 0 and m.higher_is_better) or (abs_diff < 0 and not m.higher_is_better):
            direction = "正向提升 (Improved)"
            is_better = True
            improved_count += 1
        else:
            direction = "性能回退 (Degraded)"
            is_better = False
            degraded_count += 1

        unit_str = f" {m.unit}".rstrip()
        sign = "+" if abs_diff > 0 else ""
        pct_str = f" ({sign}{rel_pct}%)" if rel_pct is not None else ""

        comparisons.append(
            {
                "metric_name": m.metric_name,
                "baseline_name": m.baseline_name,
                "baseline_value": b_val,
                "experiment_group_name": m.experiment_group_name,
                "experiment_value": e_val,
                "unit": m.unit,
                "absolute_diff": abs_diff,
                "relative_change_pct": rel_pct,
                "higher_is_better": m.higher_is_better,
                "evaluation": direction,
            }
        )

        change_bullets.append(
            f"指标 **{m.metric_name}**：由 {m.baseline_name} 的 `{b_val}{unit_str}` 变为 "
            f"{m.experiment_group_name} 的 `{e_val}{unit_str}`，绝对变化量为 `{sign}{abs_diff}{unit_str}`{pct_str}，判定为 **{direction}**。"
        )

    overview = (
        f"针对实验「{req.experiment_name}」（实验目标：{req.objective or '未填写具体目标'}），"
        f"系统共核对了用户输入的 {len(valid_metrics)} 项定量指标：其中 {improved_count} 项指标获得正向提升，"
        f"{degraded_count} 项指标出现波动或回退。"
    )
    if req.result_summary_input.strip():
        overview += f" 用户实验结果记录补充：{req.result_summary_input.strip()}"

    causes: List[str] = []
    if req.notes.strip():
        causes.append(f"结合用户输入的实验备注（\"{req.notes.strip()}\"），该配置改动直接影响了上述指标的变化。")
    if improved_count > 0:
        causes.append("实验组在核心评价指标上相较于 Baseline 呈现数值改善，表明当前实验变量调整对目标任务产生了正向增益（仅基于用户输入数值对比）。")
    if degraded_count > 0:
        causes.append("部分指标出现回退，可能存在精度与计算开销/泛化性之间的权衡（Trade-off），需结合具体训练日志排查过拟合或超参数敏感性。")

    limitations: List[str] = [
        f"当前仅基于用户输入的 {len(valid_metrics)} 项单点指标均值进行对比，未包含多次独立随机种子运行下的标准差与统计显著性检验（p-value）。",
    ]
    if len(valid_metrics) < 2:
        limitations.append("当前仅录入了单一评价指标，缺少计算效率（如延迟/显存占用）或鲁棒性维度的交叉验证。")

    suggestions: List[str] = [
        "建议固定其他超参数，针对本次实验改动的核心变量补充消融实验（Ablation Study），确认各项子模块的独立贡献。",
        "建议在不同规模的数据子集或最少 3 个随机种子下重复验证，排除随机波动对实验结论的干扰。",
    ]

    return {
        "sufficient_data": True,
        "overview": overview,
        "metric_comparisons": comparisons,
        "result_changes": change_bullets,
        "possible_causes": causes,
        "limitations": limitations,
        "next_step_suggestions": suggestions,
    }
