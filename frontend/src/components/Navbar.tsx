import React from "react";

export type ActiveTab = "home" | "workspace" | "report" | "qa" | "experiments";

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  backendHealthy: boolean;
  llmModeLabel: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  backendHealthy,
  llmModeLabel,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; badge?: string }> = [
    { id: "home", label: "产品首页" },
    { id: "workspace", label: "论文工作台", badge: "P0" },
    { id: "report", label: "结构化报告", badge: "18维" },
    { id: "qa", label: "论文智能问答", badge: "P1" },
    { id: "experiments", label: "实验对比分析", badge: "P2" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div
          className="flex cursor-pointer items-center gap-3"
          onClick={() => onSelectTab("home")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 font-mono text-sm font-bold text-white shadow-sm">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                AI Research Assistant
              </span>
              <span className="rounded bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 border border-sky-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Your AI-powered Research Assistant
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-sky-500/20 text-sky-200"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 text-xs">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium border ${
              backendHealthy
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                backendHealthy ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            {backendHealthy ? "后端 API 已连接" : "后端离线"}
          </span>
          <span className="hidden lg:inline-block rounded bg-slate-100 px-2.5 py-1 text-slate-600 font-mono">
            {llmModeLabel}
          </span>
        </div>
      </div>
    </header>
  );
};
