import React from "react";
import { PaperSummary } from "../types/research";
import { ResearchApi } from "../lib/api";

interface ReportViewerProps {
  paper: PaperSummary | null;
  onGoToQA: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ paper, onGoToQA }) => {
  if (!paper) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm text-slate-500">
          当前尚未选择论文记录，请先在「论文工作台」上传 PDF 或载入《Attention Is All You Need》示例。
        </p>
      </div>
    );
  }

  const a = paper.analysis;
  if (!a) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">
        该论文当前状态为 <strong>{paper.status}</strong>
        {paper.error_message ? `：${paper.error_message}` : "，尚未生成结构化分析报告。"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {paper.is_demo && (
                <span className="rounded bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-300">
                  【示例演示数据】arXiv:1706.03762
                </span>
              )}
              <span className="rounded bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                状态：{paper.status}（共 {paper.page_count} 页）
              </span>
              <span className="rounded bg-slate-100 px-2.5 py-0.5 text-xs font-mono text-slate-700">
                引擎：{paper.analysis_engine}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{a.title}</h1>
            <p className="mt-1 text-xs text-slate-600">
              <strong>作者：</strong> {a.authors.join(", ")}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              <strong>发表年份：</strong> {a.publication_year} &nbsp;|&nbsp;{" "}
              <strong>发表会议/期刊：</strong> {a.venue}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onGoToQA}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              针对本文提问 (P1 问答)
            </button>
            <a
              href={ResearchApi.getExportMarkdownUrl(paper.id)}
              download={`report_paper_${paper.id}.md`}
              className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              导出 Markdown 报告 (.md)
            </a>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 border border-slate-200">
          <strong className="text-slate-900">摘要（Abstract）：</strong> {a.abstract}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. 研究问题与动机（Research Question & Motivation）
          </h3>
          <p className="mt-3 text-xs leading-relaxed text-slate-700">
            <strong>研究背景：</strong> {a.background}
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-900 font-medium">
            <strong>核心研究问题：</strong> {a.research_question}
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
            <strong>研究动机：</strong> {a.motivation}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. 核心方法与架构（Methodology & Architecture）
          </h3>
          <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-700">
            <strong>核心方法：</strong> {a.methodology}
          </p>
          <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-slate-700">
            <strong>系统架构：</strong> {a.architecture}
          </p>
        </div>
      </div>
    </div>
  );
};
