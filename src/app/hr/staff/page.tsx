"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Search, UserCheck } from "lucide-react";

const DEPARTMENTS = ["Administration", "Nursing", "Clinical", "Finance", "Laboratory", "Library", "Hostel", "Security"];

export default function StaffPage() {
  const { staff } = useNIMSStore();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const filtered = useMemo(() =>
    staff.filter(s =>
      (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.designation.toLowerCase().includes(search.toLowerCase())) &&
      (deptFilter === "all" || s.department === deptFilter)
    ),
    [staff, search, deptFilter]
  );

  const STATUS_COLORS = {
    Active: { bg: "#F0FDFA", text: "#0F766E" },
    "On Leave": { bg: "#FFFBEB", text: "#D97706" },
    Resigned: { bg: "#FFF1F0", text: "#F97066" },
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Staff", count: staff.length, color: "#0F766E" },
          { label: "Nursing Faculty", count: staff.filter(s => s.department === "Nursing").length, color: "#0284c7" },
          { label: "Clinical Instructors", count: staff.filter(s => s.department === "Clinical").length, color: "#7C3AED" },
          { label: "Administrative", count: staff.filter(s => s.department === "Administration").length, color: "#D97706" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-2xl font-serif font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs mt-1" style={{ color: "#475569" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex gap-3 items-center" style={{ borderColor: "#E2E8F0" }}>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5" style={{ color: "#475569" }} />
          <input type="text" placeholder="Search name or designation..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
        </div>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#0F172A" }}>
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <div className="text-sm" style={{ color: "#475569" }}>{filtered.length} staff</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Designation</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Department</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>INC Reg. No.</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Joined</th>
              <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: s.department === "Nursing" ? "#0F766E" : s.department === "Clinical" ? "#7C3AED" : s.department === "Administration" ? "#0284c7" : "#94a3b8" }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: "#0F172A" }}>{s.name}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3" style={{ color: "#0F172A" }}>{s.designation}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>{s.department}</span>
                </td>
                <td className="px-5 py-3 font-mono text-xs" style={{ color: "#475569" }}>
                  {s.incRegNo || "—"}
                </td>
                <td className="px-5 py-3 text-xs" style={{ color: "#475569" }}>{formatDate(s.joiningDate)}</td>
                <td className="px-5 py-3 text-center">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ backgroundColor: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS]?.bg ?? "#f1f5f9", color: STATUS_COLORS[s.status as keyof typeof STATUS_COLORS]?.text ?? "#475569" }}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
