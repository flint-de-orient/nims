"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { formatINR } from "@/lib/utils";
import { Search, Filter, CreditCard } from "lucide-react";
import type { Course } from "@/lib/types";

const COURSES: Course[] = ["GNM", "B.Sc Nursing", "P.B. B.Sc", "M.Sc Nursing"];

type LedgerStatus = "all" | "paid" | "partial" | "overdue";

export default function LedgerPage() {
  const { students, receipts, defaulters, feeStructures } = useNIMSStore();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<Course | "all">("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LedgerStatus>("all");

  const defaulterIds = new Set(defaulters.map(d => d.studentId));

  const studentLedgers = useMemo(() => {
    return students.map(s => {
      const fees = feeStructures.filter(f => f.course === s.course && f.year === s.year);
      const totalFee = fees.reduce((sum, f) => sum + f.amount, 0);
      const studentReceipts = receipts.filter(r => r.studentId === s.id);
      const totalPaid = studentReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
      const balance = Math.max(0, totalFee - totalPaid);
      const defaulter = defaulters.find(d => d.studentId === s.id);

      let status: LedgerStatus = "paid";
      if (defaulter) status = "overdue";
      else if (balance > 0) status = "partial";

      return { student: s, totalFee, totalPaid, balance, status, receiptsCount: studentReceipts.length };
    });
  }, [students, receipts, defaulters, feeStructures]);

  const filtered = useMemo(() => {
    return studentLedgers.filter(sl => {
      const matchSearch = search === "" ||
        sl.student.name.toLowerCase().includes(search.toLowerCase()) ||
        sl.student.rollNo.toLowerCase().includes(search.toLowerCase());
      const matchCourse = courseFilter === "all" || sl.student.course === courseFilter;
      const matchYear = yearFilter === "all" || sl.student.year === yearFilter;
      const matchStatus = statusFilter === "all" || sl.status === statusFilter;
      return matchSearch && matchCourse && matchYear && matchStatus;
    });
  }, [studentLedgers, search, courseFilter, yearFilter, statusFilter]);

  const statusColors: Record<LedgerStatus, { bg: string; text: string; label: string }> = {
    paid: { bg: "#F0FDFA", text: "#0F766E", label: "Paid" },
    partial: { bg: "#FFFBEB", text: "#D97706", label: "Partial" },
    overdue: { bg: "#FFF1F0", text: "#F97066", label: "Overdue" },
    all: { bg: "#f8fafc", text: "#475569", label: "All" },
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center" style={{ borderColor: "#E2E8F0" }}>
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5" style={{ color: "#475569" }} />
          <input
            type="text"
            placeholder="Search name or roll no..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "#E2E8F0" }}
          />
        </div>
        <select value={courseFilter} onChange={e => setCourseFilter(e.target.value as Course | "all")}
          className="px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#0F172A" }}>
          <option value="all">All Courses</option>
          {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value === "all" ? "all" : +e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#0F172A" }}>
          <option value="all">All Years</option>
          {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>
        <div className="flex gap-1">
          {(["all","paid","partial","overdue"] as LedgerStatus[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${statusFilter === s ? "border-transparent" : "border-transparent"}`}
              style={statusFilter === s
                ? { backgroundColor: s === "all" ? "#0F766E" : statusColors[s].bg, color: s === "all" ? "white" : statusColors[s].text, border: `1px solid ${s === "all" ? "#0F766E" : statusColors[s].text}` }
                : { backgroundColor: "#f8fafc", color: "#475569", border: "1px solid #E2E8F0" }}>
              {statusColors[s].label}
            </button>
          ))}
        </div>
        <div className="ml-auto text-sm" style={{ color: "#475569" }}>{filtered.length} students</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Course / Year</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Total Fee</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Paid</th>
              <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Balance</th>
              <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ student, totalFee, totalPaid, balance, status }) => (
              <tr key={student.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                <td className="px-5 py-3">
                  <Link href={`/finance/ledger/${student.id}`} className="font-medium hover:underline" style={{ color: "#0F172A" }}>
                    {student.name}
                  </Link>
                  <div className="text-xs" style={{ color: "#475569" }}>{student.rollNo}</div>
                </td>
                <td className="px-5 py-3">
                  <div style={{ color: "#0F172A" }}>{student.course}</div>
                  <div className="text-xs" style={{ color: "#475569" }}>Year {student.year} · {student.category}</div>
                </td>
                <td className="px-5 py-3 text-right font-medium" style={{ color: "#0F172A" }}>{formatINR(totalFee)}</td>
                <td className="px-5 py-3 text-right font-medium" style={{ color: "#0F766E" }}>{formatINR(totalPaid)}</td>
                <td className="px-5 py-3 text-right font-semibold" style={{ color: balance > 0 ? "#F97066" : "#0F766E" }}>
                  {balance > 0 ? formatINR(balance) : "Clear"}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: statusColors[status].bg, color: statusColors[status].text }}>
                    {statusColors[status].label}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex gap-2 justify-end">
                    <Link href={`/finance/ledger/${student.id}`}
                      className="text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-gray-50 transition-all"
                      style={{ borderColor: "#E2E8F0", color: "#475569" }}>
                      View
                    </Link>
                    {balance > 0 && (
                      <Link href={`/finance/receipt/new?student=${student.id}`}
                        className="text-xs px-2.5 py-1.5 rounded-lg font-medium text-white hover:opacity-90 transition-all flex items-center gap-1"
                        style={{ backgroundColor: "#0F766E" }}>
                        <CreditCard size={12} /> Pay
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
