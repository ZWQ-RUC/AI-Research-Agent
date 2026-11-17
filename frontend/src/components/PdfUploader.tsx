import React, { useState } from "react";
import { PaperSummary } from "../types/research";
import { ResearchApi } from "../lib/api";

interface PdfUploaderProps {
  onUploadSuccess: (paper: PaperSummary) => void;
  onLoadDemo: () => Promise<void>;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onUploadSuccess,
  onLoadDemo,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const f = e.target.files?.[0] || null;
    if (f) {
      if (!f.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg("文件格式错误：仅支持上传 .pdf 格式的学术论文文件。");
        setSelectedFile(null);
        return;
      }
      if (f.size === 0) {
        setErrorMsg("文件为空（0 字节），请选择包含有效内容的 PDF 论文。");
        setSelectedFile(null);
        return;
      }
      if (f.size > 30 * 1024 * 1024) {
        setErrorMsg("文件超过 30MB 限制，请压缩或分割后上传。");
        setSelectedFile(null);
        return;
      }
    }
    setSelectedFile(f);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setErrorMsg(null);
      const result = await ResearchApi.uploadPaper(selectedFile, true);
      onUploadSuccess(result);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "上传解析失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            上传学术论文 PDF（P0 核心解析工作台）
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            支持 30MB 以内原生文本型 PDF，自动完成扩展名、%PDF- 魔数校验与 PyMuPDF 分页文本提取
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadDemo}
          disabled={uploading}
          className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
        >
          一键载入《Attention Is All You Need》真实示例
        </button>
      </div>

      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-slate-800"
        />
        {selectedFile && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-4 py-2.5 border border-slate-200 text-xs">
            <span className="font-medium text-slate-800">
              已选文件：{selectedFile.name}
            </span>
            <span className="font-mono text-slate-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </span>
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={!selectedFile || uploading}
            onClick={handleUpload}
            className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
          >
            {uploading ? "正在上传并执行 18 维结构化解析..." : "上传并开始智能解析"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <strong>校验/解析错误提示：</strong> {errorMsg}
        </div>
      )}
    </div>
  );
};
