"use client";
import { useParams, useRouter } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate, numberToWordsIN } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Printer, Mail, MessageCircle, ArrowLeft, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function ReceiptViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { receipts, students } = useNIMSStore();
  const { toast } = useToast();

  const receipt = receipts.find(r => r.id === id);
  const student = receipt ? students.find(s => s.id === receipt.studentId) : null;

  if (!receipt || !student) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center" style={{ borderColor: "#E2E8F0" }}>
        <p style={{ color: "#475569" }}>Receipt not found.</p>
        <button onClick={() => router.back()} className="text-sm mt-2 hover:underline" style={{ color: "#0F766E" }}>Go back</button>
      </div>
    );
  }

  const verifyUrl = `https://nims.noujan.edu.in/verify/${receipt.receiptNumber}`;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm hover:underline" style={{ color: "#475569" }}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => toast({ title: "Email sent", description: `Receipt emailed to ${student.email}`, variant: "success" })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#475569" }}>
            <Mail size={15} /> Email
          </button>
          <button
            onClick={() => toast({ title: "WhatsApp sent", description: `Receipt sent to ${student.phone}`, variant: "success" })}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 transition-all"
            style={{ borderColor: "#E2E8F0", color: "#25D366" }}>
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0F766E" }}>
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* Receipt — printable */}
      <div id="print-receipt"
        className="bg-white border rounded-2xl overflow-hidden shadow-sm"
        style={{ borderColor: "#E2E8F0" }}>

        {/* Header stripe */}
        <div className="px-8 py-6 text-white" style={{ backgroundColor: "#0B3D3A" }}>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif font-bold text-xl leading-tight">Noujan Institute of Nursing</h1>
              <p className="text-sm mt-1 opacity-80">Beleghata, Kolkata — 700 010, West Bengal</p>
              <p className="text-xs mt-0.5 opacity-60">Phone: 033-2323-4567 · Email: admin@noujan.edu.in</p>
              <p className="text-xs mt-0.5 opacity-60">Recognized by INC, New Delhi · Affiliated to WBUHS</p>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-60 mb-1">RECEIPT</div>
              <div className="font-mono font-bold text-base" style={{ color: "#5EEAD4" }}>{receipt.receiptNumber}</div>
              <div className="text-xs opacity-70 mt-1">{formatDate(receipt.date)}</div>
            </div>
          </div>
        </div>

        {/* Divider with ORIGINAL watermark */}
        <div className="px-8 py-2 flex items-center justify-between border-b" style={{ backgroundColor: "#F0FDFA", borderColor: "#5EEAD4" }}>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#0F766E" }}>Student Fee Receipt — Original</span>
          <span className="text-xs" style={{ color: "#475569" }}>AY 2025-26</span>
        </div>

        {/* Student info */}
        <div className="px-8 py-5">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Student Name</span>
                <span className="font-semibold" style={{ color: "#0F172A" }}>{student.name}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Roll No.</span>
                <span style={{ color: "#0F172A" }}>{student.rollNo}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Course</span>
                <span style={{ color: "#0F172A" }}>{student.course} — Year {student.year}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Category</span>
                <span style={{ color: "#0F172A" }}>{student.category}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Payment Mode</span>
                <span className="font-semibold" style={{ color: "#0F172A" }}>{receipt.paymentMode}</span>
              </div>
              {receipt.referenceNumber && (
                <div className="flex gap-3 text-sm">
                  <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Ref. No.</span>
                  <span className="font-mono" style={{ color: "#0F172A" }}>{receipt.referenceNumber}</span>
                </div>
              )}
              <div className="flex gap-3 text-sm">
                <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Receipt Date</span>
                <span style={{ color: "#0F172A" }}>{formatDate(receipt.date)}</span>
              </div>
              {receipt.remarks && (
                <div className="flex gap-3 text-sm">
                  <span className="w-28 flex-shrink-0 font-medium" style={{ color: "#475569" }}>Remarks</span>
                  <span style={{ color: "#0F172A" }}>{receipt.remarks}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fee table */}
        <div className="px-8">
          <table className="w-full text-sm border rounded-lg overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
            <thead>
              <tr style={{ backgroundColor: "#0F766E" }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">Fee Head</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">Gross (₹)</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">Scholarship (₹)</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white">Net (₹)</th>
              </tr>
            </thead>
            <tbody>
              {receipt.heads.map((h, i) => (
                <tr key={i} className="border-t" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-4 py-2.5" style={{ color: "#0F172A" }}>{h.head}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: "#475569" }}>
                    {h.scholarship ? formatINR(h.amount + h.scholarship) : formatINR(h.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ color: "#0F766E" }}>
                    {h.scholarship ? formatINR(h.scholarship) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: "#0F172A" }}>
                    {formatINR(h.amount)}
                  </td>
                </tr>
              ))}
              {receipt.lateFee && receipt.lateFee > 0 && (
                <tr className="border-t" style={{ borderColor: "#f1f5f9" }}>
                  <td className="px-4 py-2.5" style={{ color: "#F97066" }}>Late Fee</td>
                  <td colSpan={2}></td>
                  <td className="px-4 py-2.5 text-right font-medium" style={{ color: "#F97066" }}>{formatINR(receipt.lateFee)}</td>
                </tr>
              )}
              <tr style={{ backgroundColor: "#0B3D3A" }}>
                <td className="px-4 py-3 font-bold text-white" colSpan={3}>TOTAL AMOUNT</td>
                <td className="px-4 py-3 text-right font-bold text-white text-base">{formatINR(receipt.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Amount in words */}
        <div className="px-8 py-4">
          <div className="text-sm font-medium" style={{ color: "#475569" }}>Amount in Words:</div>
          <div className="font-semibold mt-1 italic" style={{ color: "#0F172A" }}>
            {numberToWordsIN(receipt.totalAmount)}
          </div>
        </div>

        {/* Signatures + QR */}
        <div className="px-8 pb-6">
          <div className="flex items-end justify-between">
            <div className="flex gap-12">
              <div className="text-center">
                <div className="h-10 border-b mb-2" style={{ borderColor: "#E2E8F0", width: 100 }}></div>
                <div className="text-xs font-medium" style={{ color: "#475569" }}>Cashier</div>
              </div>
              <div className="text-center">
                <div className="h-10 border-b mb-2" style={{ borderColor: "#E2E8F0", width: 100 }}></div>
                <div className="text-xs font-medium" style={{ color: "#475569" }}>Accountant</div>
              </div>
              <div className="text-center">
                <div className="h-10 border-b mb-2" style={{ borderColor: "#E2E8F0", width: 120 }}></div>
                <div className="text-xs font-medium" style={{ color: "#475569" }}>Authorised Signatory</div>
              </div>
            </div>
            <div className="text-center">
              <QRCodeSVG value={verifyUrl} size={72} level="M"
                fgColor="#0B3D3A" bgColor="white" />
              <div className="text-xs mt-1.5" style={{ color: "#475569" }}>Scan to verify</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-3 text-center text-xs border-t" style={{ borderColor: "#E2E8F0", color: "#475569", backgroundColor: "#f8fafc" }}>
          This is a computer-generated receipt. Valid without physical signature when digitally verified.
          · Verify at: {verifyUrl}
        </div>
      </div>
    </div>
  );
}
