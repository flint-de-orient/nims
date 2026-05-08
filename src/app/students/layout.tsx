"use client";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDetail = pathname !== "/students";
  return (
    <DashboardLayout title={isDetail ? "Student Profile" : "Students"} breadcrumbs={[{ label: "Students" }, ...(isDetail ? [{ label: "Profile" }] : [])]}>
      {children}
    </DashboardLayout>
  );
}
