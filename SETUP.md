# Creator Earnings Dashboard — Setup Guide

## Quick Start (Local Development with CSV data)

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — the app works immediately using the CSV data files in `/data/`.

---

## Going Live with Google Sheets

To make the dashboard pull live data from the Google Sheet, you need to set up a Google Cloud service account. This takes about 5 minutes.

### Step 1: Create a Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name it something like "Creator Dashboard"
4. Click "Create"

### Step 2: Enable the Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### Step 3: Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Name it "sheets-reader"
4. Click "Done" (no need to grant additional roles)
5. Click on the service account you just created
6. Go to the "Keys" tab → "Add Key" → "Create new key" → JSON
7. A JSON file will download — this contains your credentials

### Step 4: Share the Google Sheet

1. Open the JSON key file and copy the `client_email` value
2. Go to your Google Sheet
3. Click "Share" and paste the service account email
4. Give it "Viewer" access

### Step 5: Set Environment Variables

Create a `.env.local` file (or set these in Vercel):

```
GOOGLE_SHEETS_SPREADSHEET_ID=1gYHEyrBvjRsWPTw0oJ2v8yBAhaBxcA9N4OR2zhnSNes
GOOGLE_SERVICE_ACCOUNT_EMAIL=sheets-reader@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
USE_GOOGLE_SHEETS=true
```

The private key is in the downloaded JSON file under the `private_key` field. Copy it exactly.

### Step 6: Deploy to Vercel

1. Push the project to a GitHub repo
2. Go to https://vercel.com → "New Project" → Import the repo
3. Add the environment variables from Step 5
4. Deploy!

The dashboard will now pull live data from the Google Sheet on every page load.

---

## How It Works

- **CSV mode** (`USE_GOOGLE_SHEETS=false`): Reads from `/data/daily-spend.csv` and `/data/daily-per-ad.csv`
- **Live mode** (`USE_GOOGLE_SHEETS=true`): Fetches from Google Sheets API on every request
- The 5% commission is calculated automatically
- The sheet names expected are "Daily Spend" and "Daily per ad" (matching your current setup)

## Adding a New Creator

Option A (simplest): Duplicate this entire project, change the sheet ID, deploy as a new Vercel project.

Option B (scalable): We can add route-based support like `/dashboard/[creator]` — let me know when you're ready for this.
