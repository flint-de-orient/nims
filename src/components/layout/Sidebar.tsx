"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  LayoutDashboard, DollarSign, Users, BookOpen, GraduationCap,
  FileText, ShoppingCart, BarChart3, UserCheck, Calendar,
  ClipboardList, ChevronRight, GitBranch, Landmark
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: Role[];
  children?: NavItem[];
  iconBg?: string;
  iconColor?: string;
}

interface IconBoxProps {
  bg: string;
  color: string;
  children: React.ReactNode;
}

function IconBox({ bg, color, children }: IconBoxProps) {
  return (
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: bg, color }}
    >
      {children}
    </div>
  );
}

const navItems: NavItem[] = [
  {
    label: "Finance",
    href: "/finance",
    icon: <DollarSign size={18} />,
    roles: ["Principal", "Accountant"],
    children: [
      {
        label: "Dashboard", href: "/finance", icon: <LayoutDashboard size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#0D4A45", iconColor: "#5EEAD4",
      },
      {
        label: "Fee Master", href: "/finance/fee-master", icon: <FileText size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#0C2E5A", iconColor: "#60A5FA",
      },
      {
        label: "Student Ledger", href: "/finance/ledger", icon: <BookOpen size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#2D1B69", iconColor: "#A78BFA",
      },
      {
        label: "New Receipt", href: "/finance/receipt/new", icon: <ClipboardList size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#0E4629", iconColor: "#4ADE80",
      },
      {
        label: "Vendors & Expenses", href: "/finance/expenses", icon: <ShoppingCart size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#4C1D00", iconColor: "#FB923C",
      },
      {
        label: "Chart of Accounts", href: "/finance/chart-of-accounts", icon: <GitBranch size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#2D1062", iconColor: "#C084FC",
      },
      {
        label: "Loan Management", href: "/finance/loans", icon: <Landmark size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#0B2942", iconColor: "#38BDF8",
      },
      {
        label: "Reports & Tally", href: "/finance/reports", icon: <BarChart3 size={15} />,
        roles: ["Principal", "Accountant"], iconBg: "#4A0D0D", iconColor: "#F87171",
      },
    ],
  },
  {
    label: "Students",
    href: "/students",
    icon: <GraduationCap size={18} />,
    roles: ["Principal", "Registrar", "Faculty"],
    children: [
      {
        label: "All Students", href: "/students", icon: <Users size={15} />,
        roles: ["Principal", "Registrar", "Faculty"], iconBg: "#0C2E5A", iconColor: "#60A5FA",
      },
    ],
  },
  {
    label: "Academics",
    href: "/academics",
    icon: <BookOpen size={18} />,
    roles: ["Principal", "Registrar", "Faculty"],
    children: [
      {
        label: "Exam Routine", href: "/academics/exam-routine", icon: <Calendar size={15} />,
        roles: ["Principal", "Registrar", "Faculty"], iconBg: "#2D1B69", iconColor: "#A78BFA",
      },
      {
        label: "Timetable", href: "/academics/timetable", icon: <ClipboardList size={15} />,
        roles: ["Principal", "Registrar", "Faculty"], iconBg: "#0E4629", iconColor: "#4ADE80",
      },
    ],
  },
  {
    label: "HR & Staff",
    href: "/hr",
    icon: <UserCheck size={18} />,
    roles: ["Principal", "Registrar"],
    children: [
      {
        label: "Staff List", href: "/hr/staff", icon: <Users size={15} />,
        roles: ["Principal", "Registrar"], iconBg: "#4C1D00", iconColor: "#FB923C",
      },
      {
        label: "Attendance", href: "/hr/attendance", icon: <Calendar size={15} />,
        roles: ["Principal", "Registrar"], iconBg: "#0B2942", iconColor: "#38BDF8",
      },
    ],
  },
  {
    label: "My Portal",
    href: "/portal",
    icon: <LayoutDashboard size={18} />,
    roles: ["Student"],
    iconBg: "#2D1062",
    iconColor: "#C084FC",
  },
];

const ROLE_BADGE_COLORS: Record<Role, string> = {
  Principal: "#0F766E",
  Accountant: "#2563EB",
  Registrar: "#7C3AED",
  Faculty: "#D97706",
  Student: "#DC2626",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { role, userName } = useNIMSStore();

  const visibleItems = navItems.filter((item) => item.roles.includes(role));
  const firstName = userName ? userName.split(" ")[0] : role;

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-40"
      style={{
        background: "linear-gradient(180deg, #0B1A18 0%, #060E0C 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo area */}
      <div className="px-5 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
              boxShadow: "0 4px 12px rgba(15,118,110,0.45)",
            }}
          >
            N
          </div>
          <div>
            <div
              className="text-white font-bold text-base leading-tight tracking-wide"
              style={{ fontFamily: "Georgia, serif" }}
            >
              NIMS
            </div>
            <div className="text-xs" style={{ color: "rgba(94,234,212,0.65)" }}>
              Noujan Institute
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {visibleItems.map((item) => {
          if (!item.children) {
            // Flat item (My Portal)
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm transition-all"
                style={{
                  borderLeft: isActive ? "3px solid #14B8A6" : "3px solid transparent",
                  background: isActive ? "rgba(20,184,166,0.18)" : "transparent",
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }}
              >
                {item.iconBg && item.iconColor ? (
                  <IconBox bg={item.iconBg} color={item.iconColor}>
                    {item.icon}
                  </IconBox>
                ) : (
                  item.icon
                )}
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight
                    size={13}
                    className="ml-auto"
                    style={{ color: "rgba(94,234,212,0.7)" }}
                  />
                )}
              </Link>
            );
          }

          return (
            <div key={item.href} className="mb-2">
              {/* Section group label */}
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <span
                  className="text-xs font-semibold uppercase"
                  style={{
                    color: "rgba(94,234,212,0.55)",
                    letterSpacing: "0.12em",
                  }}
                >
                  {item.label}
                </span>
                <div
                  className="flex-1"
                  style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)" }}
                />
              </div>

              {/* Children */}
              <div>
                {item.children
                  .filter((child) => child.roles.includes(role))
                  .map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl mb-0.5 text-sm transition-all"
                        style={{
                          borderLeft: childActive ? "3px solid #14B8A6" : "3px solid transparent",
                          background: childActive ? "rgba(20,184,166,0.18)" : "transparent",
                          color: childActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                          fontWeight: childActive ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive)
                            (e.currentTarget as HTMLAnchorElement).style.background =
                              "rgba(255,255,255,0.06)";
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive)
                            (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                        }}
                      >
                        {child.iconBg && child.iconColor ? (
                          <IconBox bg={child.iconBg} color={child.iconColor}>
                            {child.icon}
                          </IconBox>
                        ) : (
                          child.icon
                        )}
                        <span className="flex-1 truncate">{child.label}</span>
                        {childActive && (
                          <ChevronRight
                            size={13}
                            style={{ color: "rgba(94,234,212,0.7)", flexShrink: 0 }}
                          />
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className="px-3 pb-4 pt-2 flex-shrink-0">
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: "rgba(255,255,255,0.07)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
              boxShadow: "0 2px 8px rgba(15,118,110,0.4)",
            }}
          >
            {firstName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate leading-tight">
              {firstName}
            </div>
            <div className="mt-0.5">
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${ROLE_BADGE_COLORS[role]}22`,
                  color: ROLE_BADGE_COLORS[role],
                  border: `1px solid ${ROLE_BADGE_COLORS[role]}44`,
                }}
              >
                {role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
