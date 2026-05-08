"use client";
import { useNIMSStore } from "@/lib/store";
import { Bell, ChevronDown, LogOut, Check } from "lucide-react";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const roles: Role[] = ["Principal", "Accountant", "Registrar", "Faculty", "Student"];

const ROLE_COLORS: Record<Role, string> = {
  Principal: "#0F766E",
  Accountant: "#2563EB",
  Registrar: "#7C3AED",
  Faculty: "#D97706",
  Student: "#DC2626",
};

interface TopBarProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function TopBar({ title, breadcrumbs }: TopBarProps) {
  const { role, setRole, userName } = useNIMSStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const displayName = userName || role;
  const initial = displayName[0]?.toUpperCase();

  // Format date: Mon, 08 May 2026
  const now = new Date(2026, 4, 8); // May 8, 2026
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header
      className="fixed top-0 right-0 h-16 flex items-center justify-between px-6 z-30"
      style={{
        left: "256px",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 0 #E2E8F0, 0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Left: breadcrumbs + title */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs mb-0.5" style={{ color: "#94a3b8" }}>
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span style={{ color: "#cbd5e1" }}>/</span>}
                <span>{bc.label}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="font-bold text-lg leading-tight" style={{ color: "#0F172A" }}>
          {title}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Date chip */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ backgroundColor: "#F8FAFC", color: "#64748B", border: "1px solid #E2E8F0" }}
        >
          {dateLabel}
        </div>

        {/* Notification bell */}
        <button
          className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-100"
          style={{ color: "#64748B" }}
        >
          <Bell size={17} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
            style={{ backgroundColor: "#EF4444" }}
          />
        </button>

        {/* Role/user dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-medium transition-all hover:shadow-sm"
            style={{
              borderColor: "#E2E8F0",
              color: "#0F172A",
              backgroundColor: "#ffffff",
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ backgroundColor: ROLE_COLORS[role] }}
            >
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold leading-tight" style={{ color: "#0F172A" }}>
                {displayName}
              </div>
              <div className="text-xs leading-tight" style={{ color: "#94A3B8" }}>
                {role}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
              style={{ color: "#94A3B8" }}
            />
          </button>

          {open && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

              {/* Dropdown card */}
              <div
                className="absolute right-0 top-12 w-56 rounded-2xl py-2 z-50"
                style={{
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 10px 40px rgba(0,0,0,0.12)",
                  border: "1px solid #F1F5F9",
                }}
              >
                {/* User header */}
                <div
                  className="px-4 py-3 mb-1"
                  style={{ borderBottom: "1px solid #F1F5F9" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[role] }}
                    >
                      {initial}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#0F172A" }}>
                        {displayName}
                      </div>
                      <div className="text-xs" style={{ color: "#94A3B8" }}>
                        {role}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Switch role section */}
                <div
                  className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#94A3B8", letterSpacing: "0.1em" }}
                >
                  Switch Role
                </div>

                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setOpen(false);
                      if (r === "Student") router.push("/portal");
                      else router.push("/finance");
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-slate-50 flex items-center gap-3"
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[r] }}
                    >
                      {r[0]}
                    </div>
                    <span
                      className="flex-1"
                      style={{ color: r === role ? ROLE_COLORS[r] : "#0F172A", fontWeight: r === role ? 600 : 400 }}
                    >
                      {r}
                    </span>
                    {r === role && (
                      <Check size={14} style={{ color: ROLE_COLORS[r], flexShrink: 0 }} />
                    )}
                  </button>
                ))}

                {/* Logout */}
                <div style={{ borderTop: "1px solid #F1F5F9", marginTop: "4px", paddingTop: "4px" }}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push("/login");
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-red-50 transition-colors"
                    style={{ color: "#EF4444" }}
                  >
                    <LogOut size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
