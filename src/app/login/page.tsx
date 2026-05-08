"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNIMSStore } from "@/lib/store";
import type { Role } from "@/lib/types";

const roles: Role[] = ["Principal", "Accountant", "Registrar", "Faculty", "Student"];

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0B3D3A 0%, #0F766E 50%, #5EEAD4 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
            <span className="text-white font-serif font-bold text-2xl">N</span>
          </div>
          <h1 className="text-white font-serif font-bold text-3xl">NIMS</h1>
          <p className="text-white/70 text-sm mt-1">Nursing Institution Management System</p>
          <p className="text-white/50 text-xs mt-1">Noujan Institute of Nursing · Beleghata, Kolkata</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-serif font-bold text-xl mb-1" style={{ color: "#0F172A" }}>Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: "#475569" }}>Sign in to continue to your dashboard</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2"
                style={{
                  borderColor: "#E2E8F0",
                  color: "#0F172A",
                  "--tw-ring-color": "#0F766E",
                } as React.CSSProperties}
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
                Login as
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none appearance-none bg-white"
                style={{ borderColor: "#E2E8F0", color: "#0F172A" }}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-white font-medium text-sm transition-all hover:opacity-90 active:scale-[0.98] mt-2"
              style={{ backgroundColor: "#0F766E" }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 p-3 rounded-lg text-xs" style={{ backgroundColor: "#F0FDFA", color: "#475569" }}>
            <strong style={{ color: "#0F766E" }}>Demo:</strong> Any credentials work. Select your role above to explore that perspective.
          </div>
        </div>
      </div>
    </div>
  );
}
