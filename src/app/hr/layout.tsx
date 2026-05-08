"use client";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
const TITLES: Record<string, string> = {
  "/hr/staff": "Staff List",
  "/hr/attendance": "Attendance",
};
export default function HRLayout({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  const title = TITLES[p] || "HR & Staff";
  return <DashboardLayout title={title} breadcrumbs={[{ label: "HR & Staff" }, { label: title }]}>{children}</DashboardLayout>;
}
