import fs from "fs";
import path from "path";
import {
  getCommissionStructure,
  calculateMonthlyCommission,
  getEffectiveRate,
} from "./commission";

export interface DailySpend {
  month: number;
  date: string;
  spend: number;
}

export interface MonthlySpend {
  month: string;
  totalSpend: number;
  earnings: number;
}

export interface AdPerformance {
  date: string;
  creatorTag: string;
  spend: number;
  campaignName: string;
  adsetName: string;
  adName: string;
  roas: number;
  ctr: number;
  hookRate: number;
  websitePurchase: number;
  cpm: number;
  frequency: number;
  impressions: number;
  thruplays: number;
  videoAvgPlayTime: number;
  holdRate: number;
}

export interface AdSummary {
  adName: string;
  totalSpend: number;
  earnings: number;
  totalImpressions: number;
  totalPurchases: number;
  avgCTR: number;
  avgHookRate: number;
  avgROAS: number;
  avgCPM: number;
  avgHoldRate: number;
  daysActive: number;
}

function parseCurrency(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace("£", "").replace(",", "")) || 0;
}

function parsePercent(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace("%", "")) || 0;
}

// ---- CSV-based data loading (will be swapped for Google Sheets API) ----

function loadDailySpendCSV(): DailySpend[] {
  const csvPath = path.join(process.cwd(), "data", "daily-spend.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n").slice(1); // skip header

  return lines
    .map((line) => {
      const parts = line.split(",");
      return {
        month: parseInt(parts[0]) || 0,
        date: parts[1]?.trim() || "",
        spend: parseCurrency(parts[2]),
      };
    })
    .filter((d) => d.date && d.month > 0);
}

function loadAdPerformanceCSV(): AdPerformance[] {
  const csvPath = path.join(process.cwd(), "data", "daily-per-ad.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.trim().split("\n").slice(1);

  return lines.map((line) => {
    // Handle potential commas in quoted fields
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        parts.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    parts.push(current.trim());

    return {
      date: parts[0] || "",
      creatorTag: parts[1] || "",
      spend: parseCurrency(parts[2]),
      campaignName: parts[3] || "",
      adsetName: parts[4] || "",
      adName: parts[5] || "",
      roas: parseFloat(parts[6]) || 0,
      ctr: parsePercent(parts[7]),
      hookRate: parsePercent(parts[8]),
      websitePurchase: parseInt(parts[9]) || 0,
      cpm: parseCurrency(parts[10]),
      frequency: parseFloat(parts[11]) || 0,
      impressions: parseInt(parts[12]) || 0,
      thruplays: parseInt(parts[13]) || 0,
      videoAvgPlayTime: parseInt(parts[14]) || 0,
      holdRate: parsePercent(parts[15]),
    };
  });
}

export function getCreatorName(): string {
  const csvPath = path.join(process.cwd(), "data", "daily-per-ad.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const firstDataLine = raw.trim().split("\n")[1] || "";
  const parts = firstDataLine.split(",");
  return parts[1]?.trim() || "Creator";
}

export function getCurrentMonthSpend(): number {
  const ads = loadAdPerformanceCSV();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return Math.round(
    ads
      .filter((ad) => {
        const date = new Date(ad.date);
        return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
      })
      .reduce((sum, ad) => sum + ad.spend, 0) * 100
  ) / 100;
}

// ---- Public API ----

export function getMonthlyEarnings(): MonthlySpend[] {
  const daily = loadDailySpendCSV();
  const monthMap = new Map<number, number>();

  for (const d of daily) {
    monthMap.set(d.month, (monthMap.get(d.month) || 0) + d.spend);
  }

  const monthNames = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const structure = getCommissionStructure();

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, totalSpend]) => ({
      month: monthNames[month] || `Month ${month}`,
      totalSpend: Math.round(totalSpend * 100) / 100,
      earnings: Math.round(calculateMonthlyCommission(totalSpend, structure) * 100) / 100,
    }));
}

export function getDailySpendData(): { date: string; spend: number }[] {
  const daily = loadDailySpendCSV();
  return daily
    .filter((d) => d.spend > 0)
    .map((d) => ({
      date: d.date,
      spend: d.spend,
    }));
}

export function getAdSummaries(): AdSummary[] {
  const ads = loadAdPerformanceCSV();
  const adMap = new Map<
    string,
    {
      totalSpend: number;
      totalImpressions: number;
      totalPurchases: number;
      ctrSum: number;
      hookRateSum: number;
      roasSum: number;
      cpmSum: number;
      holdRateSum: number;
      count: number;
    }
  >();

  for (const ad of ads) {
    const existing = adMap.get(ad.adName) || {
      totalSpend: 0,
      totalImpressions: 0,
      totalPurchases: 0,
      ctrSum: 0,
      hookRateSum: 0,
      roasSum: 0,
      cpmSum: 0,
      holdRateSum: 0,
      count: 0,
    };

    existing.totalSpend += ad.spend;
    existing.totalImpressions += ad.impressions;
    existing.totalPurchases += ad.websitePurchase;
    existing.ctrSum += ad.ctr;
    existing.hookRateSum += ad.hookRate;
    existing.roasSum += ad.roas;
    existing.cpmSum += ad.cpm;
    existing.holdRateSum += ad.holdRate;
    existing.count += 1;

    adMap.set(ad.adName, existing);
  }

  const structure = getCommissionStructure();
  const totalSpendAll = Array.from(adMap.values()).reduce((s, d) => s + d.totalSpend, 0);
  const effectiveRate = getEffectiveRate(totalSpendAll, structure);

  return Array.from(adMap.entries())
    .map(([adName, data]) => ({
      adName,
      totalSpend: Math.round(data.totalSpend * 100) / 100,
      earnings: Math.round(data.totalSpend * effectiveRate * 100) / 100,
      totalImpressions: data.totalImpressions,
      totalPurchases: data.totalPurchases,
      avgCTR: Math.round((data.ctrSum / data.count) * 100) / 100,
      avgHookRate: Math.round((data.hookRateSum / data.count) * 100) / 100,
      avgROAS: Math.round((data.roasSum / data.count) * 100) / 100,
      avgCPM: Math.round((data.cpmSum / data.count) * 100) / 100,
      avgHoldRate: Math.round((data.holdRateSum / data.count) * 100) / 100,
      daysActive: data.count,
    }))
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

export function getTotalStats() {
  const monthly = getMonthlyEarnings();
  const ads = getAdSummaries();

  const totalSpend = monthly.reduce((sum, m) => sum + m.totalSpend, 0);
  const totalEarnings = Math.round(monthly.reduce((sum, m) => sum + m.earnings, 0) * 100) / 100;
  const topAd = ads[0];

  return {
    totalSpend: Math.round(totalSpend * 100) / 100,
    totalEarnings,
    totalAds: ads.length,
    topAd: topAd?.adName || "N/A",
    topAdSpend: topAd?.totalSpend || 0,
  };
}
