# Google Sheets Auto-Upload Setup

This guide sets up automatic upload of the generated on-call schedule to your Google Drive spreadsheet.

The upload code is already written — you just need credentials.

---

## What It Does

After schedule generation succeeds, the Python script:
1. Opens your spreadsheet named **"On Call Schedule"** in Google Drive
2. Finds (or creates) a worksheet named **"On call schedule YYYY"** (e.g., "On call schedule 2026")
3. Appends the new month's schedule with developer colors
4. Leaves previous months untouched

---

## Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"New Project"** → name it anything (e.g., `oncall-scheduler`)
3. Click **"Create"**

---

## Step 2: Enable the Required APIs

In your new project:

1. Go to **APIs & Services → Library**
2. Search for **"Google Sheets API"** → click it → **Enable**
3. Search for **"Google Drive API"** → click it → **Enable**

---

## Step 3: Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **"+ Create Credentials"** → **"Service Account"**
3. Name: `oncall-bot` → click **Create and Continue**
4. Role: **Editor** → click **Continue** → **Done**

---

## Step 4: Download the JSON Key

1. In the Credentials page, click your new service account (`oncall-bot@...`)
2. Go to the **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"** → **JSON** → **Create**
4. A `.json` file downloads — rename it to **`google-credentials.json`**
5. Move it to the project root (same folder as `on_call_scheduler_with_sheets.py`)

---

## Step 5: Share Your Spreadsheet with the Service Account

1. Open `google-credentials.json` and find the `"client_email"` field:
   ```
   "client_email": "oncall-bot@your-project.iam.gserviceaccount.com"
   ```
2. Open your Google Drive spreadsheet **"On Call Schedule"**
3. Click **Share** (top right)
4. Paste the `client_email` address → set role to **Editor** → **Send**

> The service account now has permission to edit the spreadsheet automatically.

---

## Step 6: Create config.json

Copy the template and fill it in:

```bash
cp config.json.template config.json
```

The only field you need to set is `credentials_file` — it's already set correctly in the template:

```json
{
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": true
}
```

> The spreadsheet is found by name **"On Call Schedule"** — make sure your Google Drive spreadsheet has exactly this name.

---

## Step 7: Install Python Dependencies

```bash
pip install gspread oauth2client
```

(These are in addition to pandas and openpyxl which you likely already have.)

---

## Step 8: Test It Manually

```bash
cd /path/to/ohad_tools
python3 on_call_scheduler_with_sheets.py
```

You should see:
```
✓ Planning schedule for: Mar 2026
✓ Connected to spreadsheet: On Call Schedule
✓ Found worksheet: On call schedule 2026
✓ Uploaded 31 days of schedule
✓ Applied colors to 62 cells
✓ SUCCESS! Schedule uploaded to Google Sheets
```

---

## Disabling Upload (Local Only)

To generate locally without uploading, set in `config.json`:

```json
{
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": false
}
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `SpreadsheetNotFound` | Make sure spreadsheet is named exactly **"On Call Schedule"** and shared with the service account email |
| `403 Forbidden` | Service account not shared on the spreadsheet — redo Step 5 |
| `FileNotFoundError: google-credentials.json` | Credentials file missing or wrong path in `config.json` |
| `ModuleNotFoundError: gspread` | Run `pip install gspread oauth2client` |
