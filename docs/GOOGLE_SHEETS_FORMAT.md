# Google Sheets Format & Structure

This document explains how the schedule is uploaded to Google Sheets.

---

## 📊 Spreadsheet Structure

### Spreadsheet Name
```
On Call Schedule
```
**Important:** The script looks for a spreadsheet with this exact name.

### Worksheet Name Format
```
On call schedule YYYY
```

**Examples:**
- `On call schedule 2026`
- `On call schedule 2027`

**Note:** The year is taken from the `worksheet_name` field in `config.json`.

---

## 📝 Data Format

### Append Mode
The script **appends** data instead of clearing the sheet. This allows you to keep historical data.

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│ ... existing data ...                           │
│ Row N: Last data from previous month            │
├─────────────────────────────────────────────────┤
│ Row N+1: (empty)                                │
│ Row N+2: (empty)                                │
├─────────────────────────────────────────────────┤
│ Row N+3: Month Name (e.g., "Feb")               │
├──────┬──────────┬──────────┬───────────────────┤
│ Day  │  Night   │   Day    │  Day of Week      │
│  1   │  Omer    │  Alex    │  Sunday           │
│  2   │  Shlomi  │  Gabriel │  Monday           │
│ ...  │  ...     │  ...     │  ...              │
└──────┴──────────┴──────────┴───────────────────┘
```

---

## 📋 Column Details

### Column A: Day of Month
- **Content:** Day number (1, 2, 3, ..., 31)
- **Format:** Plain number
- **Example:** `1`, `15`, `28`

### Column B: Night Shift (00:00-09:50)
- **Content:** Developer name for night shift
- **Format:**
  - Centered text
  - Background color based on developer
- **Example:** `Omer` (with blue background)

### Column C: Day Shift (10:00-23:59)
- **Content:** Developer name for day shift
- **Format:**
  - Centered text
  - Background color based on developer
- **Example:** `Alex` (with yellow background)

### Column D: Day of Week
- **Content:** Day name (Sunday, Monday, ...)
- **Format:** Plain text
- **Example:** `Friday`, `Saturday`

---

## 🎨 Color Mapping

Each developer has a unique background color:

| Developer | Color | RGB (0-1) |
|-----------|-------|-----------|
| Omer | Blue | (0.6, 0.7, 0.9) |
| Shlomi | Light Cyan | (0.7, 0.9, 0.9) |
| Amit | Light Brown | (0.85, 0.75, 0.6) |
| Ohad | Light Pink | (1.0, 0.8, 0.8) |
| Ivan | Red/Coral | (0.95, 0.6, 0.6) |
| Gabriel | Light Green | (0.7, 0.9, 0.7) |
| Or | Purple/Lavender | (0.85, 0.7, 0.9) |
| Hagay | Dark Purple | (0.7, 0.5, 0.8) |
| Yariv | Dark Red | (0.8, 0.4, 0.4) |
| Alex | Light Yellow | (0.9, 0.9, 0.6) |

---

## 📅 Example Output

### January 2026 Schedule

```
Row 1:  Jan

Row 2:  1   Omer     Alex     Sunday
Row 3:  2   Shlomi   Gabriel  Monday
Row 4:  3   Amit     Ohad     Tuesday
...
Row 32: 31  Ivan     Hagay    Saturday
```

### February 2026 Schedule (Appended)

```
Row 34: (empty)
Row 35: (empty)

Row 36: Feb

Row 37: 1   Gabriel  Omer     Sunday
Row 38: 2   Alex     Shlomi   Monday
...
Row 64: 28  Yariv    Amit     Friday
```

---

## ⚙️ Configuration

### config.json

```json
{
  "spreadsheet_id": "not_used_anymore",
  "worksheet_name": "2026",
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": true
}
```

**Note:** `spreadsheet_id` is no longer used. The script opens the spreadsheet by name: **"On Call Schedule"**

### What Each Field Does

| Field | Purpose | Example |
|-------|---------|---------|
| `worksheet_name` | Year for the tab | `"2026"` → tab: "On call schedule 2026" |
| `credentials_file` | Service account JSON | `"google-credentials.json"` |
| `upload_to_sheets` | Enable/disable upload | `true` or `false` |

---

## 🔧 How the Script Works

### Step 1: Find Next Empty Row
```python
all_values = worksheet.get_all_values()
next_row = len(all_values) + 1
```

### Step 2: Add Empty Rows
```python
# Skip 2 rows for spacing
next_row += 2
```

### Step 3: Write Month Name
```python
worksheet.update_cell(month_row, 1, "Feb")  # Column A
```

### Step 4: Write Schedule Data
```python
data = [
    [1, "Omer", "Alex", "Sunday"],
    [2, "Shlomi", "Gabriel", "Monday"],
    ...
]
worksheet.update(range, data)
```

### Step 5: Apply Colors & Formatting
```python
# Center text + background color for each developer cell
requests.append({
    "repeatCell": {
        "range": {...},
        "cell": {
            "userEnteredFormat": {
                "backgroundColor": color,
                "horizontalAlignment": "CENTER"
            }
        }
    }
})
```

---

## 🎯 Benefits of Append Mode

### Keep Historical Data
- ✅ All months in one tab
- ✅ Easy to compare months
- ✅ No data loss

### Example Timeline in One Sheet
```
Jan
1-31...

(empty)
(empty)

Feb
1-28...

(empty)
(empty)

Mar
1-31...
```

---

## 🔍 Finding Your Spreadsheet

### Option 1: By URL
The script now opens by name, but you can find it at:
```
https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
```

### Option 2: Google Drive Search
Search for: **"On Call Schedule"**

---

## 🆕 Setting Up a New Year

### Create New Tab
The script will automatically create the tab if it doesn't exist:
- Tab name: `On call schedule 2027`
- Rows: 500
- Columns: 10

### Update config.json
```json
{
  "worksheet_name": "2027",  ← Change year
  ...
}
```

---

## 🐛 Troubleshooting

### Issue: "Spreadsheet not found"

**Error:**
```
gspread.exceptions.SpreadsheetNotFound: Spreadsheet 'On Call Schedule' not found
```

**Solutions:**
1. Check spreadsheet name is exactly: `On Call Schedule`
2. Verify service account has access to the spreadsheet
3. Make sure you shared the sheet with service account email

---

### Issue: "Tab not found" (Auto-creates)

**Behavior:** Script automatically creates the tab if missing
```
✓ Created new worksheet: On call schedule 2026
```

**No action needed!**

---

### Issue: Wrong Tab Name

**Expected:** `On call schedule 2026`
**Got:** `2026`

**Fix:** Update your `config.json`:
```json
{
  "worksheet_name": "2026"  ← This is used to create "On call schedule 2026"
}
```

---

### Issue: Data Not Centered

**Check:** The script applies center alignment to columns B and C

**Verify in code:**
```python
"horizontalAlignment": "CENTER"
```

---

### Issue: Colors Not Showing

**Check:**
1. Developer name in sheet matches `DEVELOPER_COLORS` dictionary
2. Service account has **Editor** access (not Viewer)
3. Color values are correct (0-1 range, not 0-255)

---

## 📊 Formatting Applied

### Month Name (Column A, Row 1 of section)
- **Bold:** Yes
- **Font Size:** 12pt
- **Alignment:** Left

### Day Numbers (Column A)
- **Format:** Plain number
- **Alignment:** Left (default)

### Developer Names (Columns B & C)
- **Background:** Developer color
- **Alignment:** CENTER
- **Text:** Developer name

### Day of Week (Column D)
- **Format:** Plain text
- **Alignment:** Left (default)

---

## 💡 Tips

### Multiple Months
The append mode allows you to see all months:
```
Jan → 31 days
Feb → 28 days
Mar → 31 days
...
```

### Yearly Tab
Keep each year in its own tab:
- `On call schedule 2026`
- `On call schedule 2027`
- etc.

### Backup
The script also saves to CSV:
- `shift_schedule.csv` - Full schedule with headers
- `shift_summary.csv` - Summary statistics

---

## 🎉 Complete Example

### Console Output
```
Uploading to Google Sheets...
============================================================
✓ Connected to spreadsheet: On Call Schedule
✓ Found worksheet: On call schedule 2026
✓ Appending data starting at row 66
✓ Wrote month name 'Feb' at row 66
✓ Uploaded 28 days of schedule

Applying formatting...
✓ Applied colors to 57 cells

============================================================
✓ SUCCESS! Schedule uploaded to Google Sheets
  Spreadsheet: On Call Schedule
  Worksheet: On call schedule 2026
  URL: https://docs.google.com/spreadsheets/d/...
============================================================
```

### Final Result in Google Sheets
```
Row 64: 31  Ivan     Hagay    Saturday  (January)

Row 65: (empty)
Row 66: (empty)

Row 67: Feb  ← Bold, 12pt

Row 68: 1   [Omer]   [Alex]   Sunday    ← Colored & centered
Row 69: 2   [Shlomi] [Gabriel] Monday   ← Colored & centered
...
```

---

**That's it!** The schedule is now properly formatted and appended to your Google Sheets. 🎊
