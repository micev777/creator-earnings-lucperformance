import { google } from "googleapis";

// ---- Google Sheets API data fetcher ----
// This module replaces the CSV-based data loading with live Google Sheets reads.
//
// Required environment variables (set in Vercel or .env.local):
//   GOOGLE_SHEETS_SPREADSHEET_ID  – the ID from the sheet URL
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  – service account email
//   GOOGLE_SERVICE_ACCOUNT_KEY    – the private key (JSON-escaped)
//
// The sheet must be shared with the service account email (Viewer access is enough).

const COMMISSION_RATE = 0.05;

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
  const rows = await fetchRange("Daily Spend!A2:F100");

  // The sheet has monthly totals in columns E and F
  // But we also compute from daily data as a fallback
  const monthMap = new Map<number, number>();

  for (const row of rows) {
    const month = parseInt(row[0]) || 0;
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

  return Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([month, totalSpend]) => ({
      month: monthNames[month] || `Month ${month}`,
      totalSpend: Math.round(totalSpend * 100) / 100,
      earnings: Math.round(totalSpend * COMMISSION_RATE * 100) / 100,
    }));
}

export async function getDailySpendDataLive() {
  const rows = await fetchRange("Daily Spend!A2:C100");

  return rows
    .filter((row) => row[1] && parseCurrency(row[2]) > 0)
    .map((row) => ({
      date: row[1],
      spend: parseCurrency(row[2]),
    }));
}

export async function getAdSummariesLive() {
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

  return Array.from(adMap.entries())
    .map(([adName, data]) => ({
      adName,
      totalSpend: Math.round(data.totalSpend * 100) / 100,
      earnings: Math.round(data.totalSpend * COMMISSION_RATE * 100) / 100,
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
