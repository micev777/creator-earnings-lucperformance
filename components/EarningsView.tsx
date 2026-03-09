"use client";

import type { MonthlySpend } from "@/lib/data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Props {
  monthlyEarnings: MonthlySpend[];
  totalStats: {
    totalSpend: number;
    totalEarnings: number;
    totalAds: number;
    topAd: string;
    topAdSpend: number;
  };
  dailySpend: { date: string; spend: number }[];
}

function formatCurrency(val: number): string {
  return `£${val.toFixed(2)}`;
}

function formatAdName(name: string): string {
  // Extract meaningful part from long ad names
  const parts = name.split("_");
  // Try to find the descriptive part
  const meaningful = parts.filter(
    (p) =>
      !p.match(/^\d+$/) &&
      p !== "DIP" &&
      p !== "Video" &&
      p !== "9x16" &&
      p !== "Copy" &&
      p !== "INV" &&
      p !== "LD" &&
      p !== "DS"
  );
  return meaningful.slice(-3).join(" ") || name.slice(0, 40);
}

export default function EarningsView({
  monthlyEarnings,
  totalStats,
  dailySpend,
}: Props) {
  // Prepare daily chart data with cumulative earnings
  const chartData = dailySpend.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    spend: d.spend,
    earnings: Math.round(d.spend * 0.05 * 100) / 100,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Total Ad Spend</p>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(totalStats.totalSpend)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Across all campaigns</p>
        </div>
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] rounded-xl p-6 text-white">
          <p className="text-sm text-blue-200 mb-1">Your Earnings (5%)</p>
          <p className="text-3xl font-bold">
            {formatCurrency(totalStats.totalEarnings)}
          </p>
          <p className="text-xs text-blue-200 mt-1">Total commission earned</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">Top Performing Ad</p>
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {formatAdName(totalStats.topAd)}
          </p>
          <p className="text-xs text-emerald-600 mt-2">
            {formatCurrency(totalStats.topAdSpend)} spend
          </p>
        </div>
      </div>

      {/* Monthly Earnings Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Earnings
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pr-4">Month</th>
                <th className="pb-3 pr-4 text-right">Ad Spend</th>
                <th className="pb-3 pr-4 text-right">Your Earnings (5%)</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyEarnings.map((m, i) => (
                <tr
                  key={m.month}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="py-4 pr-4">
                    <span className="font-medium text-gray-900">{m.month}</span>
                  </td>
                  <td className="py-4 pr-4 text-right text-gray-600">
                    {formatCurrency(m.totalSpend)}
                  </td>
                  <td className="py-4 pr-4 text-right">
                    <span className="font-semibold text-[#1e3a5f]">
                      {formatCurrency(m.earnings)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        i === monthlyEarnings.length - 1
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {i === monthlyEarnings.length - 1
                        ? "In Progress"
                        : "Complete"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Earnings by Month
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyEarnings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(v) => `£${v}`}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatCurrency(value),
                  name === "earnings" ? "Your Earnings" : "Ad Spend",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="totalSpend"
                fill="#e2e8f0"
                radius={[4, 4, 0, 0]}
                name="Ad Spend"
              />
              <Bar
                dataKey="earnings"
                fill="#1e3a5f"
                radius={[4, 4, 0, 0]}
                name="Your Earnings"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Spend Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Spend Trend
        </h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(v) => `£${v}`}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatCurrency(value),
                  name === "spend" ? "Ad Spend" : "Your Earnings",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="spend"
                stroke="#1e3a5f"
                fill="#1e3a5f"
                fillOpacity={0.1}
                strokeWidth={2}
                name="spend"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
