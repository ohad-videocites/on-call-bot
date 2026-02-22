# Month Management Guide

## 📅 How the System Handles Months

The system is designed to **always work on next month** automatically.

### Example Timeline

```
Today's Date: February 14, 2026
Planning For:  March 2026 ✅ (auto-calculated)

Today's Date: December 20, 2025
Planning For:  January 2026 ✅ (handles year rollover)
```

---

## 🔄 Automatic Month Calculation

### Web App (constraints-app/server.js)

**When it creates `data/constraints.json` for the first time:**

```javascript
// Lines 27-29
const now = new Date();
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

const defaultData = {
    month: nextMonth.getMonth() + 1,  // Next month (1-12)
    year: nextMonth.getFullYear(),
    ...
}
```

**Result**: Automatically sets month to next month

---

### Python Script (on_call_scheduler_with_sheets.py)

**When it reads from JSON:**

```python
# Lines 26-49
def load_data_from_json(json_file="data/constraints.json"):
    # Reads month and year from constraints.json
    month = data.get("month", next_month.month)
    year = data.get("year", next_month.year)

    # Generates date range for that month
    last_day = calendar.monthrange(year, month)[1]
    all_days = pd.date_range(start=f"{year}-{month:02d}-01",
                             end=f"{year}-{month:02d}-{last_day}",
                             freq="D")
```

**Result**: Uses the month from JSON to generate schedule

---

## 🎯 Workflow

### Typical Monthly Cycle

```
┌────────────────────────────────────────────────────────┐
│  Week 3-4 of Current Month (e.g., Feb 15-28)           │
└────────────────────────────────────────────────────────┘
    ↓
1. Start web app
   → Automatically displays "Mar 2026"
    ↓
2. Developers submit constraints for March
   → Stored in data/constraints.json
    ↓
3. You run Python script (around Feb 25)
   → Reads: "month: 3, year: 2026"
   → Generates: March 1-31 schedule
   → Uploads to Google Sheets tab "2026"
    ↓
4. Schedule ready for March!
```

---

## 🛠️ Manual Override (If Needed)

### Option 1: Edit constraints.json Directly

```bash
# Edit the file
nano data/constraints.json
```

Change:
```json
{
  "month": 3,     ← Change to desired month (1-12)
  "year": 2026,   ← Change to desired year
  "developers": { ... }
}
```

### Option 2: Use the API

```bash
# Set specific month/year
curl -X POST http://localhost:3000/api/month \
  -H "Content-Type: application/json" \
  -d '{"month": 4, "year": 2026}'
```

### Option 3: Delete constraints.json

```bash
# Remove the file
rm data/constraints.json

# Restart web app
cd constraints-app && npm start
```

The app will recreate it with the correct next month.

---

## 📊 How Each Component Shows the Month

### 1. Web Interface

**Location**: Browser header
**Display**: "Mar 2026" (as a badge/chip)
**Source**: Reads from `/api/month` endpoint

**Code**: [constraints-app/public/index.html:422](constraints-app/public/index.html:422)
```javascript
document.getElementById('monthDisplay').textContent =
    `${monthNames[data.month - 1]} ${data.year}`;
```

---

### 2. Server Console

**Location**: Terminal where `npm start` runs
**Display**: "✓ Created default constraints.json for March 2026"
**Source**: Calculated at startup

**Code**: [constraints-app/server.js:46](constraints-app/server.js:46)
```javascript
console.log(`✓ Created default constraints.json for ${nextMonth.toLocaleString('default', { month: 'long' })} ${nextMonth.getFullYear()}`);
```

---

### 3. Python Script Output

**Location**: Terminal where you run the script
**Display**:
```
✓ Planning schedule for: Mar 2026
📅 Generating schedule from 2026-03-01 to 2026-03-31
```

**Code**: [on_call_scheduler_with_sheets.py:65](on_call_scheduler_with_sheets.py:65)
```python
print(f"✓ Planning schedule for: {month_names[month-1]} {year}")
print(f"📅 Generating schedule from {start_date} to {end_date}")
```

---

### 4. CSV Output

**Location**: `shift_schedule.csv` (first row)
**Display**: "Mar" in the first cell
**Source**: Dynamic month name

**Code**: [on_call_scheduler_with_sheets.py:234](on_call_scheduler_with_sheets.py:234)
```python
month_header = pd.DataFrame([[month_names[month-1], '', '', '']], columns=final_df.columns)
```

---

### 5. Google Sheets

**Location**: Uploaded spreadsheet
**Display**:
- Tab name: "2026" (from config.json)
- First row: "Mar"
- Column data: "01/03", "02/03", etc.

**Source**: All from constraints.json

---

## 🔍 Debugging Month Issues

### Check Current Month Setting

```bash
# View current month/year
cat data/constraints.json | grep -A2 "month"
```

Expected output:
```json
"month": 3,
"year": 2026,
```

---

### Verify Web App Shows Correct Month

1. Open browser: http://localhost:3000
2. Look for colored badge at top
3. Should show: "Mar 2026" (next month from today)

---

### Check Python Script Reads Correctly

```bash
python3 on_call_scheduler_with_sheets.py
```

First line should show:
```
✓ Planning schedule for: Mar 2026
```

If you see:
```
⚠️  Using hardcoded month and constraints
```

Then the JSON file wasn't found or has errors.

---

## 🎨 Visual Month Flow

```
Today: Feb 2026
    ↓
Web App Startup
    ↓
Calculate Next Month
    ↓
nextMonth = March 2026
    ↓
Create/Update constraints.json
    {
      "month": 3,
      "year": 2026
    }
    ↓
Python Script Reads JSON
    ↓
Generate Date Range
    March 1 - March 31
    ↓
Create Schedule
    ↓
Upload to Sheets
    ↓
Done! Schedule for March ready
```

---

## ⚙️ Configuration Files

### constraints.json
```json
{
  "month": 3,           ← Planning month (1-12)
  "year": 2026,         ← Planning year
  "last_updated": "...",
  "developers": { ... }
}
```

**Purpose**: Source of truth for which month to plan
**Updated by**: Web app (auto-created with next month)
**Read by**: Python script

---

### config.json
```json
{
  "worksheet_name": "2026"  ← Year tab in Google Sheets
}
```

**Purpose**: Which tab to update in Google Sheets
**Note**: This is the YEAR, not the month
**Update**: Annually (Jan → change to "2027")

---

## 🚀 Quick Commands

### Reset to Auto Next Month
```bash
rm data/constraints.json
cd constraints-app && npm start
```

### Check What Month Is Set
```bash
cat data/constraints.json | python3 -m json.tool | grep -A1 month
```

### Manually Set Different Month (via API)
```bash
# Set to April 2026
curl -X POST http://localhost:3000/api/month \
  -H "Content-Type: application/json" \
  -d '{"month": 4, "year": 2026}'
```

### See Python Script Month Detection
```bash
python3 on_call_scheduler_with_sheets.py | head -n 5
```

---

## 📝 Best Practices

### ✅ DO:
- Let the system auto-calculate next month
- Run the web app at the start of each planning cycle
- Verify the month shown in the web interface
- Check the Python output before uploading to Sheets

### ❌ DON'T:
- Manually edit constraints.json unless necessary
- Forget to update config.json year tab annually
- Run Python script for wrong month (check output!)

---

## 🎯 Summary

| Question | Answer |
|----------|--------|
| **Who sets the month?** | Web app automatically (next month) |
| **Where is it stored?** | `data/constraints.json` |
| **Who reads it?** | Python script |
| **Can I override?** | Yes (API or manual edit) |
| **Default behavior?** | Always next month from today |

**Key Takeaway**: The system is designed to "just work" - when you start the web app, it automatically sets up for next month, and the Python script reads that setting.
