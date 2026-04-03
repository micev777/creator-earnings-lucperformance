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

  // Resolve current month/year upfront — used for filtering
  const now = new Date();
  const currentMonthNum = now.getMonth() + 1; // 1-indexed
  const currentYear = now.getFullYear();
  const currentMonthName = now.toLocaleString("en-GB", { month: "long" });

  let monthlyEarnings, adSummaries, currentMonthAdSummaries, dailySpend, creatorName;

  if (useLive) {
    [monthlyEarnings, adSummaries, currentMonthAdSummaries, dailySpend, creatorName] =
      await Promise.all([
        getMonthlyEarningsLive(),
        getAdSummariesLive(),                                              // all-time (Ad Performance tab)
        getAdSummariesLive({ month: currentMonthNum, year: currentYear }), // current month (top ad card)
        getDailySpendDataLive(),
        getCreatorNameLive(),
      ]);
  } else {
    monthlyEarnings = getMonthlyEarnings();
    adSummaries = getAdSummaries();
    currentMonthAdSummaries = adSummaries; // CSV dev mode — no date filter
    dailySpend = getDailySpendData();
    creatorName = getCreatorName();
  }

  // Top ad is the current month's best performer
  const topAd = currentMonthAdSummaries[0] ?? adSummaries[0];
  const commissionStructure = getCommissionStructure();
  const commissionDescription = getCommissionDescription(commissionStructure);

  // Current month entry — used for summary cards and tier progress.
  // Tiers reset monthly, so all top-level figures reflect the current month only.
  const currentMonthEntry = monthlyEarnings.find((m) => m.month === currentMonthName);
  const currentMonthSpend = currentMonthEntry?.totalSpend || 0;
  const currentMonthEarnings = Math.round((currentMonthEntry?.earnings || 0) * 100) / 100;

  const totalStats = {
    totalSpend: currentMonthSpend,
    totalEarnings: currentMonthEarnings,
    totalAds: currentMonthAdSummaries.length,
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
      adSummaries={currentMonthAdSummaries}
      totalStats={totalStats}
      dailySpend={dailySpend}
    />
  );
}
