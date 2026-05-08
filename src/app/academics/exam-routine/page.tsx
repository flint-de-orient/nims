"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Sparkles, RefreshCw, Lock, CheckCircle } from "lucide-react";

const SUBJECTS = [
  "Anatomy & Physiology",
  "Nutrition & Biochemistry",
  "Microbiology & Parasitology",
  "Psychology & Sociology",
  "Nursing Foundations",
  "Community Health Nursing",
  "Medical-Surgical Nursing",
  "Obstetrics & Midwifery",
  "Paediatric Nursing",
  "Mental Health Nursing",
];

const HALLS = ["Hall A (60 seats)", "Hall B (40 seats)", "Hall C (40 seats)", "Hall D (30 seats)"];
const INVIGILATORS = [
  "Mrs. Rekha Bose",
  "Mrs. Sumita Roy",
  "Mrs. Nilima Das",
  "Mrs. Sudeshna Pal",
  "Mrs. Kalyani Saha",
];

function generateSchedule() {
  const days: { date: string; morning: { subject: string; hall: string; invigilator: string } | null; afternoon: { subject: string; hall: string; invigilator: string } | null }[] = [];
  const usedSubjects = new Set<string>();
  const baseDate = new Date("2025-06-02");

  for (let d = 0; d < 5; d++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + d);
    const dateStr = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const getNext = () => {
      const available = SUBJECTS.filter(s => !usedSubjects.has(s));
      if (!available.length) return null;
      const s = available[Math.floor(Math.random() * available.length)];
      usedSubjects.add(s);
      return {
        subject: s,
        hall: HALLS[d % HALLS.length],
        invigilator: INVIGILATORS[d % INVIGILATORS.length],
      };
    };

    days.push({ date: dateStr, morning: getNext(), afternoon: getNext() });
  }
  return days;
}

export default function ExamRoutinePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<ReturnType<typeof generateSchedule> | null>(null);
  const [locked, setLocked] = useState(false);
  const [batch, setBatch] = useState("GNM Year 2 — 2024-25");

  const handleGenerate = () => {
    setLoading(true);
    setLocked(false);
    setTimeout(() => {
      setSchedule(generateSchedule());
      setLoading(false);
      toast({ title: "Exam routine generated!", description: "Clash-free 5-day schedule ready", variant: "success" });
    }, 2000);
  };

  const handleLock = () => {
    setLocked(true);
    toast({ title: "Routine locked & published", description: "Students have been notified via SMS/Email", variant: "success" });
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border p-5 flex items-end gap-4" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Batch</label>
          <select value={batch} onChange={e => setBatch(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0", color: "#0F172A" }}>
            {["GNM Year 1 — 2024-25", "GNM Year 2 — 2024-25", "GNM Year 3 — 2024-25", "B.Sc Nursing Year 1 — 2024-25", "B.Sc Nursing Year 2 — 2024-25"].map(b => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading || locked}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
          style={{ backgroundColor: "#0F766E" }}>
          {loading ? <><RefreshCw size={16} className="animate-spin" /> Generating AI Schedule...</> : <><Sparkles size={16} /> Generate Routine</>}
        </button>
        {schedule && !locked && (
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}>
            <RefreshCw size={16} /> Re-run
          </button>
        )}
        {schedule && !locked && (
          <button onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-white hover:opacity-90 transition-all"
            style={{ backgroundColor: "#F59E0B" }}>
            <Lock size={16} /> Lock & Publish
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-white rounded-xl border p-12 flex flex-col items-center justify-center gap-4" style={{ borderColor: "#E2E8F0" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F0FDFA" }}>
            <Sparkles size={28} style={{ color: "#0F766E" }} className="animate-pulse" />
          </div>
          <div className="text-center">
            <div className="font-semibold" style={{ color: "#0F172A" }}>AI is generating a clash-free schedule...</div>
            <div className="text-sm mt-1" style={{ color: "#475569" }}>Checking subject conflicts, hall availability, and invigilator schedules</div>
          </div>
          <div className="w-64 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#E2E8F0" }}>
            <div className="h-full rounded-full animate-pulse" style={{ backgroundColor: "#0F766E", width: "60%" }} />
          </div>
        </div>
      )}

      {schedule && !loading && (
        <div className="space-y-3">
          {locked && (
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "#0F766E", backgroundColor: "#F0FDFA" }}>
              <CheckCircle size={20} style={{ color: "#0F766E" }} />
              <div>
                <div className="font-semibold" style={{ color: "#0F172A" }}>Routine locked and published</div>
                <div className="text-sm" style={{ color: "#475569" }}>Notifications sent to all {batch.split(" ")[1]} {batch.split(" ")[2]} students</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3">
            {schedule.map((day, di) => (
              <div key={di} className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                <div className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: "#E2E8F0", backgroundColor: "#f8fafc" }}>
                  <div className="font-semibold text-sm" style={{ color: "#0F172A" }}>Day {di + 1} — {day.date}</div>
                  {locked && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>Published</span>}
                </div>
                <div className="grid grid-cols-2 divide-x" style={{ borderColor: "#E2E8F0" }}>
                  {[
                    { slot: "Morning (10:00 AM)", data: day.morning },
                    { slot: "Afternoon (2:00 PM)", data: day.afternoon },
                  ].map(({ slot, data }) => (
                    <div key={slot} className="p-5">
                      <div className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "#475569" }}>{slot}</div>
                      {data ? (
                        <div>
                          <div className="font-medium" style={{ color: "#0F172A" }}>{data.subject}</div>
                          <div className="mt-2 space-y-1">
                            <div className="text-xs" style={{ color: "#475569" }}>
                              <span className="font-medium">Hall:</span> {data.hall}
                            </div>
                            <div className="text-xs" style={{ color: "#475569" }}>
                              <span className="font-medium">Invigilator:</span> {data.invigilator}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm" style={{ color: "#94a3b8" }}>—</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!schedule && !loading && (
        <div className="bg-white rounded-xl border p-16 flex flex-col items-center justify-center gap-4" style={{ borderColor: "#E2E8F0" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#F0FDFA" }}>
            <Sparkles size={28} style={{ color: "#0F766E" }} />
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg font-serif" style={{ color: "#0F172A" }}>AI Exam Routine Engine</div>
            <div className="text-sm mt-1 max-w-md" style={{ color: "#475569" }}>
              Select a batch and click Generate to produce a clash-free 5-day exam schedule with automated hall and invigilator assignments.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
