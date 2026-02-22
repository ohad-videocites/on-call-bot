/**
 * On-Call Scheduler Daemon
 *
 * This is the ONLY process you need to keep running.
 * It manages the full monthly lifecycle:
 *
 *  - Last 5 days of month → starts the web server + sends daily Slack reminders to team
 *  - Last day of month     → runs schedule generation, stops web server, sends results
 *      • Script output (success or failure) → admin DM webhook
 *      • Success only → team channel: "check the drive"
 *
 * Usage:
 *   node scheduler.js
 *
 * Keep alive with pm2:
 *   pm2 start scheduler.js --name oncall-scheduler
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');

// ============================================================================
// Config
// ============================================================================
const CONFIG_PATH = path.join(__dirname, '..', 'scheduler-config.json');

let config = null;
try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    console.log('✓ scheduler-config.json loaded');
    console.log(`  Team channel webhook: ${config.slack_webhook_team ? '✓ set' : '✗ missing'}`);
    console.log(`  Admin DM webhook:     ${config.slack_webhook_admin ? '✓ set' : '✗ missing'}`);
    console.log(`  App URL:              ${config.app_url}`);
    console.log(`  Reminder window:      last ${config.reminder_days || 5} days of month`);
} catch {
    console.log('⚠ scheduler-config.json not found — Slack notifications disabled');
    console.log('  Copy scheduler-config.json.template to scheduler-config.json and fill in values.');
}

// ============================================================================
// Web server process management
// ============================================================================
let serverProcess = null;

function startServer() {
    if (serverProcess) {
        console.log('ℹ Web server already running.');
        return;
    }
    console.log('▶ Starting web server...');
    serverProcess = spawn('node', ['server.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
    serverProcess.on('exit', (code) => {
        console.log(`Web server exited with code ${code}`);
        serverProcess = null;
    });
    console.log('✓ Web server started (port 3000)');
}

function stopServer() {
    if (!serverProcess) {
        console.log('ℹ Web server is not running.');
        return;
    }
    console.log('■ Stopping web server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
    console.log('✓ Web server stopped — app closed until next month');
}

// ============================================================================
// Slack notifications
// ============================================================================
async function sendSlack(target, text) {
    if (!config) return;
    const url = target === 'team' ? config.slack_webhook_team : config.slack_webhook_admin;
    if (!url || url.includes('YOUR')) {
        console.log(`[Slack ${target}] (not configured) ${text.slice(0, 80)}...`);
        return;
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        if (res.ok) {
            console.log(`✓ Slack message sent to [${target}]`);
        } else {
            console.error(`✗ Slack error [${target}]: ${res.status}`);
        }
    } catch (err) {
        console.error(`✗ Slack fetch failed [${target}]:`, err.message);
    }
}

// ============================================================================
// Constraints reset — clear restrictions and advance month/year
// ============================================================================
function resetConstraintsForNextMonth() {
    try {
        const dataFile = path.join(__dirname, '..', 'data', 'constraints.json');
        const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

        // Advance month/year by 1
        let month = data.month;
        let year = data.year;
        if (month === 12) {
            month = 1;
            year += 1;
        } else {
            month += 1;
        }

        // Clear all restrictions
        for (const dev of Object.keys(data.developers)) {
            data.developers[dev].restrictions = [];
        }

        data.month = month;
        data.year = year;
        data.last_updated = new Date().toISOString();

        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
        console.log(`✓ Constraints reset — ready to collect for ${monthNames[month-1]} ${year}`);
    } catch (err) {
        console.error('✗ Failed to reset constraints:', err.message);
    }
}

// ============================================================================
// Python schedule generation
// ============================================================================
function runPythonScript() {
    return new Promise((resolve) => {
        console.log('▶ Running schedule generation script...');
        const proc = spawn('python3', ['on_call_scheduler_with_sheets.py'], {
            cwd: path.join(__dirname, '..')
        });
        let output = '';
        proc.stdout.on('data', d => { process.stdout.write(d); output += d.toString(); });
        proc.stderr.on('data', d => { process.stderr.write(d); output += d.toString(); });
        proc.on('close', code => {
            console.log(`Script exited with code ${code}`);
            resolve({ code, output });
        });
    });
}

// ============================================================================
// Month helpers
// ============================================================================
function getDaysLeft() {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return lastDay - now.getDate(); // 0 = last day, 4 = 5th-to-last, etc.
    //return 1;
}

function getMonthName(offset = 0) {
    const names = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
    const now = new Date();
    const idx = (now.getMonth() + offset) % 12;
    return names[idx];
}

// ============================================================================
// Core daily logic (called by cron + on startup)
// ============================================================================
async function runDailyCheck() {
    const daysLeft = getDaysLeft();
    const reminderDays = config?.reminder_days || 5;
    const appUrl = config?.app_url || 'http://localhost:3000';

    console.log(`\n[${new Date().toLocaleString()}] Daily check — ${daysLeft} day(s) left in month`);

    // One day before window opens — reset constraints so the app is clean when it opens
    if (daysLeft === reminderDays + 1) {
        resetConstraintsForNextMonth();
        return;
    }

    // Outside window — nothing to do
    if (daysLeft >= reminderDays) {
        console.log('ℹ Outside reminder window. No action needed.');
        return;
    }

    // === SECOND-TO-LAST DAY: morning reminder + generate at 23:50 ===
    // Runs one day before month end so developers see the schedule 24h before it starts
    if (daysLeft === 1) {
        console.log('📅 Second-to-last day of month — running schedule generation at 23:50');

        // Morning: remind team it's the last chance
        startServer(); // ensure server is still open for late submissions
        await sendSlack('team',
            `⏰ *Last chance to submit on-call constraints!*\n` +
            `The schedule will be generated tonight. Make sure you've marked your unavailable shifts for *${getMonthName(1)}*.\n` +
            `👉 ${appUrl}`
        );

        // Wait until 17:00 to collect submissions, then generate (before machine shuts down at 20:00)
        const now = new Date();
        const runAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
        const msUntilRun = runAt - now;

        if (msUntilRun > 0) {
            console.log(`⏳ Waiting until 17:00 to generate schedule (${Math.round(msUntilRun / 60000)} minutes)...`);
            await new Promise(resolve => setTimeout(resolve, msUntilRun));
        }

        // Generate schedule
        const { code, output } = await runPythonScript();

        if (code === 0) {
            // Admin DM: full technical output
            await sendSlack('admin',
                `✅ *On-Call Schedule Generated Successfully!*\n` +
                `\`\`\`${output.slice(-800)}\`\`\``
            );
            // Team channel: just a friendly message
            await sendSlack('team',
                `✅ *The on-call schedule for ${getMonthName(1)} is ready!*\n` +
                `📊 Check the Google Drive spreadsheet — the new month has been added.\n` +
                `_See you next month! 👋_`
            );
        } else {
            // Admin DM only — team doesn't need to see failures
            await sendSlack('admin',
                `❌ *Schedule generation FAILED*\n` +
                `Please check the logs and run manually.\n` +
                `\`\`\`${output.slice(-600)}\`\`\``
            );
        }

        // Stop the web server — app is closed until next cycle
        stopServer();
        return;
    }

    // === REMINDER DAYS (2 to reminderDays-1 before end): start server + remind ===
    if (daysLeft > 1) {
        startServer();

        await sendSlack('team',
            `🔔 *On-Call Constraints — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left!*\n\n` +
            `Please log in and mark your unavailable shifts for *${getMonthName(1)}*.\n` +
            `👉 ${appUrl}\n\n` +
            `_Deadline: tomorrow night_`
        );
    }
}

// ============================================================================
// Startup: check if we're already in the window
// ============================================================================
(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🗓  On-Call Scheduler Daemon');
    console.log('='.repeat(60));

    const daysLeft = getDaysLeft();
    const reminderDays = config?.reminder_days || 5;

    if (daysLeft >= 1 && daysLeft < reminderDays) {
        // In the reminder window (and generation hasn't run yet) — start the server
        console.log(`\n📅 Currently in reminder window (${daysLeft} days left in month)`);
        console.log('▶ Starting web server immediately...');
        startServer();
    } else if (daysLeft === 0) {
        // Last day — generation already ran last night, server should be off
        console.log(`\n📅 Last day of month — generation already completed. Server stays off.`);
    } else {
        console.log(`\n📅 Outside reminder window (${daysLeft} days left in month)`);
        console.log(`ℹ Web server will start in ${daysLeft - reminderDays + 1} day(s)`);
    }

    // Schedule daily check at 10:30 AM — machine starts around 10:00
    cron.schedule('30 10 * * *', runDailyCheck, {
        timezone: 'Asia/Jerusalem'
    });
    //cron.schedule('* * * * *', runDailyCheck)  //Test mode

    // Also run on startup to catch up if machine just rebooted and it's already past 10:30
    console.log('▶ Running startup check...');
    await runDailyCheck();

    console.log('\n✓ Cron scheduled: daily at 10:30 AM (Asia/Jerusalem)');
    console.log('✓ Scheduler daemon running. Press Ctrl+C to stop.\n');
})();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    stopServer();
    process.exit(0);
});

process.on('SIGTERM', () => {
    stopServer();
    process.exit(0);
});
