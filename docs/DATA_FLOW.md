# Data Flow & Configuration Guide

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: Constraint Collection                             │
└─────────────────────────────────────────────────────────────┘

    Developers
        ↓ (fill constraints via web browser)
    Web Interface
    (constraints-app/public/index.html)
        ↓ (HTTP POST to API)
    Node.js Backend
    (constraints-app/server.js:21)
        ↓ (writes to)
    📄 data/constraints.json  ← LOCAL JSON FILE
        ↓
    [Constraints stored locally]


┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: Schedule Generation                                │
└─────────────────────────────────────────────────────────────┘

    You run: python3 on_call_scheduler_with_sheets.py
        ↓
    Script reads:
    📄 data/constraints.json (line 40-48)
        ↓
    Schedule generation algorithm
    (lines 105-180)
        ↓
    ┌─────────────────┬─────────────────┐
    │  LOCAL OUTPUT   │  CLOUD OUTPUT   │
    └─────────────────┴─────────────────┘
            ↓                   ↓
    📄 shift_schedule.csv    (if enabled)
    📄 shift_summary.csv         ↓
    (lines 169, 178)      Read config.json
                               ↓
                        Check: upload_to_sheets
                               ↓
                    ┌──────────┴──────────┐
                    │                     │
                 true                  false
                    ↓                     ↓
            Upload to Google      Skip upload
            Sheets with colors    (line 370-375)
            (line 363-368)
                    ↓
            ☁️ Google Sheets
            (Year tab, e.g., "2026")
```

---

## 🗂️ JSON Files Explained

### 1. `data/constraints.json` (Auto-created)

**Purpose**: Stores developer constraints
**Created by**: Web app backend
**Read by**: Python scheduler
**Location in code**: [constraints-app/server.js:21](constraints-app/server.js:21)

**Example Structure**:
```json
{
  "month": 2,
  "year": 2026,
  "last_updated": "2026-02-14T10:30:00Z",
  "developers": {
    "Gabriel": {
      "email": "",
      "restrictions": [
        "12/02 Day",
        "13/02 Night"
      ]
    },
    "Ohad": {
      "email": "",
      "restrictions": [
        "01/02 Day"
      ]
    }
  }
}
```

**Key Points**:
- ✅ Auto-created when web app starts
- ✅ Updated in real-time as developers submit
- ✅ Used by Python script to read constraints
- ❌ Does NOT control Google Sheets upload

---

### 2. `config.json` (You create this)

**Purpose**: Controls Google Sheets integration
**Created by**: You (copy from template)
**Read by**: Python scheduler only
**Location in code**: [on_call_scheduler_with_sheets.py:365](on_call_scheduler_with_sheets.py:365)

**Example Structure**:
```json
{
  "spreadsheet_id": "1abc123xyz789...",
  "worksheet_name": "2026",
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": true
}
```

**Configuration Options**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spreadsheet_id` | string | Yes | Your Google Sheets ID from URL |
| `worksheet_name` | string | Yes | Tab name (e.g., "2026", "2027") |
| `credentials_file` | string | Yes | Path to service account JSON |
| `upload_to_sheets` | boolean | No | Enable/disable upload (default: true) |

---

## ⚙️ Controlling Google Sheets Upload

### Option 1: Enable Upload (Default)

**config.json**:
```json
{
  "spreadsheet_id": "your-id",
  "worksheet_name": "2026",
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": true
}
```

**Result**:
```
✓ Schedule uploaded to Google Sheets
  Spreadsheet: On-Call Schedule
  Worksheet: 2026
  URL: https://docs.google.com/spreadsheets/d/...
```

---

### Option 2: Disable Upload (Local Only)

**config.json**:
```json
{
  "spreadsheet_id": "your-id",
  "worksheet_name": "2026",
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": false
}
```

**Result**:
```
ℹ️  Google Sheets upload is DISABLED in config.json
   Schedule saved locally only: shift_schedule.csv
   To enable: Set 'upload_to_sheets': true in config.json
```

---

### Option 3: No config.json (Local Only)

Don't create `config.json` at all.

**Result**:
```
⚠ config.json not found. Skipping Google Sheets upload.
  To enable Google Sheets integration:
  1. Create config.json with your spreadsheet details
  2. Set up Google Sheets API credentials
  See SETUP.md for instructions.
```

---

## 🔍 Finding Data Locations in Code

### Web App Data File

**File**: [constraints-app/server.js](constraints-app/server.js:21)
**Line**: 21

```javascript
const DATA_FILE = path.join(DATA_DIR, 'data', 'constraints.json');
```

To change location, edit this line.

---

### Python Script Reading Constraints

**File**: [on_call_scheduler_with_sheets.py](on_call_scheduler_with_sheets.py:40)
**Lines**: 40-48

```python
def load_constraints_from_json(json_file="data/constraints.json"):
    """Load developer constraints from JSON file"""
    try:
        with open(json_file, 'r') as f:
            data = json.load(f)
            developers = {}
            for dev_name, dev_data in data.get("developers", {}).items():
                developers[dev_name] = dev_data.get("restrictions", [])
            return developers
```

---

### Python Script Reading Config

**File**: [on_call_scheduler_with_sheets.py](on_call_scheduler_with_sheets.py:365)
**Lines**: 365-377

```python
try:
    with open('config.json', 'r') as f:
        config = json.load(f)

    # Check if upload is enabled (default to True if not specified)
    upload_enabled = config.get('upload_to_sheets', True)

    if upload_enabled:
        upload_to_google_sheets(final_df_with_header, config)
    else:
        print("\nℹ️  Google Sheets upload is DISABLED")
```

---

### Google Sheets Upload Function

**File**: [on_call_scheduler_with_sheets.py](on_call_scheduler_with_sheets.py:251)
**Lines**: 251-360

```python
def upload_to_google_sheets(df, config):
    """
    Upload schedule DataFrame to Google Sheets with developer color coding
    """
    # Line 251: Gets worksheet_name from config
    worksheet_name = config.get('worksheet_name', '2026')
```

---

## 🎯 Common Use Cases

### Use Case 1: Testing Schedule Generation (No Upload)

```json
{
  "upload_to_sheets": false
}
```

Run script → Only creates CSV files locally

---

### Use Case 2: Development/Staging (Separate Sheet)

```json
{
  "spreadsheet_id": "test-sheet-id",
  "worksheet_name": "Test",
  "upload_to_sheets": true
}
```

Run script → Uploads to test spreadsheet

---

### Use Case 3: Production (Main Sheet)

```json
{
  "spreadsheet_id": "production-sheet-id",
  "worksheet_name": "2026",
  "upload_to_sheets": true
}
```

Run script → Uploads to production spreadsheet with colors

---

## 🚀 Quick Commands

### Just Generate CSV (No Upload)

```bash
# Option 1: Set upload_to_sheets: false in config.json
python3 on_call_scheduler_with_sheets.py

# Option 2: Temporarily rename config.json
mv config.json config.json.backup
python3 on_call_scheduler_with_sheets.py
mv config.json.backup config.json
```

### Generate & Upload to Google Sheets

```bash
# Ensure upload_to_sheets: true in config.json
python3 on_call_scheduler_with_sheets.py
```

### View Current Constraints

```bash
cat data/constraints.json | python3 -m json.tool
```

### Check Web App Data

```bash
# View full data
cat data/constraints.json

# View just developer names
cat data/constraints.json | grep -A1 '"developers"'
```

---

## 📝 Summary

| Component | File | Purpose |
|-----------|------|---------|
| **Web App** | `constraints-app/server.js` | Manages `data/constraints.json` |
| **Constraints** | `data/constraints.json` | Stores developer restrictions |
| **Configuration** | `config.json` | Controls Google Sheets upload |
| **Credentials** | `google-credentials.json` | Google API authentication |
| **Scheduler** | `on_call_scheduler_with_sheets.py` | Reads constraints, generates schedule |

**Key Takeaway**: The web app **never** touches Google Sheets. Only the Python script uploads to Sheets, and only if `config.json` exists and `upload_to_sheets` is `true`.
