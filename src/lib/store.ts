import { create } from "zustand";
import { mockStudents } from "./mock-data/students";
import { mockStaff } from "./mock-data/staff";
import { mockFeeStructures, mockScholarshipRules, defaultLateFeeRule } from "./mock-data/fees";
import { mockVendors } from "./mock-data/vendors";
import { mockExpenses } from "./mock-data/expenses";
import { mockReceipts, defaultersConfig } from "./mock-data/receipts";
import { mockLoans, mockLoanRepayments } from "./mock-data/loans";
import type {
  Role, Student, FeeStructure, ScholarshipRule, LateFeeRule,
  Receipt, Vendor, Expense, Staff, Loan, LoanRepayment, PaymentMode
} from "./types";

interface AuthSlice {
  role: Role;
  userName: string;
  setRole: (role: Role) => void;
}

interface StudentsSlice {
  students: Student[];
  updateStudent: (student: Student) => void;
}

interface FeesSlice {
  feeStructures: FeeStructure[];
  scholarshipRules: ScholarshipRule[];
  lateFeeRule: LateFeeRule;
  updateFeeStructure: (fee: FeeStructure) => void;
  addFeeStructure: (fee: FeeStructure) => void;
  updateLateFeeRule: (rule: LateFeeRule) => void;
  updateScholarshipRule: (rule: ScholarshipRule) => void;
}

interface ReceiptsSlice {
  receipts: Receipt[];
  nextReceiptSeq: number;
  addReceipt: (receipt: Receipt) => void;
}

interface VendorsSlice {
  vendors: Vendor[];
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
}

interface ExpensesSlice {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpenseStatus: (id: string, status: Expense["status"], approvedBy?: string) => void;
}

interface StaffSlice {
  staff: Staff[];
}

interface LoansSlice {
  loans: Loan[];
  loanRepayments: LoanRepayment[];
  addLoan: (loan: Omit<Loan, "id">) => void;
  recordPayment: (repaymentId: string, paidAmount: number, paidDate: string, paymentMode: PaymentMode, referenceNumber?: string) => void;
}

type NIMSStore = AuthSlice & StudentsSlice & FeesSlice & ReceiptsSlice & VendorsSlice & ExpensesSlice & StaffSlice & LoansSlice & {
  defaulters: typeof defaultersConfig;
};

export const useNIMSStore = create<NIMSStore>((set) => ({
  // Auth
  role: "Principal" as Role,
  userName: "Dr. Pratima Ghosh",
  setRole: (role) => {
    const names: Record<Role, string> = {
      Principal: "Dr. Pratima Ghosh",
      Accountant: "Bikash Sharma",
      Registrar: "Mrs. Mamata Kundu",
      Faculty: "Mrs. Rekha Bose",
      Student: "Riya Bhattacharya",
    };
    set({ role, userName: names[role] });
  },

  // Students
  students: mockStudents,
  updateStudent: (student) =>
    set((state) => ({
      students: state.students.map((s) => (s.id === student.id ? student : s)),
    })),

  // Fees
  feeStructures: mockFeeStructures,
  scholarshipRules: mockScholarshipRules,
  lateFeeRule: defaultLateFeeRule,
  updateFeeStructure: (fee) =>
    set((state) => ({
      feeStructures: state.feeStructures.map((f) => (f.id === fee.id ? fee : f)),
    })),
  addFeeStructure: (fee) =>
    set((state) => ({ feeStructures: [...state.feeStructures, fee] })),
  updateLateFeeRule: (rule) => set({ lateFeeRule: rule }),
  updateScholarshipRule: (rule) =>
    set((state) => ({
      scholarshipRules: state.scholarshipRules.map((r) => (r.id === rule.id ? rule : r)),
    })),

  // Receipts
  receipts: mockReceipts,
  nextReceiptSeq: 75,
  addReceipt: (receipt) =>
    set((state) => ({
      receipts: [receipt, ...state.receipts],
      nextReceiptSeq: state.nextReceiptSeq + 1,
    })),

  // Vendors
  vendors: mockVendors,
  addVendor: (vendor) => set((state) => ({ vendors: [...state.vendors, vendor] })),
  updateVendor: (vendor) =>
    set((state) => ({
      vendors: state.vendors.map((v) => (v.id === vendor.id ? vendor : v)),
    })),

  // Expenses
  expenses: mockExpenses,
  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  updateExpenseStatus: (id, status, approvedBy) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === id ? { ...e, status, ...(approvedBy ? { approvedBy } : {}) } : e
      ),
    })),

  // Staff
  staff: mockStaff,

  // Loans
  loans: mockLoans,
  loanRepayments: mockLoanRepayments,

  addLoan: (loanData) => {
    const loanId = `loan-${Date.now()}`;
    const loan: Loan = { id: loanId, ...loanData };
    const base = Math.floor(loanData.amount / loanData.tenureMonths);
    const today = new Date().toISOString().split("T")[0];
    const repayments: LoanRepayment[] = Array.from({ length: loanData.tenureMonths }, (_, i) => {
      const [y, m, d] = loanData.repaymentStartDate.split("-").map(Number);
      const total = y * 12 + (m - 1) + i;
      const dueDate = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const principal = i === loanData.tenureMonths - 1 ? loanData.amount - base * (loanData.tenureMonths - 1) : base;
      return {
        id: `${loanId}-r${i + 1}`,
        loanId,
        installmentNo: i + 1,
        dueDate,
        principalDue: principal,
        interestDue: Math.round(loanData.amount * loanData.interestRate / 100 / 12),
        status: dueDate < today ? "Overdue" : "Upcoming",
      };
    });
    set((state) => ({ loans: [...state.loans, loan], loanRepayments: [...state.loanRepayments, ...repayments] }));
  },

  recordPayment: (repaymentId, paidAmount, paidDate, paymentMode, referenceNumber) =>
    set((state) => {
      const repayment = state.loanRepayments.find(r => r.id === repaymentId);
      if (!repayment) return state;
      const updatedRepayments = state.loanRepayments.map(r =>
        r.id === repaymentId
          ? { ...r, paidDate, paidAmount, paymentMode, referenceNumber, status: paidAmount >= r.principalDue + r.interestDue ? "Paid" : "Partial" as LoanRepayment["status"] }
          : r
      );
      const loanInstallments = updatedRepayments.filter(r => r.loanId === repayment.loanId);
      const allPaid = loanInstallments.every(r => r.status === "Paid");
      const hasOverdue = loanInstallments.some(r => r.status === "Overdue");
      const updatedLoans = state.loans.map(l =>
        l.id === repayment.loanId
          ? { ...l, status: allPaid ? "Closed" : hasOverdue ? "Overdue" : "Active" as Loan["status"] }
          : l
      );
      return { loanRepayments: updatedRepayments, loans: updatedLoans };
    }),

  // Defaulters config
  defaulters: defaultersConfig,
}));
