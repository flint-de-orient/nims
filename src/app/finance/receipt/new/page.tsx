"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate, generateReceiptNumber } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Search, Plus, Minus, CheckCircle } from "lucide-react";
import type { FeeHead, PaymentMode } from "@/lib/types";

const FEE_HEADS: FeeHead[] = ["Tuition", "Hostel", "Lab", "Exam", "Library", "University", "Misc"];
const PAYMENT_MODES: PaymentMode[] = ["Cash", "UPI", "Card", "Net Banking", "Cheque"];

function NewReceiptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledStudentId = searchParams.get("student");
  const { students, feeStructures, receipts, scholarshipRules, nextReceiptSeq, addReceipt, userName, defaulters } = useNIMSStore();
  const { toast } = useToast();

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(prefilledStudentId);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedHeads, setSelectedHeads] = useState<Record<FeeHead, { selected: boolean; amount: number; scholarship: number }>>({} as Record<FeeHead, { selected: boolean; amount: number; scholarship: number }>);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [newReceiptId, setNewReceiptId] = useState<string | null>(null);

  const student = students.find(s => s.id === selectedStudentId);

  const filteredStudents = useMemo(() =>
    students.filter(s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 8),
    [students, studentSearch]
  );

  const fees = useMemo(() =>
    student ? feeStructures.filter(f => f.course === student.course && f.year === student.year) : [],
    [student, feeStructures]
  );

  // Auto-populate fee heads when student selected
  useEffect(() => {
    if (!student) return;
    const heads: Record<FeeHead, { selected: boolean; amount: number; scholarship: number }> = {} as Record<FeeHead, { selected: boolean; amount: number; scholarship: number }>;
    FEE_HEADS.forEach(h => {
      const feeEntry = fees.find(f => f.head === h);
      if (!feeEntry || feeEntry.amount === 0) {
        heads[h] = { selected: false, amount: 0, scholarship: 0 };
        return;
      }
      const paidForHead = receipts.filter(r => r.studentId === student.id).reduce((sum, r) => {
        const entry = r.heads.find(rh => rh.head === h);
        return sum + (entry ? entry.amount : 0);
      }, 0);
      const schRule = scholarshipRules.find(r => (r.head === h || r.head === "All") && r.category === student.category);
      let discount = 0;
      if (schRule) {
        discount = schRule.type === "percent" ? Math.round(feeEntry.amount * schRule.value / 100) : schRule.value;
      }
      const payable = feeEntry.amount - discount;
      const due = Math.max(0, payable - paidForHead);
      heads[h] = { selected: due > 0, amount: due, scholarship: discount };
    });
    setSelectedHeads(heads);
  }, [student?.id, fees.length]);

  const totalAmount = useMemo(() =>
    Object.entries(selectedHeads)
      .filter(([, v]) => v.selected)
      .reduce((sum, [, v]) => sum + v.amount, 0),
    [selectedHeads]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) { toast({ title: "Please select a student", variant: "destructive" }); return; }
    if (totalAmount <= 0) { toast({ title: "No amount to collect", variant: "destructive" }); return; }
    if (["UPI", "Card", "Net Banking", "Cheque"].includes(paymentMode) && !referenceNumber) {
      toast({ title: "Reference number required for " + paymentMode, variant: "destructive" }); return;
    }

    const id = `r${Date.now()}`;
    const receiptNumber = generateReceiptNumber(nextReceiptSeq);
    const headsArr = FEE_HEADS
      .filter(h => selectedHeads[h]?.selected && selectedHeads[h]?.amount > 0)
      .map(h => ({
        head: h,
        amount: selectedHeads[h].amount,
        ...(selectedHeads[h].scholarship > 0 ? { scholarship: selectedHeads[h].scholarship } : {}),
      }));

    addReceipt({
      id,
      receiptNumber,
      studentId: student.id,
      date: new Date().toISOString().split("T")[0],
      heads: headsArr,
      totalAmount,
      paymentMode,
      ...(referenceNumber ? { referenceNumber } : {}),
      ...(remarks ? { remarks } : {}),
      createdBy: userName,
    });

    setNewReceiptId(id);
    setSubmitted(true);
    toast({ title: "Receipt created!", description: `${receiptNumber} — ${formatINR(totalAmount)}`, variant: "success" });
  };

  if (submitted && newReceiptId) {
    return (
      <div className="max-w-md mx-auto mt-12 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#F0FDFA" }}>
          <CheckCircle size={32} style={{ color: "#0F766E" }} />
        </div>
        <h2 className="font-serif font-bold text-2xl mb-2" style={{ color: "#0F172A" }}>Payment Recorded!</h2>
        <p className="text-sm mb-6" style={{ color: "#475569" }}>
          Receipt generated for {student?.name}. Amount: {formatINR(totalAmount)}
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push(`/finance/receipt/${newReceiptId}`)}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0F766E" }}>
            View Receipt
          </button>
          <button onClick={() => { setSubmitted(false); setSelectedStudentId(null); setStudentSearch(""); }}
            className="px-6 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}>
            New Receipt
          </button>
          <button onClick={() => router.push("/finance")}
            className="px-6 py-2.5 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}>
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      {/* Step 1: Student Lookup */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
        <h3 className="font-serif font-semibold mb-4 flex items-center gap-2" style={{ color: "#0F172A" }}>
          <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#0F766E" }}>1</span>
          Student
        </h3>
        {!student ? (
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5" style={{ color: "#475569" }} />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={studentSearch}
              onChange={e => { setStudentSearch(e.target.value); setShowDropdown(true); }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0" }}
            />
            {showDropdown && filteredStudents.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg z-20 overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
                {filteredStudents.map(s => (
                  <button key={s.id} type="button"
                    onClick={() => { setSelectedStudentId(s.id); setStudentSearch(s.name); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-0 flex items-center justify-between"
                    style={{ borderColor: "#f1f5f9" }}>
                    <div>
                      <div className="font-medium text-sm" style={{ color: "#0F172A" }}>{s.name}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{s.rollNo} · {s.course} Yr {s.year}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      defaulters.find(d => d.studentId === s.id) ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
                    }`}>
                      {defaulters.find(d => d.studentId === s.id) ? "Overdue" : "OK"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "#F0FDFA" }}>
            <div>
              <div className="font-semibold" style={{ color: "#0F172A" }}>{student.name}</div>
              <div className="text-sm" style={{ color: "#475569" }}>{student.rollNo} · {student.course} Year {student.year} · {student.category}</div>
            </div>
            <button type="button" onClick={() => { setSelectedStudentId(null); setStudentSearch(""); }}
              className="text-xs px-2.5 py-1 rounded-lg border hover:bg-white transition-all"
              style={{ borderColor: "#0F766E", color: "#0F766E" }}>
              Change
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Fee Heads */}
      {student && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4 flex items-center gap-2" style={{ color: "#0F172A" }}>
            <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#0F766E" }}>2</span>
            Fee Heads
          </h3>
          <div className="space-y-3">
            {FEE_HEADS.map(h => {
              const headData = selectedHeads[h];
              if (!headData || (headData.amount === 0 && !headData.selected)) return null;
              return (
                <div key={h} className="flex items-center gap-4 p-3 rounded-xl border transition-all"
                  style={{ borderColor: headData.selected ? "#0F766E" : "#E2E8F0", backgroundColor: headData.selected ? "#F0FDFA" : "white" }}>
                  <input type="checkbox" checked={headData.selected} onChange={e => setSelectedHeads(p => ({ ...p, [h]: { ...p[h], selected: e.target.checked } }))}
                    className="w-4 h-4 rounded accent-teal-600 cursor-pointer" />
                  <div className="flex-1">
                    <div className="font-medium text-sm" style={{ color: "#0F172A" }}>{h}</div>
                    {headData.scholarship > 0 && (
                      <div className="text-xs" style={{ color: "#0F766E" }}>Scholarship: -{formatINR(headData.scholarship)}</div>
                    )}
                  </div>
                  <input
                    type="number"
                    value={headData.amount}
                    onChange={e => setSelectedHeads(p => ({ ...p, [h]: { ...p[h], amount: +e.target.value } }))}
                    disabled={!headData.selected}
                    className="w-32 text-right px-3 py-1.5 rounded-lg border text-sm outline-none disabled:opacity-50 disabled:bg-gray-50"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
            <span className="font-semibold" style={{ color: "#0F172A" }}>Total Amount</span>
            <span className="text-xl font-serif font-bold" style={{ color: "#0F766E" }}>{formatINR(totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Step 3: Payment Mode */}
      {student && (
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4 flex items-center gap-2" style={{ color: "#0F172A" }}>
            <span className="w-6 h-6 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#0F766E" }}>3</span>
            Payment Details
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#0F172A" }}>Payment Mode</label>
              <div className="flex gap-2 flex-wrap">
                {PAYMENT_MODES.map(m => (
                  <button key={m} type="button" onClick={() => setPaymentMode(m)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                    style={paymentMode === m
                      ? { backgroundColor: "#0F766E", color: "white", borderColor: "#0F766E" }
                      : { borderColor: "#E2E8F0", color: "#475569" }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {["UPI", "Card", "Net Banking", "Cheque"].includes(paymentMode) && (
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                  Reference / Transaction Number <span style={{ color: "#F97066" }}>*</span>
                </label>
                <input type="text" value={referenceNumber} onChange={e => setReferenceNumber(e.target.value)}
                  placeholder={paymentMode === "Cheque" ? "Cheque number" : "Transaction ID"}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "#E2E8F0" }} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>Remarks (optional)</label>
              <input type="text" value={remarks} onChange={e => setRemarks(e.target.value)}
                placeholder="Any notes..."
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "#E2E8F0" }} />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      {student && (
        <div className="flex gap-3">
          <button type="submit"
            className="flex-1 py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-all text-base"
            style={{ backgroundColor: "#0F766E" }}>
            Generate Receipt — {formatINR(totalAmount)}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}>
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}

export default function NewReceiptPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <NewReceiptContent />
    </Suspense>
  );
}
