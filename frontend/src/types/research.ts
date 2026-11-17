export interface EvidenceItem {
  claim: string;
  quote: string;
  page: number;
  section: string;
  fact_or_inference: "原文事实" | "AI 推断" | string;
}

export interface NumberCheckItem {
  metric_or_context: string;
  number: string;
  verified_in_source: boolean;
  matched_pages: number[];
  source_snippet: string;
}

export interface PaperAnalysisResult {
  title: string;
  authors: string[];
  publication_year: string;
  venue: string;
  abstract: string;
  background: string;
  research_question: string;
  motivation: string;
  methodology: string;
  architecture: string;
  experimental_design: string;
  datasets: string[];
  metrics: string[];
  results: string;
  contributions: string[];
  limitations: string[];
  conclusion: string;
  future_work: string;
  evidences: EvidenceItem[];
  number_checks: NumberCheckItem[];
  engine_note?: string;
}

export interface PaperSummary {
  id: number;
  filename: string;
  file_size: number;
  page_count: number;
  blank_pages: number[];
  is_scanned: boolean;
  pdf_metadata: Record<string, string>;
  status: "uploaded" | "analyzed" | "failed" | "scanned_warning" | string;
  analysis_engine: string;
  analysis: PaperAnalysisResult | null;
  error_message: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface QACitation {
  page: number;
  score: number;
  snippet: string;
  section_hint: string;
}

export interface QAResponse {
  id: number;
  paper_id: number;
  question: string;
  answer: string;
  citations: QACitation[];
  has_evidence: boolean;
  retrieval_method: string;
  created_at: string;
}

export interface ExperimentMetricInput {
  metric_name: string;
  baseline_name: string;
  baseline_value: number | null;
  experiment_group_name: string;
  experiment_value: number | null;
  higher_is_better: boolean;
  unit: string;
}

export interface ExperimentReport {
  sufficient_data: boolean;
  overview: string;
  metric_comparisons: Array<{
    metric_name: string;
    baseline_name: string;
    baseline_value: number;
    experiment_group_name: string;
    experiment_value: number;
    unit: string;
    absolute_diff: number;
    relative_change_pct: number | null;
    higher_is_better: boolean;
    evaluation: string;
  }>;
  result_changes: string[];
  possible_causes: string[];
  limitations: string[];
  next_step_suggestions: string[];
}
