import React, { useState } from "react";
import { PaperSummary, QAResponse } from "../types/research";
import { ResearchApi } from "../lib/api";

interface PaperQAProps {
  paper: PaperSummary | null;
}

export const PaperQA: React.FC<PaperQAProps> = ({ paper }) => {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [history, setHistory] = useState<QAResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (qText?: string) => {
    const targetQ = (qText ?? question).trim();
    if (!paper || !targetQ) return;
    try {
      setAsking(true);
      setError(null);
      const res = await ResearchApi.askQuestion(paper.id, targetQ, 3);
      setHistory((prev) => [res, ...prev]);
      if (!qText) setQuestion("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "提问请求失败");
    } finally {
      setAsking(false);
    }
  };

  if (!paper) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        请先在「论文工作台」选择或上传一篇论文后再进行智能问答。
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          论文智能问答（P1 · 基于页码分块检索与原文引用）
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          当前绑定论文：<strong>{paper.filename}</strong>（共 {paper.page_count} 页）
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="输入关于本文研究方法、架构参数、数据集或实验结果的问题..."
            className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-xs"
          />
          <button
            type="button"
            disabled={asking || !question.trim()}
            onClick={() => handleAsk()}
            className="rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white"
          >
            {asking ? "检索原文中..." : "发送提问"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-xs font-bold text-slate-900">
              问：{item.question}
            </div>
            <div className="mt-2 whitespace-pre-line text-xs leading-relaxed text-slate-700">
              {item.answer}
            </div>
            {item.citations.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                <div className="text-[11px] font-semibold text-slate-500">
                  原文引用段落（含精确页码）：
                </div>
                {item.citations.map((cit, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-200"
                  >
                    <span className="font-semibold text-sky-700">
                      [Page {cit.page}] (相关度 {cit.score})：
                    </span>{" "}
                    &ldquo;{cit.snippet}&rdquo;
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
