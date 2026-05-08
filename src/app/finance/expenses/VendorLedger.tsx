"use client";
import { useMemo } from "react";
import type { Vendor, Expense } from "@/lib/types";
import { formatINR, formatDate } from "@/lib/utils";
import { X, FileText, FileSpreadsheet, IndianRupee, CheckCircle, Clock, Banknote } from "lucide-react";

interface Props {
  vendor: Vendor;
  expenses: Expense[];
  onClose: () => void;
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  Pending:  { bg: "#FFFBEB", text: "#D97706" },
  Approved: { bg: "#F0FDFA", text: "#0F766E" },
  Paid:     { bg: "#F0F9FF", text: "#0284c7" },
  Rejected: { bg: "#FFF1F0", text: "#F97066" },
};

const BRANCH_COLORS: Record<string, string> = {
  "College Expense": "#0F766E",
  "Infrastructure":  "#7C3AED",
  "Hostel Expense":  "#D97706",
};

export default function VendorLedger({ vendor, expenses, onClose }: Props) {
  const ledger = useMemo(() =>
    expenses
      .filter(e => e.vendorId === vendor.id)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, vendor.id]
  );

  const summary = useMemo(() => {
    const active = ledger.filter(e => e.status !== "Rejected");
    const totalBilled = active.reduce((s, e) => s + e.amount + e.cgst + e.sgst + e.igst, 0);
    const paid       = active.filter(e => e.status === "Paid")
                             .reduce((s, e) => s + e.amount + e.cgst + e.sgst + e.igst, 0);
    const pending    = active.filter(e => e.status === "Pending" || e.status === "Approved")
                             .reduce((s, e) => s + e.amount + e.cgst + e.sgst + e.igst, 0);
    return { totalBilled, paid, pending };
  }, [ledger]);

  /* ── CSV download ─────────────────────────────────────────────── */
  const handleCSV = () => {
    const header = ["Date", "Invoice #", "Branch", "Sub-head", "Ledger Account", "Description", "Base (₹)", "GST (₹)", "Total (₹)", "Status"];
    const rows = ledger.map(e => [
      e.date,
      e.invoiceNumber,
      e.accountBranch ?? "",
      e.accountSubHead ?? "",
      e.accountLeaf ?? "",
      `"${e.description.replace(/"/g, '""')}"`,
      e.amount,
      e.cgst + e.sgst + e.igst,
      e.amount + e.cgst + e.sgst + e.igst,
      e.status,
    ]);
    const csv = [header, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `vendor-ledger-${vendor.name.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── PDF (new window → print) ─────────────────────────────────── */
  const handlePDF = () => {
    const rows = ledger.map(e => `
      <tr>
        <td>${formatDate(e.date)}</td>
        <td>${e.invoiceNumber}</td>
        <td>
          <span style="color:${BRANCH_COLORS[e.accountBranch ?? ""] ?? "#64748b"};font-weight:600">${e.accountBranch ?? ""}</span>
          ${e.accountSubHead ? `<br><span style="color:#64748b;font-size:11px">${e.accountSubHead}${e.accountLeaf ? " / " + e.accountLeaf : ""}</span>` : ""}
        </td>
        <td>${e.description}</td>
        <td style="text-align:right">${formatINR(e.amount)}</td>
        <td style="text-align:right;color:#64748b">${(e.cgst + e.sgst + e.igst) > 0 ? formatINR(e.cgst + e.sgst + e.igst) : "—"}</td>
        <td style="text-align:right;font-weight:600">${formatINR(e.amount + e.cgst + e.sgst + e.igst)}</td>
        <td style="text-align:center">
          <span style="background:${STATUS_STYLE[e.status]?.bg};color:${STATUS_STYLE[e.status]?.text};padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600">${e.status}</span>
        </td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Vendor Ledger – ${vendor.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #1e293b; padding: 32px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; padding: 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
    .info-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .info-value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .summary { display: flex; gap: 16px; margin-bottom: 20px; }
    .summary-card { flex: 1; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .summary-card .label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; }
    .summary-card .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #0f766e; color: white; }
    th { padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
    td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tbody tr:hover { background: #f8fafc; }
    tfoot td { background: #f8fafc; font-weight: 700; border-top: 2px solid #e2e8f0; }
    @media print {
      body { padding: 16px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${vendor.name}</h1>
  <div class="sub">${vendor.category} · GSTIN: ${vendor.gstin}</div>

  <div class="info-grid">
    <div><div class="info-label">Address</div><div class="info-value" style="font-weight:400;font-size:12px">${vendor.address}</div></div>
    <div><div class="info-label">Contact</div><div class="info-value">${vendor.contact}</div></div>
    <div><div class="info-label">Payment Terms</div><div class="info-value">${vendor.paymentTerms}</div></div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Invoiced</div>
      <div class="value" style="color:#0f172a">${formatINR(summary.totalBilled)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Paid</div>
      <div class="value" style="color:#0284c7">${formatINR(summary.paid)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Outstanding</div>
      <div class="value" style="color:${summary.pending > 0 ? "#D97706" : "#0F766E"}">${formatINR(summary.pending)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th><th>Invoice #</th><th>Account Head</th><th>Description</th>
        <th style="text-align:right">Base</th><th style="text-align:right">GST</th>
        <th style="text-align:right">Total</th><th style="text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">Grand Total (${ledger.length} transaction${ledger.length !== 1 ? "s" : ""})</td>
        <td style="text-align:right">${formatINR(ledger.reduce((s, e) => s + e.amount, 0))}</td>
        <td style="text-align:right">${formatINR(ledger.reduce((s, e) => s + e.cgst + e.sgst + e.igst, 0))}</td>
        <td style="text-align:right">${formatINR(summary.totalBilled)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top:32px;color:#94a3b8;font-size:10px;text-align:right">
    Generated by NIMS · ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
  </div>
</body>
</html>`;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
  };

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-[640px] max-w-full bg-white flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif font-bold text-xl truncate" style={{ color: "#0F172A" }}>{vendor.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{vendor.category}</span>
              </div>
              <p className="text-xs" style={{ color: "#64748b" }}>
                GSTIN: <span className="font-mono">{vendor.gstin}</span> · {vendor.address}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0" style={{ color: "#64748b" }}>
              <X size={18} />
            </button>
          </div>

          {/* Download buttons */}
          <div className="flex gap-2 mt-4">
            <button onClick={handlePDF}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium hover:bg-red-50 transition-colors"
              style={{ borderColor: "#fca5a5", color: "#dc2626" }}>
              <FileText size={14} /> Download PDF
            </button>
            <button onClick={handleCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-medium hover:bg-green-50 transition-colors"
              style={{ borderColor: "#86efac", color: "#16a34a" }}>
              <FileSpreadsheet size={14} /> Download Excel
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-px flex-shrink-0" style={{ backgroundColor: "#E2E8F0" }}>
          {[
            { label: "Total Invoiced", value: summary.totalBilled, icon: IndianRupee, color: "#0F172A", bg: "#f8fafc" },
            { label: "Paid",           value: summary.paid,        icon: Banknote,    color: "#0284c7", bg: "#F0F9FF" },
            { label: "Outstanding",    value: summary.pending,     icon: Clock,       color: summary.pending > 0 ? "#D97706" : "#0F766E", bg: summary.pending > 0 ? "#FFFBEB" : "#F0FDFA" },
          ].map(c => (
            <div key={c.label} className="px-5 py-4" style={{ backgroundColor: c.bg }}>
              <div className="flex items-center gap-2 mb-1">
                <c.icon size={13} style={{ color: c.color }} />
                <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "#94a3b8" }}>{c.label}</span>
              </div>
              <div className="font-bold text-lg" style={{ color: c.color }}>{formatINR(c.value)}</div>
            </div>
          ))}
        </div>

        {/* Vendor details strip */}
        <div className="flex gap-6 px-6 py-3 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0", backgroundColor: "#fafafa" }}>
          <div>
            <div className="text-xs" style={{ color: "#94a3b8" }}>Contact</div>
            <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{vendor.contact}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "#94a3b8" }}>Email</div>
            <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{vendor.email}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: "#94a3b8" }}>Payment Terms</div>
            <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{vendor.paymentTerms}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs" style={{ color: "#94a3b8" }}>Account Heads</div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(vendor.accountHeads ?? []).map(h => (
                <span key={h} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>{h}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Ledger table */}
        <div className="flex-1 overflow-y-auto">
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <CheckCircle size={40} className="mb-4" style={{ color: "#cbd5e1" }} />
              <p className="font-medium" style={{ color: "#475569" }}>No transactions yet</p>
              <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Expenses linked to this vendor will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ backgroundColor: "#0F766E" }}>
                  {["Date", "Invoice #", "Account Head", "Description", "Base", "GST", "Total", "Status"].map(h => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white ${h === "Base" || h === "GST" || h === "Total" ? "text-right" : h === "Status" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledger.map((e, i) => {
                  const gst = e.cgst + e.sgst + e.igst;
                  const total = e.amount + gst;
                  const branchColor = e.accountBranch ? BRANCH_COLORS[e.accountBranch] ?? "#94a3b8" : "#94a3b8";
                  return (
                    <tr key={e.id} className="border-t hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "#f1f5f9", backgroundColor: i % 2 === 0 ? "white" : "#fafafa" }}>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#475569" }}>{formatDate(e.date)}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "#475569" }}>{e.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        {e.accountBranch ? (
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: branchColor }} />
                              <span className="text-xs font-semibold" style={{ color: branchColor }}>{e.accountBranch}</span>
                            </div>
                            <div className="text-xs" style={{ color: "#94a3b8" }}>
                              {e.accountSubHead}{e.accountLeaf ? ` / ${e.accountLeaf}` : ""}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{e.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-40">
                        <span className="text-xs line-clamp-2" style={{ color: "#475569" }}>{e.description}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-xs" style={{ color: "#0F172A" }}>{formatINR(e.amount)}</td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: "#94a3b8" }}>{gst > 0 ? formatINR(gst) : "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-sm" style={{ color: "#0F172A" }}>{formatINR(total)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ backgroundColor: STATUS_STYLE[e.status]?.bg, color: STATUS_STYLE[e.status]?.text }}>
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Footer totals */}
              <tfoot>
                <tr className="border-t-2" style={{ borderColor: "#E2E8F0", backgroundColor: "#f8fafc" }}>
                  <td colSpan={4} className="px-4 py-3 text-xs font-semibold" style={{ color: "#475569" }}>
                    Total — {ledger.length} transaction{ledger.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0F172A" }}>
                    {formatINR(ledger.reduce((s, e) => s + e.amount, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#94a3b8" }}>
                    {formatINR(ledger.reduce((s, e) => s + e.cgst + e.sgst + e.igst, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm" style={{ color: "#0F766E" }}>
                    {formatINR(summary.totalBilled)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
