# Monthly On-Call Scheduling Workflow

This guide explains the complete monthly workflow for collecting constraints and generating the schedule.

---

## 📅 Timeline Overview

```
Month Timeline (Example: February)
═══════════════════════════════════════════════════════════

Week 3-4 of February
├─ Feb 15-17: Open constraints collection app
├─ Feb 15-22: Developers submit their March constraints
├─ Feb 22:    Close/Stop the app
├─ Feb 23-25: Review submissions
└─ Feb 25-28: Generate schedule & upload to Google Sheets

March 1: New schedule goes live ✅
```

---

## 🔄 Complete Monthly Process

### Phase 1: Open Collection Period (2-3 days)

**When:** ~15th of current month
**Duration:** 2-3 days
**Goal:** Collect constraints for next month

#### Step 1: Start the Web App

```bash
cd constraints-app
npm start
```

**You'll see:**
```
🚀 On-Call Constraints Server
📍 Server running at: http://localhost:3000
📁 Data file: ../data/constraints.json

💡 Share this URL with developers to collect constraints
```

#### Step 2: Share with Team

Find your local IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Or just use this on Mac
ipconfig getifaddr en0
```

**Share URL:** `http://YOUR_IP:3000`

**Send to team:**
```
📢 Hey team!

Please submit your unavailable dates for [NEXT MONTH] by [DATE].

🔗 Link: http://192.168.1.100:3000

Instructions:
1. Select your name
2. Click checkboxes for dates you're NOT available
3. Click "Save All Constraints"

Deadline: [DATE] 5 PM
```

#### Step 3: Monitor Submissions

Check who has submitted:
```bash
curl http://localhost:3000/api/developers
```

Or view the file directly:
```bash
cat data/constraints.json
```

#### Step 4: Send Reminders (Optional)

**Day 2 reminder:**
```bash
# Check who hasn't submitted (0 constraints)
curl http://localhost:3000/api/developers | grep -A2 "restrictionCount.*0"
```

---

### Phase 2: Close Collection Period

**When:** End of collection window (e.g., Feb 22)

#### Stop the Server

```bash
# In the terminal running the server
Ctrl + C
```

**Console shows:**
```
^C Server shutting down...
```

#### Backup Constraints (Optional)

```bash
# Save a copy with date
cp data/constraints.json data/constraints-backup-$(date +%Y-%m-%d).json
```

---

### Phase 3: Review & Validate

**When:** Day after closing (e.g., Feb 23-25)

#### Review Submissions

```bash
# Pretty print the constraints
cat data/constraints.json | python3 -m json.tool
```

#### Check for Issues

```bash
# Count constraints per developer
cat data/constraints.json | grep -A 10 "developers"
```

**Look for:**
- ❌ Developers with 0 constraints (did they forget?)
- ❌ Excessive constraints (vacation?)
- ✅ Reasonable spread across team

#### Make Manual Edits (If Needed)

```bash
nano data/constraints.json
```

**Example:** Developer forgot to submit:
```json
{
  "developers": {
    "Alex": {
      "email": "",
      "restrictions": [
        "05/03 Day",
        "05/03 Night",
        "06/03 Day"
      ]
    }
  }
}
```

---

### Phase 4: Generate Schedule

**When:** ~25th-28th of current month

#### Option A: Generate Locally Only (Test)

```bash
# Set upload to false in config.json
{
  "upload_to_sheets": false
}

# Run script
python3 on_call_scheduler_with_sheets.py
```

**Output:**
```
✓ Planning schedule for: Mar 2026
📅 Generating schedule from 2026-03-01 to 2026-03-31

Shift Summary:
  Developer  Special Shifts  Night Shifts  Day Shifts
  Gabriel             2            12          16
  Ohad                1            10          14
  ...

Shift schedule written to shift_schedule.csv
ℹ️  Google Sheets upload is DISABLED
```

#### Review Generated Schedule

```bash
# View CSV
cat shift_schedule.csv

# Or open in Excel/Numbers
open shift_schedule.csv
```

**Check for:**
- ✅ Fair distribution (shift summary)
- ✅ Constraints respected
- ✅ No gaps in coverage
- ✅ Reasonable rotation

#### Option B: Generate & Upload to Google Sheets

```bash
# Set upload to true in config.json
{
  "upload_to_sheets": true
}

# Run script
python3 on_call_scheduler_with_sheets.py
```

**Output:**
```
✓ Planning schedule for: Mar 2026
📅 Generating schedule from 2026-03-01 to 2026-03-31

Uploading to Google Sheets...
✓ Connected to spreadsheet: On-Call Schedule
✓ Found worksheet: 2026
✓ Cleared existing content
✓ Uploaded 32 rows
✓ Applied colors to 62 cells

✓ SUCCESS! Schedule uploaded to Google Sheets
  Spreadsheet: On-Call Schedule
  Worksheet: 2026
  URL: https://docs.google.com/spreadsheets/d/...
```

#### Verify in Google Sheets

1. Open the Google Sheets URL
2. Check the tab (e.g., "2026")
3. Verify:
   - ✅ Month header (Mar)
   - ✅ All dates populated
   - ✅ Developer colors applied
   - ✅ No empty cells

---

### Phase 5: Share Schedule

**When:** After verification

#### Share with Team

```
📢 Hey team!

The [MONTH] on-call schedule is ready!

📊 Schedule: [GOOGLE_SHEETS_LINK]

Please review and let me know if you see any issues.

Quick Stats:
• Total shifts allocated: [X]
• Average per person: [Y]
• Special shifts (weekends): [Z]

Schedule goes live: [FIRST_DAY_OF_MONTH]
```

---

## 🛠️ Common Operations

### Check Current Status

```bash
# What month is configured?
cat data/constraints.json | grep -A2 "month"

# How many constraints submitted?
cat data/constraints.json | grep -c "restrictions"

# Server running?
curl http://localhost:3000/health
```

### Reopen for Late Submissions

```bash
# Restart server
cd constraints-app
npm start

# Share URL again with specific deadline
```

### Regenerate Schedule

```bash
# Edit constraints if needed
nano data/constraints.json

# Regenerate
python3 on_call_scheduler_with_sheets.py
```

### Manual Override for Developer

```bash
# Via API (if server running)
curl -X POST http://localhost:3000/api/constraints/Alex \
  -H "Content-Type: application/json" \
  -d '{"restriction": "15/03 Day"}'

# Or edit JSON directly
nano data/constraints.json
```

---

## 📋 Monthly Checklist

### Before Opening Collection

- [ ] Verify next month is correct in system
- [ ] Test the web app locally
- [ ] Confirm Google Sheets credentials are valid
- [ ] Review last month's process for improvements

### During Collection Period

- [ ] Share URL with team
- [ ] Monitor submission count
- [ ] Send reminder to those who haven't submitted
- [ ] Answer any questions from team

### After Closing Collection

- [ ] Stop the server
- [ ] Backup constraints.json
- [ ] Review all submissions
- [ ] Check for anomalies

### Before Generating Schedule

- [ ] Verify all developers submitted
- [ ] Make any manual adjustments
- [ ] Test generation locally first
- [ ] Review shift distribution

### After Uploading to Sheets

- [ ] Verify colors applied correctly
- [ ] Check no gaps in coverage
- [ ] Confirm month/year correct
- [ ] Share with team

---

## 🎯 Quick Commands Reference

```bash
# Start collection
cd constraints-app && npm start

# Stop collection
Ctrl + C

# Check submissions
cat data/constraints.json

# Backup constraints
cp data/constraints.json data/backup-$(date +%Y-%m-%d).json

# Generate schedule (local only)
python3 on_call_scheduler_with_sheets.py  # with upload_to_sheets: false

# Generate & upload
python3 on_call_scheduler_with_sheets.py  # with upload_to_sheets: true

# View generated CSV
cat shift_schedule.csv

# Open in default app
open shift_schedule.csv
```

---

## 🔒 Security Notes

### During Collection Period

- ✅ Server runs on local network only
- ✅ No authentication needed (trust-based)
- ✅ Data stored locally in JSON file

### When Server is Stopped

- ✅ Web app is inaccessible
- ✅ Constraints are safe in JSON file
- ✅ No one can modify data

### Best Practices

1. **Only run server during collection period** (2-3 days)
2. **Stop server immediately after deadline**
3. **Backup constraints.json before running script**
4. **Don't leave server running indefinitely**
5. **Use firewall rules if needed** (restrict to company network)

---

## 🐛 Troubleshooting

### Issue: Server won't start

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 [PID]

# Or use different port
# Edit server.js: const PORT = 3001;
```

### Issue: Developers can't access

```bash
# Check firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Verify IP address
ipconfig getifaddr en0

# Test from their machine
curl http://YOUR_IP:3000/health
```

### Issue: Constraints not saving

```bash
# Check permissions
ls -la data/

# Fix if needed
chmod 755 data/
chmod 644 data/constraints.json
```

### Issue: Wrong month displayed

```bash
# Delete and recreate
rm data/constraints.json
cd constraints-app && npm start
```

---

## 📊 Sample Timeline (Real Example)

```
February 15, 2026 (Monday)
  09:00 - Start web app
  09:15 - Share URL with team via Slack

February 15-17 (Mon-Wed)
  - Developers submit constraints for March
  - Monitor submissions throughout

February 18 (Thursday)
  10:00 - Send reminder to 3 developers who haven't submitted

February 19 (Friday)
  17:00 - Deadline passes
  17:05 - Stop web app (Ctrl+C)
  17:10 - Backup constraints.json

February 20 (Saturday-Sunday)
  - Weekend break

February 22 (Monday)
  10:00 - Review all submissions
  11:00 - Contact Alex about vacation (added manually)
  14:00 - Test schedule generation locally
  14:30 - Generate and upload to Google Sheets
  15:00 - Verify in Google Sheets
  15:30 - Share link with team

March 1, 2026
  00:00 - New schedule goes live! 🎉
```

---

## 💡 Tips & Best Practices

### Communication

- ✅ Give clear deadline (date AND time)
- ✅ Send reminder 1 day before deadline
- ✅ Thank team after submissions
- ✅ Share schedule 3-5 days before it starts

### Technical

- ✅ Always backup constraints.json before generating
- ✅ Test locally before uploading to Sheets
- ✅ Keep server logs for troubleshooting
- ✅ Document any manual changes

### Process

- ✅ Consistent schedule (same dates each month)
- ✅ Allow 2-3 days for submissions
- ✅ Review before generating
- ✅ Share schedule early for feedback

---

## 📁 File Locations Quick Reference

| File | Purpose | When Used |
|------|---------|-----------|
| `constraints.json` | Stores submitted constraints | During & after collection |
| `shift_schedule.csv` | Generated schedule (backup) | After generation |
| `shift_summary.csv` | Shift distribution stats | After generation |
| `config.json` | Google Sheets settings | During generation |
| `server.js` | Web app backend | During collection |
| `index.html` | Web interface | During collection |

---

## 🎉 Success Metrics

After each month, track:

- ⏱️ **Time to collect**: 2-3 days target
- 👥 **Submission rate**: 100% target
- 🔄 **Manual changes needed**: Minimize
- ✅ **Schedule published by**: 5 days before month starts
- 😊 **Team satisfaction**: Collect feedback

---

**Ready for next month?** Follow this workflow and you're all set! 🚀
