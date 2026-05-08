"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Edit2, Plus, Clock, Save, X, BookOpen, Clock3, GraduationCap } from "lucide-react";
import type { FeeHead, Course, Year, FeeStructure, LateFeeRule } from "@/lib/types";

const COURSES: Course[] = ["GNM", "B.Sc Nursing", "P.B. B.Sc", "M.Sc Nursing"];
const FEE_HEADS: FeeHead[] = ["Tuition", "Hostel", "Lab", "Exam", "Library", "University", "Misc"];
const COURSE_YEARS: Record<Course, Year[]> = {
  "GNM": [1, 2, 3],
  "B.Sc Nursing": [1, 2, 3, 4],
  "P.B. B.Sc": [1, 2],
  "M.Sc Nursing": [1, 2],
};
const COURSE_CONFIG: Record<Course, { gradient: string; shadow: string; color: string }> = {
  "GNM":          { gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)", shadow: "rgba(15,118,110,0.35)", color: "#0F766E" },
  "B.Sc Nursing": { gradient: "linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%)", shadow: "rgba(3,105,161,0.30)",  color: "#0284c7" },
  "P.B. B.Sc":    { gradient: "linear-gradient(135deg, #B45309 0%, #F59E0B 100%)", shadow: "rgba(180,83,9,0.30)",  color: "#D97706" },
  "M.Sc Nursing": { gradient: "linear-gradient(135deg, #6D28D9 0%, #A78BFA 100%)", shadow: "rgba(109,40,217,0.30)", color: "#7C3AED" },
};
const HEAD_ICONS: Record<FeeHead, string> = {
  Tuition: "📚", Hostel: "🏠", Lab: "🔬", Exam: "📝", Library: "📖", University: "🏛️", Misc: "📋",
};

export default function FeeMasterPage() {
  const { feeStructures, updateFeeStructure, addFeeStructure, lateFeeRule, updateLateFeeRule, scholarshipRules } = useNIMSStore();
  const { toast } = useToast();

  const [selectedCourse, setSelectedCourse] = useState<Course>("GNM");
  const [selectedYear, setSelectedYear] = useState<Year>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHead, setNewHead] = useState<FeeHead>("Misc");
  const [newAmount, setNewAmount] = useState("");
  const [showLateFeeEditor, setShowLateFeeEditor] = useState(false);
  const [lateFeeDraft, setLateFeeDraft] = useState<LateFeeRule>(lateFeeRule);
  const [sampleDays, setSampleDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"structure" | "latefee" | "scholarship">("structure");

  const fees = useMemo(() =>
    feeStructures.filter(f => f.course === selectedCourse && f.year === selectedYear),
    [feeStructures, selectedCourse, selectedYear]
  );
  const totalFee = fees.reduce((sum, f) => sum + f.amount, 0);

  const handleSave = (f: FeeStructure) => {
    const amount = parseInt(editAmount);
    if (isNaN(amount) || amount < 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    updateFeeStructure({ ...f, amount, effectiveFrom: new Date().toISOString().split("T")[0] });
    setEditingId(null);
    toast({ title: "Fee updated", description: `${f.head} updated to ${formatINR(amount)}`, variant: "success" });
  };
  const handleAdd = () => {
    const amount = parseInt(newAmount);
    if (isNaN(amount) || amount < 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    addFeeStructure({ id: `f${Date.now()}`, course: selectedCourse, year: selectedYear, head: newHead, amount, effectiveFrom: new Date().toISOString().split("T")[0] });
    setShowAddModal(false); setNewAmount("");
    toast({ title: "Fee head added", variant: "success" });
  };

  const lateFeePreview = useMemo(() => {
    const overDays = Math.max(0, sampleDays - lateFeeDraft.graceDays);
    return Math.min(overDays * lateFeeDraft.ratePerDay, lateFeeDraft.cap);
  }, [lateFeeDraft, sampleDays]);

  const cfg = COURSE_CONFIG[selectedCourse];

  return (
    <div className="space-y-5">

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-2xl border p-1.5"
        style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", width: "fit-content" }}
      >
        {(["structure", "latefee", "scholarship"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={activeTab === tab ? { backgroundColor: "#0F766E", color: "#fff" } : { color: "#64748B" }}
          >
            {tab === "structure" ? "Fee Structure" : tab === "latefee" ? "Late Fee Rules" : "Scholarship Rules"}
          </button>
        ))}
      </div>

      {activeTab === "structure" && (
        <div className="space-y-5">
          {/* Course + Year selector */}
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>Select Course</div>
                <div className="flex gap-2 flex-wrap">
                  {COURSES.map(c => {
                    const cc = COURSE_CONFIG[c];
                    const isActive = selectedCourse === c;
                    return (
                      <button
                        key={c}
                        onClick={() => { setSelectedCourse(c); setSelectedYear(1); }}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                        style={isActive
                          ? { background: cc.gradient, color: "#fff", borderColor: "transparent", boxShadow: `0 4px 12px ${cc.shadow}` }
                          : { backgroundColor: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94A3B8" }}>Year</div>
                <div className="flex gap-2">
                  {COURSE_YEARS[selectedCourse].map(y => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className="w-11 h-11 rounded-xl text-sm font-bold border transition-all"
                      style={selectedYear === y
                        ? { background: cfg.gradient, color: "#fff", borderColor: "transparent", boxShadow: `0 4px 10px ${cfg.shadow}` }
                        : { backgroundColor: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div
                className="ml-auto rounded-2xl p-5 text-white relative overflow-hidden"
                style={{ background: cfg.gradient, boxShadow: `0 6px 20px ${cfg.shadow}`, minWidth: "180px" }}
              >
                <GraduationCap size={56} className="absolute -right-2 -bottom-2 opacity-15" />
                <div className="text-white/75 text-xs font-bold uppercase tracking-wider mb-2">Annual Total</div>
                <div className="font-bold text-2xl tracking-tight">{formatINR(totalFee)}</div>
                <div className="text-white/60 text-xs mt-1">{selectedCourse} · Year {selectedYear}</div>
              </div>
            </div>
          </div>

          {/* Fee table */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}
          >
            <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <div>
                <h3 className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>
                  {selectedCourse} — Year {selectedYear}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Fee heads and annual amounts</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.30)" }}
              >
                <Plus size={15} /> Add Fee Head
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Fee Head</th>
                  <th className="text-right px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Annual Amount</th>
                  <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Effective From</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {fees.map((f, idx) => (
                  <tr
                    key={f.id}
                    className="transition-colors"
                    style={{ borderBottom: "1px solid #F1F5F9", backgroundColor: idx % 2 === 0 ? "#fff" : "#FAFBFC" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F0FDFA")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#FAFBFC")}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                          style={{ backgroundColor: `${cfg.color}15` }}
                        >
                          {HEAD_ICONS[f.head as FeeHead] || "💰"}
                        </div>
                        <span className="font-semibold text-[15px]" style={{ color: "#0F172A" }}>{f.head}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {editingId === f.id ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-36 text-right px-3 py-2 rounded-xl border text-base font-bold outline-none"
                          style={{ borderColor: cfg.color, color: "#0F172A" }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold text-[15px]" style={{ color: "#0F172A" }}>{formatINR(f.amount)}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                        style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}
                      >
                        {formatDate(f.effectiveFrom)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        {editingId === f.id ? (
                          <>
                            <button onClick={() => handleSave(f)} className="p-2 rounded-lg hover:bg-green-50 transition-colors" style={{ color: "#0F766E" }}><Save size={15} /></button>
                            <button onClick={() => setEditingId(null)} className="p-2 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#F97066" }}><X size={15} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(f.id); setEditAmount(String(f.amount)); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#64748B" }}><Edit2 size={15} /></button>
                            <button onClick={() => setShowHistory(showHistory === f.id ? null : f.id)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#64748B" }}><Clock size={15} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                <tr style={{ backgroundColor: `${cfg.color}10`, borderTop: `2px solid ${cfg.color}30` }}>
                  <td className="px-6 py-4 font-bold text-base" style={{ color: "#0F172A" }}>Total Annual Fee</td>
                  <td className="px-4 py-4 text-right font-bold text-xl" style={{ color: cfg.color }}>{formatINR(totalFee)}</td>
                  <td colSpan={2} />
                </tr>
              </tbody>
            </table>
          </div>

          {showHistory && (
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
              <h4 className="font-serif font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "#0F172A" }}>
                <Clock3 size={18} style={{ color: cfg.color }} /> Fee History — {fees.find(f => f.id === showHistory)?.head}
              </h4>
              <div className="space-y-0">
                {[
                  { date: "2022-07-01", amount: 38000 },
                  { date: "2023-07-01", amount: 41000 },
                  { date: "2024-07-01", amount: fees.find(f => f.id === showHistory)?.amount || 0 },
                ].map((h, i, arr) => (
                  <div key={i} className="flex items-center justify-between py-3.5 border-b last:border-0" style={{ borderColor: "#F1F5F9" }}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${i === arr.length - 1 ? "ring-2 ring-offset-2" : ""}`}
                        style={{ backgroundColor: i === arr.length - 1 ? cfg.color : "#CBD5E1" }} />
                      <span className="text-[15px]" style={{ color: "#64748B" }}>{formatDate(h.date)}</span>
                    </div>
                    <span className="font-bold text-[15px]" style={{ color: i === arr.length - 1 ? cfg.color : "#0F172A" }}>{formatINR(h.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "latefee" && (
        <div className="grid grid-cols-2 gap-5">
          <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <h3 className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>Late Fee Rule Editor</h3>
            {[
              { label: "Grace Period (days)", key: "graceDays", help: "No late fee charged within this many days after due date" },
              { label: "Rate per Day (₹)", key: "ratePerDay", help: undefined },
              { label: "Maximum Cap (₹)", key: "cap", help: "Late fee will not exceed this amount" },
            ].map(({ label, key, help }) => (
              <div key={key}>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>{label}</label>
                <input
                  type="number"
                  value={(lateFeeDraft as unknown as Record<string, number>)[key]}
                  onChange={e => setLateFeeDraft(p => ({ ...p, [key]: +e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-base outline-none"
                  style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}
                />
                {help && <p className="text-sm mt-1.5" style={{ color: "#94A3B8" }}>{help}</p>}
              </div>
            ))}
            <button
              onClick={() => { updateLateFeeRule(lateFeeDraft); toast({ title: "Late fee rule saved", variant: "success" }); }}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E", boxShadow: "0 4px 12px rgba(15,118,110,0.30)" }}
            >
              Save Rule
            </button>
          </div>

          <div className="rounded-2xl border p-6" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
            <h3 className="font-serif font-bold text-xl mb-6" style={{ color: "#0F172A" }}>Live Preview</h3>
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold" style={{ color: "#0F172A" }}>Days since due date</label>
                <span
                  className="text-sm font-bold px-3 py-1 rounded-lg"
                  style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}
                >
                  {sampleDays} days
                </span>
              </div>
              <input type="range" min={0} max={180} value={sampleDays} onChange={e => setSampleDays(+e.target.value)} className="w-full accent-teal-600" />
            </div>
            <div className="space-y-3 p-5 rounded-2xl" style={{ backgroundColor: "#F0FDFA" }}>
              <div className="flex justify-between text-base">
                <span style={{ color: "#475569" }}>Days overdue</span>
                <span className="font-semibold" style={{ color: "#0F172A" }}>{Math.max(0, sampleDays - lateFeeDraft.graceDays)} days</span>
              </div>
              <div className="flex justify-between text-base">
                <span style={{ color: "#475569" }}>Rate × days</span>
                <span className="font-semibold" style={{ color: "#0F172A" }}>
                  {formatINR(lateFeeDraft.ratePerDay)} × {Math.max(0, sampleDays - lateFeeDraft.graceDays)}
                </span>
              </div>
              <div className="border-t pt-4 flex justify-between items-center" style={{ borderColor: "#5EEAD4" }}>
                <span className="font-bold text-base" style={{ color: "#0F172A" }}>Late Fee Charged</span>
                <span className="font-bold text-2xl" style={{ color: lateFeePreview > 0 ? "#E11D48" : "#0F766E" }}>
                  {formatINR(lateFeePreview)}
                </span>
              </div>
              {lateFeePreview >= lateFeeDraft.cap && (
                <div className="text-sm text-center font-medium" style={{ color: "#F59E0B" }}>⚠ Cap of {formatINR(lateFeeDraft.cap)} applied</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "scholarship" && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#E2E8F0", boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
          <div className="px-6 py-5 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>Scholarship Rules</h3>
            <p className="text-base mt-1" style={{ color: "#64748B" }}>Auto-applied as line-item discounts at receipt time</p>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Category</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Applies To</th>
                <th className="text-left px-4 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Type</th>
                <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: "#94A3B8" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {scholarshipRules.map((r, idx) => {
                const catColors: Record<string, { bg: string; text: string }> = {
                  SC:  { bg: "#EFF6FF", text: "#1D4ED8" },
                  ST:  { bg: "#F5F3FF", text: "#6D28D9" },
                  OBC: { bg: "#FFFBEB", text: "#B45309" },
                  EWS: { bg: "#F0FDF4", text: "#15803D" },
                };
                const cs = catColors[r.category] ?? { bg: "#F0FDFA", text: "#0F766E" };
                return (
                  <tr key={r.id} className="transition-colors"
                    style={{ borderBottom: "1px solid #F1F5F9", backgroundColor: idx % 2 === 0 ? "#fff" : "#FAFBFC" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F0FDFA")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#FAFBFC")}>
                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-lg font-bold" style={{ backgroundColor: cs.bg, color: cs.text }}>{r.category}</span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-[15px]" style={{ color: "#0F172A" }}>{r.head}</td>
                    <td className="px-4 py-4 text-base" style={{ color: "#64748B" }}>
                      {r.type === "percent" ? "Percentage" : "Fixed Amount"}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-base" style={{ color: "#0F766E" }}>
                      {r.type === "percent" ? `${r.value}%` : formatINR(r.value)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Fee Head Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="rounded-2xl shadow-2xl p-6 w-96" style={{ backgroundColor: "#fff" }}>
            <h3 className="font-serif font-bold text-xl mb-1" style={{ color: "#0F172A" }}>Add Fee Head</h3>
            <p className="text-sm mb-5" style={{ color: "#64748B" }}>{selectedCourse} · Year {selectedYear}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Fee Head</label>
                <select value={newHead} onChange={e => setNewHead(e.target.value as FeeHead)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  {FEE_HEADS.map(h => <option key={h} value={h}>{HEAD_ICONS[h]} {h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "#0F172A" }}>Amount (₹)</label>
                <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                  placeholder="0" className="w-full px-3.5 py-2.5 rounded-xl border text-base outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-all"
                style={{ borderColor: "#E2E8F0", color: "#64748B" }}>Cancel</button>
              <button onClick={handleAdd}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-all"
                style={{ backgroundColor: "#0F766E" }}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
