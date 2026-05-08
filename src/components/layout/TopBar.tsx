"use client";
import { useNIMSStore } from "@/lib/store";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const roles: Role[] = ["Principal", "Accountant", "Registrar", "Faculty", "Student"];

interface TopBarProps {
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export default function TopBar({ title, breadcrumbs }: TopBarProps) {
  const { role, setRole, userName } = useNIMSStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 right-0 h-14 flex items-center justify-between px-6 z-30 border-b"
      style={{ left: "256px", backgroundColor: "#ffffff", borderColor: "#E2E8F0" }}
    >
      {/* Left: breadcrumbs + title */}
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 text-xs mb-0.5" style={{ color: "#475569" }}>
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span>/</span>}
                <span>{bc.label}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="font-serif font-bold text-base" style={{ color: "#0F172A" }}>
          {title}
        </h1>
      </div>

      {/* Right: role switcher + notifications */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={18} style={{ color: "#475569" }} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: "#F97066" }}
          />
        </button>

        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: "#0F766E" }}
            >
              {role[0]}
            </div>
            <span>{role}</span>
            <ChevronDown size={14} style={{ color: "#475569" }} />
          </button>

          {open && (
            <div
              className="absolute right-0 top-10 w-48 rounded-xl shadow-lg border py-1 z-50 bg-white"
              style={{ borderColor: "#E2E8F0" }}
            >
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
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
                  className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                    r === role ? "font-medium" : ""
                  }`}
                  style={{ color: r === role ? "#0F766E" : "#0F172A" }}
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: r === role ? "#0F766E" : "#94a3b8" }}
                  >
                    {r[0]}
                  </div>
                  {r}
                  {r === role && <span className="ml-auto text-xs" style={{ color: "#0F766E" }}>●</span>}
                </button>
              ))}
              <div className="border-t mt-1 pt-1" style={{ borderColor: "#E2E8F0" }}>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors"
                  style={{ color: "#F97066" }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
