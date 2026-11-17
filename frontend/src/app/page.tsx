"use client";
import React, { useEffect, useState } from "react";
import { Navbar, ActiveTab } from "../components/Navbar";
import { PdfUploader } from "../components/PdfUploader";
import { ReportViewer } from "../components/ReportViewer";
import { PaperQA } from "../components/PaperQA";
import { ExperimentAnalyzer } from "../components/ExperimentAnalyzer";
import { ResearchApi } from "../lib/api";
import { PaperSummary } from "../types/research";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [llmModeLabel, setLlmModeLabel] = useState<string>("checking...");
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<PaperSummary | null>(null);

  const loadInitialState = async () => {
    try {
      const health = await ResearchApi.getHealth();
      setBackendHealthy(health.status === "ok");
      setLlmModeLabel(
        health.api_key_configured
          ? `LLM: ${health.llm_provider}`
          : "Engine: 原文证据核验模式 (免Key可用)"
      );
      const list = await ResearchApi.listPapers();
      setPapers(list);
      if (list.length > 0 && !selectedPaper) {
        setSelectedPaper(list[0]);
      }
    } catch {
      setBackendHealthy(false);
      setLlmModeLabel("后端未连接");
    }
  };

  useEffect(() => {
    loadInitialState();
  }, []);

  const handleLoadDemo = async () => {
    const demoPaper = await ResearchApi.loadDemoPaper();
    const list = await ResearchApi.listPapers();
    setPapers(list);
    setSelectedPaper(demoPaper);
    setActiveTab("report");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        backendHealthy={backendHealthy}
        llmModeLabel={llmModeLabel}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {activeTab === "home" && (
          <div className="space-y-10">
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="max-w-3xl space-y-4">
                <span className="inline-block rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
                  轻量级科研文献解析与防幻觉工作台
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  AI Research Assistant — Your AI-powered Research Assistant
                </h1>
                <p className="text-sm leading-relaxed text-slate-600">
                  将非结构化学术论文 PDF 转换为句句可追溯原文页码的 18 维结构化知识报告，帮助本科生、研究生与科研人员高效理解研究问题、核心方法、实验设计与实验结果。
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab("workspace")}
                    className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    进入论文工作台（上传 PDF）
                  </button>
                  <button
                    onClick={handleLoadDemo}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    一键查看《Attention Is All You Need》18维解析演示
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "workspace" && (
          <PdfUploader
            onUploadSuccess={(paper) => {
              setSelectedPaper(paper);
              loadInitialState();
              setActiveTab("report");
            }}
            onLoadDemo={handleLoadDemo}
          />
        )}

        {activeTab === "report" && (
          <ReportViewer
            paper={selectedPaper}
            onGoToQA={() => setActiveTab("qa")}
          />
        )}

        {activeTab === "qa" && <PaperQA paper={selectedPaper} />}

        {activeTab === "experiments" && <ExperimentAnalyzer />}
      </main>
    </div>
  );
}
