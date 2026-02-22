# Slack Integration Setup

This guide explains how to create two Slack webhooks for the On-Call automation:

1. **Team webhook** — sends reminders and success messages to your #oncall channel
2. **Admin webhook** — sends you a DM with script output (success details or failure errors)

---

## Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. App Name: `On-Call Bot`
5. Pick your workspace
6. Click **"Create App"**

---

## Step 2: Enable Incoming Webhooks

1. In the left sidebar, click **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **ON**

---

## Step 3: Create Webhook #1 — Team Channel

1. Click **"Add New Webhook to Workspace"**
2. In the dropdown, select your **#oncall channel** (or whichever channel you want reminders in)
3. Click **"Allow"**
4. Copy the webhook URL (shown after clicking Allow — starts with `hooks.slack.com/services/...`)
5. Paste it as `slack_webhook_team` in `scheduler-config.json`

---

## Step 4: Create Webhook #2 — Your Personal DM

1. Back on the Incoming Webhooks page, click **"Add New Webhook to Workspace"** again
2. In the dropdown, search for **your own name** (to send yourself a DM)
3. Click **"Allow"**
4. Copy the second webhook URL
5. Paste it as `slack_webhook_admin` in `scheduler-config.json`

---

## Step 5: Configure the App URL

Open `scheduler-config.json` and set `app_url` to the address where developers access the app.

**For local network only:**
```json
"app_url": "http://192.168.1.100:3000"
```
Find your IP with: `ifconfig | grep "inet " | grep -v 127.0.0.1`

**For a VPS/remote server (future):**
```json
"app_url": "https://oncall.yourcompany.com"
```

---

## Final scheduler-config.json

```json
{
  "slack_webhook_team": "<paste team channel webhook URL here>",
  "slack_webhook_admin": "<paste your personal DM webhook URL here>",
  "app_url": "http://YOUR_MACHINE_IP:3000",
  "reminder_days": 5
}
```

---

## Step 6: Run the Scheduler

```bash
cd constraints-app
node scheduler.js
```

You should see:
```
✓ scheduler-config.json loaded
  Team channel webhook: ✓ set
  Admin DM webhook:     ✓ set
  App URL:              http://192.168.1.100:3000
  Reminder window:      last 5 days of month
```

---

## How the Monthly Cycle Works

| When | What happens |
|------|-------------|
| Day `lastDay - 4` to `lastDay - 1` | Server starts, daily Slack reminder to team channel with app link |
| Last day at **09:00** | Morning reminder sent to team |
| Last day at **23:50** | Schedule generation runs |
| Last day after generation (success) | Admin DM: full output. Team channel: "schedule is ready, check Drive" |
| Last day after generation (failure) | Admin DM only: error details. Team channel is not notified. |
| After generation | Web server stops — app is closed until next month |

---

## Keeping the Scheduler Always Running (pm2)

Install pm2 once:
```bash
npm install -g pm2
```

Start the scheduler:
```bash
cd constraints-app
pm2 start scheduler.js --name oncall-scheduler
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

Check status:
```bash
pm2 status
pm2 logs oncall-scheduler
```

---

## Testing

To test the Slack messages without waiting for end of month, you can temporarily trigger:

```bash
# In constraints-app/scheduler.js, find the cron line and change to:
cron.schedule('* * * * *', runDailyCheck)   # fires every minute
```

Use these return values to test each scenario:

| `return` value | What it simulates | Expected behavior |
|---|---|---|
| `3` | 3 days left → reminder window | Server starts, reminder message → team channel |
| `1` | Second-to-last day → generation day | Last-chance message → team, waits until 17:00, runs script, sends results, stops server |
| `0` | Last day | Nothing — generation already ran the day before |

> ⚠️ Generation (`return 1`) waits until **17:00** before running the script.
> To test immediately, also temporarily change the `runAt` time to a minute from now:
> ```js
> const runAt = new Date(Date.now() + 60 * 1000); // 1 minute from now
> ```

Remember to revert all changes after testing.
