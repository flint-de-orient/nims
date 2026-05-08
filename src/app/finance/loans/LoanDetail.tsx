"use client";
import { useState, useMemo } from "react";
import type { Loan, LoanRepayment, PaymentMode } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { X, CheckCircle, Clock, AlertCircle, FileText, FileSpreadsheet, CreditCard } from "lucide-react";

interface Props {
  loan: Loan;
  repayments: LoanRepayment[];
  onClose: () => void;
  onRecordPayment: (repaymentId: string, amount: number, date: string, mode: PaymentMode, ref?: string) => void;
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  Paid:     { bg: "#F0FDFA", text: "#0F766E", icon: <CheckCircle size={12} /> },
  Upcoming: { bg: "#F0F9FF", text: "#0284c7", icon: <Clock size={12} /> },
  Overdue:  { bg: "#FFF1F0", text: "#F97066", icon: <AlertCircle size={12} /> },
  Partial:  { bg: "#FFFBEB", text: "#D97706", icon: <Clock size={12} /> },
};

const LOAN_STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Active:  { bg: "#F0F9FF", text: "#0284c7" },
  Overdue: { bg: "#FFF1F0", text: "#F97066" },
  Closed:  { bg: "#F0FDFA", text: "#0F766E" },
};

export default function LoanDetail({ loan, repayments, onClose, onRecordPayment }: Props) {
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    mode: "Cash" as PaymentMode,
    reference: "",
  });

  const summary = useMemo(() => {
    const paid   = repayments.filter(r => r.status === "Paid").reduce((s, r) => s + (r.paidAmount ?? 0), 0);
    const overdue = repayments.filter(r => r.status === "Overdue" || r.status === "Partial")
                              .reduce((s, r) => s + r.principalDue + r.interestDue, 0);
    const upcoming = repayments.filter(r => r.status === "Upcoming")
                               .reduce((s, r) => s + r.principalDue + r.interestDue, 0);
    return { paid, overdue, upcoming, outstanding: overdue + upcoming };
  }, [repayments]);

  const nextDue = repayments.find(r => r.status === "Upcoming" || r.status === "Overdue");
  const paidCount = repayments.filter(r => r.status === "Paid").length;
  const progressPct = Math.round((paidCount / repayments.length) * 100);

  const openPay = (r: LoanRepayment) => {
    setPayForm({
      amount: String(r.principalDue + r.interestDue),
      date: new Date().toISOString().split("T")[0],
      mode: "Cash",
      reference: "",
    });
    setPayingId(r.id);
  };

  const submitPayment = () => {
    if (!payingId) return;
    onRecordPayment(payingId, parseFloat(payForm.amount), payForm.date, payForm.mode, payForm.reference || undefined);
    setPayingId(null);
  };

  /* ── PDF ─────────────────────────────────────────── */
  const handlePDF = () => {
    const rows = repayments.map(r => `
      <tr style="background:${r.status === "Overdue" ? "#fff7ed" : "white"}">
        <td>${r.installmentNo}</td>
        <td>${formatDate(r.dueDate)}</td>
        <td style="text-align:right">${formatINR(r.principalDue)}</td>
        <td style="text-align:right">${r.interestDue > 0 ? formatINR(r.interestDue) : "—"}</td>
        <td style="text-align:right;font-weight:600">${formatINR(r.principalDue + r.interestDue)}</td>
        <td style="text-align:center"><span style="background:${STATUS_STYLE[r.status]?.bg};color:${STATUS_STYLE[r.status]?.text};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600">${r.status}</span></td>
        <td>${r.paidDate ? formatDate(r.paidDate) : "—"}</td>
        <td style="text-align:right">${r.paidAmount ? formatINR(r.paidAmount) : "—"}</td>
        <td>${r.paymentMode ?? "—"}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Loan Schedule – ${loan.lenderName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;padding:32px}
  h1{font-size:20px;font-weight:700;margin-bottom:4px}
  .sub{color:#64748b;font-size:12px;margin-bottom:16px}
  .info{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}
  .label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em}
  .value{font-size:13px;font-weight:600;color:#0f172a;margin-top:2px}
  .summary{display:flex;gap:16px;margin-bottom:20px}
  .card{flex:1;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0}
  .card .label{font-size:10px;color:#94a3b8;text-transform:uppercase}
  .card .value{font-size:18px;font-weight:700;margin-top:4px}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#0f766e;color:white}
  th{padding:8px 10px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  td{padding:7px 10px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tfoot td{background:#f8fafc;font-weight:700;border-top:2px solid #e2e8f0}
</style></head><body>
<h1>${loan.lenderName}</h1>
<div class="sub">${loan.lenderType} · ${loan.relationship} · ${loan.phone ?? ""}</div>
<div class="info">
  <div><div class="label">Loan Amount</div><div class="value">${formatINR(loan.amount)}</div></div>
  <div><div class="label">Date Received</div><div class="value">${formatDate(loan.dateReceived)}</div></div>
  <div><div class="label">Tenure</div><div class="value">${loan.tenureMonths} months</div></div>
  <div><div class="label">Interest</div><div class="value">${loan.interestRate === 0 ? "Interest-free" : loan.interestRate + "% p.a."}</div></div>
</div>
<div class="summary">
  <div class="card"><div class="label">Total Borrowed</div><div class="value" style="color:#0f172a">${formatINR(loan.amount)}</div></div>
  <div class="card"><div class="label">Repaid</div><div class="value" style="color:#0284c7">${formatINR(summary.paid)}</div></div>
  <div class="card"><div class="label">Outstanding</div><div class="value" style="color:${summary.overdue > 0 ? "#F97066" : "#D97706"}">${formatINR(summary.outstanding)}</div></div>
  <div class="card"><div class="label">Progress</div><div class="value" style="color:#0F766E">${progressPct}%</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Due Date</th><th style="text-align:right">Principal</th><th style="text-align:right">Interest</th><th style="text-align:right">Total</th><th style="text-align:center">Status</th><th>Paid On</th><th style="text-align:right">Paid</th><th>Mode</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="2">Total (${repayments.length} installments)</td><td style="text-align:right">${formatINR(loan.amount)}</td><td></td><td style="text-align:right">${formatINR(loan.amount)}</td><td></td><td></td><td style="text-align:right">${formatINR(summary.paid)}</td><td></td></tr></tfoot>
</table>
<div style="margin-top:32px;color:#94a3b8;font-size:10px;text-align:right">Generated by NIMS · ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div>
</body></html>`;
    const w = window.open("", "_blank", "width=1000,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  /* ── CSV ─────────────────────────────────────────── */
  const handleCSV = () => {
    const header = ["#","Due Date","Principal (₹)","Interest (₹)","Total Due (₹)","Status","Paid Date","Paid Amount (₹)","Mode","Reference"];
    const rows = repayments.map(r => [
      r.installmentNo, r.dueDate, r.principalDue, r.interestDue,
      r.principalDue + r.interestDue, r.status,
      r.paidDate ?? "", r.paidAmount ?? "", r.paymentMode ?? "", r.referenceNumber ?? "",
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `loan-schedule-${loan.lenderName.replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-[680px] max-w-full bg-white flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>{loan.lenderName}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{loan.lenderType}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: LOAN_STATUS_COLOR[loan.status]?.bg, color: LOAN_STATUS_COLOR[loan.status]?.text }}>
                  {loan.status}
                </span>
              </div>
              <p className="text-xs" style={{ color: "#64748b" }}>{loan.relationship}{loan.phone ? ` · ${loan.phone}` : ""}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#64748b" }}>
              <X size={18} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handlePDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium hover:bg-red-50 transition-colors"
              style={{ borderColor: "#fca5a5", color: "#dc2626" }}>
              <FileText size={14} /> Schedule PDF
            </button>
            <button onClick={handleCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium hover:bg-green-50 transition-colors"
              style={{ borderColor: "#86efac", color: "#16a34a" }}>
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-px flex-shrink-0" style={{ backgroundColor: "#E2E8F0" }}>
          {[
            { label: "Loan Amount",  value: formatINR(loan.amount),         color: "#0F172A", bg: "#f8fafc" },
            { label: "Repaid",       value: formatINR(summary.paid),        color: "#0284c7", bg: "#F0F9FF" },
            { label: "Overdue",      value: formatINR(summary.overdue),     color: "#F97066", bg: summary.overdue > 0 ? "#FFF1F0" : "#f8fafc" },
            { label: "Upcoming",     value: formatINR(summary.upcoming),    color: "#D97706", bg: "#FFFBEB" },
          ].map(c => (
            <div key={c.label} className="px-4 py-3" style={{ backgroundColor: c.bg }}>
              <div className="text-xs uppercase tracking-wide font-medium mb-1" style={{ color: "#94a3b8" }}>{c.label}</div>
              <div className="font-bold text-base" style={{ color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Loan meta + progress */}
        <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0", backgroundColor: "#fafafa" }}>
          <div className="flex gap-6 mb-3 text-sm flex-wrap">
            <div><span style={{ color: "#94a3b8" }}>Received: </span><span className="font-medium" style={{ color: "#0F172A" }}>{formatDate(loan.dateReceived)}</span></div>
            <div><span style={{ color: "#94a3b8" }}>Tenure: </span><span className="font-medium" style={{ color: "#0F172A" }}>{loan.tenureMonths} months</span></div>
            <div><span style={{ color: "#94a3b8" }}>Interest: </span><span className="font-medium" style={{ color: "#0F172A" }}>{loan.interestRate === 0 ? "Interest-free" : `${loan.interestRate}% p.a.`}</span></div>
            {nextDue && <div><span style={{ color: "#94a3b8" }}>Next due: </span><span className="font-medium" style={{ color: nextDue.status === "Overdue" ? "#F97066" : "#0F172A" }}>{formatDate(nextDue.dueDate)} — {formatINR(nextDue.principalDue + nextDue.interestDue)}</span></div>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? "#0F766E" : "#0284c7" }} />
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#475569" }}>
              {paidCount}/{repayments.length} paid ({progressPct}%)
            </span>
          </div>
          {loan.purpose && <p className="text-xs mt-2" style={{ color: "#64748b" }}><span className="font-medium">Purpose:</span> {loan.purpose}</p>}
        </div>

        {/* Repayment schedule */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ backgroundColor: "#0F766E" }}>
                {["#", "Due Date", "Principal", "Interest", "Total", "Status", "Paid On", "Mode", ""].map(h => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white ${["Principal","Interest","Total"].includes(h) ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repayments.map((r, i) => {
                const canPay = r.status === "Overdue" || r.status === "Upcoming" || r.status === "Partial";
                const isPayingThis = payingId === r.id;
                return (
                  <>
                    <tr key={r.id} className="border-t transition-colors"
                      style={{ borderColor: "#f1f5f9", backgroundColor: r.status === "Overdue" ? "#fff8f6" : i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "#94a3b8" }}>{r.installmentNo}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#475569" }}>{formatDate(r.dueDate)}</td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: "#0F172A" }}>{formatINR(r.principalDue)}</td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: "#94a3b8" }}>{r.interestDue > 0 ? formatINR(r.interestDue) : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-sm" style={{ color: "#0F172A" }}>{formatINR(r.principalDue + r.interestDue)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold w-fit"
                          style={{ backgroundColor: STATUS_STYLE[r.status]?.bg, color: STATUS_STYLE[r.status]?.text }}>
                          {STATUS_STYLE[r.status]?.icon} {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{r.paidDate ? formatDate(r.paidDate) : "—"}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{r.paymentMode ?? "—"}</td>
                      <td className="px-4 py-3">
                        {canPay && (
                          <button onClick={() => isPayingThis ? setPayingId(null) : openPay(r)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all"
                            style={isPayingThis
                              ? { borderColor: "#E2E8F0", color: "#475569", backgroundColor: "#f8fafc" }
                              : { borderColor: "#0F766E", color: "#0F766E", backgroundColor: "#F0FDFA" }}>
                            <CreditCard size={11} /> {isPayingThis ? "Cancel" : "Pay"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isPayingThis && (
                      <tr key={`${r.id}-payform`} style={{ backgroundColor: "#F0FDFA" }}>
                        <td colSpan={9} className="px-4 py-4 border-t" style={{ borderColor: "#e2e8f0" }}>
                          <div className="flex flex-wrap gap-3 items-end">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Amount (₹)</label>
                              <input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}
                                className="w-32 px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Date</label>
                              <input type="date" value={payForm.date} onChange={e => setPayForm(p => ({ ...p, date: e.target.value }))}
                                className="px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Mode</label>
                              <select value={payForm.mode} onChange={e => setPayForm(p => ({ ...p, mode: e.target.value as PaymentMode }))}
                                className="px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                                {(["Cash","UPI","Cheque","Net Banking","Card"] as PaymentMode[]).map(m => <option key={m}>{m}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Reference</label>
                              <input value={payForm.reference} onChange={e => setPayForm(p => ({ ...p, reference: e.target.value }))}
                                placeholder="Cheque / UTR no." className="w-36 px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                            </div>
                            <button onClick={submitPayment}
                              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
                              style={{ backgroundColor: "#0F766E" }}>
                              <CheckCircle size={13} /> Record Payment
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2" style={{ borderColor: "#E2E8F0", backgroundColor: "#f8fafc" }}>
                <td colSpan={2} className="px-4 py-3 text-xs font-semibold" style={{ color: "#475569" }}>Total — {repayments.length} installments</td>
                <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0F172A" }}>{formatINR(loan.amount)}</td>
                <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#94a3b8" }}>{formatINR(repayments.reduce((s,r) => s + r.interestDue, 0) || 0) === formatINR(0) ? "—" : formatINR(repayments.reduce((s,r) => s + r.interestDue, 0))}</td>
                <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0F766E" }}>{formatINR(loan.amount + repayments.reduce((s,r) => s + r.interestDue, 0))}</td>
                <td colSpan={2} className="px-4 py-3 text-xs" style={{ color: "#475569" }}>{paidCount} paid · {repayments.length - paidCount} remaining</td>
                <td colSpan={2} className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0284c7" }}>{formatINR(summary.paid)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
