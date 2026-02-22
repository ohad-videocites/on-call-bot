# On-Call Scheduling System

Automated on-call scheduling system with web-based constraint collection and Google Sheets integration.

## 🎯 Features

- **Web Interface** for developers to submit monthly availability constraints
- **Automated Schedule Generation** with fair distribution algorithm
- **Google Sheets Integration** with automatic color-coded developer assignments
- **Real-time Updates** as developers submit their constraints
- **Local & Cloud Storage** - Data saved locally and synced to Google Sheets

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python dependencies
pip3 install -r requirements.txt

# Install Node.js dependencies
cd constraints-app
npm install
cd ..
```

### 2. Start the Web App

```bash
cd constraints-app
npm start
```

Access at: **http://localhost:3000**

### 3. Collect Constraints

Share the web app URL with your team. They can:
- Select their name
- Pick unavailable dates
- Choose Day/Night shifts
- Submit constraints

### 4. Generate Schedule

```bash
python3 on_call_scheduler_with_sheets.py
```

The schedule will be:
- Saved to `shift_schedule.csv`
- Uploaded to Google Sheets with color coding

## 📁 Project Structure

```
ohad_tools/
├── constraints-app/          # Web application
│   ├── server.js            # Backend API
│   ├── package.json         # Node dependencies
│   └── public/
│       └── index.html       # Frontend interface
├── data/
│   └── constraints.json     # Constraints data (auto-generated)
├── on_call_scheduler_with_sheets.py  # Main scheduler
├── on_call_2.py            # Original script (preserved)
├── config.json             # Google Sheets config
├── requirements.txt        # Python dependencies
├── SETUP.md               # Detailed setup guide
└── README.md              # This file
```

## ⚙️ Configuration

### Google Sheets Setup

1. Create Google Cloud Project
2. Enable Google Sheets API
3. Create Service Account & download credentials
4. Share your spreadsheet with service account email
5. Create `config.json`:

```json
{
  "spreadsheet_id": "YOUR_SPREADSHEET_ID",
  "worksheet_name": "2026",
  "credentials_file": "google-credentials.json"
}
```

See [SETUP.md](SETUP.md) for detailed instructions.

## 🎨 Developer Colors

Each developer is automatically assigned a color in Google Sheets:

| Developer | Color |
|-----------|-------|
| Omer      | Blue |
| Shlomi    | Light Cyan |
| Amit      | Light Brown |
| Ohad      | Light Pink |
| Ivan      | Red/Coral |
| Gabriel   | Light Green |
| Or        | Purple/Lavender |
| Hagay     | Dark Purple |
| Yariv     | Dark Red |
| Alex      | Light Yellow |

## 📊 How It Works

1. **Constraint Collection Phase**
   - Developers access web interface
   - Submit dates they're unavailable
   - Data stored in `constraints.json`

2. **Schedule Generation**
   - Python script reads constraints
   - Allocates shifts fairly across developers
   - Respects all submitted restrictions
   - Avoids consecutive assignments

3. **Google Sheets Update**
   - Schedule uploaded automatically
   - Developer names color-coded
   - Updates specific year tab

## 🔧 Maintenance

### Update Month/Year

Edit `on_call_scheduler_with_sheets.py` line 6:

```python
all_days = pd.date_range(start="2026-02-01", end="2026-02-28", freq="D")
```

### Add/Remove Developers

Edit `constraints-app/server.js` and `on_call_scheduler_with_sheets.py`

See [SETUP.md](SETUP.md) for details.

## 📝 Files Generated

- `shift_schedule.csv` - Local backup of schedule
- `shift_summary.csv` - Statistics on shift distribution
- `data/constraints.json` - Current constraints data

## 🔒 Security

- Never commit `google-credentials.json`
- Keep `config.json` out of version control
- Add to `.gitignore`:

```
google-credentials.json
config.json
data/constraints.json
*.csv
```

## 📖 Documentation

- [SETUP.md](SETUP.md) - Complete setup guide
- [on_call_scheduler_with_sheets.py](on_call_scheduler_with_sheets.py) - Main script with comments

## 🐛 Troubleshooting

See [SETUP.md - Troubleshooting](SETUP.md#troubleshooting) section.

## 📜 License

MIT

## 👥 Contributing

This is an internal tool. Modify as needed for your team's requirements.

---

**Ready to get started?** Follow [SETUP.md](SETUP.md) for complete installation instructions.
