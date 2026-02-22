# Review Mode Guide

Review Mode allows developers to **view** their submitted constraints without being able to **edit** them after the submission period closes.

---

## 🎯 When to Use Review Mode

```
Day 1-3:  Collection Mode (Editable)
  ↓       Developers submit constraints
Day 4:    Close submissions
  ↓       Enable Review Mode
Day 4-5:  Review Mode (Read-Only)
  ↓       Developers can view but not edit
Day 6:    Generate Schedule
```

---

## 🚀 How to Enable Review Mode

### Method 1: Command Line Flag (Recommended)

Stop the server and restart with `--review`:

```bash
# Stop current server (Ctrl+C)

# Start in review mode
cd constraints-app
node server.js --review
```

### Method 2: Environment Variable

```bash
# Set environment variable
export REVIEW_MODE=true

# Start server
cd constraints-app
node server.js
```

Or in one line:
```bash
REVIEW_MODE=true node server.js
```

---

## 📊 What Happens in Review Mode

### Server Output

```
🚀 On-Call Constraints Server
📍 Local:   http://localhost:3000
📍 Network: http://192.168.68.123:3000
📁 Data file: ../data/constraints.json

🔒 REVIEW MODE ACTIVE - All changes are blocked

💡 Share the Network URL with developers
```

### Web Interface Changes

#### 1. **Orange Banner Appears**
```
┌─────────────────────────────────────────────┐
│ 🔒 Review Mode Active                       │
│ Submission period has closed. You can view  │
│ your constraints but cannot make changes.   │
└─────────────────────────────────────────────┘
```

#### 2. **Checkboxes are Disabled**
- ☑ Existing selections shown
- ☐ All checkboxes grayed out
- 🚫 Cannot click or change

#### 3. **Action Buttons Hidden**
- ❌ "Clear All" button removed
- ❌ "Save All Constraints" button removed

#### 4. **Instructions Updated**
```
┌─────────────────────────────────────────────┐
│ 👁️ Review Mode:                             │
│ The submission period has closed. You can   │
│ view your constraints but cannot make       │
│ changes. Contact the administrator if you   │
│ need to make urgent changes.                │
└─────────────────────────────────────────────┘
```

---

## 🛡️ Security Features

### Multi-Layer Protection

1. **Server-Side Blocking**
   - POST/DELETE/PUT requests return HTTP 403
   - Cannot bypass via direct API calls

2. **Client-Side UI**
   - Checkboxes disabled
   - Save buttons hidden
   - Visual feedback

3. **JavaScript Checks**
   - Functions prevent changes
   - Shows error if attempted
   - Reverts any accidental toggles

### Example: If Someone Tries to Edit

**Browser:**
```
❌ Review mode is active - changes are not allowed
```

**API Response:**
```json
{
  "error": "Review mode is active - changes are not allowed",
  "reviewMode": true
}
```

---

## 📋 Complete Workflow Example

### Timeline: February Month Planning

```
February 15 (Monday) - Day 1
├─ 09:00 - Start server in normal mode
│          $ node server.js
├─ 09:15 - Share URL with team
└─ Team submits constraints throughout day

February 16-17 (Tue-Wed) - Days 2-3
└─ Continue accepting submissions

February 18 (Thursday) - Deadline Day
├─ 17:00 - Deadline passes
├─ 17:05 - Stop server (Ctrl+C)
├─ 17:10 - Backup constraints.json
└─ 17:15 - Restart in REVIEW MODE
           $ node server.js --review

February 19-20 (Fri-Sat) - Review Days
├─ Developers can view their submissions
├─ You review all constraints
├─ Handle urgent change requests manually
└─ No edits via web interface

February 22 (Monday) - Generation Day
├─ 10:00 - Stop server
├─ 10:30 - Generate schedule
│          $ python3 on_call_scheduler_with_sheets.py
└─ 15:00 - Share schedule with team
```

---

## 🔄 Switching Modes

### From Normal to Review Mode

```bash
# 1. Stop server
Ctrl+C in server terminal

# 2. Restart in review mode
node server.js --review
```

### From Review Mode to Normal (Reopen)

```bash
# 1. Stop server
Ctrl+C

# 2. Restart without flag
node server.js
```

**Note:** Developers can now edit again!

---

## 🆘 Handling Urgent Changes in Review Mode

### Scenario: Developer Needs to Add Constraint

If a developer contacts you with an urgent change during review period:

#### Option 1: Manual Edit (Quick)

```bash
# Edit the JSON file directly
nano data/constraints.json
```

Add the constraint:
```json
{
  "developers": {
    "Alex": {
      "restrictions": [
        "15/03 Day",
        "16/03 Night"  ← Add this
      ]
    }
  }
}
```

#### Option 2: Temporarily Reopen (If Multiple Changes)

```bash
# Stop review mode server
Ctrl+C

# Start in normal mode (remove --review)
node server.js

# Tell specific developer to make changes
# Once done, restart in review mode
Ctrl+C
node server.js --review
```

#### Option 3: Use API Directly (Advanced)

```bash
# Add single constraint via curl
curl -X POST http://localhost:3000/api/constraints/Alex \
  -H "Content-Type: application/json" \
  -d '{"restriction": "16/03 Night"}'

# Note: This won't work in review mode!
# Must stop review mode first
```

---

## 🧪 Testing Review Mode

### Test Locally Before Sharing

```bash
# 1. Start in review mode
node server.js --review

# 2. Open browser
http://localhost:3000

# 3. Check for:
✓ Orange banner at top
✓ "Review Mode Active" message
✓ Checkboxes are disabled (grayed out)
✓ Save button is hidden
✓ Instructions mention read-only

# 4. Try to click checkbox
✓ Should show error: "Review mode is active"

# 5. Try API call (should fail)
curl -X POST http://localhost:3000/api/constraints/Alex \
  -H "Content-Type: application/json" \
  -d '{"restriction": "15/03 Day"}'

# Response should be:
# {"error":"Review mode is active - changes are not allowed","reviewMode":true}
```

---

## 📱 What Developers See

### Normal Mode (Edit)
```
┌─────────────────────────────────────┐
│ 📅 On-Call Constraints Collector    │
│ Mar 2026                            │
│                                     │
│ 📝 How to use:                      │
│ 1️⃣ Select your name                │
│ 2️⃣ Click checkboxes for dates      │
│ 3️⃣ Click "Save All Constraints"    │
│                                     │
│ [Calendar with clickable boxes]     │
│                                     │
│ [Clear All] [Save All Constraints]  │
└─────────────────────────────────────┘
```

### Review Mode (Read-Only)
```
┌─────────────────────────────────────┐
│ 📅 On-Call Constraints Collector    │
│ Mar 2026                            │
│                                     │
│ 🔒 Review Mode Active               │
│ Submission period has closed.       │
│                                     │
│ 👁️ Review Mode:                    │
│ You can view your constraints but   │
│ cannot make changes. Contact admin. │
│                                     │
│ [Calendar with disabled boxes]      │
│                                     │
│ (No buttons shown)                  │
└─────────────────────────────────────┘
```

---

## 🎯 Quick Reference

### Commands

| Action | Command |
|--------|---------|
| **Start Normal Mode** | `node server.js` |
| **Start Review Mode** | `node server.js --review` |
| **Check Mode** | `curl http://localhost:3000/api/review-mode` |
| **Stop Server** | `Ctrl+C` |

### Mode Indicators

| Indicator | Normal Mode | Review Mode |
|-----------|-------------|-------------|
| Banner | None | 🔒 Orange banner |
| Checkboxes | ✅ Enabled | 🚫 Disabled |
| Save Button | ✅ Visible | ❌ Hidden |
| API Edits | ✅ Allowed | ❌ Blocked (403) |
| Console | Standard | "REVIEW MODE ACTIVE" |

---

## 💡 Best Practices

### Do's ✅

- ✅ Enable review mode after deadline
- ✅ Announce to team when review mode starts
- ✅ Keep review mode for 1-2 days
- ✅ Test review mode before using
- ✅ Backup constraints.json before review mode

### Don'ts ❌

- ❌ Don't enable review mode during submission period
- ❌ Don't forget to announce mode change to team
- ❌ Don't run server indefinitely in review mode
- ❌ Don't make manual edits without backing up first

---

## 🐛 Troubleshooting

### Issue: Review Mode Not Working

**Symptoms:** Checkboxes still clickable, no banner

**Solutions:**

1. **Check server startup message:**
   ```bash
   # Should see:
   🔒 REVIEW MODE ACTIVE - All changes are blocked
   ```

2. **Verify flag:**
   ```bash
   # Make sure you're using --review
   node server.js --review
   ```

3. **Test API:**
   ```bash
   curl http://localhost:3000/api/review-mode
   # Should return: {"reviewMode":true,...}
   ```

4. **Clear browser cache:**
   - Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

---

### Issue: Need to Exit Review Mode

```bash
# 1. Stop server
Ctrl+C

# 2. Restart WITHOUT --review flag
node server.js

# Done! Now in edit mode again
```

---

### Issue: Banner Shows But Checkboxes Work

**Cause:** JavaScript didn't load properly or old cached version

**Fix:**
1. Hard refresh browser (Cmd+Shift+R)
2. Check browser console for errors
3. Verify `isReviewMode` variable in console:
   ```javascript
   // In browser console:
   console.log(isReviewMode)
   // Should show: true
   ```

---

## 📊 Monitoring Review Mode

### Check Status Remotely

```bash
# From any device
curl http://192.168.68.123:3000/api/review-mode

# Response:
{
  "reviewMode": true,
  "message": "Review mode active - no changes allowed"
}
```

### Server Logs

Watch for attempted changes:
```
POST /api/constraints/Alex - 403 Forbidden (Review mode)
DELETE /api/constraints/Gabriel - 403 Forbidden (Review mode)
```

---

## 🎉 Success Checklist

When review mode is properly configured:

- [ ] Server shows "REVIEW MODE ACTIVE" message
- [ ] Orange banner visible on web page
- [ ] Checkboxes are grayed out and disabled
- [ ] Save/Clear buttons are hidden
- [ ] API returns 403 for POST/DELETE
- [ ] Team has been notified of review mode
- [ ] You can still view all submitted constraints

---

**Need to make changes?** → Manual edit JSON or temporarily disable review mode

**Ready to generate schedule?** → Stop server, run Python script

**Questions?** → See WORKFLOW.md for complete monthly process
