import {
  getMonthlyEarnings,
  getAdSummaries,
  getDailySpendData,
  getCreatorName,
} from "@/lib/data";
import {
  getMonthlyEarningsLive,
  getAdSummariesLive,
  getDailySpendDataLive,
  getCreatorNameLive,
} from "@/lib/google-sheets";
import {
  getCommissionStructure,
  getCommissionDescription,
} from "@/lib/commission";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const useLive = process.env.USE_GOOGLE_SHEETS === "true";

  let monthlyEarnings, adSummaries, dailySpend, creatorName;

  if (useLive) {
    [monthlyEarnings, adSummaries, dailySpend, creatorName] = await Promise.all([
      getMonthlyEarningsLive(),
      getAdSummariesLive(),
      getDailySpendDataLive(),
      getCreatorNameLive(),
    ]);
  } else {
    monthlyEarnings = getMonthlyEarnings();
    adSummaries = getAdSummaries();
    dailySpend = getDailySpendData();
    creatorName = getCreatorName();
  }

  const totalSpend = monthlyEarnings.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalEarnings =
    Math.round(monthlyEarnings.reduce((sum, m) => sum + m.earnings, 0) * 100) / 100;
  const topAd = adSummaries[0];
  const commissionStructure = getCommissionStructure();
  const commissionDescription = getCommissionDescription(commissionStructure);
  const latestMonth = monthlyEarnings[monthlyEarnings.length - 1];

  const totalStats = {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalEarnings,
    totalAds: adSummaries.length,
    topAd: topAd?.adName || "N/A",
    topAdSpend: topAd?.totalSpend || 0,
    commissionDescription,
    commissionStructure,
    creatorName: creatorName || "Creator",
    currentMonthSpend: latestMonth?.totalSpend || 0,
    currentMonth: latestMonth?.month || "",
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
