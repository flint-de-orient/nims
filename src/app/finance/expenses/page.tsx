"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { CHART_OF_ACCOUNTS, APPROVAL_THRESHOLDS } from "@/lib/chart-of-accounts";
import {
  Plus, Building2, CheckCircle, XCircle, Clock, Banknote,
  ShieldCheck, ShieldAlert, Users, Wallet, ChevronRight,
  Receipt, TrendingUp, AlertCircle, DollarSign,
} from "lucide-react";
import type { Expense, ExpenseStatus } from "@/lib/types";
import VendorLedger from "./VendorLedger";

type TabType = "vendors" | "expenses" | "pending";

export default function ExpensesPage() {
  const { vendors, expenses, addVendor, addExpense, updateExpenseStatus, role } = useNIMSStore();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabType>("expenses");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");

  const [vForm, setVForm] = useState({
    name: "", gstin: "", address: "", contact: "", email: "",
    category: "Supplier", paymentTerms: "Net 30",
    accountHeads: [] as string[],
  });

  const [eForm, setEForm] = useState({
    vendorId: "",
    isDirectPayment: false,
    accountBranch: "",
    accountSubHead: "",
    accountLeaf: "",
    amount: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    isIGST: false,
  });

  const selectedBranch = useMemo(
    () => CHART_OF_ACCOUNTS.find(b => b.name === eForm.accountBranch),
    [eForm.accountBranch]
  );
  const selectedSubHead = useMemo(
    () => selectedBranch?.subHeads.find(s => s.name === eForm.accountSubHead),
    [selectedBranch, eForm.accountSubHead]
  );

  const filteredVendors = useMemo(() => {
    if (!eForm.accountSubHead) return [];
    return vendors.filter(v => v.accountHeads.includes(eForm.accountSubHead));
  }, [vendors, eForm.accountSubHead]);

  const autoDirectPayment = eForm.accountSubHead !== "" && filteredVendors.length === 0;
  const effectiveDirectPayment = autoDirectPayment || eForm.isDirectPayment;

  const gstCalc = useMemo(() => {
    const amount = parseFloat(eForm.amount) || 0;
    if (eForm.isIGST) return { cgst: 0, sgst: 0, igst: Math.round(amount * 0.18) };
    const each = Math.round(amount * 0.09);
    return { cgst: each, sgst: each, igst: 0 };
  }, [eForm.amount, eForm.isIGST]);

  const approvalLevel = useMemo(() => {
    const amt = parseFloat(eForm.amount) || 0;
    if (amt <= 0) return null;
    if (amt < APPROVAL_THRESHOLDS.auto) return "auto";
    if (amt <= APPROVAL_THRESHOLDS.principal) return "principal";
    return "committee";
  }, [eForm.amount]);

  const pendingExpenses = expenses.filter(e => e.status === "Pending");
  const filteredExpenses = useMemo(() =>
    expenses.filter(e =>
      (statusFilter === "all" || e.status === statusFilter) &&
      (branchFilter === "all" || e.accountBranch === branchFilter)
    ),
    [expenses, statusFilter, branchFilter]
  );

  const kpi = useMemo(() => ({
    total: expenses.reduce((s, e) => s + e.amount, 0),
    paid: expenses.filter(e => e.status === "Paid").reduce((s, e) => s + e.amount, 0),
    pending: expenses.filter(e => e.status === "Pending").reduce((s, e) => s + e.amount, 0),
    approved: expenses.filter(e => e.status === "Approved").reduce((s, e) => s + e.amount, 0),
  }), [expenses]);

  const toggleAccountHead = (name: string) => {
    setVForm(p => ({
      ...p,
      accountHeads: p.accountHeads.includes(name)
        ? p.accountHeads.filter(h => h !== name)
        : [...p.accountHeads, name],
    }));
  };

  const handleAddVendor = () => {
    if (!vForm.name) { toast({ title: "Vendor name required", variant: "destructive" }); return; }
    addVendor({ id: `v${Date.now()}`, ...vForm });
    setShowVendorModal(false);
    setVForm({ name: "", gstin: "", address: "", contact: "", email: "", category: "Supplier", paymentTerms: "Net 30", accountHeads: [] });
    toast({ title: "Vendor added", variant: "success" });
  };

  const handleAddExpense = () => {
    const amount = parseFloat(eForm.amount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Valid amount required", variant: "destructive" }); return; }
    if (!eForm.accountBranch || !eForm.accountSubHead) { toast({ title: "Select account head", variant: "destructive" }); return; }
    if (!effectiveDirectPayment && !eForm.vendorId) { toast({ title: "Select a vendor or switch to Direct Payment", variant: "destructive" }); return; }
    if (!eForm.description) { toast({ title: "Description required", variant: "destructive" }); return; }

    const autoApprove = amount < APPROVAL_THRESHOLDS.auto;
    addExpense({
      id: `e${Date.now()}`,
      ...(effectiveDirectPayment
        ? { isDirectPayment: true }
        : { vendorId: eForm.vendorId }),
      category: eForm.accountSubHead,
      accountBranch: eForm.accountBranch,
      accountSubHead: eForm.accountSubHead,
      accountLeaf: eForm.accountLeaf || undefined,
      amount,
      cgst: gstCalc.cgst,
      sgst: gstCalc.sgst,
      igst: gstCalc.igst,
      invoiceNumber: eForm.invoiceNumber || `INV/${Date.now()}`,
      date: eForm.date,
      description: eForm.description,
      status: autoApprove ? "Approved" : "Pending",
      submittedBy: "Bikash Sharma",
      ...(autoApprove ? { approvedBy: "Auto-approved (< ₹5,000)" } : {}),
    });
    setShowExpenseModal(false);
    setEForm(p => ({ ...p, accountBranch: "", accountSubHead: "", accountLeaf: "", amount: "", invoiceNumber: "", description: "", isDirectPayment: false, vendorId: "" }));
    toast({
      title: autoApprove ? "Expense posted (auto-approved)" : "Submitted for approval",
      description: autoApprove ? `${eForm.accountBranch} / ${eForm.accountSubHead}` : "Pending Principal approval",
      variant: autoApprove ? "success" : "default",
    });
  };

  const handleApprove = (id: string) => { updateExpenseStatus(id, "Approved", "Dr. Pratima Ghosh"); toast({ title: "Expense approved", variant: "success" }); };
  const handleReject  = (id: string) => { updateExpenseStatus(id, "Rejected"); toast({ title: "Expense rejected", variant: "destructive" }); };
  const handleMarkPaid= (id: string) => { updateExpenseStatus(id, "Paid"); toast({ title: "Marked as paid", variant: "success" }); };

  const STATUS_STYLE: Record<ExpenseStatus, { bg: string; text: string; dot: string }> = {
    Pending:  { bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
    Approved: { bg: "#F0FDFA", text: "#0F766E", dot: "#14B8A6" },
    Paid:     { bg: "#F0F9FF", text: "#0369A1", dot: "#0EA5E9" },
    Rejected: { bg: "#FFF1F0", text: "#E11D48", dot: "#F97066" },
  };

  const BRANCH_COLORS: Record<string, string> = {
    "College Expense": "#0F766E",
    "Infrastructure":  "#7C3AED",
    "Hostel Expense":  "#D97706",
  };

  const tabs = [
    { id: "expenses" as TabType, label: "All Expenses", count: expenses.length },
    { id: "vendors"  as TabType, label: "Vendors",      count: vendors.length },
    ...(role === "Principal" || role === "Accountant"
      ? [{ id: "pending" as TabType, label: "Pending Approval", count: pendingExpenses.length }]
      : []),
  ];

  return (
    <div className="space-y-5">

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Expenses", value: kpi.total, Icon: DollarSign, gradient: "linear-gradient(135deg, #0B3D3A 0%, #0F766E 100%)", shadow: "rgba(11,61,58,0.40)" },
          { label: "Paid",           value: kpi.paid,  Icon: CheckCircle, gradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)", shadow: "rgba(3,105,161,0.30)" },
          { label: "Approved",       value: kpi.approved, Icon: TrendingUp, gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", shadow: "rgba(15,118,110,0.35)" },
          { label: "Pending Approval", value: kpi.pending, Icon: AlertCircle, gradient: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)", shadow: "rgba(180,83,9,0.30)" },
        ].map(({ label, value, Icon, gradient, shadow }) => (
          <div key={label} className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: gradient, boxShadow: `0 8px 24px ${shadow}` }}>
            <Icon size={64} className="absolute -right-3 -bottom-3 opacity-10" />
            <div className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-3">{label}</div>
            <div className="text-3xl font-bold tracking-tight">{formatINR(value)}</div>
            <div className="text-white/60 text-xs mt-2">{expenses.filter(e => e.status === (label === "Paid" ? "Paid" : label === "Approved" ? "Approved" : label === "Pending Approval" ? "Pending" : undefined) || label === "Total Expenses").length} records</div>
          </div>
        ))}
      </div>

      {/* Tabs + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div
          className="flex gap-1 rounded-2xl border p-1.5"
          style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
              style={tab === t.id
                ? { backgroundColor: "#0F766E", color: "#fff" }
                : { color: "#64748B" }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={tab === t.id
                    ? { backgroundColor: "rgba(255,255,255,0.25)", color: "#fff" }
                    : t.id === "pending" && t.count > 0
                    ? { backgroundColor: "#FFF1F0", color: "#F97066" }
                    : { backgroundColor: "#F1F5F9", color: "#64748B" }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === "vendors" && (
            <button
              onClick={() => setShowVendorModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.35)" }}
            >
              <Plus size={15} /> Add Vendor
            </button>
          )}
          {tab === "expenses" && (
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.35)" }}
            >
              <Plus size={15} /> New Expense
            </button>
          )}
        </div>
      </div>

      {/* Vendors tab */}
      {tab === "vendors" && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Vendor</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>GSTIN</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Category</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Linked Account Heads</th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Terms</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((v, idx) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVendorId(v.id)}
                  className="cursor-pointer transition-colors group"
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFBFC",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F0FDFA")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#FFFFFF" : "#FAFBFC")}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#F0FDFA", boxShadow: "0 1px 4px rgba(15,118,110,0.15)" }}
                      >
                        <Building2 size={16} style={{ color: "#0F766E" }} />
                      </div>
                      <div>
                        <div className="font-semibold text-[15px] group-hover:text-teal-700 transition-colors" style={{ color: "#0F172A" }}>{v.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{v.contact}</div>
                      </div>
                      <ChevronRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-all" style={{ color: "#0F766E" }} />
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm" style={{ color: "#64748B" }}>{v.gstin}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#F1F5F9", color: "#64748B" }}>{v.category}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(v.accountHeads ?? []).slice(0, 3).map(h => (
                        <span key={h} className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>{h}</span>
                      ))}
                      {(v.accountHeads ?? []).length > 3 && (
                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: "#F1F5F9", color: "#94A3B8" }}>+{(v.accountHeads ?? []).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: "#64748B" }}>{v.paymentTerms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses tab */}
      {tab === "expenses" && (
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            {(["all", "Pending", "Approved", "Paid", "Rejected"] as (ExpenseStatus | "all")[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={statusFilter === s
                  ? { backgroundColor: s === "all" ? "#0F766E" : STATUS_STYLE[s as ExpenseStatus]?.bg, color: s === "all" ? "white" : STATUS_STYLE[s as ExpenseStatus]?.text, borderColor: s === "all" ? "#0F766E" : STATUS_STYLE[s as ExpenseStatus]?.text }
                  : { backgroundColor: "white", color: "#64748B", borderColor: "#E2E8F0" }}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-200 mx-1" />
            {["all", "College Expense", "Infrastructure", "Hostel Expense"].map(b => (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold border transition-all"
                style={branchFilter === b
                  ? { backgroundColor: b === "all" ? "#0F172A" : BRANCH_COLORS[b], color: "white", borderColor: b === "all" ? "#0F172A" : BRANCH_COLORS[b] }
                  : { backgroundColor: "white", color: "#64748B", borderColor: "#E2E8F0" }}
              >
                {b === "all" ? "All Branches" : b}
              </button>
            ))}
          </div>

          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Date</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Account Head</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Vendor / Description</th>
                  <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Invoice</th>
                  <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Amount</th>
                  <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((e, idx) => {
                  const vendor = vendors.find(v => v.id === e.vendorId);
                  const isDirect = e.isDirectPayment || (!e.vendorId);
                  const branchColor = e.accountBranch ? BRANCH_COLORS[e.accountBranch] : "#94a3b8";
                  const ss = STATUS_STYLE[e.status];
                  return (
                    <tr
                      key={e.id}
                      className="transition-colors"
                      style={{
                        borderBottom: "1px solid #F1F5F9",
                        backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFBFC",
                      }}
                      onMouseEnter={ev => (ev.currentTarget.style.backgroundColor = "#F8FAFC")}
                      onMouseLeave={ev => (ev.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#FFFFFF" : "#FAFBFC")}
                    >
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: "#64748B" }}>{formatDate(e.date)}</td>
                      <td className="px-4 py-4">
                        {e.accountBranch ? (
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: branchColor }} />
                              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: branchColor }}>{e.accountBranch}</span>
                            </div>
                            <div className="text-sm" style={{ color: "#475569" }}>
                              {e.accountSubHead}{e.accountLeaf ? ` / ${e.accountLeaf}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm" style={{ color: "#94A3B8" }}>{e.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isDirect ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold" style={{ backgroundColor: "#F0F9FF", color: "#0369A1" }}>
                              <Wallet size={10} /> Direct Payment
                            </span>
                            <div className="text-sm truncate max-w-48 mt-1" style={{ color: "#64748B" }}>{e.description}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>{vendor?.name || "—"}</div>
                            <div className="text-sm truncate max-w-48" style={{ color: "#64748B" }}>{e.description}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-mono text-sm" style={{ color: "#64748B" }}>{e.invoiceNumber}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-bold text-[15px]" style={{ color: "#0F172A" }}>{formatINR(e.amount)}</div>
                        {(e.cgst + e.sgst + e.igst) > 0 && (
                          <div className="text-xs" style={{ color: "#94A3B8" }}>+{formatINR(e.cgst + e.sgst + e.igst)} GST</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold"
                          style={{ backgroundColor: ss.bg, color: ss.text }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ss.dot }} />
                          {e.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {role === "Principal" && e.status === "Pending" && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(e.id)}
                              className="p-2 rounded-lg hover:bg-green-50 transition-colors" style={{ color: "#0F766E" }} title="Approve">
                              <CheckCircle size={16} />
                            </button>
                            <button onClick={() => handleReject(e.id)}
                              className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#F97066" }} title="Reject">
                              <XCircle size={16} />
                            </button>
                          </div>
                        )}
                        {role === "Accountant" && e.status === "Approved" && (
                          <button onClick={() => handleMarkPaid(e.id)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all hover:bg-blue-50"
                            style={{ borderColor: "#0369A1", color: "#0369A1" }}>
                            <Banknote size={12} /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Approval tab */}
      {tab === "pending" && (
        <div className="space-y-3">
          {pendingExpenses.length === 0 ? (
            <div
              className="rounded-2xl border p-16 text-center"
              style={{ backgroundColor: "#fff", borderColor: "#E2E8F0" }}
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0FDFA" }}>
                <CheckCircle size={32} style={{ color: "#0F766E" }} />
              </div>
              <p className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>All caught up!</p>
              <p className="text-base mt-2" style={{ color: "#64748B" }}>No expenses pending approval.</p>
            </div>
          ) : pendingExpenses.map(e => {
            const vendor = vendors.find(v => v.id === e.vendorId);
            const isDirect = e.isDirectPayment || (!e.vendorId);
            const branchColor = e.accountBranch ? BRANCH_COLORS[e.accountBranch] : "#94a3b8";
            const needsCommittee = e.amount > APPROVAL_THRESHOLDS.principal;
            return (
              <div
                key={e.id}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#FFFBEB" }}>
                        <Clock size={18} style={{ color: "#B45309" }} />
                      </div>
                      <div>
                        {isDirect ? (
                          <div className="inline-flex items-center gap-2 font-bold text-base" style={{ color: "#0369A1" }}>
                            <Wallet size={15} /> Direct Payment
                          </div>
                        ) : (
                          <div className="font-bold text-base" style={{ color: "#0F172A" }}>{vendor?.name || "—"}</div>
                        )}
                        <div className="text-sm" style={{ color: "#64748B" }}>{formatDate(e.date)} · {e.invoiceNumber}</div>
                      </div>
                      {needsCommittee && (
                        <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-semibold"
                          style={{ backgroundColor: "#FFF1F0", color: "#E11D48" }}>
                          <Users size={11} /> Committee Required
                        </span>
                      )}
                    </div>
                    {e.accountBranch && (
                      <div className="ml-14 mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: branchColor }} />
                        <span className="text-sm font-bold" style={{ color: branchColor }}>{e.accountBranch}</span>
                        <span className="text-sm" style={{ color: "#64748B" }}>/ {e.accountSubHead}{e.accountLeaf ? ` / ${e.accountLeaf}` : ""}</span>
                      </div>
                    )}
                    <p className="text-base ml-14" style={{ color: "#475569" }}>{e.description}</p>
                    <div className="ml-14 mt-4 flex gap-6 text-base flex-wrap">
                      <div><span style={{ color: "#94A3B8" }}>Amount </span><span className="font-bold" style={{ color: "#0F172A" }}>{formatINR(e.amount)}</span></div>
                      {(e.cgst + e.sgst + e.igst) > 0 && (
                        <div><span style={{ color: "#94A3B8" }}>GST </span><span className="font-semibold">{formatINR(e.cgst + e.sgst + e.igst)}</span></div>
                      )}
                      <div><span style={{ color: "#94A3B8" }}>Total </span><span className="font-bold text-lg" style={{ color: "#0F766E" }}>{formatINR(e.amount + e.cgst + e.sgst + e.igst)}</span></div>
                    </div>
                  </div>
                  {role === "Principal" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleApprove(e.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                        style={{ backgroundColor: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.30)" }}>
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button onClick={() => handleReject(e.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-semibold hover:bg-red-50 transition-all"
                        style={{ borderColor: "#F97066", color: "#F97066" }}>
                        <XCircle size={15} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-2xl p-6 w-[520px] max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: "#fff" }}
          >
            <h3 className="font-serif font-bold text-xl mb-1" style={{ color: "#0F172A" }}>Add Vendor</h3>
            <p className="text-sm mb-5" style={{ color: "#64748B" }}>Register a new vendor with account head mapping</p>
            <div className="space-y-4">
              {[
                { label: "Vendor Name *", key: "name", placeholder: "e.g. ABC Suppliers" },
                { label: "GSTIN", key: "gstin", placeholder: "19AAAAA0000A1Z5" },
                { label: "Address", key: "address", placeholder: "Full address" },
                { label: "Contact", key: "contact", placeholder: "Phone number" },
                { label: "Email", key: "email", placeholder: "vendor@example.com" },
                { label: "Payment Terms", key: "paymentTerms", placeholder: "Net 30" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>{f.label}</label>
                  <input
                    value={(vForm as unknown as Record<string, string>)[f.key]}
                    onChange={e => setVForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#0F172A" }}>
                  Linked Account Heads
                  {vForm.accountHeads.length > 0 && (
                    <span className="ml-2 text-xs font-normal px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>
                      {vForm.accountHeads.length} selected
                    </span>
                  )}
                </label>
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                  {CHART_OF_ACCOUNTS.map(branch => (
                    <div key={branch.id}>
                      <div className="px-3 py-2 text-xs font-bold uppercase tracking-widest"
                        style={{ backgroundColor: branch.color + "18", color: branch.color }}>
                        {branch.name}
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 px-3 py-2">
                        {branch.subHeads.map(sh => (
                          <label key={sh.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                            <input type="checkbox"
                              checked={vForm.accountHeads.includes(sh.name)}
                              onChange={() => toggleAccountHead(sh.name)}
                              className="rounded accent-teal-600 flex-shrink-0" />
                            <span className="text-sm group-hover:text-teal-700 transition-colors" style={{ color: "#475569" }}>{sh.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowVendorModal(false)}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
              <button onClick={handleAddVendor}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "#0F766E" }}>Add Vendor</button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Ledger slide-over */}
      {selectedVendorId && (() => {
        const v = vendors.find(x => x.id === selectedVendorId);
        return v ? <VendorLedger vendor={v} expenses={expenses} onClose={() => setSelectedVendorId(null)} /> : null;
      })()}

      {/* New Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div
            className="rounded-2xl shadow-2xl p-6 w-[560px] max-h-[92vh] overflow-y-auto"
            style={{ backgroundColor: "#fff" }}
          >
            <h3 className="font-serif font-bold text-xl mb-1" style={{ color: "#0F172A" }}>New Expense</h3>
            <p className="text-sm mb-5" style={{ color: "#64748B" }}>Post against Noujan&apos;s chart of accounts</p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>Account Head</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#0F172A" }}>Branch</label>
                    <select value={eForm.accountBranch}
                      onChange={e => setEForm(p => ({ ...p, accountBranch: e.target.value, accountSubHead: "", accountLeaf: "", isDirectPayment: false, vendorId: "" }))}
                      className="w-full px-2.5 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                      <option value="">— Select —</option>
                      {CHART_OF_ACCOUNTS.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#0F172A" }}>Sub-head</label>
                    <select value={eForm.accountSubHead}
                      onChange={e => {
                        const subHead = e.target.value;
                        const matched = vendors.filter(v => v.accountHeads.includes(subHead));
                        setEForm(p => ({ ...p, accountSubHead: subHead, accountLeaf: "", isDirectPayment: false, vendorId: matched[0]?.id || "" }));
                      }}
                      disabled={!selectedBranch}
                      className="w-full px-2.5 py-2 rounded-lg border text-sm outline-none bg-white disabled:opacity-50" style={{ borderColor: "#E2E8F0" }}>
                      <option value="">— Select —</option>
                      {selectedBranch?.subHeads.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#0F172A" }}>Ledger Account</label>
                    <select value={eForm.accountLeaf}
                      onChange={e => setEForm(p => ({ ...p, accountLeaf: e.target.value }))}
                      disabled={!selectedSubHead || !selectedSubHead.leaves}
                      className="w-full px-2.5 py-2 rounded-lg border text-sm outline-none bg-white disabled:opacity-50" style={{ borderColor: "#E2E8F0" }}>
                      <option value="">{!selectedSubHead?.leaves ? "— Leaf —" : "— Select —"}</option>
                      {selectedSubHead?.leaves?.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                {eForm.accountBranch && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedBranch?.color || "#94a3b8" }} />
                    <span className="text-xs font-bold" style={{ color: selectedBranch?.color || "#94a3b8" }}>{eForm.accountBranch}</span>
                    {eForm.accountSubHead && <><span className="text-xs text-gray-400">/</span><span className="text-xs font-medium" style={{ color: "#475569" }}>{eForm.accountSubHead}</span></>}
                    {eForm.accountLeaf && <><span className="text-xs text-gray-400">/</span><span className="text-xs" style={{ color: "#475569" }}>{eForm.accountLeaf}</span></>}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Vendor</label>
                  {!eForm.accountSubHead ? (
                    <div className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-gray-50" style={{ borderColor: "#E2E8F0", color: "#94A3B8" }}>
                      Select account head first
                    </div>
                  ) : effectiveDirectPayment ? (
                    <div className="p-3 rounded-xl border"
                      style={{ borderColor: autoDirectPayment ? "#E2E8F0" : "#0369A1", backgroundColor: autoDirectPayment ? "#F8FAFC" : "#F0F9FF" }}>
                      <div className="flex items-center gap-2">
                        <Wallet size={14} style={{ color: autoDirectPayment ? "#64748b" : "#0369A1" }} />
                        <span className="text-sm font-semibold" style={{ color: autoDirectPayment ? "#64748B" : "#0369A1" }}>Direct Payment</span>
                      </div>
                      {autoDirectPayment ? (
                        <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>No vendor registered for this head</p>
                      ) : (
                        <button className="text-xs mt-1 underline hover:no-underline" style={{ color: "#0369A1" }}
                          onClick={() => setEForm(p => ({ ...p, isDirectPayment: false, vendorId: filteredVendors[0]?.id || "" }))}>
                          Use vendor instead
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <select value={eForm.vendorId} onChange={e => setEForm(p => ({ ...p, vendorId: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                        <option value="">— Select vendor —</option>
                        {filteredVendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      <button className="flex items-center gap-1 text-xs mt-1.5 hover:underline" style={{ color: "#94A3B8" }}
                        onClick={() => setEForm(p => ({ ...p, isDirectPayment: true, vendorId: "" }))}>
                        <Wallet size={10} /> Switch to Direct Payment
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Date</label>
                  <input type="date" value={eForm.date} onChange={e => setEForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Description</label>
                <input value={eForm.description} onChange={e => setEForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of the expense"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Amount (₹)</label>
                  <input type="number" value={eForm.amount} onChange={e => setEForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0" className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Invoice Number</label>
                  <input value={eForm.invoiceNumber} onChange={e => setEForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                    placeholder="INV/2025/001" className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              {approvalLevel && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: approvalLevel === "auto" ? "#F0FDFA" : approvalLevel === "principal" ? "#FFFBEB" : "#FFF1F0",
                    borderColor: approvalLevel === "auto" ? "#0F766E" : approvalLevel === "principal" ? "#D97706" : "#F97066",
                  }}>
                  {approvalLevel === "auto" && <ShieldCheck size={18} style={{ color: "#0F766E" }} />}
                  {approvalLevel === "principal" && <ShieldAlert size={18} style={{ color: "#D97706" }} />}
                  {approvalLevel === "committee" && <Users size={18} style={{ color: "#F97066" }} />}
                  <div className="text-sm font-semibold"
                    style={{ color: approvalLevel === "auto" ? "#0F766E" : approvalLevel === "principal" ? "#D97706" : "#F97066" }}>
                    {approvalLevel === "auto" && "Auto-approved — below ₹5,000"}
                    {approvalLevel === "principal" && "Principal approval required — ₹5,000–₹25,000"}
                    {approvalLevel === "committee" && "Principal + Committee approval — above ₹25,000"}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>GST</span>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                    <input type="checkbox" checked={eForm.isIGST} onChange={e => setEForm(p => ({ ...p, isIGST: e.target.checked }))} className="rounded accent-teal-600" />
                    Inter-state (IGST 18%)
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {eForm.isIGST ? (
                    <div className="text-center p-2.5 rounded-xl bg-white border" style={{ borderColor: "#E2E8F0" }}>
                      <div className="text-xs mb-1" style={{ color: "#64748B" }}>IGST 18%</div>
                      <div className="font-bold text-base" style={{ color: "#0F172A" }}>{formatINR(gstCalc.igst)}</div>
                    </div>
                  ) : (
                    <>
                      {[{ label: "CGST 9%", val: gstCalc.cgst }, { label: "SGST 9%", val: gstCalc.sgst }, { label: "Total GST", val: gstCalc.cgst + gstCalc.sgst }].map(({ label, val }) => (
                        <div key={label} className="text-center p-2.5 rounded-xl bg-white border" style={{ borderColor: "#E2E8F0" }}>
                          <div className="text-xs mb-1" style={{ color: "#64748B" }}>{label}</div>
                          <div className="font-bold text-base" style={{ color: label === "Total GST" ? "#0F766E" : "#0F172A" }}>{formatINR(val)}</div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: "#E2E8F0" }}>
                  <span className="font-semibold" style={{ color: "#0F172A" }}>Grand Total</span>
                  <span className="font-bold text-xl" style={{ color: "#0F766E" }}>
                    {formatINR((parseFloat(eForm.amount) || 0) + gstCalc.cgst + gstCalc.sgst + gstCalc.igst)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
              <button onClick={handleAddExpense}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "#0F766E" }}>
                {approvalLevel === "auto" ? "Post Expense" : "Submit for Approval"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
