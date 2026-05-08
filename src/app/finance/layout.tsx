"use client";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

const PAGE_TITLES: Record<string, string> = {
  "/finance": "Finance Dashboard",
  "/finance/fee-master": "Fee Master",
  "/finance/ledger": "Student Ledger",
  "/finance/receipt/new": "New Receipt",
  "/finance/expenses": "Vendors & Expenses",
  "/finance/reports": "Reports & Tally Bridge",
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || (pathname.startsWith("/finance/receipt/") ? "Receipt" : pathname.startsWith("/finance/ledger/") ? "Student Ledger" : "Finance");
  return (
    <DashboardLayout title={title} breadcrumbs={[{ label: "Finance" }, { label: title }]}>
      {children}
    </DashboardLayout>
  );
}
