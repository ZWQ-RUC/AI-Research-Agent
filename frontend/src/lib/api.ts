import {
  ExperimentMetricInput,
  PaperSummary,
  QAResponse,
} from "../types/research";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
    },
  });
  if (!response.ok) {
    let errDetail = `请求失败 (HTTP ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson.detail) errDetail = errJson.detail;
    } catch {
      // ignore json parse error
    }
    throw new Error(errDetail);
  }
  return response.json() as Promise<T>;
}

export const ResearchApi = {
  getHealth: () => requestJson<Record<string, unknown>>("/api/health"),

  listPapers: () => requestJson<PaperSummary[]>("/api/papers"),

  getPaper: (paperId: number) =>
    requestJson<PaperSummary>(`/api/papers/${paperId}`),

  uploadPaper: async (file: File, autoAnalyze = true): Promise<PaperSummary> => {
    const formData = new FormData();
    formData.append("file", file);
    return requestJson<PaperSummary>(
      `/api/papers/upload?auto_analyze=${autoAnalyze}`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  analyzePaper: (paperId: number, requireLlm = false) =>
    requestJson<PaperSummary>(`/api/papers/${paperId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ require_llm: requireLlm }),
    }),

  loadDemoPaper: () =>
    requestJson<PaperSummary>("/api/papers/demo/load", {
      method: "POST",
    }),

  deletePaper: (paperId: number) =>
    requestJson<{ deleted: boolean; paper_id: number }>(`/api/papers/${paperId}`, {
      method: "DELETE",
    }),

  getExportMarkdownUrl: (paperId: number) =>
    `${API_BASE_URL}/api/papers/${paperId}/export`,

  askQuestion: (paperId: number, question: string, topK = 3) =>
    requestJson<QAResponse>("/api/qa/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paperId, question, top_k: topK }),
    }),

  analyzeExperiment: (payload: {
    experiment_name: string;
    objective: string;
    metrics: ExperimentMetricInput[];
    result_summary_input: string;
    notes: string;
  }) =>
    requestJson<Record<string, unknown>>("/api/experiments/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};
