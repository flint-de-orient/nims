"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useNIMSStore } from "@/lib/store";
import { formatINR, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  TrendingUp, TrendingDown, AlertCircle, CreditCard, RefreshCw, Bell, Receipt, ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format } from "date-fns";

const COURSE_COLORS: Record<string, string> = {
  "GNM": "#0F766E",
  "B.Sc Nursing": "#5EEAD4",
  "P.B. B.Sc": "#F59E0B",
  "M.Sc Nursing": "#0B3D3A",
};

export default function FinanceDashboard() {
  const { receipts, students, defaulters } = useNIMSStore();
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

  // Recent receipts
  const recentReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8)
      .map(r => ({ ...r, student: students.find(s => s.id === r.studentId) }));
  }, [receipts, students]);

  const kpiCards = [
    {
      title: "Collected This Month",
      value: formatINR(collectedThisMonth),
      icon: <CreditCard size={20} />,
      color: "#0F766E",
      bg: "#F0FDFA",
      sub: `${receipts.filter(r => isWithinInterval(new Date(r.date), { start: thisMonthStart, end: thisMonthEnd })).length} receipts`,
    },
    {
      title: "Outstanding",
      value: formatINR(totalOutstanding),
      icon: <AlertCircle size={20} />,
      color: "#F97066",
      bg: "#FFF1F0",
      sub: `Overdue: ${formatINR(overdueAmount)} · Due: ${formatINR(currentDue)}`,
    },
    {
      title: "Refunds (2025-26)",
      value: "₹0",
      icon: <RefreshCw size={20} />,
      color: "#475569",
      bg: "#f8fafc",
      sub: "No refunds processed",
    },
    {
      title: "MoM Change",
      value: `${momDelta >= 0 ? "+" : ""}${momDelta.toFixed(1)}%`,
      icon: momDelta >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />,
      color: momDelta >= 0 ? "#0F766E" : "#F97066",
      bg: momDelta >= 0 ? "#F0FDFA" : "#FFF1F0",
      sub: `vs ${formatINR(collectedLastMonth)} last month`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border p-5 flex flex-col gap-3" style={{ borderColor: "#E2E8F0" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "#475569" }}>{card.title}</span>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.bg, color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div className="font-serif font-bold text-2xl" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs" style={{ color: "#475569" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Line chart - 2 cols */}
        <div className="col-span-2 bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>12-Month Fee Collection Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v) => [formatINR(Number(v)), "Collected"]} contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Line type="monotone" dataKey="amount" stroke="#0F766E" strokeWidth={2.5} dot={{ fill: "#0F766E", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart - 1 col */}
        <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E2E8F0" }}>
          <h3 className="font-serif font-semibold mb-4" style={{ color: "#0F172A" }}>Collection by Course</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={courseData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {courseData.map((entry, index) => (
                  <Cell key={index} fill={COURSE_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [formatINR(Number(v)), ""]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: defaulters + recent receipts */}
      <div className="grid grid-cols-5 gap-4">
        {/* Defaulters - 3 cols */}
        <div className="col-span-3 bg-white rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Top Defaulters</h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#FFF1F0", color: "#F97066" }}>
              {defaulters.length} students
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#f8fafc" }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Student</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Overdue</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#475569" }}>Age</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {topDefaulters.map((d, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: "#f1f5f9" }}>
                    <td className="px-5 py-3">
                      <Link href={`/finance/ledger/${d.student!.id}`} className="hover:underline font-medium" style={{ color: "#0F172A" }}>
                        {d.student!.name}
                      </Link>
                      <div className="text-xs" style={{ color: "#475569" }}>
                        {d.student!.course} · Yr {d.student!.year}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: "#F97066" }}>
                      {formatINR(d.overdueAmount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        d.overdueDays > 90 ? "bg-red-50 text-red-600" :
                        d.overdueDays > 30 ? "bg-orange-50 text-orange-600" :
                        "bg-yellow-50 text-yellow-700"
                      }`}>
                        {d.overdueDays}d
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toast({ title: "Reminder sent", description: `SMS reminder sent to ${d.student!.name}`, variant: "success" })}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors hover:bg-teal-50"
                        style={{ borderColor: "#0F766E", color: "#0F766E" }}
                      >
                        <Bell size={12} /> Remind
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent receipts - 2 cols */}
        <div className="col-span-2 bg-white rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <h3 className="font-serif font-semibold" style={{ color: "#0F172A" }}>Recent Receipts</h3>
            <Link href="/finance/ledger" className="text-xs font-medium flex items-center gap-1 hover:underline" style={{ color: "#0F766E" }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
            {recentReceipts.map((r) => (
              <Link key={r.id} href={`/finance/receipt/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F0FDFA" }}>
                  <Receipt size={14} style={{ color: "#0F766E" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "#0F172A" }}>{r.student?.name || "Unknown"}</div>
                  <div className="text-xs" style={{ color: "#475569" }}>{r.receiptNumber}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold" style={{ color: "#0F766E" }}>{formatINR(r.totalAmount)}</div>
                  <div className="text-xs" style={{ color: "#475569" }}>{formatDate(r.date)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
