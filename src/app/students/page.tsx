"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { Search, GraduationCap, Users, ChevronRight, TrendingUp } from "lucide-react";
import type { Course } from "@/lib/types";

const COURSES: Course[] = ["GNM", "B.Sc Nursing", "P.B. B.Sc", "M.Sc Nursing"];

const COURSE_CONFIG: Record<Course, { gradient: string; shadow: string; badge: string; text: string }> = {
  "GNM":          { gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", shadow: "rgba(15,118,110,0.35)", badge: "#0F766E", text: "#0F766E" },
  "B.Sc Nursing": { gradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)", shadow: "rgba(3,105,161,0.30)",  badge: "#0284c7", text: "#0284c7" },
  "P.B. B.Sc":    { gradient: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)", shadow: "rgba(180,83,9,0.30)",  badge: "#D97706", text: "#D97706" },
  "M.Sc Nursing": { gradient: "linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)", shadow: "rgba(109,40,217,0.30)", badge: "#7C3AED", text: "#7C3AED" },
};

const CATEGORY_STYLE: Record<string, { bg: string; text: string }> = {
  SC:  { bg: "#EFF6FF", text: "#1D4ED8" },
  ST:  { bg: "#F5F3FF", text: "#6D28D9" },
  OBC: { bg: "#FFFBEB", text: "#B45309" },
  EWS: { bg: "#F0FDF4", text: "#15803D" },
  GEN: { bg: "#F8FAFC", text: "#475569" },
};

export default function StudentsPage() {
  const { students } = useNIMSStore();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState<Course | "all">("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");

  const filtered = useMemo(() =>
    students.filter(s =>
      (search === "" || s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.toLowerCase().includes(search.toLowerCase())) &&
      (courseFilter === "all" || s.course === courseFilter) &&
      (yearFilter === "all" || s.year === yearFilter)
    ),
    [students, search, courseFilter, yearFilter]
  );

  const activeCount = students.filter(s => s.status === "Active").length;

  return (
    <div className="space-y-5">

      {/* Hero KPI band */}
      <div className="grid grid-cols-5 gap-4">
        {/* Total card */}
        <div
          className="rounded-2xl p-5 text-white relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0B3D3A 0%, #0F766E 100%)",
            boxShadow: "0 8px 24px rgba(11,61,58,0.40)",
          }}
        >
          <GraduationCap size={72} className="absolute -right-3 -bottom-3 opacity-10" />
          <div className="text-white/75 text-sm font-medium mb-3">Total Enrolled</div>
          <div className="text-5xl font-bold tracking-tight">{students.length}</div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
            <TrendingUp size={12} />
            <span>{activeCount} active</span>
          </div>
        </div>

        {/* Per-course cards */}
        {COURSES.map(c => {
          const count = students.filter(s => s.course === c).length;
          const cfg = COURSE_CONFIG[c];
          const pct = students.length > 0 ? Math.round((count / students.length) * 100) : 0;
          return (
            <div
              key={c}
              className="rounded-2xl p-5 text-white relative overflow-hidden cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{ background: cfg.gradient, boxShadow: `0 6px 20px ${cfg.shadow}` }}
              onClick={() => setCourseFilter(courseFilter === c ? "all" : c)}
            >
              <Users size={56} className="absolute -right-2 -bottom-2 opacity-10" />
              <div className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-3">{c}</div>
              <div className="text-4xl font-bold tracking-tight">{count}</div>
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-white/20">
                  <div className="h-1.5 rounded-full bg-white/70 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-white/60 mt-1">{pct}% of total</div>
              </div>
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
            placeholder="Search by name or roll number…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", color: "#0F172A" }}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...COURSES] as (Course | "all")[]).map(c => (
            <button
              key={c}
              onClick={() => setCourseFilter(c)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium border transition-all"
              style={courseFilter === c
                ? (c === "all"
                  ? { backgroundColor: "#0F766E", color: "#fff", borderColor: "#0F766E" }
                  : { backgroundColor: COURSE_CONFIG[c as Course].badge, color: "#fff", borderColor: COURSE_CONFIG[c as Course].badge })
                : { backgroundColor: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }
              }
            >
              {c === "all" ? "All Courses" : c}
            </button>
          ))}
        </div>

        <div className="h-7 w-px bg-slate-200" />

        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value === "all" ? "all" : +e.target.value)}
          className="px-3 py-2.5 rounded-xl border text-sm outline-none appearance-none pr-8"
          style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC", color: "#0F172A" }}
        >
          <option value="all">All Years</option>
          {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
        </select>

        <div
          className="ml-auto text-sm font-semibold px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}
        >
          {filtered.length} students
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
              <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Student</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Roll No.</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Course</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Year</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Category</th>
              <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, idx) => {
              const cfg = COURSE_CONFIG[s.course];
              const cat = CATEGORY_STYLE[s.category] ?? CATEGORY_STYLE.GEN;
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
                        style={{ background: cfg.gradient, boxShadow: `0 2px 8px ${cfg.shadow}` }}
                      >
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/students/${s.id}`}
                          className="font-semibold text-[15px] hover:underline"
                          style={{ color: "#0F172A" }}
                        >
                          {s.name}
                        </Link>
                        <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>{s.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm font-medium" style={{ color: "#475569" }}>{s.rollNo}</td>
                  <td className="px-4 py-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold text-white"
                      style={{ backgroundColor: cfg.badge }}
                    >
                      {s.course}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-sm font-semibold w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}
                    >
                      {s.year}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                      style={{ backgroundColor: cat.bg, color: cat.text }}
                    >
                      {s.category}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                      style={{ backgroundColor: s.status === "Active" ? "#F0FDFA" : "#FFF1F0", color: s.status === "Active" ? "#0F766E" : "#F97066" }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/students/${s.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:gap-2"
                      style={{ color: "#0F766E", backgroundColor: "#F0FDFA" }}
                    >
                      View <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <GraduationCap size={40} className="mx-auto mb-3 opacity-20" style={{ color: "#0F766E" }} />
                  <p className="font-semibold text-base" style={{ color: "#0F172A" }}>No students found</p>
                  <p className="text-sm mt-1" style={{ color: "#94A3B8" }}>Try adjusting your search or filters</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
