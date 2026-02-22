# On-Call Constraints & Scheduling System - Setup Guide

This guide will help you set up the complete on-call scheduling system with Google Sheets integration.

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Part 1: Web App Setup](#part-1-web-app-setup)
4. [Part 2: Google Sheets Setup](#part-2-google-sheets-setup)
5. [Part 3: Running the System](#part-3-running-the-system)
6. [Troubleshooting](#troubleshooting)

---

## System Overview

The system consists of three main components:

1. **Web Interface** - Developers fill in their monthly constraints
2. **Node.js Backend** - Manages data in `constraints.json`
3. **Python Script** - Generates schedule and uploads to Google Sheets with color coding

### File Structure

```
ohad_tools/
├── constraints-app/
│   ├── server.js                    # Backend API server
│   ├── package.json                 # Node.js dependencies
│   └── public/
│       └── index.html               # Web interface
├── data/
│   └── constraints.json             # Shared data file (auto-created)
├── on_call_scheduler_with_sheets.py # Main scheduling script
├── on_call_2.py                     # Original script (preserved)
├── config.json                      # Google Sheets configuration
├── google-credentials.json          # Google API credentials (you'll create this)
├── requirements.txt                 # Python dependencies
└── SETUP.md                         # This file
```

---

## Prerequisites

### Required Software

- **Node.js** (v16 or higher)
  - Check: `node --version`
  - Install: https://nodejs.org/

- **Python** (v3.8 or higher)
  - Check: `python3 --version`
  - Install: https://www.python.org/

- **pip** (Python package manager)
  - Check: `pip3 --version`

### Required Accounts

- **Google Account** with access to Google Drive and Google Sheets

---

## Part 1: Web App Setup

### Step 1: Install Node.js Dependencies

```bash
cd constraints-app
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing

### Step 2: Install Python Dependencies

```bash
cd ..
pip3 install -r requirements.txt
```

This will install:
- `pandas` - Data manipulation
- `gspread` - Google Sheets API
- `oauth2client` - Google authentication

### Step 3: Test the Web App

Start the server:

```bash
cd constraints-app
npm start
```

You should see:

```
🚀 On-Call Constraints Server
📍 Server running at: http://localhost:3000
📁 Data file: ../data/constraints.json
```

Open your browser and go to: **http://localhost:3000**

You should see the constraints collection interface!

### Step 4: Share with Developers

On your local network, find your computer's IP address:

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Share the URL with your team: `http://YOUR_IP:3000`

For example: `http://192.168.1.100:3000`

---

## Part 2: Google Sheets Setup

> 📖 **For detailed, step-by-step instructions with troubleshooting, see [SERVICE_ACCOUNT_SETUP.md](SERVICE_ACCOUNT_SETUP.md)**

This section provides a quick overview. For comprehensive guidance, refer to the detailed guide.

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name it: `On-Call Scheduler`
4. Click **"Create"**

### Step 2: Enable Google Sheets API

1. In the Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Sheets API"**
3. Click on it and press **"Enable"**
4. Also enable **"Google Drive API"** (same process)

### Step 3: Create Service Account

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"Service Account"**
3. Fill in:
   - **Service account name**: `on-call-scheduler`
   - **Service account ID**: (auto-generated)
   - **Description**: `Service account for on-call scheduling`
4. Click **"Create and Continue"**
5. Skip optional steps, click **"Done"**

### Step 4: Download Credentials

1. Find your service account in the list
2. Click on the email address
3. Go to the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Choose **"JSON"** format
6. Click **"Create"**
7. The JSON file will download automatically
8. **Rename it to `google-credentials.json`**
9. **Move it to your `ohad_tools/` directory**

⚠️ **IMPORTANT**: Keep this file secure! Don't commit it to git or share it publicly.

### Step 5: Share Your Google Sheet

1. Open the downloaded `google-credentials.json`
2. Find the **"client_email"** field (looks like: `xxx@xxx.iam.gserviceaccount.com`)
3. **Copy this email address**
4. Open your Google Sheets spreadsheet
5. Click **"Share"** button
6. Paste the service account email
7. Give it **"Editor"** access
8. Click **"Send"**

### Step 6: Get Your Spreadsheet ID

From your Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
                                        ^^^^^^^^^^^^^^^^^^^
                                        Copy this part
```

### Step 7: Create Configuration File

1. Copy the template:
   ```bash
   cp config.json.template config.json
   ```

2. Edit `config.json`:
   ```json
   {
     "spreadsheet_id": "YOUR_SPREADSHEET_ID_FROM_STEP_6",
     "worksheet_name": "2026",
     "credentials_file": "google-credentials.json"
   }
   ```

3. Update the `worksheet_name` to match the tab name in your spreadsheet (e.g., "2026", "2027")

---

## Part 3: Running the System

### Complete Workflow

#### 1. Collect Constraints (Monthly)

At the beginning of each month:

```bash
cd constraints-app
npm start
```

Share the URL with your team: `http://YOUR_IP:3000`

Developers will:
- Select their name
- Pick unavailable dates
- Choose Day/Night shifts
- Submit constraints

The data is automatically saved to `data/constraints.json`

#### 2. Generate Schedule

When ready to generate the schedule:

```bash
cd ..
python3 on_call_scheduler_with_sheets.py
```

The script will:
1. ✅ Read constraints from `constraints.json`
2. ✅ Generate optimized schedule
3. ✅ Save to `shift_schedule.csv` (local backup)
4. ✅ Upload to Google Sheets
5. ✅ Apply developer colors automatically

#### 3. Verify in Google Sheets

Open your Google Sheet and check:
- The schedule is in the correct tab (e.g., "2026")
- Each developer has their assigned color
- All dates are populated correctly

---

## Configuration Options

### Updating Developer List

To add or remove developers, edit `server.js` lines 32-41:

```javascript
developers: {
    "Gabriel": { email: "", restrictions: [] },
    "Shlomi": { email: "", restrictions: [] },
    // Add new developers here
    "NewDeveloper": { email: "", restrictions: [] }
}
```

### Updating Developer Colors

To change developer colors, edit `on_call_scheduler_with_sheets.py` lines 9-20:

```python
DEVELOPER_COLORS = {
    "Omer": {"red": 0.6, "green": 0.7, "blue": 0.9},
    # RGB values from 0 to 1
    # Add new developer colors here
}
```

Color picker tool: https://www.google.com/search?q=color+picker

Convert RGB (0-255) to (0-1) by dividing by 255.

### Updating Month/Year

The script automatically reads dates from line 6 in `on_call_scheduler_with_sheets.py`:

```python
all_days = pd.date_range(start="2026-02-01", end="2026-02-28", freq="D")
```

Update this for each new month.

---

## Troubleshooting

### Problem: "Module not found" errors

**Solution**: Reinstall dependencies
```bash
pip3 install -r requirements.txt
cd constraints-app && npm install
```

### Problem: "Permission denied" for Google Sheets

**Solution**:
1. Check that you shared the sheet with the service account email
2. Verify the service account has "Editor" permissions
3. Check that the spreadsheet ID in `config.json` is correct

### Problem: "Cannot connect to server" on web app

**Solution**:
1. Make sure the server is running: `cd constraints-app && npm start`
2. Check firewall settings allow port 3000
3. On macOS: System Preferences → Security & Privacy → Firewall

### Problem: Colors not showing in Google Sheets

**Solution**:
1. Check that all developers in the schedule are listed in `DEVELOPER_COLORS`
2. Verify the worksheet name matches in `config.json`
3. Make sure the service account has "Editor" access (not just "Viewer")

### Problem: "File not found: constraints.json"

**Solution**: The file is auto-created on first run. Just make sure:
```bash
mkdir -p data
```

### Problem: Script uses old hardcoded constraints

**Solution**: The script tries to load from JSON first. If it fails, check:
1. File exists at `data/constraints.json`
2. File has valid JSON format
3. Check console output for warnings

---

## Security Best Practices

1. ✅ **Never commit `google-credentials.json` to version control**

   Add to `.gitignore`:
   ```
   google-credentials.json
   config.json
   ```

2. ✅ **Restrict network access** if needed (use firewall rules)

3. ✅ **Rotate service account keys** periodically (every 90 days recommended)

4. ✅ **Use environment variables** for production deployments

---

## Maintenance

### Monthly Checklist

- [ ] Update date range in Python script
- [ ] Clear previous month's constraints (or start fresh)
- [ ] Share web app URL with team
- [ ] Wait for all developers to submit
- [ ] Run schedule generation script
- [ ] Verify Google Sheets updated correctly
- [ ] Share final schedule with team

### Quarterly Tasks

- [ ] Review and update developer list
- [ ] Rotate Google service account keys
- [ ] Backup historical schedules

---

## Support & Questions

If you encounter issues:

1. Check the console output for error messages
2. Review this troubleshooting section
3. Check that all files are in the correct locations
4. Verify all dependencies are installed

---

## Quick Reference

### Start Web App
```bash
cd constraints-app && npm start
```

### Generate Schedule
```bash
python3 on_call_scheduler_with_sheets.py
```

### View Constraints Data
```bash
cat data/constraints.json
```

### Check Logs
```bash
# Server logs appear in terminal where you ran `npm start`
```

---

**That's it! You're all set up.** 🎉

The system is now ready to collect constraints and generate schedules automatically.
