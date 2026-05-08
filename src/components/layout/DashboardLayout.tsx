"use client";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function DashboardLayout({ children, title, breadcrumbs }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <Sidebar />
      <TopBar title={title} breadcrumbs={breadcrumbs} />
      <main className="pt-14 pl-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
