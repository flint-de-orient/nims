export type Role = "Principal" | "Accountant" | "Registrar" | "Faculty" | "Student";

export type Course = "GNM" | "B.Sc Nursing" | "P.B. B.Sc" | "M.Sc Nursing";
export type Year = 1 | 2 | 3 | 4;
export type FeeHead = "Tuition" | "Hostel" | "Lab" | "Exam" | "Library" | "University" | "Misc";
export type PaymentMode = "Cash" | "UPI" | "Card" | "Net Banking" | "Cheque";
export type ExpenseStatus = "Pending" | "Approved" | "Paid" | "Rejected";
export type StudentStatus = "Active" | "Alumni" | "Dropout";

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  course: Course;
  year: Year;
  dob: string;
  address: string;
  phone: string;
  email: string;
  guardian: string;
  guardianPhone: string;
  category: "General" | "SC" | "ST" | "OBC" | "EWS";
  status: StudentStatus;
  admissionDate: string;
  photo?: string;
}

export interface FeeStructure {
  id: string;
  course: Course;
  year: Year;
  head: FeeHead;
  amount: number;
  effectiveFrom: string;
}

export interface ScholarshipRule {
  id: string;
  category: "SC" | "ST" | "OBC" | "EWS" | "Merit";
  type: "percent" | "absolute";
  value: number;
  head: FeeHead | "All";
}

export interface LateFeeRule {
  graceDays: number;
  ratePerDay: number;
  cap: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  studentId: string;
  date: string;
  heads: { head: FeeHead; amount: number; scholarship?: number }[];
  totalAmount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  remarks?: string;
  createdBy: string;
  lateFee?: number;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  address: string;
  contact: string;
  email: string;
  category: string;
  paymentTerms: string;
  accountHeads: string[]; // COA sub-head names this vendor is tagged to e.g. ["College Paperwork", "Purchase"]
}

export interface Expense {
  id: string;
  vendorId?: string;        // optional — undefined for direct payments (salary, govt fees, etc.)
  isDirectPayment?: boolean;
  category: string;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoiceNumber: string;
  invoiceFile?: string;
  date: string;
  description: string;
  status: ExpenseStatus;
  submittedBy: string;
  approvedBy?: string;
  remarks?: string;
  accountBranch?: string;
  accountSubHead?: string;
  accountLeaf?: string;
}

export interface Staff {
  id: string;
  name: string;
  designation: string;
  department: string;
  incRegNo?: string;
  joiningDate: string;
  phone: string;
  email: string;
  salary: number;
  status: "Active" | "On Leave" | "Resigned";
}
