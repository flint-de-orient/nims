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
    <div className="min-h-screen" style={{ backgroundColor: "#EEF2F0" }}>
      <Sidebar />
      <TopBar title={title} breadcrumbs={breadcrumbs} />
      <main
        className="min-h-screen"
        style={{ paddingTop: "64px", paddingLeft: "256px" }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
