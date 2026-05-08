"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  LayoutDashboard, DollarSign, Users, BookOpen, GraduationCap,
  FileText, ShoppingCart, BarChart3, UserCheck, Calendar,
  ClipboardList, LogOut, ChevronRight, GitBranch
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Finance",
    href: "/finance",
    icon: <DollarSign size={18} />,
    roles: ["Principal", "Accountant"],
    children: [
      { label: "Dashboard", href: "/finance", icon: <LayoutDashboard size={16} />, roles: ["Principal", "Accountant"] },
      { label: "Fee Master", href: "/finance/fee-master", icon: <FileText size={16} />, roles: ["Principal", "Accountant"] },
      { label: "Student Ledger", href: "/finance/ledger", icon: <BookOpen size={16} />, roles: ["Principal", "Accountant"] },
      { label: "New Receipt", href: "/finance/receipt/new", icon: <ClipboardList size={16} />, roles: ["Principal", "Accountant"] },
      { label: "Vendors & Expenses", href: "/finance/expenses", icon: <ShoppingCart size={16} />, roles: ["Principal", "Accountant"] },
      { label: "Chart of Accounts", href: "/finance/chart-of-accounts", icon: <GitBranch size={16} />, roles: ["Principal", "Accountant"] },
      { label: "Reports & Tally", href: "/finance/reports", icon: <BarChart3 size={16} />, roles: ["Principal", "Accountant"] },
    ],
  },
  {
    label: "Students",
    href: "/students",
    icon: <GraduationCap size={18} />,
    roles: ["Principal", "Registrar", "Faculty"],
    children: [
      { label: "All Students", href: "/students", icon: <Users size={16} />, roles: ["Principal", "Registrar", "Faculty"] },
    ],
  },
  {
    label: "Academics",
    href: "/academics",
    icon: <BookOpen size={18} />,
    roles: ["Principal", "Registrar", "Faculty"],
    children: [
      { label: "Exam Routine", href: "/academics/exam-routine", icon: <Calendar size={16} />, roles: ["Principal", "Registrar", "Faculty"] },
      { label: "Timetable", href: "/academics/timetable", icon: <ClipboardList size={16} />, roles: ["Principal", "Registrar", "Faculty"] },
    ],
  },
  {
    label: "HR & Staff",
    href: "/hr",
    icon: <UserCheck size={18} />,
    roles: ["Principal", "Registrar"],
    children: [
      { label: "Staff List", href: "/hr/staff", icon: <Users size={16} />, roles: ["Principal", "Registrar"] },
      { label: "Attendance", href: "/hr/attendance", icon: <Calendar size={16} />, roles: ["Principal", "Registrar"] },
    ],
  },
  {
    label: "My Portal",
    href: "/portal",
    icon: <LayoutDashboard size={18} />,
    roles: ["Student"],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role } = useNIMSStore();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{ backgroundColor: "#0B3D3A" }}
    >
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: "#0F766E" }}
          >
            N
          </div>
          <div>
            <div className="text-white font-serif font-bold text-base leading-tight">NIMS</div>
            <div className="text-xs" style={{ color: "#5EEAD4" }}>Noujan Institute</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          if (!item.children) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all ${
                  isActive
                    ? "text-white font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                style={isActive ? { backgroundColor: "#0F766E" } : {}}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={item.href} className="mb-1">
              <div className="flex items-center gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#5EEAD4" }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              <div className="pl-2">
                {item.children
                  .filter((child) => child.roles.includes(role))
                  .map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all ${
                          childActive
                            ? "text-white font-medium"
                            : "text-white/60 hover:text-white hover:bg-white/10"
                        }`}
                        style={childActive ? { backgroundColor: "#0F766E" } : {}}
                      >
                        {child.icon}
                        <span>{child.label}</span>
                        {childActive && <ChevronRight size={14} className="ml-auto" />}
                      </Link>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Role pill */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: "#0F766E" }}
          >
            {role[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{role}</div>
            <div className="text-white/40 text-xs">Active Role</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
