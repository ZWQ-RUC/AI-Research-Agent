import React, { useState } from "react";
import { ExperimentMetricInput, ExperimentReport } from "../types/research";
import { ResearchApi } from "../lib/api";

export const ExperimentAnalyzer: React.FC = () => {
  const [expName, setExpName] = useState("WMT14 英德翻译 Multi-Head Attention 消融对比实验");
  const [objective, setObjective] = useState("验证 8 头自注意力架构相较于 ConvS2S 基线模型在翻译 BLEU 上的提升效果");
  const [metrics, setMetrics] = useState<ExperimentMetricInput[]>([
    {
      metric_name: "WMT14 EN-DE BLEU",
      baseline_name: "ConvS2S (Baseline)",
      baseline_value: 25.16,
      experiment_group_name: "Transformer (Base)",
      experiment_value: 27.3,
      higher_is_better: true,
      unit: "BLEU",
    },
    {
      metric_name: "WMT14 EN-FR BLEU",
      baseline_name: "ConvS2S (Baseline)",
      baseline_value: 40.46,
      experiment_group_name: "Transformer (Big)",
      experiment_value: 41.8,
      higher_is_better: true,
      unit: "BLEU",
    },
  ]);
  const [notes, setNotes] = useState("基于 8 张 NVIDIA P100 GPU 训练，warmup_steps = 4000，dropout = 0.1");
  const [report, setReport] = useState<ExperimentReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await ResearchApi.analyzeExperiment({
        experiment_name: expName,
        objective,
        metrics,
        result_summary_input: "",
        notes,
      });
      setReport(res.report as ExperimentReport);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          实验数据对比分析（P2 · 100% 源自用户输入数值，严禁编造结果）
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            value={expName}
            onChange={(e) => setExpName(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
            placeholder="实验名称"
          />
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
            placeholder="实验目标"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white"
          >
            {loading ? "正在计算定量对比..." : "生成实验对比分析报告"}
          </button>
        </div>
      </div>

      {report && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900">实验结果概述</h3>
          <p className="text-slate-700">{report.overview}</p>
        </div>
      )}
    </div>
  );
};
