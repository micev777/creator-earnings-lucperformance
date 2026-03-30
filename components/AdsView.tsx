"use client";

import { useState } from "react";
import type { AdSummary } from "@/lib/data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  adSummaries: AdSummary[];
  totalStats: {
    totalSpend: number;
    totalEarnings: number;
    totalAds: number;
    topAd: string;
    topAdSpend: number;
    commissionDescription: string;
  };
}

function formatCurrency(val: number): string {
  return `£${val.toFixed(2)}`;
}


type SortField = "totalSpend" | "avgCTR" | "avgHookRate" | "avgROAS" | "totalImpressions" | "avgHoldRate";

export default function AdsView({ adSummaries, totalStats }: Props) {
  const [sortBy, setSortBy] = useState<SortField>("totalSpend");
  const [showAll, setShowAll] = useState(false);

  const sorted = [...adSummaries].sort((a, b) => {
    return (b[sortBy] as number) - (a[sortBy] as number);
  });

  const displayed = showAll ? sorted : sorted.slice(0, 10);

  // Top 8 for chart — use rank number on Y-axis, full name in tooltip
  const chartData = sorted.slice(0, 8).map((ad, i) => ({
    name: `#${i + 1}`,
    fullName: ad.adName,
    spend: ad.totalSpend,
    earnings: ad.earnings,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Ads</p>
          <p className="text-2xl font-bold text-gray-900">
            {totalStats.totalAds}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Total Spend</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalStats.totalSpend)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] rounded-xl p-5 text-white">
          <p className="text-sm text-blue-200 mb-1">Your Total Earnings</p>
          <p className="text-2xl font-bold">
            {formatCurrency(totalStats.totalEarnings)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">Best Ad Earnings</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(sorted[0]?.earnings || 0)}
          </p>
        </div>
      </div>

      {/* Top Ads Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Top Performing Ads by Spend
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "#64748b" }}
                tickFormatter={(v) => `£${v}`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }}
                width={32}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value)),
                  name === "spend" ? "Ad Spend" : "Your Earnings",
                ]}
                labelFormatter={(label: any, payload: any) =>
                  payload?.[0]?.payload?.fullName || label
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  maxWidth: "300px",
                  whiteSpace: "normal",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="spend"
                fill="#1e3a5f"
                radius={[0, 4, 4, 0]}
                name="spend"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Ad Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            All Ads — Ranked
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            >
              <option value="totalSpend">Spend</option>
              <option value="avgCTR">CTR</option>
              <option value="avgHookRate">Hook Rate</option>
              <option value="avgROAS">ROAS</option>
              <option value="totalImpressions">Impressions</option>
              <option value="avgHoldRate">Hold Rate</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 pr-3 w-8">#</th>
                <th className="pb-3 pr-4">Ad</th>
                <th className="pb-3 pr-4 text-right">Spend</th>
                <th className="pb-3 pr-4 text-right">Earnings</th>
                <th className="pb-3 pr-4 text-right">Impressions</th>
                <th className="pb-3 pr-4 text-right">CTR</th>
                <th className="pb-3 pr-4 text-right">Hook Rate</th>
                <th className="pb-3 pr-4 text-right">Hold Rate</th>
                <th className="pb-3 pr-4 text-right">ROAS</th>
                <th className="pb-3 text-right">Days</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((ad, i) => (
                <tr
                  key={ad.adName}
                  className={`border-b border-gray-50 last:border-0 ${
                    i === 0 ? "bg-amber-50/50" : ""
                  }`}
                >
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i < 3
                          ? "bg-gray-100 text-gray-600"
                          : "text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-sm font-medium text-gray-900 leading-tight break-all">
                      {ad.adName}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-right text-sm text-gray-600">
                    {formatCurrency(ad.totalSpend)}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm font-medium text-[#1e3a5f]">
                    {formatCurrency(ad.earnings)}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm text-gray-600">
                    {ad.totalImpressions.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right text-sm text-gray-600">
                    {ad.avgCTR.toFixed(2)}%
                  </td>
                  <td className="py-3 pr-4 text-right text-sm text-gray-600">
                    {ad.avgHookRate.toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4 text-right text-sm text-gray-600">
                    {ad.avgHoldRate.toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4 text-right text-sm text-gray-600">
                    {ad.avgROAS.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-500">
                    {ad.daysActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adSummaries.length > 10 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-[#1e3a5f] hover:text-[#2d5a8e] font-medium"
            >
              {showAll
                ? "Show Top 10"
                : `Show All ${adSummaries.length} Ads`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
