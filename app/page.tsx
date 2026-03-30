import {
  getMonthlyEarnings,
  getAdSummaries,
  getDailySpendData,
} from "@/lib/data";
import {
  getMonthlyEarningsLive,
  getAdSummariesLive,
  getDailySpendDataLive,
} from "@/lib/google-sheets";
import { getCommissionStructure, getCommissionDescription } from "@/lib/commission";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export default async function Home() {
  const useLive = process.env.USE_GOOGLE_SHEETS === "true";

  let monthlyEarnings, adSummaries, dailySpend;

  if (useLive) {
    [monthlyEarnings, adSummaries, dailySpend] = await Promise.all([
      getMonthlyEarningsLive(),
      getAdSummariesLive(),
      getDailySpendDataLive(),
    ]);
  } else {
    monthlyEarnings = getMonthlyEarnings();
    adSummaries = getAdSummaries();
    dailySpend = getDailySpendData();
  }

  const totalSpend = monthlyEarnings.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalEarnings = Math.round(monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0) * 100) / 100;
  const topAd = adSummaries[0];
  const commissionDescription = getCommissionDescription(getCommissionStructure());

  const totalStats = {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalEarnings,
    totalAds: adSummaries.length,
    topAd: topAd?.adName || "N/A",
    topAdSpend: topAd?.totalSpend || 0,
    commissionDescription,
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
