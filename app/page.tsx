import {
  getMonthlyEarnings,
  getAdSummaries,
  getDailySpendData,
  getCreatorName,
  getCurrentMonthSpend,
} from "@/lib/data";
import {
  getMonthlyEarningsLive,
  getAdSummariesLive,
  getDailySpendDataLive,
  getCreatorNameLive,
  getCurrentMonthSpendLive,
} from "@/lib/google-sheets";
import {
  getCommissionStructure,
  getCommissionDescription,
} from "@/lib/commission";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const useLive = process.env.USE_GOOGLE_SHEETS === "true";

  let monthlyEarnings, adSummaries, dailySpend, creatorName, currentMonthSpend;

  if (useLive) {
    [monthlyEarnings, adSummaries, dailySpend, creatorName, currentMonthSpend] =
      await Promise.all([
        getMonthlyEarningsLive(),
        getAdSummariesLive(),
        getDailySpendDataLive(),
        getCreatorNameLive(),
        getCurrentMonthSpendLive(),
      ]);
  } else {
    monthlyEarnings = getMonthlyEarnings();
    adSummaries = getAdSummaries();
    dailySpend = getDailySpendData();
    creatorName = getCreatorName();
    currentMonthSpend = getCurrentMonthSpend();
  }

  const totalSpend = monthlyEarnings.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalEarnings =
    Math.round(monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0) * 100) / 100;
  const topAd = adSummaries[0];
  const commissionStructure = getCommissionStructure();
  const commissionDescription = getCommissionDescription(commissionStructure);

  // Current month name
  const now = new Date();
  const currentMonthName = now.toLocaleString("en-GB", { month: "long" });

  const totalStats = {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalEarnings,
    totalAds: adSummaries.length,
    topAd: topAd?.adName || "N/A",
    topAdSpend: topAd?.totalSpend || 0,
    commissionDescription,
    commissionStructure,
    creatorName: creatorName || "Creator",
    currentMonthSpend: currentMonthSpend || 0,
    currentMonth: currentMonthName,
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
