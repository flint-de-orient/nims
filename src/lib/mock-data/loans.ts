import type { Loan, LoanRepayment, PaymentMode } from "../types";

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function makeRepayments(
  loanId: string,
  amount: number,
  startDate: string,
  count: number,
  paidCount: number,
  overdueCount: number,
  payModes: PaymentMode[] = ["Cash", "UPI", "Cheque", "Net Banking"],
): LoanRepayment[] {
  const base = Math.floor(amount / count);
  return Array.from({ length: count }, (_, i) => {
    const dueDate = addMonths(startDate, i);
    const principal = i === count - 1 ? amount - base * (count - 1) : base;
    const isPaid = i < paidCount;
    const isOverdue = !isPaid && i < paidCount + overdueCount;

    if (isPaid) {
      const paidD = addMonths(startDate, i);   // paid within the same month
      const paidDate = paidD.slice(0, 8) + String(Math.min(28, parseInt(paidD.slice(8)) + (i % 4) + 2)).padStart(2, "0");
      return {
        id: `${loanId}-r${i + 1}`,
        loanId,
        installmentNo: i + 1,
        dueDate,
        principalDue: principal,
        interestDue: 0,
        paidDate,
        paidAmount: principal,
        paymentMode: payModes[i % payModes.length],
        referenceNumber: `TXN/${loanId.toUpperCase()}/${String(i + 1).padStart(3, "0")}`,
        status: "Paid" as const,
      };
    }
    return {
      id: `${loanId}-r${i + 1}`,
      loanId,
      installmentNo: i + 1,
      dueDate,
      principalDue: principal,
      interestDue: 0,
      status: (isOverdue ? "Overdue" : "Upcoming") as RepaymentStatus,
    };
  });
}

type RepaymentStatus = "Upcoming" | "Paid" | "Overdue" | "Partial";

export const mockLoans: Loan[] = [
  {
    id: "loan-001",
    lenderName: "Md. Nasiruddin",
    lenderType: "Trustee",
    relationship: "Managing Trustee",
    phone: "9830001001",
    amount: 500000,
    dateReceived: "2025-01-10",
    purpose: "Operating capital for new academic session — lab upgrades and hostel renovation",
    interestRate: 0,
    tenureMonths: 24,
    repaymentStartDate: "2025-02-01",
    status: "Active",
    notes: "Interest-free personal loan from Managing Trustee. Repayment to be completed before March 2027.",
  },
  {
    id: "loan-002",
    lenderName: "Renu Devi Agarwal",
    lenderType: "Committee Member",
    relationship: "Finance Committee Chair",
    phone: "9830002002",
    amount: 200000,
    dateReceived: "2025-08-15",
    purpose: "Bridge funding for INC renewal fees and college paperwork expenses",
    interestRate: 0,
    tenureMonths: 12,
    repaymentStartDate: "2025-09-01",
    status: "Overdue",
    notes: "Loan to cover regulatory compliance costs. Two installments currently overdue.",
  },
  {
    id: "loan-003",
    lenderName: "Arun Kumar Ghosh",
    lenderType: "Individual",
    relationship: "Friend of Management",
    phone: "9830003003",
    amount: 150000,
    dateReceived: "2024-03-01",
    purpose: "Emergency medical equipment purchase for clinical lab",
    interestRate: 0,
    tenureMonths: 12,
    repaymentStartDate: "2024-04-01",
    status: "Closed",
    notes: "Fully repaid. Loan closed March 2025.",
  },
];

export const mockLoanRepayments: LoanRepayment[] = [
  // Loan 001: 24 months, 15 paid (Feb 2025–Apr 2026), 9 upcoming
  ...makeRepayments("loan-001", 500000, "2025-02-01", 24, 15, 0, ["Cash", "UPI", "Net Banking", "Cheque"]),
  // Loan 002: 12 months, 6 paid (Sep–Feb), 2 overdue (Mar–Apr 2026), 4 upcoming
  ...makeRepayments("loan-002", 200000, "2025-09-01", 12, 6, 2, ["UPI", "Cash", "Cheque", "UPI"]),
  // Loan 003: 12 months, all 12 paid (Apr 2024–Mar 2025)
  ...makeRepayments("loan-003", 150000, "2024-04-01", 12, 12, 0, ["Cash", "Cheque", "UPI", "Net Banking"]),
];
