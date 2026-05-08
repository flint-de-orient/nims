"use client";
import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
const TITLES: Record<string, string> = {
  "/academics/exam-routine": "Exam Routine Engine",
  "/academics/timetable": "Daily Timetable",
};
export default function AcademicsLayout({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  const title = TITLES[p] || "Academics";
  return <DashboardLayout title={title} breadcrumbs={[{ label: "Academics" }, { label: title }]}>{children}</DashboardLayout>;
}
