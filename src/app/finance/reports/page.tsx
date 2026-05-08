"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Download, RefreshCw, CheckCircle, FileText, Code } from "lucide-react";
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
    receipts.filter(r => {
      const d = new Date(r.date);
      return d >= new Date(dateFrom) && d <= new Date(dateTo);
    }),
    [receipts, dateFrom, dateTo]
  );

  const filteredExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = new Date(e.date);
      return d >= new Date(dateFrom) && d <= new Date(dateTo);
    }),
    [expenses, dateFrom, dateTo]
  );

  // 12-month data
  const now = new Date();
  const monthlyData = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const m = subMonths(now, 11 - i);
    const start = startOfMonth(m); const end = endOfMonth(m);
    const income = receipts.filter(r => isWithinInterval(new Date(r.date), { start, end })).reduce((s, r) => s + r.totalAmount, 0);
    const exp = expenses.filter(e => isWithinInterval(new Date(e.date), { start, end })).reduce((s, e) => s + e.amount, 0);
    return { month: format(m, "MMM yy"), income, expenses: exp, profit: income - exp };
  }), [receipts, expenses]);

  const totalIncome = filteredReceipts.reduce((s, r) => s + r.totalAmount, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpenses;

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
    setTimeout(() => {
      setGenerating(false);
      setXmlGenerated(true);
    }, 1500);
  };

  const handleDownloadXML = () => {
    const xml = generateTallyXML();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NIMS_Tally_${dateFrom}_to_${dateTo}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    setShowSuccessModal(true);
  };

  const xmlPreview = useMemo(() => generateTallyXML(), [filteredReceipts, filteredExpenses]);

  const tabList: { id: ReportTab; label: string }[] = [
    { id: "tally", label: "Tally Bridge" },
    { id: "pnl", label: "P&L" },
    { id: "cashflow", label: "Cash Flow" },
    { id: "agedues", label: "Age-wise Dues" },
    { id: "scholarship", label: "Scholarship Register" },
    { id: "collection", label: "Collection Trend" },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar + date range */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-white rounded-xl border p-1.5 flex-wrap" style={{ borderColor: "#E2E8F0" }}>
          {tabList.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "text-white" : "hover:bg-gray-50"}`}
              style={tab === t.id ? { backgroundColor: "#0F766E" } : { color: "#475569" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
          <span className="text-sm" style={{ color: "#475569" }}>to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
          <button onClick={() => toast({ title: "PDF generated (mock)", description: `Report exported for ${dateFrom} – ${dateTo}`, variant: "success" })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* P&L Tab */}
      {tab === "pnl" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Income", value: totalIncome, color: "#0F766E" },
              { label: "Total Expenses", value: totalExpenses, color: "#F97066" },
              { label: "Net Surplus", value: netProfit, color: netProfit >= 0 ? "#0F766E" : "#F97066" },
            ].map(k => (
              <div key={k.label} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
                <div className="text-sm mb-2" style={{ color: "#475569" }}>{k.label}</div>
                <div className="font-serif font-bold text-2xl" style={{ color: k.color }}>{formatINR(k.value)}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Monthly P&L</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend />
                <Bar dataKey="income" fill="#0F766E" radius={[4,4,0,0]} name="Income" />
                <Bar dataKey="expenses" fill="#F97066" radius={[4,4,0,0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {tab === "cashflow" && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Cash Flow Statement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => formatINR(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#0F766E" strokeWidth={2.5} dot={false} name="Inflow" />
              <Line type="monotone" dataKey="expenses" stroke="#F97066" strokeWidth={2.5} dot={false} name="Outflow" />
              <Line type="monotone" dataKey="profit" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="5 5" name="Net" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Age-wise Dues */}
      {tab === "agedues" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Age-wise Dues Register</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Student</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: "#F59E0B" }}>0-30d</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: "#F97066" }}>31-60d</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: "#ef4444" }}>61-90d</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase" style={{ color: "#dc2626" }}>90+d</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase" style={{ color: "#475569" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {defaulters.map(d => {
                const s = students.find(x => x.id === d.studentId);
                const buckets = { b0: 0, b31: 0, b61: 0, b90: 0 };
                if (d.overdueDays <= 30) buckets.b0 = d.overdueAmount;
                else if (d.overdueDays <= 60) buckets.b31 = d.overdueAmount;
                else if (d.overdueDays <= 90) buckets.b61 = d.overdueAmount;
                else buckets.b90 = d.overdueAmount;
                return (
                  <tr key={d.studentId} className="border-t hover:bg-gray-50" style={{ borderColor: "#f1f5f9" }}>
                    <td className="px-5 py-3">
                      <div className="font-medium" style={{ color: "#0F172A" }}>{s?.name}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{s?.course} · Yr {s?.year}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{buckets.b0 > 0 ? formatINR(buckets.b0) : "—"}</td>
                    <td className="px-4 py-3 text-right text-sm">{buckets.b31 > 0 ? formatINR(buckets.b31) : "—"}</td>
                    <td className="px-4 py-3 text-right text-sm">{buckets.b61 > 0 ? formatINR(buckets.b61) : "—"}</td>
                    <td className="px-4 py-3 text-right text-sm">{buckets.b90 > 0 ? formatINR(buckets.b90) : "—"}</td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: "#F97066" }}>{formatINR(d.overdueAmount)}</td>
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
              return (
                <div key={cat} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
                  <div className="text-sm" style={{ color: "#475569" }}>{cat} Scholarship</div>
                  <div className="font-bold text-xl mt-1" style={{ color: "#0F766E" }}>{formatINR(total)}</div>
                  <div className="text-xs mt-1" style={{ color: "#475569" }}>{count} students</div>
                </div>
              );
            })}
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Student</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Category</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Scholarship Amount</th>
                </tr>
              </thead>
              <tbody>
                {students.filter(s => ["SC","ST","OBC","EWS"].includes(s.category)).map(s => {
                  const schAmount = receipts.filter(r => r.studentId === s.id).reduce((sum, r) =>
                    sum + r.heads.reduce((ss, h) => ss + (h.scholarship || 0), 0), 0);
                  if (schAmount === 0) return null;
                  return (
                    <tr key={s.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#f1f5f9" }}>
                      <td className="px-5 py-3 font-medium" style={{ color: "#0F172A" }}>{s.name}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700">{s.category}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F766E" }}>{formatINR(schAmount)}</td>
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
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Fee Collection Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => [formatINR(Number(v)), "Collected"]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="income" fill="#0F766E" radius={[4,4,0,0]} name="Fee Collection" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tally Bridge */}
      {tab === "tally" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FDFA" }}>
                <Code size={22} style={{ color: "#0F766E" }} />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-lg" style={{ color: "#0F172A" }}>Tally Bridge</h3>
                <p className="text-sm mt-1" style={{ color: "#475569" }}>
                  Generate a Tally XML file containing all fee receipts and expenses for the selected date range.
                  Import directly into Tally Prime or Busy.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="text-xs" style={{ color: "#475569" }}>Receipts in range</div>
                    <div className="font-bold mt-0.5" style={{ color: "#0F172A" }}>{filteredReceipts.length}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="text-xs" style={{ color: "#475569" }}>Expenses in range</div>
                    <div className="font-bold mt-0.5" style={{ color: "#0F172A" }}>{filteredExpenses.length}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                    <div className="text-xs" style={{ color: "#475569" }}>Net value</div>
                    <div className="font-bold mt-0.5" style={{ color: "#0F766E" }}>{formatINR(totalIncome - totalExpenses)}</div>
                  </div>
                </div>
              </div>
              <button
                onClick={handleGenerateTally}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-all disabled:opacity-70 flex-shrink-0"
                style={{ backgroundColor: "#0F766E" }}>
                {generating ? <><RefreshCw size={16} className="animate-spin" /> Generating...</> : <><Code size={16} /> Generate Tally XML</>}
              </button>
            </div>
          </div>

          {/* XML Preview */}
          {xmlGenerated && (
            <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0", backgroundColor: "#0B3D3A" }}>
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-teal-300" />
                  <span className="text-sm font-mono font-medium text-white">NIMS_Tally_{dateFrom}_to_{dateTo}.xml</span>
                </div>
                <button onClick={handleDownloadXML}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: "#F59E0B", color: "white" }}>
                  <Download size={14} /> Download XML
                </button>
              </div>
              <div className="overflow-auto max-h-96 p-4" style={{ backgroundColor: "#0F172A" }}>
                <pre className="text-xs leading-relaxed whitespace-pre">
                  {xmlPreview.split("\n").map((line, i) => {
                    const isTag = line.trim().startsWith("<");
                    const isComment = line.trim().startsWith("<!--");

                    let color = "#e2e8f0";
                    if (isComment) color = "#64748b";
                    else if (line.includes("TALLYMESSAGE") || line.includes("VOUCHER ") || line.includes("ENVELOPE") || line.includes("BODY") || line.includes("IMPORTDATA")) color = "#5EEAD4";
                    else if (isTag) color = "#93c5fd";
                    else if (!isTag && line.trim()) color = "#fde68a";

                    return (
                      <span key={i} style={{ color }} className="block">
                        {line}
                      </span>
                    );
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0FDFA" }}>
              <CheckCircle size={32} style={{ color: "#0F766E" }} />
            </div>
            <h3 className="font-serif font-bold text-xl mb-2" style={{ color: "#0F172A" }}>XML Ready!</h3>
            <p className="text-sm mb-2" style={{ color: "#475569" }}>
              Your Tally XML file has been downloaded successfully.
            </p>
            <p className="text-sm font-medium" style={{ color: "#0F766E" }}>
              Ready to import in Tally Prime / Busy
            </p>
            <div className="mt-5 p-3 rounded-xl text-xs text-left space-y-1.5" style={{ backgroundColor: "#f8fafc", color: "#475569" }}>
              <div>① Open Tally Prime → Gateway of Tally</div>
              <div>② Import → From XML File</div>
              <div>③ Select the downloaded file</div>
              <div>④ Review and confirm import</div>
            </div>
            <button onClick={() => setShowSuccessModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E" }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
