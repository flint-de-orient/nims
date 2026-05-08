"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Download, RefreshCw, CheckCircle, FileText, Code, TrendingUp, TrendingDown, DollarSign, BarChart2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";

type ReportTab = "pnl" | "cashflow" | "agedues" | "collection" | "scholarship" | "tally";

export default function ReportsPage() {
  const { receipts, expenses, students, defaulters } = useNIMSStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<ReportTab>("tally");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [xmlGenerated, setXmlGenerated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const filteredReceipts = useMemo(() =>
    receipts.filter(r => { const d = new Date(r.date); return d >= new Date(dateFrom) && d <= new Date(dateTo); }),
    [receipts, dateFrom, dateTo]
  );
  const filteredExpenses = useMemo(() =>
    expenses.filter(e => { const d = new Date(e.date); return d >= new Date(dateFrom) && d <= new Date(dateTo); }),
    [expenses, dateFrom, dateTo]
  );

  const now = new Date();
  const monthlyData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const m = subMonths(now, 11 - i);
    const start = startOfMonth(m); const end = endOfMonth(m);
    const income = receipts.filter(r => isWithinInterval(new Date(r.date), { start, end })).reduce((s, r) => s + r.totalAmount, 0);
    const exp = expenses.filter(e => isWithinInterval(new Date(e.date), { start, end })).reduce((s, e) => s + e.amount, 0);
    return { month: format(m, "MMM yy"), income, expenses: exp, profit: income - exp };
  }), [receipts, expenses]);

  const totalIncome   = filteredReceipts.reduce((s, r) => s + r.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit     = totalIncome - totalExpenses;

  const generateTallyXML = () => {
    const receiptEntries = filteredReceipts.slice(0, 5).map(r => {
      const student = students.find(s => s.id === r.studentId);
      return `        <VOUCHER REMOTEID="${r.id}" VCHTYPE="Receipt" ACTION="Create">
            <DATE>${r.date.replace(/-/g, "")}</DATE>
            <NARRATION>Fee receipt ${r.receiptNumber} from ${student?.name || "Student"}</NARRATION>
            <VOUCHERNUMBER>${r.receiptNumber}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${student?.name || "Student"}</PARTYLEDGERNAME>
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>Fees Received - ${r.heads[0]?.head || "Tuition"}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>-${r.totalAmount}.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${r.paymentMode === "Cash" ? "Cash" : "Bank Account"}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>${r.totalAmount}.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
        </VOUCHER>`;
    }).join("\n");

    const expenseEntries = filteredExpenses.slice(0, 3).map(e => {
      const totalGst = e.cgst + e.sgst + e.igst;
      return `        <VOUCHER REMOTEID="${e.id}" VCHTYPE="Purchase" ACTION="Create">
            <DATE>${e.date.replace(/-/g, "")}</DATE>
            <NARRATION>${e.description}</NARRATION>
            <VOUCHERNUMBER>${e.invoiceNumber}</VOUCHERNUMBER>
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${e.category}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>${e.amount}.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>${totalGst > 0 ? `
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>${e.igst > 0 ? "IGST" : "CGST + SGST"}</LEDGERNAME>
                <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
                <AMOUNT>${totalGst}.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>` : ""}
            <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>Accounts Payable</LEDGERNAME>
                <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
                <AMOUNT>-${e.amount + totalGst}.00</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
        </VOUCHER>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
    <HEADER>
        <TALLYREQUEST>Import Data</TALLYREQUEST>
    </HEADER>
    <BODY>
        <IMPORTDATA>
            <REQUESTDESC>
                <REPORTNAME>All Masters</REPORTNAME>
                <STATICVARIABLES>
                    <SVCURRENTCOMPANY>Noujan Institute of Nursing</SVCURRENTCOMPANY>
                </STATICVARIABLES>
            </REQUESTDESC>
            <REQUESTDATA>
                <TALLYMESSAGE xmlns:UDF="TallyUDF">
${receiptEntries}

${expenseEntries}
                </TALLYMESSAGE>
            </REQUESTDATA>
        </IMPORTDATA>
    </BODY>
</ENVELOPE>`;
  };

  const handleGenerateTally = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setXmlGenerated(true); }, 1500);
  };
  const handleDownloadXML = () => {
    const xml = generateTallyXML();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `NIMS_Tally_${dateFrom}_to_${dateTo}.xml`; a.click();
    URL.revokeObjectURL(url);
    setShowSuccessModal(true);
  };

  const xmlPreview = useMemo(() => generateTallyXML(), [filteredReceipts, filteredExpenses]);

  const tabList: { id: ReportTab; label: string }[] = [
    { id: "tally",      label: "Tally Bridge" },
    { id: "pnl",        label: "P&L" },
    { id: "cashflow",   label: "Cash Flow" },
    { id: "agedues",    label: "Age-wise Dues" },
    { id: "scholarship",label: "Scholarship" },
    { id: "collection", label: "Collection Trend" },
  ];

  const BRANCH_COLORS: Record<string, string> = { "College Expense": "#0F766E", "Infrastructure": "#7C3AED", "Hostel Expense": "#D97706" };

  return (
    <div className="space-y-5">

      {/* Tab bar + date range */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className="flex gap-1 rounded-2xl border p-1.5 flex-wrap"
          style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {tabList.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={tab === t.id ? { backgroundColor: "#0F766E", color: "#fff" } : { color: "#64748B" }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E2E8F0", backgroundColor: "#fff" }} />
          <span className="text-sm font-medium" style={{ color: "#94A3B8" }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E2E8F0", backgroundColor: "#fff" }} />
          <button
            onClick={() => toast({ title: "PDF generated (mock)", description: `Report exported for ${dateFrom} – ${dateTo}`, variant: "success" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#64748B", backgroundColor: "#fff" }}
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* P&L Tab */}
      {tab === "pnl" && (() => {
        const branchTotals = ["College Expense", "Infrastructure", "Hostel Expense"].map(b => ({
          name: b, total: filteredExpenses.filter(e => e.accountBranch === b).reduce((s, e) => s + e.amount, 0),
        }));
        const incomeHeadTotals = [
          { name: "Tuition Fees", total: filteredReceipts.filter(r => r.heads.some(h => h.head === "Tuition")).reduce((s, r) => s + r.heads.filter(h => h.head === "Tuition").reduce((a, h) => a + h.amount, 0), 0) },
          { name: "Hostel Fees",  total: filteredReceipts.filter(r => r.heads.some(h => h.head === "Hostel")).reduce((s, r) => s + r.heads.filter(h => h.head === "Hostel").reduce((a, h) => a + h.amount, 0), 0) },
          { name: "Exam & Lab",   total: filteredReceipts.filter(r => r.heads.some(h => h.head === "Exam" || h.head === "Lab")).reduce((s, r) => s + r.heads.filter(h => h.head === "Exam" || h.head === "Lab").reduce((a, h) => a + h.amount, 0), 0) },
          { name: "Other Fees",   total: filteredReceipts.filter(r => r.heads.some(h => !["Tuition","Hostel","Exam","Lab"].includes(h.head))).reduce((s, r) => s + r.heads.filter(h => !["Tuition","Hostel","Exam","Lab"].includes(h.head)).reduce((a, h) => a + h.amount, 0), 0) },
        ];
        return (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Income", value: totalIncome, gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", shadow: "rgba(15,118,110,0.35)", Icon: TrendingUp },
                { label: "Total Expenses", value: totalExpenses, gradient: "linear-gradient(135deg, #E11D48 0%, #F97066 100%)", shadow: "rgba(225,29,72,0.30)", Icon: TrendingDown },
                { label: "Net Surplus", value: netProfit, gradient: netProfit >= 0 ? "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)" : "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)", shadow: "rgba(3,105,161,0.30)", Icon: DollarSign },
              ].map(({ label, value, gradient, shadow, Icon }) => (
                <div key={label} className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: gradient, boxShadow: `0 8px 24px ${shadow}` }}>
                  <Icon size={72} className="absolute -right-3 -bottom-3 opacity-10" />
                  <div className="text-white/75 text-xs font-bold uppercase tracking-widest mb-3">{label}</div>
                  <div className="font-bold text-3xl tracking-tight">{formatINR(value)}</div>
                  <div className="text-white/60 text-xs mt-2">Selected date range</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border p-5" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <h3 className="font-serif font-bold text-lg mb-5" style={{ color: "#0F172A" }}>Expense by Branch</h3>
                <div className="space-y-4">
                  {branchTotals.map(b => {
                    const pct = totalExpenses > 0 ? Math.round((b.total / totalExpenses) * 100) : 0;
                    return (
                      <div key={b.name}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: BRANCH_COLORS[b.name] }} />
                            <span className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>{b.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[15px]" style={{ color: "#0F172A" }}>{formatINR(b.total)}</span>
                            <span className="text-sm ml-2" style={{ color: "#94A3B8" }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full" style={{ backgroundColor: "#F1F5F9" }}>
                          <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: BRANCH_COLORS[b.name] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-2xl border p-5" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
                <h3 className="font-serif font-bold text-lg mb-5" style={{ color: "#0F172A" }}>Income by Head</h3>
                <div className="space-y-4">
                  {incomeHeadTotals.filter(h => h.total > 0).map(h => {
                    const pct = totalIncome > 0 ? Math.round((h.total / totalIncome) * 100) : 0;
                    return (
                      <div key={h.name}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>{h.name}</span>
                          <div className="text-right">
                            <span className="font-bold text-[15px]" style={{ color: "#0F172A" }}>{formatINR(h.total)}</span>
                            <span className="text-sm ml-2" style={{ color: "#94A3B8" }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2.5 rounded-full" style={{ backgroundColor: "#F1F5F9" }}>
                          <div className="h-2.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#0F766E" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <h3 className="font-serif font-bold text-lg mb-5" style={{ color: "#0F172A" }}>Monthly P&L</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
                  <Legend />
                  <Bar dataKey="income" fill="#0F766E" radius={[6,6,0,0]} name="Income" />
                  <Bar dataKey="expenses" fill="#F97066" radius={[6,6,0,0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })()}

      {/* Cash Flow */}
      {tab === "cashflow" && (
        <div className="rounded-2xl border p-6" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <h3 className="font-serif font-bold text-xl mb-6" style={{ color: "#0F172A" }}>Cash Flow Statement</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#0F766E" strokeWidth={3} dot={false} name="Inflow" />
              <Line type="monotone" dataKey="expenses" stroke="#F97066" strokeWidth={3} dot={false} name="Outflow" />
              <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2.5} dot={false} strokeDasharray="6 4" name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Age-wise Dues */}
      {tab === "agedues" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>Age-wise Dues Register</h3>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>Outstanding balances bucketed by overdue days</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Student</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#F59E0B" }}>0–30 days</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#F97066" }}>31–60 days</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#EF4444" }}>61–90 days</th>
                <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#DC2626" }}>90+ days</th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Total Due</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.map((d, idx) => {
                const s = students.find(x => x.id === d.studentId);
                const buckets = { b0: 0, b31: 0, b61: 0, b90: 0 };
                if (d.overdueDays <= 30) buckets.b0 = d.overdueAmount;
                else if (d.overdueDays <= 60) buckets.b31 = d.overdueAmount;
                else if (d.overdueDays <= 90) buckets.b61 = d.overdueAmount;
                else buckets.b90 = d.overdueAmount;
                return (
                  <tr key={d.studentId} className="transition-colors"
                    style={{ borderBottom: "1px solid #F1F5F9", backgroundColor: idx % 2 === 0 ? "#fff" : "#FAFBFC" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F0FDFA")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#FAFBFC")}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>{s?.name}</div>
                      <div className="text-sm" style={{ color: "#94A3B8" }}>{s?.course} · Year {s?.year}</div>
                    </td>
                    {[buckets.b0, buckets.b31, buckets.b61, buckets.b90].map((v, i) => (
                      <td key={i} className="px-4 py-4 text-right text-[15px] font-medium" style={{ color: v > 0 ? "#0F172A" : "#CBD5E1" }}>
                        {v > 0 ? formatINR(v) : "—"}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right font-bold text-base" style={{ color: "#E11D48" }}>{formatINR(d.overdueAmount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Scholarship Register */}
      {tab === "scholarship" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {["SC","ST","OBC"].map(cat => {
              const count = students.filter(s => s.category === cat).length;
              const total = receipts.reduce((sum, r) => {
                const st = students.find(x => x.id === r.studentId);
                if (st?.category !== cat) return sum;
                return sum + r.heads.reduce((s, h) => s + (h.scholarship || 0), 0);
              }, 0);
              const gradients: Record<string, string> = { SC: "linear-gradient(135deg, #1D4ED8 0%, #60A5FA 100%)", ST: "linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)", OBC: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)" };
              return (
                <div key={cat} className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: gradients[cat], boxShadow: "0 6px 20px rgba(0,0,0,0.15)" }}>
                  <BarChart2 size={64} className="absolute -right-3 -bottom-3 opacity-10" />
                  <div className="text-white/75 text-xs font-bold uppercase tracking-widest mb-3">{cat} Scholarship</div>
                  <div className="font-bold text-3xl tracking-tight">{formatINR(total)}</div>
                  <div className="text-white/60 text-xs mt-2">{count} students</div>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Student</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Category</th>
                  <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Scholarship Amount</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => ["SC","ST","OBC","EWS"].includes(s.category)).map((s, idx) => {
                  const schAmount = receipts.filter(r => r.studentId === s.id).reduce((sum, r) =>
                    sum + r.heads.reduce((ss, h) => ss + (h.scholarship || 0), 0), 0);
                  if (schAmount === 0) return null;
                  const catColors: Record<string, string> = { SC: "#1D4ED8", ST: "#6D28D9", OBC: "#B45309", EWS: "#15803D" };
                  return (
                    <tr key={s.id} className="transition-colors"
                      style={{ borderBottom: "1px solid #F1F5F9", backgroundColor: idx % 2 === 0 ? "#fff" : "#FAFBFC" }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F0FDFA")}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#FAFBFC")}>
                      <td className="px-6 py-4 font-semibold text-[15px]" style={{ color: "#0F172A" }}>{s.name}</td>
                      <td className="px-4 py-4">
                        <span className="text-xs px-2.5 py-1 rounded-lg font-bold"
                          style={{ backgroundColor: `${catColors[s.category]}18`, color: catColors[s.category] }}>
                          {s.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-base" style={{ color: "#0F766E" }}>{formatINR(schAmount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Collection Trend */}
      {tab === "collection" && (
        <div className="rounded-2xl border p-6" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <h3 className="font-serif font-bold text-xl mb-6" style={{ color: "#0F172A" }}>Fee Collection Trend</h3>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => [formatINR(Number(v)), "Collected"]} contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid #E2E8F0", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="income" fill="#0F766E" radius={[6,6,0,0]} name="Fee Collection" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tally Bridge */}
      {tab === "tally" && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-6" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <div className="flex items-start gap-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", boxShadow: "0 4px 12px rgba(15,118,110,0.35)" }}
              >
                <Code size={24} style={{ color: "#fff" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>Tally Bridge</h3>
                <p className="text-base mt-1.5" style={{ color: "#64748B" }}>
                  Generate a Tally XML file containing all fee receipts and expenses. Import directly into Tally Prime or Busy.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Receipts in range", value: filteredReceipts.length },
                    { label: "Expenses in range", value: filteredExpenses.length },
                    { label: "Net value", value: formatINR(totalIncome - totalExpenses), isAmount: true },
                  ].map(({ label, value, isAmount }) => (
                    <div key={label} className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}>
                      <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>{label}</div>
                      <div className="font-bold text-xl" style={{ color: isAmount ? "#0F766E" : "#0F172A" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleGenerateTally}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-70 flex-shrink-0"
                style={{ backgroundColor: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.35)" }}
              >
                {generating ? <><RefreshCw size={16} className="animate-spin" /> Generating…</> : <><Code size={16} /> Generate XML</>}
              </button>
            </div>
          </div>

          {xmlGenerated && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "#0B3D3A" }}>
                <div className="flex items-center gap-2.5">
                  <FileText size={16} style={{ color: "#5EEAD4" }} />
                  <span className="text-sm font-mono font-medium text-white">NIMS_Tally_{dateFrom}_to_{dateTo}.xml</span>
                </div>
                <button
                  onClick={handleDownloadXML}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: "#F59E0B", color: "white" }}
                >
                  <Download size={14} /> Download XML
                </button>
              </div>
              <div className="overflow-auto max-h-96 p-5" style={{ backgroundColor: "#0F172A" }}>
                <pre className="text-xs leading-relaxed whitespace-pre">
                  {xmlPreview.split("\n").map((line, i) => {
                    let color = "#e2e8f0";
                    if (line.trim().startsWith("<!--")) color = "#64748b";
                    else if (line.includes("TALLYMESSAGE") || line.includes("VOUCHER ") || line.includes("ENVELOPE") || line.includes("BODY") || line.includes("IMPORTDATA")) color = "#5EEAD4";
                    else if (line.trim().startsWith("<")) color = "#93c5fd";
                    else if (line.trim()) color = "#fde68a";
                    return <span key={i} style={{ color }} className="block">{line}</span>;
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center" style={{ backgroundColor: "#fff" }}>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", boxShadow: "0 6px 20px rgba(15,118,110,0.40)" }}
            >
              <CheckCircle size={36} style={{ color: "#fff" }} />
            </div>
            <h3 className="font-serif font-bold text-2xl mb-2" style={{ color: "#0F172A" }}>XML Ready!</h3>
            <p className="text-base mb-2" style={{ color: "#475569" }}>Your Tally XML has been downloaded.</p>
            <p className="font-semibold text-base" style={{ color: "#0F766E" }}>Ready to import in Tally Prime / Busy</p>
            <div className="mt-5 p-4 rounded-xl text-sm text-left space-y-2" style={{ backgroundColor: "#F8FAFC", color: "#475569" }}>
              <div>① Open Tally Prime → Gateway of Tally</div>
              <div>② Import → From XML File</div>
              <div>③ Select the downloaded file</div>
              <div>④ Review and confirm import</div>
            </div>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="mt-5 w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E" }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
