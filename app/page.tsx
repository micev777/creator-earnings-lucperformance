import {
  getMonthlyEarnings,
  getAdSummaries,
  getTotalStats,
  getDailySpendData,
} from "@/lib/data";
import {
  getMonthlyEarningsLive,
  getAdSummariesLive,
  getDailySpendDataLive,
} from "@/lib/google-sheets";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic"; // Always fetch fresh data

const COMMISSION_RATE = 0.05;

export default async function Home() {
  const useLive = process.env.USE_GOOGLE_SHEETS === "true";

  let monthlyEarnings, adSummaries, dailySpend;

  if (useLive) {
    // Production: fetch from Google Sheets API
    [monthlyEarnings, adSummaries, dailySpend] = await Promise.all([
      getMonthlyEarningsLive(),
      getAdSummariesLive(),
      getDailySpendDataLive(),
    ]);
  } else {
    // Development: use local CSV files
    monthlyEarnings = getMonthlyEarnings();
    adSummaries = getAdSummaries();
    dailySpend = getDailySpendData();
  }

  const totalSpend = monthlyEarnings.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalEarnings = Math.round(totalSpend * COMMISSION_RATE * 100) / 100;
  const topAd = adSummaries[0];

  const totalStats = {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalEarnings,
    totalAds: adSummaries.length,
    topAd: topAd?.adName || "N/A",
    topAdSpend: topAd?.totalSpend || 0,
  };

  return (
    <Dashboard
      monthlyEarnings={monthlyEarnings}
      adSummaries={adSummaries}
      totalStats={totalStats}
      dailySpend={dailySpend}
    />
  );
}
