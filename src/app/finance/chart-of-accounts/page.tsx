"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { CHART_OF_ACCOUNTS, INCOME_HEADS } from "@/lib/chart-of-accounts";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export default function ChartOfAccountsPage() {
  const { expenses } = useNIMSStore();

  const [expandedBranches, setExpandedBranches] = useState<Record<string, boolean>>({
    "college-expense": true,
    "infrastructure": true,
    "hostel-expense": true,
  });
  const [expandedSubHeads, setExpandedSubHeads] = useState<Record<string, boolean>>({});

  const toggleBranch = (id: string) =>
    setExpandedBranches(p => ({ ...p, [id]: !p[id] }));
  const toggleSubHead = (id: string) =>
    setExpandedSubHeads(p => ({ ...p, [id]: !p[id] }));

  const branchTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      if (e.accountBranch) {
        totals[e.accountBranch] = (totals[e.accountBranch] || 0) + e.amount;
      }
    }
    return totals;
  }, [expenses]);

  const subHeadTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      if (e.accountBranch && e.accountSubHead) {
        const key = `${e.accountBranch}::${e.accountSubHead}`;
        totals[key] = (totals[key] || 0) + e.amount;
      }
    }
    return totals;
  }, [expenses]);

  const leafTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const e of expenses) {
      if (e.accountBranch && e.accountSubHead && e.accountLeaf) {
        const key = `${e.accountBranch}::${e.accountSubHead}::${e.accountLeaf}`;
        totals[key] = (totals[key] || 0) + e.amount;
      }
    }
    return totals;
  }, [expenses]);

  const totalExpense = Object.values(branchTotals).reduce((s, v) => s + v, 0);

  const BRANCH_BG: Record<string, string> = {
    "college-expense": "#F0FDFA",
    "infrastructure": "#F5F3FF",
    "hostel-expense": "#FFFBEB",
  };
  const BRANCH_BADGE_BG: Record<string, string> = {
    "college-expense": "#CCFBF1",
    "infrastructure": "#EDE9FE",
    "hostel-expense": "#FDE68A",
  };

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl" style={{ color: "#0F172A" }}>Chart of Accounts</h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>
            Nawjan Institute of Nursing — Master Ledger Configuration
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: "#475569" }}>Total Posted Expenses</div>
          <div className="font-serif font-bold text-2xl" style={{ color: "#F97066" }}>{formatINR(totalExpense)}</div>
        </div>
      </div>

      {/* Branch summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {CHART_OF_ACCOUNTS.map(branch => (
          <div key={branch.id} className="rounded-xl border p-4" style={{ borderColor: "#E2E8F0", backgroundColor: BRANCH_BG[branch.id] }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: branch.color }} />
              <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>{branch.name}</span>
            </div>
            <div className="font-serif font-bold text-xl" style={{ color: branch.color }}>
              {formatINR(branchTotals[branch.name] || 0)}
            </div>
            <div className="text-xs mt-1" style={{ color: "#475569" }}>
              {branch.subHeads.length} sub-heads
            </div>
          </div>
        ))}
      </div>

      {/* COA Tree — Expense */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingDown size={16} style={{ color: "#F97066" }} />
          <h2 className="font-serif font-semibold text-lg" style={{ color: "#0F172A" }}>Expense Accounts</h2>
        </div>
        <div className="space-y-3">
          {CHART_OF_ACCOUNTS.map(branch => {
            const isOpen = expandedBranches[branch.id];
            const branchTotal = branchTotals[branch.name] || 0;
            return (
              <div key={branch.id} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                {/* Branch header */}
                <button
                  onClick={() => toggleBranch(branch.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:opacity-90 transition-all"
                  style={{ backgroundColor: branch.color }}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown size={18} className="text-white/80" /> : <ChevronRight size={18} className="text-white/80" />}
                    <span className="font-serif font-bold text-base text-white">{branch.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white/80"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                      {branch.subHeads.length} heads
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/70 mb-0.5">Total Spend</div>
                    <div className="font-serif font-bold text-lg text-white">{formatINR(branchTotal)}</div>
                  </div>
                </button>

                {/* Sub-heads */}
                {isOpen && (
                  <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
                    {branch.subHeads.map(sub => {
                      const subKey = `${branch.name}::${sub.name}`;
                      const subTotal = subHeadTotals[subKey] || 0;
                      const subOpen = expandedSubHeads[sub.id];
                      const hasLeaves = sub.leaves && sub.leaves.length > 0;
                      return (
                        <div key={sub.id}>
                          <button
                            onClick={() => hasLeaves && toggleSubHead(sub.id)}
                            className={`w-full flex items-center justify-between px-6 py-3 transition-colors ${hasLeaves ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: branch.color }} />
                              {hasLeaves ? (
                                subOpen
                                  ? <ChevronDown size={14} style={{ color: "#94a3b8" }} />
                                  : <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                              ) : (
                                <div className="w-[14px]" />
                              )}
                              <span className="text-sm font-medium" style={{ color: "#0F172A" }}>{sub.name}</span>
                              {!hasLeaves && (
                                <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                                  style={{ backgroundColor: BRANCH_BADGE_BG[branch.id], color: branch.color }}>
                                  leaf
                                </span>
                              )}
                            </div>
                            {subTotal > 0 && (
                              <span className="text-sm font-semibold" style={{ color: "#475569" }}>
                                {formatINR(subTotal)}
                              </span>
                            )}
                          </button>

                          {/* Leaf items */}
                          {hasLeaves && subOpen && (
                            <div className="pb-2" style={{ backgroundColor: BRANCH_BG[branch.id] }}>
                              {sub.leaves!.map(leaf => {
                                const leafKey = `${branch.name}::${sub.name}::${leaf.name}`;
                                const leafTotal = leafTotals[leafKey] || 0;
                                return (
                                  <div key={leaf.id}
                                    className="flex items-center justify-between px-10 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-1 h-1 rounded-full bg-slate-400" />
                                      <span className="text-sm" style={{ color: "#475569" }}>{leaf.name}</span>
                                    </div>
                                    {leafTotal > 0 && (
                                      <span className="text-xs font-medium" style={{ color: branch.color }}>
                                        {formatINR(leafTotal)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* COA Tree — Income */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} style={{ color: "#0F766E" }} />
          <h2 className="font-serif font-semibold text-lg" style={{ color: "#0F172A" }}>Income Accounts</h2>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 text-white font-serif font-bold text-base" style={{ backgroundColor: "#0F766E" }}>
            Income
          </div>
          <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
            {INCOME_HEADS.map((head, i) => (
              <div key={head.id} className="flex items-start justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "#0F766E" }}>
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{head.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{head.note}</div>
                  </div>
                </div>
                {head.id === "loan-from-other-person" && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-3"
                    style={{ backgroundColor: "#FFFBEB", color: "#D97706" }}>
                    Pending reclassification
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
