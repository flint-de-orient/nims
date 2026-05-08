"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { ArrowLeft, CreditCard, Receipt, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";

type DueBucket = "0-30" | "31-60" | "61-90" | "90+";

export default function StudentLedgerDetail() {
  const { id } = useParams<{ id: string }>();
  const { students, receipts, feeStructures, scholarshipRules, defaulters } = useNIMSStore();

  const student = students.find(s => s.id === id);
  const studentReceipts = receipts.filter(r => r.studentId === id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const fees = feeStructures.filter(f => student && f.course === student.course && f.year === student.year);
  const defaulter = defaulters.find(d => d.studentId === id);

  const scholarships = useMemo(() => {
    if (!student) return [];
    return scholarshipRules.filter(r =>
      r.category === student.category || r.category === "Merit"
    );
  }, [student, scholarshipRules]);

  const feeBreakdown = useMemo(() => {
    return fees.map(f => {
      const schRule = scholarships.find(r => r.head === f.head || r.head === "All");
      let discount = 0;
      if (schRule) {
        discount = schRule.type === "percent" ? Math.round(f.amount * schRule.value / 100) : schRule.value;
      }
      const payable = f.amount - discount;
      const paid = studentReceipts.reduce((sum, r) => {
        const head = r.heads.find(h => h.head === f.head);
        return sum + (head ? head.amount : 0);
      }, 0);
      const due = Math.max(0, payable - paid);
      return { ...f, discount, payable, paid, due };
    });
  }, [fees, scholarships, studentReceipts]);

  const totalPayable = feeBreakdown.reduce((s, f) => s + f.payable, 0);
  const totalPaid = feeBreakdown.reduce((s, f) => s + f.paid, 0);
  const totalDue = feeBreakdown.reduce((s, f) => s + f.due, 0);
  const totalDiscount = feeBreakdown.reduce((s, f) => s + f.discount, 0);

  const dueBuckets: Record<DueBucket, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  if (defaulter) {
    const days = defaulter.overdueDays;
    if (days <= 30) dueBuckets["0-30"] = defaulter.overdueAmount;
    else if (days <= 60) dueBuckets["31-60"] = defaulter.overdueAmount;
    else if (days <= 90) dueBuckets["61-90"] = defaulter.overdueAmount;
    else dueBuckets["90+"] = defaulter.overdueAmount;
  }

  if (!student) return (
    <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E2E8F0" }}>
      <p style={{ color: "#475569" }}>Student not found.</p>
      <Link href="/finance/ledger" className="text-sm mt-2 inline-flex items-center gap-1 hover:underline" style={{ color: "#0F766E" }}>
        <ArrowLeft size={14} /> Back to Ledger
      </Link>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/finance/ledger" className="flex items-center gap-2 text-sm hover:underline" style={{ color: "#475569" }}>
          <ArrowLeft size={16} /> Back to Ledger
        </Link>
        <Link href={`/finance/receipt/new?student=${student.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
          style={{ backgroundColor: "#0F766E" }}>
          <CreditCard size={16} /> Take Payment
        </Link>
      </div>

      {/* Student profile card */}
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: "#0F766E" }}>
            {student.name.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div>
              <div className="font-serif font-bold text-xl" style={{ color: "#0F172A" }}>{student.name}</div>
              <div className="text-sm mt-0.5" style={{ color: "#475569" }}>{student.rollNo}</div>
              <div className="text-sm mt-1" style={{ color: "#475569" }}>{student.course} · Year {student.year}</div>
            </div>
            <div className="space-y-1 text-sm">
              <div><span style={{ color: "#475569" }}>Category: </span><span className="font-medium" style={{ color: "#0F172A" }}>{student.category}</span></div>
              <div><span style={{ color: "#475569" }}>Phone: </span><span style={{ color: "#0F172A" }}>{student.phone}</span></div>
              <div><span style={{ color: "#475569" }}>Admission: </span><span style={{ color: "#0F172A" }}>{formatDate(student.admissionDate)}</span></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: "#F0FDFA" }}>
                <div className="text-xs" style={{ color: "#475569" }}>Total Fee</div>
                <div className="font-bold mt-1" style={{ color: "#0F766E" }}>{formatINR(totalPayable)}</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: "#F0FDFA" }}>
                <div className="text-xs" style={{ color: "#475569" }}>Paid</div>
                <div className="font-bold mt-1" style={{ color: "#0F766E" }}>{formatINR(totalPaid)}</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ backgroundColor: totalDue > 0 ? "#FFF1F0" : "#F0FDFA" }}>
                <div className="text-xs" style={{ color: "#475569" }}>Balance</div>
                <div className="font-bold mt-1" style={{ color: totalDue > 0 ? "#F97066" : "#0F766E" }}>
                  {totalDue > 0 ? formatINR(totalDue) : "Clear"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Fee breakdown */}
        <div className="col-span-2 bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Fee Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Head</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Charged</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Scholarship</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Payable</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Paid</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Due</th>
              </tr>
            </thead>
            <tbody>
              {feeBreakdown.map(f => (
                <tr key={f.id} className="border-t" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-2.5 font-medium" style={{ color: "#0F172A" }}>{f.head}</td>
                  <td className="px-4 py-2.5 text-right text-sm" style={{ color: "#475569" }}>{formatINR(f.amount)}</td>
                  <td className="px-4 py-2.5 text-right text-sm" style={{ color: f.discount > 0 ? "#0F766E" : "#475569" }}>
                    {f.discount > 0 ? `-${formatINR(f.discount)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: "#0F172A" }}>{formatINR(f.payable)}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: "#0F766E" }}>{formatINR(f.paid)}</td>
                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: f.due > 0 ? "#F97066" : "#0F766E" }}>
                    {f.due > 0 ? formatINR(f.due) : "✓"}
                  </td>
                </tr>
              ))}
              <tr className="border-t" style={{ borderColor: "#E2E8F0", backgroundColor: "#F0FDFA" }}>
                <td className="px-5 py-3 font-bold" style={{ color: "#0F172A" }}>Total</td>
                <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "#475569" }}>{formatINR(totalPayable + totalDiscount)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold" style={{ color: "#0F766E" }}>{totalDiscount > 0 ? `-${formatINR(totalDiscount)}` : "—"}</td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: "#0F172A" }}>{formatINR(totalPayable)}</td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: "#0F766E" }}>{formatINR(totalPaid)}</td>
                <td className="px-4 py-3 text-right font-bold" style={{ color: totalDue > 0 ? "#F97066" : "#0F766E" }}>
                  {totalDue > 0 ? formatINR(totalDue) : "Clear"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Age-wise dues + side info */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Age-wise Dues</h3>
            <div className="space-y-3">
              {(["0-30","31-60","61-90","90+"] as DueBucket[]).map(bucket => {
                const colors = { "0-30": "#F59E0B", "31-60": "#F97066", "61-90": "#ef4444", "90+": "#dc2626" };
                const amount = dueBuckets[bucket];
                return (
                  <div key={bucket}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: "#475569" }}>{bucket} days</span>
                      <span className="font-semibold" style={{ color: amount > 0 ? colors[bucket] : "#0F766E" }}>
                        {amount > 0 ? formatINR(amount) : "Clear"}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: totalDue > 0 ? `${(amount / totalDue) * 100}%` : "0%",
                        backgroundColor: colors[bucket],
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Payment History</h3>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>
            {studentReceipts.length} receipts
          </span>
        </div>
        {studentReceipts.length === 0 ? (
          <div className="px-5 py-8 text-center" style={{ color: "#475569" }}>No payments recorded</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#f8fafc" }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Receipt No.</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Date</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Heads</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Mode</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Amount</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {studentReceipts.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-5 py-3">
                    <Link href={`/finance/receipt/${r.id}`} className="font-medium hover:underline" style={{ color: "#0F766E" }}>
                      {r.receiptNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3" style={{ color: "#475569" }}>{formatDate(r.date)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.heads.map(h => (
                        <span key={h.head} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {h.head}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0FDFA", color: "#0F766E" }}>
                      {r.paymentMode}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold" style={{ color: "#0F766E" }}>{formatINR(r.totalAmount)}</td>
                  <td className="px-5 py-3">
                    <Link href={`/finance/receipt/${r.id}`}
                      className="text-xs px-2.5 py-1.5 rounded-lg border font-medium hover:bg-gray-50 transition-all flex items-center gap-1"
                      style={{ borderColor: "#E2E8F0", color: "#475569" }}>
                      <Receipt size={12} /> View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
