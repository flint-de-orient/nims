"use client";
import { useState } from "react";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { CreditCard, FileText, Calendar, Stethoscope, AlertCircle, Download, PlusCircle } from "lucide-react";

export default function PortalPage() {
  const { students, receipts, defaulters, feeStructures } = useNIMSStore();
  const { toast } = useToast();

  // Student portal always shows first student in mock
  const student = students[0];
  const studentReceipts = receipts.filter(r => r.studentId === student.id);
  const defaulter = defaulters.find(d => d.studentId === student.id);
  const fees = feeStructures.filter(f => f.course === student.course && f.year === student.year);
  const totalFee = fees.reduce((s, f) => s + f.amount, 0);
  const totalPaid = studentReceipts.reduce((s, r) => s + r.totalAmount, 0);
  const balance = Math.max(0, totalFee - totalPaid);

  const [grievanceText, setGrievanceText] = useState("");
  const [clinicalForm, setClinicalForm] = useState({ hospital: "", ward: "", date: "", hours: "" });
  const [showClinicalForm, setShowClinicalForm] = useState(false);

  const clinicalEntries = [
    { hospital: "AMRI Hospitals, Dhakuria", ward: "Medical Ward", date: "2024-09-10", hours: 8 },
    { hospital: "ILS Hospitals, Howrah", ward: "Surgical Ward", date: "2024-10-05", hours: 8 },
  ];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Welcome */}
      <div className="p-6 rounded-2xl text-white" style={{ background: "linear-gradient(135deg, #0B3D3A, #0F766E)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            {student.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl">Welcome, {student.name.split(" ")[0]}!</h2>
            <p className="text-sm opacity-80 mt-0.5">{student.rollNo} · {student.course} Year {student.year}</p>
          </div>
        </div>
      </div>

      {/* Dues card */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: balance > 0 ? "#F97066" : "#0F766E", borderWidth: 1 }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard size={18} style={{ color: balance > 0 ? "#F97066" : "#0F766E" }} />
              <span className="font-semibold" style={{ color: "#0F172A" }}>Fee Status</span>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-3">
              <div>
                <div className="text-xs" style={{ color: "#475569" }}>Annual Fee</div>
                <div className="font-bold mt-0.5" style={{ color: "#0F172A" }}>{formatINR(totalFee)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: "#475569" }}>Paid</div>
                <div className="font-bold mt-0.5" style={{ color: "#0F766E" }}>{formatINR(totalPaid)}</div>
              </div>
              <div>
                <div className="text-xs" style={{ color: "#475569" }}>Balance</div>
                <div className="font-bold mt-0.5" style={{ color: balance > 0 ? "#F97066" : "#0F766E" }}>
                  {balance > 0 ? formatINR(balance) : "Clear ✓"}
                </div>
              </div>
            </div>
          </div>
          {balance > 0 && (
            <Link href="/finance/receipt/new?student=s001"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E" }}>
              <CreditCard size={16} /> Pay Now
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Admit cards */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Admit Cards</h3>
          <div className="space-y-2">
            {["Term 1 Examination — Dec 2024", "Term 2 Examination — Apr 2025"].map(card => (
              <div key={card} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50 transition-all cursor-pointer" style={{ borderColor: "#E2E8F0" }}>
                <div className="flex items-center gap-3">
                  <FileText size={16} style={{ color: "#0F766E" }} />
                  <span className="text-sm" style={{ color: "#0F172A" }}>{card}</span>
                </div>
                <button onClick={() => toast({ title: "Download started (mock)", description: `${card}.pdf`, variant: "success" })}
                  className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0F766E" }}>
                  <Download size={12} /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Marksheets */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Marksheets</h3>
          <div className="space-y-2">
            {["Term 1 Result — Available", "Term 2 Result — Pending"].map((ms, i) => (
              <div key={ms} className="flex items-center justify-between p-3 rounded-xl border transition-all" style={{ borderColor: "#E2E8F0", opacity: i === 1 ? 0.5 : 1 }}>
                <div className="flex items-center gap-3">
                  <Calendar size={16} style={{ color: i === 0 ? "#0F766E" : "#94a3b8" }} />
                  <span className="text-sm" style={{ color: "#0F172A" }}>{ms}</span>
                </div>
                {i === 0 && (
                  <button onClick={() => toast({ title: "Download started (mock)", description: "Marksheet_Term1.pdf", variant: "success" })}
                    className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0F766E" }}>
                    <Download size={12} /> PDF
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clinical Postings logbook */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Clinical Postings Logbook</h3>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              Total: {clinicalEntries.reduce((s, e) => s + e.hours, 0)}h / 1080h required
            </p>
          </div>
          <button onClick={() => setShowClinicalForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0F766E" }}>
            <PlusCircle size={13} /> Log Entry
          </button>
        </div>
        <div className="space-y-2">
          {clinicalEntries.map((e, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
              <div>
                <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{e.hospital}</div>
                <div className="text-xs" style={{ color: "#475569" }}>{e.ward} · {formatDate(e.date)}</div>
              </div>
              <span className="font-bold text-sm" style={{ color: "#0F766E" }}>{e.hours}h</span>
            </div>
          ))}
        </div>
        {showClinicalForm && (
          <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: "#E2E8F0", backgroundColor: "#F0FDFA" }}>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: "Hospital", key: "hospital" },
                { label: "Ward", key: "ward" },
                { label: "Date", key: "date", type: "date" },
                { label: "Hours", key: "hours", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#0F172A" }}>{f.label}</label>
                  <input type={f.type || "text"} value={(clinicalForm as Record<string, string>)[f.key]}
                    onChange={e => setClinicalForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }} />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { toast({ title: "Clinical entry submitted", variant: "success" }); setShowClinicalForm(false); }}
                className="px-4 py-2 rounded-lg text-white text-xs font-medium hover:opacity-90" style={{ backgroundColor: "#0F766E" }}>Submit</button>
              <button onClick={() => setShowClinicalForm(false)}
                className="px-4 py-2 rounded-lg border text-xs font-medium hover:bg-white" style={{ borderColor: "#E2E8F0", color: "#475569" }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Grievance */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
        <h3 className="font-serif font-semibold mb-3" style={{ color: "#0F172A" }}>Raise a Grievance</h3>
        <textarea value={grievanceText} onChange={e => setGrievanceText(e.target.value)}
          placeholder="Describe your issue or concern..."
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
          style={{ borderColor: "#E2E8F0" }} />
        <button onClick={() => { toast({ title: "Grievance submitted", description: "Your ticket #GT-2025-0042 has been raised.", variant: "success" }); setGrievanceText(""); }}
          disabled={!grievanceText.trim()}
          className="mt-3 px-5 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
          style={{ backgroundColor: "#F59E0B" }}>
          Submit Grievance
        </button>
      </div>
    </div>
  );
}
