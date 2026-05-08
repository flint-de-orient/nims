"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Plus, Landmark, CheckCircle, AlertCircle, Clock,
  TrendingDown, IndianRupee, CreditCard, CalendarClock,
} from "lucide-react";
import type { LenderType, PaymentMode } from "@/lib/types";
import LoanDetail from "./LoanDetail";

type TabType = "loans" | "schedule" | "payments";

const LENDER_TYPES: LenderType[] = ["Trustee", "Committee Member", "Individual", "Other"];
const PAY_MODES: PaymentMode[] = ["Cash", "UPI", "Cheque", "Net Banking", "Card"];

const LOAN_STATUS_STYLE = {
  Active:  { bg: "#F0F9FF", text: "#0284c7", border: "#bae6fd" },
  Overdue: { bg: "#FFF1F0", text: "#F97066", border: "#fecaca" },
  Closed:  { bg: "#F0FDFA", text: "#0F766E", border: "#99f6e4" },
};

export default function LoansPage() {
  const { loans, loanRepayments, addLoan, recordPayment } = useNIMSStore();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabType>("loans");
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    lenderName: "",
    lenderType: "Trustee" as LenderType,
    relationship: "",
    phone: "",
    amount: "",
    dateReceived: new Date().toISOString().split("T")[0],
    purpose: "",
    interestRate: "0",
    tenureMonths: "12",
    repaymentStartDate: "",
    notes: "",
  });

  /* ── Computed ───────────────────────────────────────────────── */
  const overview = useMemo(() => {
    const totalBorrowed = loans.reduce((s, l) => s + l.amount, 0);
    const totalRepaid   = loanRepayments.filter(r => r.status === "Paid").reduce((s, r) => s + (r.paidAmount ?? 0), 0);
    const overdue       = loanRepayments.filter(r => r.status === "Overdue").reduce((s, r) => s + r.principalDue + r.interestDue, 0);
    const outstanding   = totalBorrowed - totalRepaid;
    return { totalBorrowed, totalRepaid, outstanding, overdue };
  }, [loans, loanRepayments]);

  const scheduleItems = useMemo(() =>
    loanRepayments
      .filter(r => r.status === "Upcoming" || r.status === "Overdue" || r.status === "Partial")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [loanRepayments]
  );

  const paymentLog = useMemo(() =>
    loanRepayments
      .filter(r => r.status === "Paid" || r.status === "Partial")
      .filter(r => r.paidDate)
      .sort((a, b) => (b.paidDate ?? "").localeCompare(a.paidDate ?? "")),
    [loanRepayments]
  );

  /* ── Loan progress helper ─────────────────────────────────── */
  const loanProgress = (loanId: string) => {
    const reps = loanRepayments.filter(r => r.loanId === loanId);
    const paid = reps.filter(r => r.status === "Paid").length;
    const paidAmt = reps.filter(r => r.status === "Paid").reduce((s, r) => s + (r.paidAmount ?? 0), 0);
    const overdueAmt = reps.filter(r => r.status === "Overdue" || r.status === "Partial").reduce((s, r) => s + r.principalDue + r.interestDue, 0);
    const next = reps.find(r => r.status === "Upcoming" || r.status === "Overdue");
    return { total: reps.length, paid, paidAmt, overdueAmt, next, pct: reps.length ? Math.round(paid / reps.length * 100) : 0 };
  };

  /* ── Add Loan ──────────────────────────────────────────────── */
  const handleAddLoan = () => {
    if (!form.lenderName.trim()) { toast({ title: "Lender name required", variant: "destructive" }); return; }
    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Valid amount required", variant: "destructive" }); return; }
    const tenure = parseInt(form.tenureMonths);
    if (isNaN(tenure) || tenure < 1) { toast({ title: "Valid tenure required", variant: "destructive" }); return; }
    if (!form.repaymentStartDate) { toast({ title: "Repayment start date required", variant: "destructive" }); return; }
    if (!form.purpose.trim()) { toast({ title: "Purpose required", variant: "destructive" }); return; }

    addLoan({
      lenderName: form.lenderName.trim(),
      lenderType: form.lenderType,
      relationship: form.relationship.trim(),
      phone: form.phone.trim() || undefined,
      amount,
      dateReceived: form.dateReceived,
      purpose: form.purpose.trim(),
      interestRate: parseFloat(form.interestRate) || 0,
      tenureMonths: tenure,
      repaymentStartDate: form.repaymentStartDate,
      status: "Active",
      notes: form.notes.trim() || undefined,
    });
    setShowAddModal(false);
    setForm(p => ({ ...p, lenderName: "", relationship: "", phone: "", amount: "", purpose: "", notes: "", interestRate: "0", tenureMonths: "12", repaymentStartDate: "" }));
    toast({ title: "Loan recorded", description: `Repayment schedule of ${tenure} installments generated`, variant: "success" });
  };

  /* ── Record payment (from schedule tab) ───────────────────── */
  const [quickPayId, setQuickPayId] = useState<string | null>(null);
  const [quickPayForm, setQuickPayForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0], mode: "Cash" as PaymentMode, reference: "" });

  const openQuickPay = (repaymentId: string, due: number) => {
    setQuickPayForm({ amount: String(due), date: new Date().toISOString().split("T")[0], mode: "Cash", reference: "" });
    setQuickPayId(repaymentId);
  };

  const submitQuickPay = () => {
    if (!quickPayId) return;
    const amt = parseFloat(quickPayForm.amount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Valid amount required", variant: "destructive" }); return; }
    recordPayment(quickPayId, amt, quickPayForm.date, quickPayForm.mode, quickPayForm.reference || undefined);
    setQuickPayId(null);
    toast({ title: "Payment recorded", variant: "success" });
  };

  const selectedLoan = loans.find(l => l.id === selectedLoanId);
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif font-bold text-2xl" style={{ color: "#0F172A" }}>Loan Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#475569" }}>Track institutional borrowings, repayment schedule, and payment history</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
          style={{ backgroundColor: "#0F766E" }}>
          <Plus size={15} /> Record New Loan
        </button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Borrowed",   value: overview.totalBorrowed, icon: Landmark,      color: "#0F172A", bg: "#f8fafc",  border: "#E2E8F0" },
          { label: "Total Repaid",     value: overview.totalRepaid,   icon: CheckCircle,   color: "#0284c7", bg: "#F0F9FF",  border: "#bae6fd" },
          { label: "Outstanding",      value: overview.outstanding,   icon: TrendingDown,  color: "#D97706", bg: "#FFFBEB",  border: "#fde68a" },
          { label: "Overdue",          value: overview.overdue,       icon: AlertCircle,   color: overview.overdue > 0 ? "#F97066" : "#94a3b8", bg: overview.overdue > 0 ? "#FFF1F0" : "#f8fafc", border: overview.overdue > 0 ? "#fecaca" : "#E2E8F0" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border p-5" style={{ borderColor: c.border }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{c.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.bg }}>
                <c.icon size={15} style={{ color: c.color }} />
              </div>
            </div>
            <div className="font-bold text-2xl" style={{ color: c.color }}>{formatINR(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border p-1.5 w-fit" style={{ borderColor: "#E2E8F0" }}>
        {([
          { id: "loans" as TabType,    label: "All Loans",        count: loans.length },
          { id: "schedule" as TabType, label: "Repayment Schedule", count: scheduleItems.length },
          { id: "payments" as TabType, label: "Payment Log",      count: paymentLog.length },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.id ? "text-white" : "hover:bg-gray-50"}`}
            style={tab === t.id ? { backgroundColor: "#0F766E" } : { color: "#475569" }}>
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}
                style={t.id === "schedule" && tab !== t.id && loanRepayments.some(r => r.status === "Overdue") ? { backgroundColor: "#FFF1F0", color: "#F97066" } : {}}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── All Loans ─────────────────────────────────────────── */}
      {tab === "loans" && (
        <div className="grid grid-cols-1 gap-4">
          {loans.map(loan => {
            const prog = loanProgress(loan.id);
            const st = LOAN_STATUS_STYLE[loan.status];
            return (
              <div key={loan.id}
                onClick={() => setSelectedLoanId(loan.id)}
                className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md transition-all group"
                style={{ borderColor: "#E2E8F0" }}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                    style={{ backgroundColor: "#0F766E" }}>
                    {loan.lenderName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h3 className="font-semibold text-base group-hover:text-teal-700 transition-colors" style={{ color: "#0F172A" }}>{loan.lenderName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{loan.lenderType}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold border"
                        style={{ backgroundColor: st.bg, color: st.text, borderColor: st.border }}>
                        {loan.status}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{loan.relationship} · {loan.purpose}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Loan Amount</div>
                        <div className="font-bold" style={{ color: "#0F172A" }}>{formatINR(loan.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Repaid</div>
                        <div className="font-semibold" style={{ color: "#0284c7" }}>{formatINR(prog.paidAmt)}</div>
                      </div>
                      {prog.overdueAmt > 0 ? (
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Overdue</div>
                          <div className="font-semibold" style={{ color: "#F97066" }}>{formatINR(prog.overdueAmt)}</div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>Outstanding</div>
                          <div className="font-semibold" style={{ color: "#D97706" }}>{formatINR(loan.amount - prog.paidAmt)}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs mb-0.5" style={{ color: "#94a3b8" }}>
                          {loan.status === "Closed" ? "Closed on" : "Next Due"}
                        </div>
                        {loan.status === "Closed" ? (
                          <div className="font-semibold text-sm" style={{ color: "#0F766E" }}>Fully Repaid</div>
                        ) : prog.next ? (
                          <div className="font-semibold text-sm" style={{ color: prog.next.status === "Overdue" ? "#F97066" : "#0F172A" }}>
                            {formatDate(prog.next.dueDate)} · {formatINR(prog.next.principalDue + prog.next.interestDue)}
                          </div>
                        ) : (
                          <div className="font-semibold text-sm" style={{ color: "#0F766E" }}>—</div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${prog.pct}%`, backgroundColor: prog.pct === 100 ? "#0F766E" : prog.overdueAmt > 0 ? "#F97066" : "#0284c7" }} />
                      </div>
                      <span className="text-xs font-medium flex-shrink-0" style={{ color: "#64748b" }}>
                        {prog.paid}/{prog.total} · {prog.pct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs px-3 py-1.5 rounded-lg border font-medium" style={{ borderColor: "#0F766E", color: "#0F766E" }}>
                      View Ledger →
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Repayment Schedule ────────────────────────────────── */}
      {tab === "schedule" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          {scheduleItems.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#0F766E" }} />
              <p className="font-medium" style={{ color: "#0F172A" }}>All installments settled</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  {["Due Date", "Lender", "Inst. #", "Principal", "Interest", "Total Due", "Status", "Action"].map(h => (
                    <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${["Principal","Interest","Total Due"].includes(h) ? "text-right" : "text-left"}`} style={{ color: "#475569" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleItems.map(r => {
                  const loan = loans.find(l => l.id === r.loanId);
                  const isOverdue = r.status === "Overdue";
                  const isPayingThis = quickPayId === r.id;
                  return (
                    <>
                      <tr key={r.id} className="border-t transition-colors"
                        style={{ borderColor: "#f1f5f9", backgroundColor: isOverdue ? "#fff8f6" : "white" }}>
                        <td className="px-5 py-3 text-xs whitespace-nowrap font-medium"
                          style={{ color: isOverdue ? "#F97066" : "#475569" }}>
                          {isOverdue && <AlertCircle size={12} className="inline mr-1" style={{ color: "#F97066" }} />}
                          {formatDate(r.dueDate)}
                          {isOverdue && <span className="block text-xs font-normal" style={{ color: "#F97066" }}>
                            {Math.floor((new Date(today).getTime() - new Date(r.dueDate).getTime()) / 86400000)}d overdue
                          </span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-sm" style={{ color: "#0F172A" }}>{loan?.lenderName ?? "—"}</div>
                          <div className="text-xs" style={{ color: "#94a3b8" }}>{loan?.relationship}</div>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono" style={{ color: "#94a3b8" }}>#{r.installmentNo}/{loan?.tenureMonths}</td>
                        <td className="px-5 py-3 text-right text-xs" style={{ color: "#475569" }}>{formatINR(r.principalDue)}</td>
                        <td className="px-5 py-3 text-right text-xs" style={{ color: "#94a3b8" }}>{r.interestDue > 0 ? formatINR(r.interestDue) : "—"}</td>
                        <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F172A" }}>{formatINR(r.principalDue + r.interestDue)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: isOverdue ? "#FFF1F0" : "#F0F9FF", color: isOverdue ? "#F97066" : "#0284c7" }}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button onClick={() => isPayingThis ? setQuickPayId(null) : openQuickPay(r.id, r.principalDue + r.interestDue)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all"
                            style={isPayingThis
                              ? { borderColor: "#E2E8F0", color: "#475569" }
                              : { borderColor: "#0F766E", color: "#0F766E", backgroundColor: "#F0FDFA" }}>
                            <CreditCard size={11} /> {isPayingThis ? "Cancel" : "Record Payment"}
                          </button>
                        </td>
                      </tr>
                      {isPayingThis && (
                        <tr key={`${r.id}-qpay`} style={{ backgroundColor: "#F0FDFA" }}>
                          <td colSpan={8} className="px-5 py-4 border-t" style={{ borderColor: "#e2e8f0" }}>
                            <div className="flex flex-wrap gap-3 items-end">
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Amount (₹)</label>
                                <input type="number" value={quickPayForm.amount} onChange={e => setQuickPayForm(p => ({ ...p, amount: e.target.value }))}
                                  className="w-32 px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Date</label>
                                <input type="date" value={quickPayForm.date} onChange={e => setQuickPayForm(p => ({ ...p, date: e.target.value }))}
                                  className="px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Mode</label>
                                <select value={quickPayForm.mode} onChange={e => setQuickPayForm(p => ({ ...p, mode: e.target.value as PaymentMode }))}
                                  className="px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                                  {PAY_MODES.map(m => <option key={m}>{m}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>Reference</label>
                                <input value={quickPayForm.reference} onChange={e => setQuickPayForm(p => ({ ...p, reference: e.target.value }))}
                                  placeholder="Cheque / UTR no." className="w-40 px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                              </div>
                              <button onClick={submitQuickPay}
                                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-sm font-medium hover:opacity-90"
                                style={{ backgroundColor: "#0F766E" }}>
                                <CheckCircle size={13} /> Record
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Payment Log ───────────────────────────────────────── */}
      {tab === "payments" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          {paymentLog.length === 0 ? (
            <div className="p-12 text-center">
              <CalendarClock size={40} className="mx-auto mb-3" style={{ color: "#cbd5e1" }} />
              <p className="font-medium" style={{ color: "#475569" }}>No payments recorded yet</p>
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    {["Paid On", "Lender", "Inst. #", "Amount", "Mode", "Reference", "Status"].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide ${h === "Amount" ? "text-right" : "text-left"}`} style={{ color: "#475569" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paymentLog.map((r, i) => {
                    const loan = loans.find(l => l.id === r.loanId);
                    return (
                      <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "#f1f5f9", backgroundColor: i % 2 === 0 ? "white" : "#fafafa" }}>
                        <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#475569" }}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F0FDFA" }}>
                              <IndianRupee size={10} style={{ color: "#0F766E" }} />
                            </div>
                            {formatDate(r.paidDate!)}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-medium text-sm" style={{ color: "#0F172A" }}>{loan?.lenderName ?? "—"}</div>
                          <div className="text-xs" style={{ color: "#94a3b8" }}>{loan?.relationship}</div>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono" style={{ color: "#94a3b8" }}>#{r.installmentNo}/{loan?.tenureMonths}</td>
                        <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F172A" }}>{formatINR(r.paidAmount ?? 0)}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{r.paymentMode}</span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: "#475569" }}>{r.referenceNumber ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>Paid</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2" style={{ borderColor: "#E2E8F0", backgroundColor: "#f8fafc" }}>
                    <td colSpan={3} className="px-5 py-3 text-xs font-semibold" style={{ color: "#475569" }}>
                      Total — {paymentLog.length} payment{paymentLog.length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-5 py-3 text-right font-bold" style={{ color: "#0284c7" }}>
                      {formatINR(paymentLog.reduce((s, r) => s + (r.paidAmount ?? 0), 0))}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </div>
      )}

      {/* ── Loan Detail Slide-over ─────────────────────────────── */}
      {selectedLoan && (
        <LoanDetail
          loan={selectedLoan}
          repayments={loanRepayments.filter(r => r.loanId === selectedLoan.id)}
          onClose={() => setSelectedLoanId(null)}
          onRecordPayment={(repId, amt, date, mode, ref) => {
            recordPayment(repId, amt, date, mode, ref);
            toast({ title: "Payment recorded", variant: "success" });
          }}
        />
      )}

      {/* ── Add Loan Modal ─────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[560px] max-h-[92vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg mb-1" style={{ color: "#0F172A" }}>Record New Loan</h3>
            <p className="text-xs mb-5" style={{ color: "#475569" }}>Repayment schedule will be auto-generated</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Lender Name *</label>
                  <input value={form.lenderName} onChange={e => setForm(p => ({ ...p, lenderName: e.target.value }))}
                    placeholder="Full name of lender" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Lender Type</label>
                  <select value={form.lenderType} onChange={e => setForm(p => ({ ...p, lenderType: e.target.value as LenderType }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    {LENDER_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Position / Relationship</label>
                  <input value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))}
                    placeholder="e.g. Managing Trustee" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Contact number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Loan Amount (₹) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="500000" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Date Received *</label>
                  <input type="date" value={form.dateReceived} onChange={e => setForm(p => ({ ...p, dateReceived: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Tenure (months) *</label>
                  <input type="number" value={form.tenureMonths} onChange={e => setForm(p => ({ ...p, tenureMonths: e.target.value }))}
                    placeholder="12" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Interest Rate (% p.a.)</label>
                  <input type="number" value={form.interestRate} onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))}
                    placeholder="0" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                  <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Enter 0 for interest-free loan</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Repayment Start Date *</label>
                  <input type="date" value={form.repaymentStartDate} onChange={e => setForm(p => ({ ...p, repaymentStartDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Purpose *</label>
                  <input value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
                    placeholder="Reason for borrowing" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2} placeholder="Any additional notes..." className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              {/* Preview */}
              {form.amount && form.tenureMonths && (
                <div className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#f8fafc" }}>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#475569" }}>Schedule Preview</div>
                  <div className="flex gap-6 text-sm">
                    <div><span style={{ color: "#94a3b8" }}>Monthly installment: </span><span className="font-semibold" style={{ color: "#0F172A" }}>{formatINR(Math.floor(parseFloat(form.amount) / parseInt(form.tenureMonths)))}</span></div>
                    <div><span style={{ color: "#94a3b8" }}>Total installments: </span><span className="font-semibold" style={{ color: "#0F172A" }}>{form.tenureMonths}</span></div>
                    {parseFloat(form.interestRate) > 0 && (
                      <div><span style={{ color: "#94a3b8" }}>Monthly interest: </span><span className="font-semibold" style={{ color: "#D97706" }}>{formatINR(Math.round(parseFloat(form.amount) * parseFloat(form.interestRate) / 100 / 12))}</span></div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E2E8F0", color: "#475569" }}>Cancel</button>
              <button onClick={handleAddLoan}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: "#0F766E" }}>
                Record Loan &amp; Generate Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
