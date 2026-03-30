"use client";

import { useState } from "react";
import type { MonthlySpend, AdSummary } from "@/lib/data";
import EarningsView from "./EarningsView";
import AdsView from "./AdsView";

interface Props {
  monthlyEarnings: MonthlySpend[];
  adSummaries: AdSummary[];
  totalStats: {
    totalSpend: number;
    totalEarnings: number;
    totalAds: number;
    topAd: string;
    topAdSpend: number;
    commissionDescription: string;
  };
  dailySpend: { date: string; spend: number }[];
}

export default function Dashboard({
  monthlyEarnings,
  adSummaries,
  totalStats,
  dailySpend,
}: Props) {
  const [activeView, setActiveView] = useState<"earnings" | "ads">("earnings");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Creator Dashboard
                </h1>
                <p className="text-xs text-gray-500">Dip Performance</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveView("earnings")}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === "earnings"
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly Earnings
            </button>
            <button
              onClick={() => setActiveView("ads")}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === "ads"
                  ? "border-[#1e3a5f] text-[#1e3a5f]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Ad Performance
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === "earnings" ? (
          <EarningsView
            monthlyEarnings={monthlyEarnings}
            totalStats={totalStats}
            dailySpend={dailySpend}
          />
        ) : (
          <AdsView adSummaries={adSummaries} totalStats={totalStats} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 text-center">
            Earnings calculated at {totalStats.commissionDescription}. Data refreshes automatically.
          </p>
        </div>
      </footer>
    </div>
  );
}
