"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import type { Role } from "@/lib/types";
import { Check } from "lucide-react";

const roles: Role[] = ["Principal", "Accountant", "Registrar", "Faculty", "Student"];

const FEATURE_BULLETS = [
  "Fee Management & Receipts",
  "Expense Tracking & COA",
  "Loan Management System",
];

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useNIMSStore();
  const [selectedRole, setSelectedRole] = useState<Role>("Principal");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("demo1234");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(selectedRole);
    if (selectedRole === "Student") router.push("/portal");
    else router.push("/finance");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="w-2/5 min-h-screen flex flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0B1A18 0%, #0F766E 60%, #1A8A7E 100%)",
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(94,234,212,0.08) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        {/* Top branding */}
        <div className="relative z-10">
          {/* N emblem */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-8"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              className="text-white font-bold text-4xl"
              style={{ fontFamily: "Georgia, serif" }}
            >
              N
            </span>
          </div>

          <h1
            className="text-white font-bold mb-2"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "3rem",
              lineHeight: 1.1,
            }}
          >
            NIMS
          </h1>
          <div className="text-xl font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
            Nursing Institution
          </div>
          <div className="text-xl font-semibold mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
            Management System
          </div>

          <div className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            Noujan Institute of Nursing
          </div>
          <div className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
            Beleghata, Kolkata
          </div>

          {/* Feature bullets */}
          <div className="space-y-3">
            {FEATURE_BULLETS.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(20,184,166,0.25)", border: "1px solid rgba(20,184,166,0.4)" }}
                >
                  <Check size={13} style={{ color: "#5EEAD4" }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust badge */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Trusted by Noujan Institute since 2024
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 min-h-screen bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2
              className="font-bold mb-2"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "2rem",
                color: "#0F172A",
                lineHeight: 1.2,
              }}
            >
              Welcome back
            </h2>
            <p className="text-base" style={{ color: "#64748B" }}>
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#374151" }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#0F172A",
                  backgroundColor: "#FAFAFA",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0F766E";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,118,110,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.backgroundColor = "#FAFAFA";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#374151" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#0F172A",
                  backgroundColor: "#FAFAFA",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#0F766E";
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(15,118,110,0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.backgroundColor = "#FAFAFA";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Enter password"
              />
            </div>

            {/* Role select */}
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#374151" }}
              >
                Login as
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none appearance-none transition-all"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#0F172A",
                  backgroundColor: "#FAFAFA",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                  paddingRight: "40px",
                }}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[0.98] mt-2"
              style={{
                background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
                boxShadow: "0 4px 16px rgba(15,118,110,0.35)",
              }}
            >
              Sign In
            </button>
          </form>

          {/* Demo note */}
          <div
            className="mt-8 p-4 rounded-xl text-sm"
            style={{
              backgroundColor: "#F0FDFA",
              border: "1px solid rgba(20,184,166,0.2)",
              color: "#475569",
            }}
          >
            <span className="font-semibold" style={{ color: "#0F766E" }}>Demo mode: </span>
            Any credentials work. Select your role above to explore that perspective.
          </div>
        </div>
      </div>
    </div>
  );
}
