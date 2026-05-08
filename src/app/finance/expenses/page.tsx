"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Plus, Building2, CheckCircle, XCircle, Clock, Banknote } from "lucide-react";
import type { Expense, ExpenseStatus } from "@/lib/types";

type TabType = "vendors" | "expenses" | "pending";

const CATEGORIES = ["Mess / Catering", "Lab Supplies", "Stationery", "Clinical Posting", "Telecommunications", "Electricity", "Pharmacy / Medical", "Printing", "Security", "Maintenance", "Other"];

export default function ExpensesPage() {
  const { vendors, expenses, addVendor, addExpense, updateExpenseStatus, role } = useNIMSStore();
  const { toast } = useToast();

  const [tab, setTab] = useState<TabType>("expenses");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "all">("all");

  // Vendor form state
  const [vForm, setVForm] = useState({ name: "", gstin: "", address: "", contact: "", email: "", category: CATEGORIES[0], paymentTerms: "Net 30" });

  // Expense form state
  const [eForm, setEForm] = useState({
    vendorId: vendors[0]?.id || "",
    category: CATEGORIES[0],
    amount: "",
    invoiceNumber: "",
    invoiceFile: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    isIGST: false,
  });

  const gstCalc = useMemo(() => {
    const amount = parseFloat(eForm.amount) || 0;
    if (eForm.isIGST) {
      return { cgst: 0, sgst: 0, igst: Math.round(amount * 0.18) };
    }
    const each = Math.round(amount * 0.09);
    return { cgst: each, sgst: each, igst: 0 };
  }, [eForm.amount, eForm.isIGST]);

  const pendingExpenses = expenses.filter(e => e.status === "Pending");
  const filteredExpenses = useMemo(() =>
    expenses.filter(e => statusFilter === "all" || e.status === statusFilter),
    [expenses, statusFilter]
  );

  const handleAddVendor = () => {
    if (!vForm.name) { toast({ title: "Vendor name required", variant: "destructive" }); return; }
    addVendor({ id: `v${Date.now()}`, ...vForm });
    setShowVendorModal(false);
    setVForm({ name: "", gstin: "", address: "", contact: "", email: "", category: CATEGORIES[0], paymentTerms: "Net 30" });
    toast({ title: "Vendor added", variant: "success" });
  };

  const handleAddExpense = () => {
    const amount = parseFloat(eForm.amount);
    if (isNaN(amount) || amount <= 0) { toast({ title: "Valid amount required", variant: "destructive" }); return; }
    if (!eForm.description) { toast({ title: "Description required", variant: "destructive" }); return; }
    addExpense({
      id: `e${Date.now()}`,
      vendorId: eForm.vendorId,
      category: eForm.category,
      amount,
      cgst: gstCalc.cgst,
      sgst: gstCalc.sgst,
      igst: gstCalc.igst,
      invoiceNumber: eForm.invoiceNumber || `INV/${Date.now()}`,
      invoiceFile: eForm.invoiceFile || undefined,
      date: eForm.date,
      description: eForm.description,
      status: "Pending",
      submittedBy: "Bikash Sharma",
    });
    setShowExpenseModal(false);
    toast({ title: "Expense submitted for approval", variant: "success" });
  };

  const handleApprove = (id: string, studentName?: string) => {
    updateExpenseStatus(id, "Approved", role === "Principal" ? "Dr. Pratima Ghosh" : "Bikash Sharma");
    toast({ title: "Expense approved", variant: "success" });
  };

  const handleReject = (id: string) => {
    updateExpenseStatus(id, "Rejected");
    toast({ title: "Expense rejected", variant: "destructive" });
  };

  const handleMarkPaid = (id: string) => {
    updateExpenseStatus(id, "Paid");
    toast({ title: "Marked as paid", variant: "success" });
  };

  const statusColors: Record<ExpenseStatus, { bg: string; text: string }> = {
    Pending: { bg: "#FFFBEB", text: "#D97706" },
    Approved: { bg: "#F0FDFA", text: "#0F766E" },
    Paid: { bg: "#F0F9FF", text: "#0284c7" },
    Rejected: { bg: "#FFF1F0", text: "#F97066" },
  };

  const tabs = [
    { id: "expenses" as TabType, label: "Expenses", count: expenses.length },
    { id: "vendors" as TabType, label: "Vendors", count: vendors.length },
    ...(role === "Principal" || role === "Accountant" ? [{ id: "pending" as TabType, label: "Pending Approval", count: pendingExpenses.length }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Tabs + actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white rounded-xl border p-1.5" style={{ borderColor: "#E2E8F0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.id ? "text-white" : "hover:bg-gray-50"}`}
              style={tab === t.id ? { backgroundColor: "#0F766E" } : { color: "#475569" }}>
              {t.label}
              {t.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === t.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}
                  style={t.id === "pending" && tab !== t.id ? { backgroundColor: "#FFF1F0", color: "#F97066" } : {}}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {tab === "vendors" && (
            <button onClick={() => setShowVendorModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E" }}>
              <Plus size={15} /> Add Vendor
            </button>
          )}
          {tab === "expenses" && (
            <button onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E" }}>
              <Plus size={15} /> New Expense
            </button>
          )}
        </div>
      </div>

      {/* Vendors tab */}
      {tab === "vendors" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Vendor</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>GSTIN</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Terms</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#F0FDFA" }}>
                        <Building2 size={14} style={{ color: "#0F766E" }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: "#0F172A" }}>{v.name}</div>
                        <div className="text-xs truncate max-w-48" style={{ color: "#475569" }}>{v.address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: "#475569" }}>{v.gstin}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{v.category}</span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#475569" }}>{v.contact}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#475569" }}>{v.paymentTerms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses tab */}
      {tab === "expenses" && (
        <div className="space-y-3">
          {/* Status filter */}
          <div className="flex gap-2">
            {(["all", "Pending", "Approved", "Paid", "Rejected"] as (ExpenseStatus | "all")[]).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={statusFilter === s
                  ? { backgroundColor: s === "all" ? "#0F766E" : statusColors[s as ExpenseStatus]?.bg, color: s === "all" ? "white" : statusColors[s as ExpenseStatus]?.text, borderColor: s === "all" ? "#0F766E" : statusColors[s as ExpenseStatus]?.text }
                  : { backgroundColor: "white", color: "#475569", borderColor: "#E2E8F0" }}>
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Vendor / Description</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Invoice</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Amount</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>GST</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => {
                  const vendor = vendors.find(v => v.id === e.vendorId);
                  const totalGst = e.cgst + e.sgst + e.igst;
                  return (
                    <tr key={e.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                      <td className="px-5 py-3 text-xs" style={{ color: "#475569" }}>{formatDate(e.date)}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-sm" style={{ color: "#0F172A" }}>{vendor?.name || "Unknown"}</div>
                        <div className="text-xs truncate max-w-48" style={{ color: "#475569" }}>{e.description}</div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs" style={{ color: "#475569" }}>{e.invoiceNumber}</td>
                      <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F172A" }}>{formatINR(e.amount)}</td>
                      <td className="px-5 py-3 text-right text-xs" style={{ color: "#475569" }}>
                        {totalGst > 0 ? (
                          e.igst > 0
                            ? <span>IGST {formatINR(e.igst)}</span>
                            : <span>CGST {formatINR(e.cgst)}<br/>SGST {formatINR(e.sgst)}</span>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                          style={{ backgroundColor: statusColors[e.status].bg, color: statusColors[e.status].text }}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {role === "Principal" && e.status === "Pending" && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApprove(e.id)}
                              className="p-1.5 rounded hover:bg-green-50 transition-colors" style={{ color: "#0F766E" }} title="Approve">
                              <CheckCircle size={15} />
                            </button>
                            <button onClick={() => handleReject(e.id)}
                              className="p-1.5 rounded hover:bg-red-50 transition-colors" style={{ color: "#F97066" }} title="Reject">
                              <XCircle size={15} />
                            </button>
                          </div>
                        )}
                        {role === "Accountant" && e.status === "Approved" && (
                          <button onClick={() => handleMarkPaid(e.id)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-blue-50 transition-all"
                            style={{ borderColor: "#0284c7", color: "#0284c7" }}>
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
            <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E2E8F0" }}>
              <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "#0F766E" }} />
              <p className="font-medium" style={{ color: "#0F172A" }}>All caught up!</p>
              <p className="text-sm mt-1" style={{ color: "#475569" }}>No expenses pending approval.</p>
            </div>
          ) : pendingExpenses.map(e => {
            const vendor = vendors.find(v => v.id === e.vendorId);
            const totalGst = e.cgst + e.sgst + e.igst;
            return (
              <div key={e.id} className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#FFFBEB" }}>
                        <Clock size={16} style={{ color: "#D97706" }} />
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: "#0F172A" }}>{vendor?.name}</div>
                        <div className="text-xs" style={{ color: "#475569" }}>{formatDate(e.date)} · {e.category} · {e.invoiceNumber}</div>
                      </div>
                    </div>
                    <p className="text-sm ml-12" style={{ color: "#475569" }}>{e.description}</p>
                    <div className="ml-12 mt-3 flex gap-4 text-sm">
                      <div><span style={{ color: "#475569" }}>Amount: </span><span className="font-semibold" style={{ color: "#0F172A" }}>{formatINR(e.amount)}</span></div>
                      {totalGst > 0 && (
                        <div><span style={{ color: "#475569" }}>GST: </span><span className="font-medium" style={{ color: "#0F172A" }}>{formatINR(totalGst)}</span></div>
                      )}
                      <div><span style={{ color: "#475569" }}>Total: </span><span className="font-bold" style={{ color: "#0F766E" }}>{formatINR(e.amount + totalGst)}</span></div>
                    </div>
                  </div>
                  {role === "Principal" && (
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleApprove(e.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
                        style={{ backgroundColor: "#0F766E" }}>
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button onClick={() => handleReject(e.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-red-50 transition-all"
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
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg mb-4" style={{ color: "#0F172A" }}>Add Vendor</h3>
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
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>{f.label}</label>
                  <input value={(vForm as Record<string, string>)[f.key]} onChange={e => setVForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Category</label>
                <select value={vForm.category} onChange={e => setVForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowVendorModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E2E8F0", color: "#475569" }}>Cancel</button>
              <button onClick={handleAddVendor}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: "#0F766E" }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[520px] max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg mb-4" style={{ color: "#0F172A" }}>New Expense</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Vendor</label>
                <select value={eForm.vendorId} onChange={e => setEForm(p => ({ ...p, vendorId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Category</label>
                <select value={eForm.category} onChange={e => setEForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Description</label>
                <input value={eForm.description} onChange={e => setEForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of expense" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Amount (₹)</label>
                  <input type="number" value={eForm.amount} onChange={e => setEForm(p => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Invoice Number</label>
                  <input value={eForm.invoiceNumber} onChange={e => setEForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                    placeholder="INV/2025/001" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
              {/* GST */}
              <div className="p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#f8fafc" }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium" style={{ color: "#0F172A" }}>GST Calculation</span>
                  <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#475569" }}>
                    <input type="checkbox" checked={eForm.isIGST} onChange={e => setEForm(p => ({ ...p, isIGST: e.target.checked }))}
                      className="rounded accent-teal-600" />
                    Inter-state (IGST 18%)
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {eForm.isIGST ? (
                    <div className="text-center p-2 rounded-lg bg-white border" style={{ borderColor: "#E2E8F0" }}>
                      <div className="text-xs mb-1" style={{ color: "#475569" }}>IGST 18%</div>
                      <div className="font-semibold" style={{ color: "#0F172A" }}>{formatINR(gstCalc.igst)}</div>
                    </div>
                  ) : (
                    <>
                      <div className="text-center p-2 rounded-lg bg-white border" style={{ borderColor: "#E2E8F0" }}>
                        <div className="text-xs mb-1" style={{ color: "#475569" }}>CGST 9%</div>
                        <div className="font-semibold" style={{ color: "#0F172A" }}>{formatINR(gstCalc.cgst)}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white border" style={{ borderColor: "#E2E8F0" }}>
                        <div className="text-xs mb-1" style={{ color: "#475569" }}>SGST 9%</div>
                        <div className="font-semibold" style={{ color: "#0F172A" }}>{formatINR(gstCalc.sgst)}</div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white border" style={{ borderColor: "#E2E8F0" }}>
                        <div className="text-xs mb-1" style={{ color: "#475569" }}>Total GST</div>
                        <div className="font-semibold" style={{ color: "#0F766E" }}>{formatINR(gstCalc.cgst + gstCalc.sgst)}</div>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t" style={{ borderColor: "#E2E8F0" }}>
                  <span className="text-sm font-semibold" style={{ color: "#0F172A" }}>Grand Total</span>
                  <span className="font-bold" style={{ color: "#0F766E" }}>
                    {formatINR((parseFloat(eForm.amount) || 0) + gstCalc.cgst + gstCalc.sgst + gstCalc.igst)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Date</label>
                  <input type="date" value={eForm.date} onChange={e => setEForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Invoice File (mock)</label>
                  <input type="text" value={eForm.invoiceFile} onChange={e => setEForm(p => ({ ...p, invoiceFile: e.target.value }))}
                    placeholder="filename.pdf" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowExpenseModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50" style={{ borderColor: "#E2E8F0", color: "#475569" }}>Cancel</button>
              <button onClick={handleAddExpense}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90" style={{ backgroundColor: "#0F766E" }}>Submit for Approval</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
