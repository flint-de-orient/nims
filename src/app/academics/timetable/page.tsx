"use client";
import { useState } from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SLOTS = ["8:00–9:00", "9:00–10:00", "10:00–11:00", "11:00–12:00", "12:00–1:00", "2:00–3:00", "3:00–4:00", "4:00–5:00"];

const TIMETABLE: Record<string, Record<string, { subject: string; faculty: string; type: "theory" | "clinical" | "lab" | "free" }>> = {
  "Monday": {
    "8:00–9:00": { subject: "Anatomy & Physiology", faculty: "Mrs. Rekha Bose", type: "theory" },
    "9:00–10:00": { subject: "Nursing Foundations", faculty: "Mrs. Sumita Roy", type: "theory" },
    "10:00–11:00": { subject: "Microbiology", faculty: "Mrs. Nilima Das", type: "theory" },
    "11:00–12:00": { subject: "Lab — Anatomy", faculty: "Mrs. Rekha Bose", type: "lab" },
    "12:00–1:00": { subject: "Lab — Anatomy", faculty: "Mrs. Rekha Bose", type: "lab" },
    "2:00–3:00": { subject: "Community Health Nursing", faculty: "Mrs. Sudeshna Pal", type: "theory" },
    "3:00–4:00": { subject: "Psychology", faculty: "Mrs. Kalyani Saha", type: "theory" },
    "4:00–5:00": { subject: "Free Period", faculty: "", type: "free" },
  },
  "Tuesday": {
    "8:00–9:00": { subject: "Nutrition & Biochemistry", faculty: "Mrs. Papri Mondal", type: "theory" },
    "9:00–10:00": { subject: "Anatomy & Physiology", faculty: "Mrs. Rekha Bose", type: "theory" },
    "10:00–11:00": { subject: "Clinical Posting", faculty: "Mrs. Debolina Sen", type: "clinical" },
    "11:00–12:00": { subject: "Clinical Posting", faculty: "Mrs. Debolina Sen", type: "clinical" },
    "12:00–1:00": { subject: "Clinical Posting", faculty: "Mrs. Debolina Sen", type: "clinical" },
    "2:00–3:00": { subject: "Nursing Foundations", faculty: "Mrs. Sumita Roy", type: "theory" },
    "3:00–4:00": { subject: "Microbiology Lab", faculty: "Mrs. Nilima Das", type: "lab" },
    "4:00–5:00": { subject: "Microbiology Lab", faculty: "Mrs. Nilima Das", type: "lab" },
  },
  "Wednesday": {
    "8:00–9:00": { subject: "Community Health Nursing", faculty: "Mrs. Sudeshna Pal", type: "theory" },
    "9:00–10:00": { subject: "Nutrition & Biochemistry", faculty: "Mrs. Papri Mondal", type: "theory" },
    "10:00–11:00": { subject: "Anatomy & Physiology", faculty: "Mrs. Rekha Bose", type: "theory" },
    "11:00–12:00": { subject: "Lab — Nursing Fundamentals", faculty: "Mrs. Sumita Roy", type: "lab" },
    "12:00–1:00": { subject: "Lab — Nursing Fundamentals", faculty: "Mrs. Sumita Roy", type: "lab" },
    "2:00–3:00": { subject: "Psychology", faculty: "Mrs. Kalyani Saha", type: "theory" },
    "3:00–4:00": { subject: "Free Period", faculty: "", type: "free" },
    "4:00–5:00": { subject: "Free Period", faculty: "", type: "free" },
  },
  "Thursday": {
    "8:00–9:00": { subject: "Microbiology", faculty: "Mrs. Nilima Das", type: "theory" },
    "9:00–10:00": { subject: "Community Health Nursing", faculty: "Mrs. Sudeshna Pal", type: "theory" },
    "10:00–11:00": { subject: "Clinical Posting", faculty: "Mrs. Ranjita Mitra", type: "clinical" },
    "11:00–12:00": { subject: "Clinical Posting", faculty: "Mrs. Ranjita Mitra", type: "clinical" },
    "12:00–1:00": { subject: "Clinical Posting", faculty: "Mrs. Ranjita Mitra", type: "clinical" },
    "2:00–3:00": { subject: "Nutrition & Biochemistry", faculty: "Mrs. Papri Mondal", type: "theory" },
    "3:00–4:00": { subject: "Anatomy & Physiology", faculty: "Mrs. Rekha Bose", type: "theory" },
    "4:00–5:00": { subject: "Free Period", faculty: "", type: "free" },
  },
  "Friday": {
    "8:00–9:00": { subject: "Nursing Foundations", faculty: "Mrs. Sumita Roy", type: "theory" },
    "9:00–10:00": { subject: "Psychology", faculty: "Mrs. Kalyani Saha", type: "theory" },
    "10:00–11:00": { subject: "Microbiology", faculty: "Mrs. Nilima Das", type: "theory" },
    "11:00–12:00": { subject: "Community Health Nursing", faculty: "Mrs. Sudeshna Pal", type: "theory" },
    "12:00–1:00": { subject: "Free Period", faculty: "", type: "free" },
    "2:00–3:00": { subject: "Lab — Microbiology", faculty: "Mrs. Nilima Das", type: "lab" },
    "3:00–4:00": { subject: "Lab — Microbiology", faculty: "Mrs. Nilima Das", type: "lab" },
    "4:00–5:00": { subject: "Library / Self-study", faculty: "", type: "free" },
  },
  "Saturday": {
    "8:00–9:00": { subject: "Clinical Posting", faculty: "Mrs. Tanima Basu", type: "clinical" },
    "9:00–10:00": { subject: "Clinical Posting", faculty: "Mrs. Tanima Basu", type: "clinical" },
    "10:00–11:00": { subject: "Clinical Posting", faculty: "Mrs. Tanima Basu", type: "clinical" },
    "11:00–12:00": { subject: "Clinical Posting", faculty: "Mrs. Tanima Basu", type: "clinical" },
    "12:00–1:00": { subject: "Free Period", faculty: "", type: "free" },
    "2:00–3:00": { subject: "Free Period", faculty: "", type: "free" },
    "3:00–4:00": { subject: "Free Period", faculty: "", type: "free" },
    "4:00–5:00": { subject: "Free Period", faculty: "", type: "free" },
  },
};

const SLOT_COLORS = {
  theory: { bg: "#F0FDFA", text: "#0F766E", border: "#5EEAD4" },
  clinical: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  lab: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  free: { bg: "#f8fafc", text: "#94a3b8", border: "#E2E8F0" },
};

export default function TimetablePage() {
  const [batch, setBatch] = useState("GNM Year 1 — 2024-25");

  const clinicalHoursThisTerm = 312;
  const clinicalHoursRequired = 1080;
  const clinicalPct = Math.round((clinicalHoursThisTerm / clinicalHoursRequired) * 100);

  return (
    <div className="space-y-4">
      {/* Header controls + INC counter */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: "#E2E8F0" }}>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#475569" }}>Batch</label>
          <select value={batch} onChange={e => setBatch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
            {["GNM Year 1 — 2024-25", "GNM Year 2 — 2024-25", "B.Sc Nursing Year 1 — 2024-25"].map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2 bg-white rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: "#0F766E" }}>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#475569" }}>
              INC Clinical Hours — {batch}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${clinicalPct}%`, backgroundColor: "#0F766E" }} />
              </div>
              <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#0F766E" }}>
                {clinicalHoursThisTerm} / {clinicalHoursRequired} hrs
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: "#475569" }}>
              {clinicalPct}% complete · {clinicalPct >= 30 ? "✓ On track" : "⚠ Behind schedule"}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {Object.entries(SLOT_COLORS).map(([type, colors]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <div className="bg-white rounded-xl border overflow-auto" style={{ borderColor: "#E2E8F0" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "#0B3D3A" }}>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white w-28">Time</th>
              {DAYS.map(d => (
                <th key={d} className="text-center px-3 py-3 text-xs font-semibold text-white">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SLOTS.map((slot, si) => (
              <tr key={slot} className="border-t" style={{ borderColor: "#f1f5f9" }}>
                <td className="px-4 py-3 text-xs font-medium whitespace-nowrap" style={{ color: "#475569", backgroundColor: "#f8fafc" }}>
                  {slot}
                </td>
                {DAYS.map(day => {
                  const entry = TIMETABLE[day]?.[slot];
                  if (!entry || entry.type === "free") {
                    return (
                      <td key={day} className="px-3 py-2 text-center">
                        <div className="text-xs" style={{ color: "#cbd5e1" }}>—</div>
                      </td>
                    );
                  }
                  const colors = SLOT_COLORS[entry.type];
                  return (
                    <td key={day} className="px-2 py-2">
                      <div className="px-2 py-1.5 rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}>
                        <div className="text-xs font-medium leading-tight" style={{ color: colors.text }}>{entry.subject}</div>
                        {entry.faculty && (
                          <div className="text-xs mt-0.5 opacity-70" style={{ color: colors.text }}>{entry.faculty.split(" ").slice(-1)[0]}</div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
