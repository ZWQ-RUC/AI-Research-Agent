import { useState, useCallback } from "react";
import { ResearchApi } from "../lib/api";
import { PaperSummary } from "../types/research";

export function useResearchWorkspace() {
  const [papers, setPapers] = useState<PaperSummary[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<PaperSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await ResearchApi.listPapers();
      setPapers(list);
      if (list.length > 0 && !selectedPaper) {
        setSelectedPaper(list[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "加载论文列表失败");
    } finally {
      setLoading(false);
    }
  }, [selectedPaper]);

  return {
    papers,
    selectedPaper,
    setSelectedPaper,
    loading,
    setLoading,
    error,
    setError,
    refreshPapers,
  };
}
