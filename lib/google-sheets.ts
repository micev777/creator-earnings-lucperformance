import { google } from "googleapis";
import {
  getCommissionStructure,
  calculateMonthlyCommission,
  getEffectiveRate,
} from "./commission";

// ---- Google Sheets API data fetcher ----
// This module replaces the CSV-based data loading with live Google Sheets reads.
//
// Required environment variables (set in Vercel or .env.local):
//   GOOGLE_SHEETS_SPREADSHEET_ID  – the ID from the sheet URL
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  – service account email
//   GOOGLE_SERVICE_ACCOUNT_KEY    – the private key (JSON-escaped)
//   COMMISSION_STRUCTURE          – "flat" (default) or "tiered_option_b"
//
// The sheet must be shared with the service account email (Viewer access is enough).

function parseCurrency(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace("£", "").replace(",", "")) || 0;
}

function parsePercent(val: string): number {
  if (!val) return 0;
  return parseFloat(val.replace("%", "")) || 0;
}

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(
        /\\n/g,
        "\n"
      ),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

async function fetchRange(range: string): Promise<string[][]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range,
  });
  return (response.data.values as string[][]) || [];
}

// ---- Public API (mirrors the CSV-based functions in data.ts) ----

export async function getMonthlyEarningsLive() {
  const rows = await fetchRange("Daily Spend!A2:F5000");

  // Use the actual date in column B to determine the month.
  // Column A (month number) can be unreliable if the sheet tags late-arriving
  // data under the wrong month. The real date is the source of truth.
  const monthMap = new Map<number, number>();

  for (const row of rows) {
    const dateStr = row[1]; // column B: actual date
    if (!dateStr) continue;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) continue;
    const month = date.getMonth() + 1; // 1-indexed
    const spend = parseCurrency(row[2]);
    if (month > 0) {
      monthMap.set(month, (monthMap.get(month) || 0) + spend);
    }
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

export async function getCreatorNameLive(): Promise<string> {
  const rows = await fetchRange("Daily per ad!B2:B2");
  return rows[0]?.[0]?.trim() || "Creator";
}

export async function getCurrentMonthSpendLive(): Promise<number> {
  const rows = await fetchRange("Daily per ad!A2:C5000");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  let total = 0;
  for (const row of rows) {
    const dateStr = row[0];
    if (!dateStr) continue;
    const date = new Date(dateStr);
    if (date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth) {
      total += parseCurrency(row[2]);
    }
  }
  return Math.round(total * 100) / 100;
}

export async function getDailySpendDataLive() {
  const rows = await fetchRange("Daily Spend!A2:C5000");

  return rows
    .filter((row) => row[1] && parseCurrency(row[2]) > 0)
    .map((row) => ({
      date: row[1],
      spend: parseCurrency(row[2]),
    }));
}

export async function getAdSummariesLive(monthFilter?: { month: number; year: number }) {
  // Fetch all rows from the "Daily per ad" sheet
  const rows = await fetchRange("Daily per ad!A2:P5000");

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

  for (const row of rows) {
    const adName = row[5] || "";
    if (!adName) continue;

    // If a month filter is provided, skip rows outside that month
    if (monthFilter) {
      const dateStr = row[0];
      if (!dateStr) continue;
      const date = new Date(dateStr);
      if (
        date.getFullYear() !== monthFilter.year ||
        date.getMonth() + 1 !== monthFilter.month
      ) {
        continue;
      }
    }

    const existing = adMap.get(adName) || {
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

    existing.totalSpend += parseCurrency(row[2]);
    existing.totalImpressions += parseInt(row[12]) || 0;
    existing.totalPurchases += parseInt(row[9]) || 0;
    existing.ctrSum += parsePercent(row[7]);
    existing.hookRateSum += parsePercent(row[8]);
    existing.roasSum += parseFloat(row[6]) || 0;
    existing.cpmSum += parseCurrency(row[10]);
    existing.holdRateSum += parsePercent(row[15]);
    existing.count += 1;

    adMap.set(adName, existing);
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
