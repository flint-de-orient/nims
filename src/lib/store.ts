import { create } from "zustand";
import { mockStudents } from "./mock-data/students";
import { mockStaff } from "./mock-data/staff";
import { mockFeeStructures, mockScholarshipRules, defaultLateFeeRule } from "./mock-data/fees";
import { mockVendors } from "./mock-data/vendors";
import { mockExpenses } from "./mock-data/expenses";
import { mockReceipts, defaultersConfig } from "./mock-data/receipts";
import type {
  Role, Student, FeeStructure, ScholarshipRule, LateFeeRule,
  Receipt, Vendor, Expense, Staff
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

type NIMSStore = AuthSlice & StudentsSlice & FeesSlice & ReceiptsSlice & VendorsSlice & ExpensesSlice & StaffSlice & {
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

  // Defaulters config
  defaulters: defaultersConfig,
}));
