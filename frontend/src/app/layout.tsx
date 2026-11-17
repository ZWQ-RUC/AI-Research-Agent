import React from "react";
import "./globals.css";

export const metadata = {
  title: "AI Research Assistant — Your AI-powered Research Assistant",
  description:
    "将非结构化学术论文转换为可追溯原文页码的 18 维结构化知识报告、支持论文智能问答与实验对比分析",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
