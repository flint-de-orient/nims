"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";

const DAYS_IN_MONTH = 31;
const MARK_TYPES = ["P", "A", "L", "WO"] as const;
type Mark = typeof MARK_TYPES[number];

const MARK_COLORS: Record<Mark, { bg: string; text: string }> = {
  P: { bg: "#F0FDFA", text: "#0F766E" },
  A: { bg: "#FFF1F0", text: "#F97066" },
  L: { bg: "#FFFBEB", text: "#D97706" },
  WO: { bg: "#f8fafc", text: "#94a3b8" },
};

function generateAttendance(): Mark[] {
  return Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
    if ((i + 1) % 7 === 0 || (i + 1) % 7 === 1) return "WO";
    const r = Math.random();
    return r < 0.05 ? "A" : r < 0.12 ? "L" : "P";
  });
}

export default function AttendancePage() {
  const { staff } = useNIMSStore();
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || "");
  const [month, setMonth] = useState("2025-04");

  const selectedStaff = staff.find(s => s.id === selectedStaffId);
  const attendance = useMemo(() => generateAttendance(), [selectedStaffId, month]);

  const summary = {
    P: attendance.filter(d => d === "P").length,
    A: attendance.filter(d => d === "A").length,
    L: attendance.filter(d => d === "L").length,
    WO: attendance.filter(d => d === "WO").length,
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border p-5 flex items-end gap-4" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex-1">
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Staff Member</label>
          <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#0F172A" }}>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name} — {s.designation}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Month</label>
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2.5 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
        </div>
      </div>

      {selectedStaff && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            {(["P", "A", "L", "WO"] as Mark[]).map(mark => (
              <div key={mark} className="bg-white rounded-xl border p-4 text-center" style={{ borderColor: "#E2E8F0" }}>
                <div className="text-2xl font-serif font-bold" style={{ color: MARK_COLORS[mark].text }}>{summary[mark]}</div>
                <div className="text-xs mt-1" style={{ color: "#475569" }}>
                  {mark === "P" ? "Present" : mark === "A" ? "Absent" : mark === "L" ? "Leave" : "Week Off"}
                </div>
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>
              {selectedStaff.name} — {new Date(month + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: "#475569" }}>{d}</div>
              ))}
              {/* Offset for first day (May 2025 starts on Thursday = 4 offset) */}
              {Array.from({ length: 3 }, (_, i) => <div key={`off-${i}`} />)}
              {attendance.map((mark, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{i + 1}</div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: MARK_COLORS[mark].bg, color: MARK_COLORS[mark].text }}>
                    {mark}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
