"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, BookOpen, FileText, Calendar, Activity, CreditCard, Stethoscope } from "lucide-react";

type StudentTab = "profile" | "documents" | "attendance" | "marks" | "fees" | "clinical";

const clinicalPostings = [
  { hospital: "AMRI Hospitals, Dhakuria", ward: "Medical Ward", date: "2024-09-10", hours: 8 },
  { hospital: "AMRI Hospitals, Dhakuria", ward: "Surgical Ward", date: "2024-09-17", hours: 8 },
  { hospital: "ILS Hospitals, Howrah", ward: "ICU", date: "2024-10-05", hours: 12 },
  { hospital: "ILS Hospitals, Howrah", ward: "Paediatrics", date: "2024-10-12", hours: 8 },
  { hospital: "AMRI Hospitals, Dhakuria", ward: "Obstetrics", date: "2024-11-02", hours: 8 },
  { hospital: "NRS Medical College", ward: "Emergency", date: "2024-11-15", hours: 10 },
];

const attendanceData = Array.from({ length: 30 }, (_, i) => {
  const r = Math.random();
  return r < 0.05 ? "A" : r < 0.15 ? "L" : r < 0.2 ? "WO" : "P";
});

const marksData = [
  { subject: "Anatomy & Physiology", internal: 38, external: 72, total: 110, max: 150 },
  { subject: "Nutrition & Biochemistry", internal: 35, external: 68, total: 103, max: 150 },
  { subject: "Microbiology", internal: 40, external: 75, total: 115, max: 150 },
  { subject: "Psychology & Sociology", internal: 36, external: 70, total: 106, max: 150 },
  { subject: "Nursing Foundations", internal: 42, external: 80, total: 122, max: 150 },
];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { students, receipts } = useNIMSStore();
  const [activeTab, setActiveTab] = useState<StudentTab>("profile");

  const student = students.find(s => s.id === id);
  if (!student) return (
    <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E2E8F0" }}>
      <p style={{ color: "#475569" }}>Student not found.</p>
      <button onClick={() => router.back()} className="text-sm mt-2 hover:underline" style={{ color: "#0F766E" }}>Go back</button>
    </div>
  );

  const studentReceipts = receipts.filter(r => r.studentId === id);
  const tabs = [
    { id: "profile" as StudentTab, label: "Profile", icon: <FileText size={14} /> },
    { id: "documents" as StudentTab, label: "Documents", icon: <BookOpen size={14} /> },
    { id: "attendance" as StudentTab, label: "Attendance", icon: <Calendar size={14} /> },
    { id: "marks" as StudentTab, label: "Marks", icon: <Activity size={14} /> },
    { id: "fees" as StudentTab, label: "Fees", icon: <CreditCard size={14} /> },
    { id: "clinical" as StudentTab, label: "Clinical", icon: <Stethoscope size={14} /> },
  ];

  const PMARK = { P: { bg: "#F0FDFA", text: "#0F766E" }, A: { bg: "#FFF1F0", text: "#F97066" }, L: { bg: "#FFFBEB", text: "#D97706" }, WO: { bg: "#f8fafc", text: "#94a3b8" } };

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm hover:underline" style={{ color: "#475569" }}>
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile card */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
            style={{ backgroundColor: "#0F766E" }}>{student.name.charAt(0)}</div>
          <div className="flex-1">
            <h2 className="font-serif font-bold text-2xl" style={{ color: "#0F172A" }}>{student.name}</h2>
            <p className="text-sm mt-0.5" style={{ color: "#475569" }}>{student.rollNo} · {student.course} · Year {student.year}</p>
            <div className="flex gap-3 mt-3 flex-wrap">
              {[
                { label: "Category", value: student.category },
                { label: "Status", value: student.status },
                { label: "Admitted", value: formatDate(student.admissionDate) },
              ].map(f => (
                <span key={f.label} className="text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: "#E2E8F0", color: "#475569" }}>
                  <span className="font-medium" style={{ color: "#0F172A" }}>{f.label}:</span> {f.value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border p-1.5 overflow-x-auto" style={{ borderColor: "#E2E8F0" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === t.id ? "text-white" : "hover:bg-gray-50"}`}
            style={activeTab === t.id ? { backgroundColor: "#0F766E" } : { color: "#475569" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border p-6 grid grid-cols-2 gap-6" style={{ borderColor: "#E2E8F0" }}>
          {[
            { label: "Full Name", value: student.name },
            { label: "Date of Birth", value: formatDate(student.dob) },
            { label: "Email", value: student.email },
            { label: "Phone", value: student.phone },
            { label: "Address", value: student.address },
            { label: "Guardian", value: student.guardian },
            { label: "Guardian Phone", value: student.guardianPhone },
            { label: "Admission Date", value: formatDate(student.admissionDate) },
          ].map(f => (
            <div key={f.label}>
              <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#475569" }}>{f.label}</div>
              <div className="text-sm" style={{ color: "#0F172A" }}>{f.value}</div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
          <div className="grid grid-cols-3 gap-4">
            {["Admit Card — Term 1", "Admit Card — Term 2", "ID Card 2024-25", "Bonafide Certificate", "Fee Receipt Book", "Marksheet Yr 1"].map(doc => (
              <div key={doc} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-gray-50 cursor-pointer transition-all" style={{ borderColor: "#E2E8F0" }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FDFA" }}>
                  <FileText size={18} style={{ color: "#0F766E" }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{doc}</div>
                  <div className="text-xs" style={{ color: "#0F766E" }}>Download PDF</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Present", count: attendanceData.filter(d => d === "P").length, color: "#0F766E" },
              { label: "Absent", count: attendanceData.filter(d => d === "A").length, color: "#F97066" },
              { label: "Leave", count: attendanceData.filter(d => d === "L").length, color: "#D97706" },
              { label: "% Attendance", count: `${Math.round((attendanceData.filter(d => d === "P").length / attendanceData.length) * 100)}%`, color: "#0F766E" },
            ].map(s => (
              <div key={s.label} className="text-center p-4 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                <div className="font-bold text-xl" style={{ color: s.color }}>{s.count}</div>
                <div className="text-xs mt-1" style={{ color: "#475569" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-10 gap-2">
            {attendanceData.map((d, i) => (
              <div key={i} className="text-center">
                <div className="text-xs mb-1" style={{ color: "#94a3b8" }}>{i + 1}</div>
                <div className="text-xs font-semibold px-1.5 py-1 rounded-md"
                  style={{ backgroundColor: PMARK[d as keyof typeof PMARK].bg, color: PMARK[d as keyof typeof PMARK].text }}>
                  {d}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "marks" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase" style={{ color: "#475569" }}>Subject</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase" style={{ color: "#475569" }}>Internal (50)</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase" style={{ color: "#475569" }}>External (100)</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase" style={{ color: "#475569" }}>Total (150)</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase" style={{ color: "#475569" }}>%</th>
              </tr>
            </thead>
            <tbody>
              {marksData.map(m => (
                <tr key={m.subject} className="border-t" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "#0F172A" }}>{m.subject}</td>
                  <td className="px-5 py-3 text-right" style={{ color: "#475569" }}>{m.internal}</td>
                  <td className="px-5 py-3 text-right" style={{ color: "#475569" }}>{m.external}</td>
                  <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F172A" }}>{m.total}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                      style={{ backgroundColor: m.total/m.max > 0.75 ? "#F0FDFA" : "#FFFBEB", color: m.total/m.max > 0.75 ? "#0F766E" : "#D97706" }}>
                      {Math.round((m.total / m.max) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "fees" && (
        <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Fee Ledger</h3>
            <Link href={`/finance/ledger/${student.id}`}
              className="text-sm font-medium hover:underline" style={{ color: "#0F766E" }}>
              View detailed ledger →
            </Link>
          </div>
          {studentReceipts.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: "#475569" }}>No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {studentReceipts.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#f8fafc" }}>
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#0F172A" }}>{r.receiptNumber}</div>
                    <div className="text-xs" style={{ color: "#475569" }}>{formatDate(r.date)} · {r.paymentMode}</div>
                  </div>
                  <Link href={`/finance/receipt/${r.id}`} className="font-semibold text-sm hover:underline" style={{ color: "#0F766E" }}>
                    {r.totalAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "clinical" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <div>
              <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Clinical Postings</h3>
              <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                Total hours: <span className="font-bold" style={{ color: "#0F766E" }}>
                  {clinicalPostings.reduce((s, p) => s + p.hours, 0)}
                </span> / 1080 (INC requirement)
              </p>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Hospital</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Ward</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Date</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Hours</th>
              </tr>
            </thead>
            <tbody>
              {clinicalPostings.map((p, i) => (
                <tr key={i} className="border-t hover:bg-gray-50" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "#0F172A" }}>{p.hospital}</td>
                  <td className="px-5 py-3" style={{ color: "#475569" }}>{p.ward}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#475569" }}>{formatDate(p.date)}</td>
                  <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F766E" }}>{p.hours}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
