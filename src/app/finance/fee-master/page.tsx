"use client";
import { useState, useMemo } from "react";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Edit2, Plus, Clock, ChevronDown, ChevronRight, Save, X } from "lucide-react";
import type { FeeHead, Course, Year, FeeStructure, LateFeeRule } from "@/lib/types";

const COURSES: Course[] = ["GNM", "B.Sc Nursing", "P.B. B.Sc", "M.Sc Nursing"];
const FEE_HEADS: FeeHead[] = ["Tuition", "Hostel", "Lab", "Exam", "Library", "University", "Misc"];
const YEARS: Year[] = [1, 2, 3, 4];

const COURSE_YEARS: Record<Course, Year[]> = {
  "GNM": [1, 2, 3],
  "B.Sc Nursing": [1, 2, 3, 4],
  "P.B. B.Sc": [1, 2],
  "M.Sc Nursing": [1, 2],
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

  const handleEdit = (f: FeeStructure) => {
    setEditingId(f.id);
    setEditAmount(String(f.amount));
  };

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
    const id = `f${Date.now()}`;
    addFeeStructure({ id, course: selectedCourse, year: selectedYear, head: newHead, amount, effectiveFrom: new Date().toISOString().split("T")[0] });
    setShowAddModal(false);
    setNewAmount("");
    toast({ title: "Fee head added", variant: "success" });
  };

  const lateFeePreview = useMemo(() => {
    const overDays = Math.max(0, sampleDays - lateFeeDraft.graceDays);
    const fee = Math.min(overDays * lateFeeDraft.ratePerDay, lateFeeDraft.cap);
    return fee;
  }, [lateFeeDraft, sampleDays]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border p-1.5" style={{ borderColor: "#E2E8F0" }}>
        {(["structure", "latefee", "scholarship"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "text-white" : "hover:bg-gray-50"}`}
            style={activeTab === tab ? { backgroundColor: "#0F766E" } : { color: "#475569" }}>
            {tab === "structure" ? "Fee Structure" : tab === "latefee" ? "Late Fee Rules" : "Scholarship Rules"}
          </button>
        ))}
      </div>

      {activeTab === "structure" && (
        <div className="space-y-4">
          {/* Course + Year selector */}
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#475569" }}>Course</label>
                <div className="flex gap-2">
                  {COURSES.map(c => (
                    <button key={c} onClick={() => { setSelectedCourse(c); setSelectedYear(1); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${selectedCourse === c ? "text-white border-transparent" : "hover:bg-gray-50"}`}
                      style={selectedCourse === c ? { backgroundColor: "#0F766E", borderColor: "#0F766E" } : { borderColor: "#E2E8F0", color: "#475569" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#475569" }}>Year</label>
                <div className="flex gap-2">
                  {COURSE_YEARS[selectedCourse].map(y => (
                    <button key={y} onClick={() => setSelectedYear(y)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium border transition-all ${selectedYear === y ? "text-white border-transparent" : "hover:bg-gray-50"}`}
                      style={selectedYear === y ? { backgroundColor: "#0F766E", borderColor: "#0F766E" } : { borderColor: "#E2E8F0", color: "#475569" }}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <div className="ml-auto">
                <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#475569" }}>Annual Total</div>
                <div className="text-2xl font-serif font-bold" style={{ color: "#0F766E" }}>{formatINR(totalFee)}</div>
              </div>
            </div>
          </div>

          {/* Fee table */}
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>
                {selectedCourse} — Year {selectedYear} Fee Heads
              </h3>
              <button onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#0F766E" }}>
                <Plus size={14} /> Add Fee Head
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Fee Head</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Amount (₹)</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Effective From</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                    <td className="px-5 py-3">
                      <span className="font-medium" style={{ color: "#0F172A" }}>{f.head}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {editingId === f.id ? (
                        <input
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-32 text-right px-2 py-1 rounded border text-sm outline-none"
                          style={{ borderColor: "#0F766E" }}
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold" style={{ color: "#0F172A" }}>{formatINR(f.amount)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>
                        {formatDate(f.effectiveFrom)}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {editingId === f.id ? (
                          <>
                            <button onClick={() => handleSave(f)} className="p-1.5 rounded hover:bg-green-50 transition-colors" style={{ color: "#0F766E" }}><Save size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-red-50 transition-colors" style={{ color: "#F97066" }}><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(f)} className="p-1.5 rounded hover:bg-gray-100 transition-colors" style={{ color: "#475569" }}><Edit2 size={14} /></button>
                            <button onClick={() => setShowHistory(showHistory === f.id ? null : f.id)} className="p-1.5 rounded hover:bg-gray-100 transition-colors" style={{ color: "#475569" }}><Clock size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="border-t" style={{ borderColor: "#E2E8F0", backgroundColor: "#F0FDFA" }}>
                  <td className="px-5 py-3 font-bold" style={{ color: "#0F172A" }}>Total Annual Fee</td>
                  <td className="px-5 py-3 text-right font-bold text-lg" style={{ color: "#0F766E" }}>{formatINR(totalFee)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* History drawer mock */}
          {showHistory && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
              <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "#0F172A" }}>
                <Clock size={16} style={{ color: "#475569" }} /> Fee History — {fees.find(f => f.id === showHistory)?.head}
              </h4>
              <div className="space-y-2">
                {[
                  { date: "2022-07-01", amount: 38000 },
                  { date: "2023-07-01", amount: 41000 },
                  { date: "2024-07-01", amount: fees.find(f => f.id === showHistory)?.amount || 0 },
                ].map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "#f1f5f9" }}>
                    <span className="text-sm" style={{ color: "#475569" }}>{formatDate(h.date)}</span>
                    <span className="font-semibold text-sm" style={{ color: "#0F172A" }}>{formatINR(h.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "latefee" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-6 space-y-5" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Late Fee Rule Editor</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Grace Period (days)</label>
              <input type="number" value={lateFeeDraft.graceDays} onChange={e => setLateFeeDraft(p => ({ ...p, graceDays: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              <p className="text-xs mt-1" style={{ color: "#475569" }}>No late fee charged within this many days after due date</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Rate per Day (₹)</label>
              <input type="number" value={lateFeeDraft.ratePerDay} onChange={e => setLateFeeDraft(p => ({ ...p, ratePerDay: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Maximum Cap (₹)</label>
              <input type="number" value={lateFeeDraft.cap} onChange={e => setLateFeeDraft(p => ({ ...p, cap: +e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              <p className="text-xs mt-1" style={{ color: "#475569" }}>Late fee will not exceed this amount</p>
            </div>
            <button onClick={() => { updateLateFeeRule(lateFeeDraft); toast({ title: "Late fee rule saved", variant: "success" }); }}
              className="w-full py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
              style={{ backgroundColor: "#0F766E" }}>
              Save Rule
            </button>
          </div>

          <div className="bg-white rounded-xl border p-6" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold mb-5" style={{ color: "#0F172A" }}>Live Preview</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Days since due date</label>
              <input type="range" min={0} max={180} value={sampleDays} onChange={e => setSampleDays(+e.target.value)} className="w-full accent-teal-600" />
              <div className="text-center text-sm mt-1" style={{ color: "#475569" }}>{sampleDays} days</div>
            </div>
            <div className="space-y-3 p-4 rounded-xl" style={{ backgroundColor: "#F0FDFA" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#475569" }}>Days overdue</span>
                <span className="font-medium" style={{ color: "#0F172A" }}>{Math.max(0, sampleDays - lateFeeDraft.graceDays)} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#475569" }}>Rate × days</span>
                <span className="font-medium" style={{ color: "#0F172A" }}>
                  {formatINR(lateFeeDraft.ratePerDay)} × {Math.max(0, sampleDays - lateFeeDraft.graceDays)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between" style={{ borderColor: "#5EEAD4" }}>
                <span className="font-semibold" style={{ color: "#0F172A" }}>Late Fee Charged</span>
                <span className="font-bold text-lg" style={{ color: lateFeePreview > 0 ? "#F97066" : "#0F766E" }}>
                  {formatINR(lateFeePreview)}
                </span>
              </div>
              {lateFeePreview >= lateFeeDraft.cap && (
                <div className="text-xs text-center" style={{ color: "#F59E0B" }}>⚠ Cap of {formatINR(lateFeeDraft.cap)} applied</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "scholarship" && (
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Scholarship Rules</h3>
            <p className="text-sm mt-1" style={{ color: "#475569" }}>These rules auto-apply as line-item discounts at receipt time</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Category</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Applies To</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Type</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {scholarshipRules.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      r.category === "SC" ? "bg-blue-50 text-blue-700" :
                      r.category === "ST" ? "bg-purple-50 text-purple-700" :
                      r.category === "OBC" ? "bg-amber-50 text-amber-700" :
                      r.category === "EWS" ? "bg-green-50 text-green-700" :
                      "bg-teal-50 text-teal-700"
                    }`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium" style={{ color: "#0F172A" }}>{r.head}</td>
                  <td className="px-5 py-3" style={{ color: "#475569" }}>
                    {r.type === "percent" ? "Percentage" : "Fixed Amount"}
                  </td>
                  <td className="px-5 py-3 text-right font-bold" style={{ color: "#0F766E" }}>
                    {r.type === "percent" ? `${r.value}%` : formatINR(r.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Fee Head Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h3 className="font-serif font-bold text-lg mb-4" style={{ color: "#0F172A" }}>Add Fee Head</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Fee Head</label>
                <select value={newHead} onChange={e => setNewHead(e.target.value as FeeHead)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                  {FEE_HEADS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Amount (₹)</label>
                <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
                  placeholder="0" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all" style={{ borderColor: "#E2E8F0", color: "#475569" }}>
                Cancel
              </button>
              <button onClick={handleAdd}
                className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all" style={{ backgroundColor: "#0F766E" }}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
