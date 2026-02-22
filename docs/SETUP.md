# On-Call Bot — Setup Guide

This guide covers deploying the on-call bot on a remote Linux machine (company dev server, EC2, etc.).

---

## How It Works

You run **one process** (`scheduler.js`) and it handles everything automatically:

| When | What happens |
|------|-------------|
| 6 days before month end | Constraints reset — ready for next month |
| 5–2 days before month end | Web app starts, daily Slack reminder sent to team |
| Second-to-last day (10:30) | Last-chance Slack reminder |
| Second-to-last day (17:00) | Schedule generated, results sent to Slack, app stops |

---

## File Structure

```
on-call-bot/
├── constraints-app/
│   ├── scheduler.js          # Main daemon — the only process to keep running
│   ├── server.js             # Web server (started/stopped automatically by scheduler)
│   ├── package.json
│   └── public/
│       ├── index.html
│       └── ripple-icon.jpg
├── data/
│   └── constraints.json      # Auto-created on first run
├── output/                   # Generated schedules (auto-created)
├── docs/
├── on_call_scheduler_with_sheets.py
├── requirements.txt
├── config.json               # Google Sheets config (create from template, never commit)
├── config.json.template
├── scheduler-config.json     # Slack + app URL config (create from template, never commit)
└── scheduler-config.json.template
```

---

## Prerequisites

- **Node.js** v16+: `node --version`
- **Python** 3.8+: `python3 --version`
- **pm2**: `npm install -g pm2`

---

## Step 1: Clone the Repo

```bash
git clone https://github.com/ohad-videocites/on-call-bot.git
cd on-call-bot
```

---

## Step 2: Install Dependencies

```bash
# Node
cd constraints-app && npm install && cd ..

# Python
pip install -r requirements.txt
```

---

## Step 3: Configure Slack

```bash
cp scheduler-config.json.template scheduler-config.json
```

Edit `scheduler-config.json`:
```json
{
  "slack_webhook_team": "<your team channel webhook URL>",
  "slack_webhook_admin": "<your personal DM webhook URL>",
  "app_url": "http://YOUR_MACHINE_IP:3000",
  "reminder_days": 5
}
```

> See [SLACK_SETUP.md](SLACK_SETUP.md) for how to create the webhooks.

---

## Step 4: Configure Google Sheets

```bash
cp config.json.template config.json
```

Edit `config.json`:
```json
{
  "credentials_file": "google-credentials.json",
  "upload_to_sheets": true
}
```

Copy your `google-credentials.json` to the project root (never commit this file).

> See [GOOGLE_SHEETS_SETUP.md](GOOGLE_SHEETS_SETUP.md) for how to create the credentials.

---

## Step 5: Start the Scheduler with pm2

```bash
cd constraints-app
pm2 start scheduler.js --name oncall-scheduler
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

Check it's running:
```bash
pm2 status
pm2 logs oncall-scheduler
```

That's it — the scheduler manages everything from here.

---

## Deploying Updates

When you push changes to the repo:

```bash
cd on-call-bot
git pull
pm2 restart oncall-scheduler
```

---

## Manual Operations

### Force-run schedule generation now
```bash
cd on-call-bot
python3 on_call_scheduler_with_sheets.py
```

### Manually open/close the web app
```bash
cd constraints-app
node server.js          # open
pm2 stop oncall-scheduler   # this also stops the web server gracefully
```

### Check current constraints
```bash
cat data/constraints.json
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `pm2` not found | `npm install -g pm2` |
| Slack messages not sending | Check webhooks in `scheduler-config.json` — run `node scheduler.js` to see startup output |
| Google Sheets not updating | Run `python3 on_call_scheduler_with_sheets.py` manually to see the error |
| Web app not reachable | Check firewall allows port 3000. Find machine IP: `hostname -I` |
| `constraints.json` missing | Auto-created on first server start. Run `node server.js` once. |
| Schedule generated but wrong month | Check `data/constraints.json` — `month` and `year` fields |

---

## Security

- `google-credentials.json` — never commit, copy manually to server
- `scheduler-config.json` — never commit, copy manually to server
- Both are in `.gitignore`
