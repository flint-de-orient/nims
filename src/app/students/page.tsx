"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { Search, GraduationCap } from "lucide-react";
import type { Course } from "@/lib/types";

const COURSES: Course[] = ["GNM", "B.Sc Nursing", "P.B. B.Sc", "M.Sc Nursing"];
const COURSE_COLORS: Record<Course, string> = {
  "GNM": "#0F766E",
  "B.Sc Nursing": "#0284c7",
  "P.B. B.Sc": "#D97706",
  "M.Sc Nursing": "#7C3AED",
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

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[{ label: "Total", count: students.length, color: "#0F766E" },
          ...COURSES.map(c => ({ label: c, count: students.filter(s => s.course === c).length, color: COURSE_COLORS[c] }))
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-2xl font-serif font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs mt-1" style={{ color: "#475569" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center" style={{ borderColor: "#E2E8F0" }}>
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-2.5" style={{ color: "#475569" }} />
          <input type="text" placeholder="Search name or roll no..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
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
        <div className="text-sm ml-auto" style={{ color: "#475569" }}>{filtered.length} students</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Student</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Roll No.</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Course</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Year</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Category</th>
              <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: COURSE_COLORS[s.course] }}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <Link href={`/students/${s.id}`} className="font-medium hover:underline" style={{ color: "#0F172A" }}>{s.name}</Link>
                      <div className="text-xs" style={{ color: "#475569" }}>{s.phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs" style={{ color: "#475569" }}>{s.rollNo}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: COURSE_COLORS[s.course] }}>{s.course}</span>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: "#475569" }}>Year {s.year}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    s.category === "SC" ? "bg-blue-50 text-blue-700" :
                    s.category === "ST" ? "bg-purple-50 text-purple-700" :
                    s.category === "OBC" ? "bg-amber-50 text-amber-700" :
                    s.category === "EWS" ? "bg-green-50 text-green-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{s.category}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>{s.status}</span>
                </td>
                <td className="px-5 py-3">
                  <Link href={`/students/${s.id}`}
                    className="text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-gray-50 transition-all"
                    style={{ borderColor: "#E2E8F0", color: "#475569" }}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
