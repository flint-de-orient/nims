"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  TrendingUp, TrendingDown, AlertCircle, CreditCard, Bell, Receipt, ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";

const COURSE_COLORS: Record<string, string> = {
  "GNM": "#0F766E",
  "B.Sc Nursing": "#3B82F6",
  "P.B. B.Sc": "#F59E0B",
  "M.Sc Nursing": "#8B5CF6",
};

const COURSE_INITIALS_COLORS: Record<string, string> = {
  "GNM": "#0F766E",
  "B.Sc Nursing": "#2563EB",
  "P.B. B.Sc": "#D97706",
  "M.Sc Nursing": "#7C3AED",
};

export default function FinanceDashboard() {
  const { receipts, students, defaulters, userName } = useNIMSStore();
  const { toast } = useToast();

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const collectedThisMonth = useMemo(() =>
    receipts
      .filter(r => isWithinInterval(new Date(r.date), { start: thisMonthStart, end: thisMonthEnd }))
      .reduce((sum, r) => sum + r.totalAmount, 0),
    [receipts]
  );

  const collectedLastMonth = useMemo(() =>
    receipts
      .filter(r => isWithinInterval(new Date(r.date), { start: lastMonthStart, end: lastMonthEnd }))
      .reduce((sum, r) => sum + r.totalAmount, 0),
    [receipts]
  );

  const momDelta = collectedLastMonth > 0
    ? ((collectedThisMonth - collectedLastMonth) / collectedLastMonth) * 100
    : 0;

  const totalOutstanding = useMemo(() =>
    defaulters.reduce((sum, d) => sum + d.overdueAmount, 0),
    [defaulters]
  );

  const overdueAmount = useMemo(() =>
    defaulters.filter(d => d.overdueDays > 30).reduce((sum, d) => sum + d.overdueAmount, 0),
    [defaulters]
  );

  const currentDue = totalOutstanding - overdueAmount;

  // 12-month trend
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const month = subMonths(now, 11 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const amount = receipts
        .filter(r => isWithinInterval(new Date(r.date), { start, end }))
        .reduce((sum, r) => sum + r.totalAmount, 0);
      return { month: format(month, "MMM yy"), amount };
    });
  }, [receipts]);

  // Course-wise collection
  const courseData = useMemo(() => {
    const map: Record<string, number> = { "GNM": 0, "B.Sc Nursing": 0, "P.B. B.Sc": 0, "M.Sc Nursing": 0 };
    receipts.forEach(r => {
      const student = students.find(s => s.id === r.studentId);
      if (student && map[student.course] !== undefined) {
        map[student.course] += r.totalAmount;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).filter(x => x.value > 0);
  }, [receipts, students]);

  // Top defaulters with student info
  const topDefaulters = useMemo(() => {
    return defaulters
      .sort((a, b) => b.overdueAmount - a.overdueAmount)
      .slice(0, 10)
      .map(d => ({
        ...d,
        student: students.find(s => s.id === d.studentId),
      }))
      .filter(d => d.student);
  }, [defaulters, students]);

  const maxOverdue = topDefaulters[0]?.overdueAmount || 1;

  // Recent receipts
  const recentReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
      .map(r => ({ ...r, student: students.find(s => s.id === r.studentId) }));
  }, [receipts, students]);

  const thisMonthReceiptCount = receipts.filter(r =>
    isWithinInterval(new Date(r.date), { start: thisMonthStart, end: thisMonthEnd })
  ).length;

  const totalReceiptsYear = receipts.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === now.getFullYear();
  }).length;

  // Greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = userName ? userName.split(" ")[0] : "there";

  // Date label
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Top accent strip */}
      <div
        className="absolute left-64 right-0"
        style={{
          top: "64px",
          height: "4px",
          background: "linear-gradient(90deg, #0F766E 0%, #14B8A6 50%, transparent 100%)",
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      {/* Hero greeting bar */}
      <div
        className="rounded-2xl px-6 py-4 flex items-center justify-between"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #F0FDFA 100%)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.04)",
          border: "1px solid rgba(20,184,166,0.12)",
        }}
      >
        <div>
          <div className="text-sm font-medium" style={{ color: "#64748B" }}>
            Finance Dashboard · Noujan Institute of Nursing
          </div>
          <div className="text-xl font-bold mt-0.5" style={{ color: "#0F172A" }}>
            {greeting}, {firstName}.
          </div>
        </div>
        <div
          className="text-sm font-medium px-4 py-2 rounded-xl"
          style={{
            background: "rgba(15,118,110,0.07)",
            color: "#0F766E",
            border: "1px solid rgba(15,118,110,0.12)",
          }}
        >
          {dateLabel}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Card 1: Collected This Month */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden text-white"
          style={{
            background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
            boxShadow: "0 8px 32px rgba(15,118,110,0.28)",
          }}
        >
          <div className="absolute right-4 top-4 opacity-[0.1]">
            <CreditCard size={80} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
            Collected This Month
          </div>
          <div className="text-3xl font-bold tracking-tight mt-3 mb-2 text-white">
            {formatINR(collectedThisMonth)}
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {thisMonthReceiptCount} receipt{thisMonthReceiptCount !== 1 ? "s" : ""} this month
          </div>
        </div>

        {/* Card 2: Outstanding */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden text-white"
          style={{
            background: "linear-gradient(135deg, #92400E 0%, #D97706 100%)",
            boxShadow: "0 8px 32px rgba(217,119,6,0.28)",
          }}
        >
          <div className="absolute right-4 top-4 opacity-[0.1]">
            <AlertCircle size={80} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
            Outstanding
          </div>
          <div className="text-3xl font-bold tracking-tight mt-3 mb-2 text-white">
            {formatINR(totalOutstanding)}
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Overdue {formatINR(overdueAmount)} · Due {formatINR(currentDue)}
          </div>
        </div>

        {/* Card 3: MoM Change */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden text-white"
          style={{
            background: momDelta >= 0
              ? "linear-gradient(135deg, #065F46 0%, #059669 100%)"
              : "linear-gradient(135deg, #991B1B 0%, #DC2626 100%)",
            boxShadow: momDelta >= 0
              ? "0 8px 32px rgba(5,150,105,0.28)"
              : "0 8px 32px rgba(220,38,38,0.28)",
          }}
        >
          <div className="absolute right-4 top-4 opacity-[0.1]">
            {momDelta >= 0 ? <TrendingUp size={80} /> : <TrendingDown size={80} />}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
            MoM Change
          </div>
          <div className="text-3xl font-bold tracking-tight mt-3 mb-2 text-white">
            {momDelta >= 0 ? "+" : ""}{momDelta.toFixed(1)}%
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            vs {formatINR(collectedLastMonth)} last month
          </div>
        </div>

        {/* Card 4: Total Receipts Year */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden text-white"
          style={{
            background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)",
            boxShadow: "0 8px 32px rgba(37,99,235,0.28)",
          }}
        >
          <div className="absolute right-4 top-4 opacity-[0.1]">
            <Receipt size={80} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
            Total Receipts Year
          </div>
          <div className="text-3xl font-bold tracking-tight mt-3 mb-2 text-white">
            {totalReceiptsYear}
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            receipts in {now.getFullYear()}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Area chart — 2 cols */}
        <div
          className="col-span-2 rounded-2xl p-6"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-lg" style={{ color: "#0F172A", fontFamily: "Georgia, serif" }}>
                12-Month Fee Collection Trend
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                Monthly fee receipts · last 12 months
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F766E" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0F766E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`}
              />
              <Tooltip
                formatter={(v) => [formatINR(Number(v)), "Collected"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  fontSize: 12,
                  padding: "10px 14px",
                }}
                cursor={{ stroke: "#0F766E", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#0F766E"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: "#0F766E", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#0F766E", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — 1 col */}
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05)",
          }}
        >
          <div className="mb-4">
            <h3 className="font-bold text-lg" style={{ color: "#0F172A", fontFamily: "Georgia, serif" }}>
              Collection by Course
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              All-time breakdown
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={courseData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {courseData.map((entry, index) => (
                  <Cell key={index} fill={COURSE_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [formatINR(Number(v)), ""]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                  fontSize: 12,
                }}
              />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-5 gap-4">
        {/* Top Defaulters — 3 cols */}
        <div
          className="col-span-3 rounded-2xl relative overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05)",
          }}
        >
          {/* Top gradient strip */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: "linear-gradient(90deg, #EF4444 0%, #FB7185 100%)" }}
          />

          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid #F1F5F9", paddingTop: "20px" }}
          >
            <h3 className="font-bold text-base" style={{ color: "#0F172A", fontFamily: "Georgia, serif" }}>
              Top Defaulters
            </h3>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-semibold"
              style={{ backgroundColor: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2" }}
            >
              {defaulters.length} students
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#FAFAFA" }}>
                  <th
                    className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#94A3B8" }}
                  >
                    Student
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#94A3B8" }}
                  >
                    Overdue
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "#94A3B8" }}
                  >
                    Age
                  </th>
                  <th className="px-4 py-3 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {topDefaulters.map((d, i) => {
                  const barPct = Math.round((d.overdueAmount / maxOverdue) * 100);
                  return (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-slate-50"
                      style={{ borderTop: "1px solid #F8FAFC" }}
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/finance/ledger/${d.student!.id}`}
                          className="font-semibold text-sm hover:underline"
                          style={{ color: "#0F172A" }}
                        >
                          {d.student!.name}
                        </Link>
                        <div className="text-xs mt-0.5 mb-1.5" style={{ color: "#94A3B8" }}>
                          {d.student!.course} · Yr {d.student!.year}
                        </div>
                        {/* Progress bar */}
                        <div
                          className="h-1 rounded-full overflow-hidden"
                          style={{ backgroundColor: "#FEE2E2", width: "120px" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${barPct}%`,
                              background: "linear-gradient(90deg, #EF4444, #FB7185)",
                            }}
                          />
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-right font-semibold text-sm"
                        style={{ color: "#EF4444" }}
                      >
                        {formatINR(d.overdueAmount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={
                            d.overdueDays > 90
                              ? { backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FEE2E2" }
                              : d.overdueDays > 30
                              ? { backgroundColor: "#FFF7ED", color: "#EA580C", border: "1px solid #FED7AA" }
                              : { backgroundColor: "#FEFCE8", color: "#CA8A04", border: "1px solid #FEF08A" }
                          }
                        >
                          {d.overdueDays}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            toast({
                              title: "Reminder sent",
                              description: `SMS reminder sent to ${d.student!.name}`,
                              variant: "success",
                            })
                          }
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:shadow-sm"
                          style={{
                            border: "1px solid #0F766E",
                            color: "#0F766E",
                            backgroundColor: "rgba(15,118,110,0.04)",
                          }}
                        >
                          <Bell size={11} />
                          Remind
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Receipts — 2 cols — feed style */}
        <div
          className="col-span-2 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.05)",
          }}
        >
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid #F1F5F9" }}
          >
            <h3 className="font-bold text-base" style={{ color: "#0F172A", fontFamily: "Georgia, serif" }}>
              Recent Receipts
            </h3>
            <Link
              href="/finance/ledger"
              className="text-xs font-semibold flex items-center gap-1 hover:underline transition-colors"
              style={{ color: "#0F766E" }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: "420px" }}>
            {recentReceipts.map((r, i) => {
              const course = r.student?.course ?? "";
              const avatarColor = COURSE_INITIALS_COLORS[course] || "#64748B";
              const initial = r.student?.name?.[0]?.toUpperCase() ?? "?";

              return (
                <Link
                  key={r.id}
                  href={`/finance/receipt/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50 group"
                  style={{
                    borderBottom: i < recentReceipts.length - 1 ? "1px solid #F8FAFC" : "none",
                  }}
                >
                  {/* Avatar circle */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-semibold truncate group-hover:underline"
                      style={{ color: "#0F172A" }}
                    >
                      {r.student?.name || "Unknown"}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {r.receiptNumber}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold" style={{ color: "#0F766E" }}>
                      {formatINR(r.totalAmount)}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
                      {formatDate(r.date)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
