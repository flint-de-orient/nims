"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { Search, UserCheck, Users, Stethoscope, ShieldCheck, Briefcase } from "lucide-react";

const DEPARTMENTS = ["Administration", "Nursing", "Clinical", "Finance", "Laboratory", "Library", "Hostel", "Security"];

const DEPT_COLOR: Record<string, string> = {
  Nursing:        "#0F766E",
  Clinical:       "#7C3AED",
  Administration: "#0284c7",
  Finance:        "#D97706",
  Laboratory:     "#DB2777",
  Library:        "#0891B2",
  Hostel:         "#65A30D",
  Security:       "#64748B",
};

const STATUS_STYLE = {
  Active:    { bg: "#F0FDFA", text: "#0F766E", dot: "#14B8A6" },
  "On Leave":{ bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
  Resigned:  { bg: "#FFF1F0", text: "#E11D48", dot: "#F97066" },
};

const STAT_CARDS = [
  { label: "Total Staff", dept: null, gradient: "linear-gradient(135deg, #0B3D3A 0%, #0F766E 100%)", shadow: "rgba(11,61,58,0.40)", Icon: Users },
  { label: "Nursing Faculty", dept: "Nursing", gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", shadow: "rgba(15,118,110,0.35)", Icon: Stethoscope },
  { label: "Clinical Instructors", dept: "Clinical", gradient: "linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)", shadow: "rgba(109,40,217,0.30)", Icon: ShieldCheck },
  { label: "Administrative", dept: "Administration", gradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)", shadow: "rgba(3,105,161,0.30)", Icon: Briefcase },
];

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

  return (
    <div className="space-y-5">

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, dept, gradient, shadow, Icon }) => {
          const count = dept ? staff.filter(s => s.department === dept).length : staff.length;
          return (
            <div
              key={label}
              className="rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{ background: gradient, boxShadow: `0 8px 24px ${shadow}` }}
              onClick={() => setDeptFilter(dept ?? "all")}
            >
              <Icon size={64} className="absolute -right-3 -bottom-3 opacity-10" />
              <div className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-3">{label}</div>
              <div className="text-5xl font-bold tracking-tight">{count}</div>
              <div className="text-white/60 text-xs mt-2">members</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl border p-4 flex flex-wrap gap-3 items-center"
        style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        <div className="relative flex-1 min-w-52">
          <Search size={16} className="absolute left-3.5 top-3" style={{ color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search name or designation…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", color: "#0F172A" }}
          />
        </div>
        <select
          value={deptFilter}
          onChange={e => setDeptFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border text-sm outline-none"
          style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", color: "#0F172A" }}
        >
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <div
          className="ml-auto text-sm font-semibold px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}
        >
          {filtered.length} staff
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Name</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Designation</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Department</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>INC Reg. No.</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Joined</th>
              <th className="text-center px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => {
              const deptColor = DEPT_COLOR[s.department] ?? "#64748B";
              const statusStyle = STATUS_STYLE[s.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.Active;
              return (
                <tr
                  key={s.id}
                  className="transition-colors"
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
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: deptColor, boxShadow: `0 2px 8px ${deptColor}44` }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>{s.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-[15px]" style={{ color: "#0F172A" }}>{s.designation}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                      style={{ backgroundColor: `${deptColor}18`, color: deptColor }}
                    >
                      {s.department}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm font-medium" style={{ color: "#475569" }}>
                    {s.incRegNo || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm" style={{ color: "#64748B" }}>{formatDate(s.joiningDate)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-semibold"
                      style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusStyle.dot }} />
                      {s.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <UserCheck size={40} className="mx-auto mb-3 opacity-20" style={{ color: "#0F766E" }} />
                  <p className="font-semibold text-base" style={{ color: "#0F172A" }}>No staff found</p>
                  <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>Try adjusting your filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
