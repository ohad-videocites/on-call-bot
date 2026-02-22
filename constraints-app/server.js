const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Review mode - set via command line: node server.js --review
// or via environment variable: REVIEW_MODE=true node server.js
const REVIEW_MODE = process.argv.includes('--review') || process.env.REVIEW_MODE === 'true';

// ============================================================================
// USERS - Edit emails and passwords here
// ============================================================================
const USERS_RAW = [
    { email: 'ggabriel@rippleanalytics.com',  password: 'gabriel123',  developer: 'Gabriel' },
    { email: 'ashlomi@rippleanalytics.com',   password: 'shlomi123',  developer: 'Shlomi' },
    { email: 'yyariv@rippleanalytics.com',    password: 'yariv123',  developer: 'Yariv' },
    { email: 'eomer@rippleanalytics.com',     password: 'omer123',  developer: 'Omer' },
    { email: 'hamit@rippleanalytics.com',     password: 'amit123',  developer: 'Amit' },
    { email: 'eohad@rippleanalytics.com',     password: 'pass2108',  developer: 'Ohad', isAdmin: true },
    { email: 'ualexander@rippleanalytics.com',     password: 'alexander123',  developer: 'Alex' },
    { email: 'eor@rippleanalytics.com',       password: 'or123',  developer: 'Or' },
    { email: 'khagay@rippleanalytics.com',    password: 'hagay123',  developer: 'Hagay' },
    { email: 'iivan@rippleanalytics.com',     password: 'ivan123',  developer: 'Ivan' },
];

// Hash all passwords at startup
const USERS = USERS_RAW.map(u => ({
    ...u,
    passwordHash: bcrypt.hashSync(u.password, 10)
}));

// ============================================================================
// Middleware
// ============================================================================
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
    secret: 'oncall-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        httpOnly: true
    }
}));
app.use(express.static('public'));

// ============================================================================
// Auth Middleware
// ============================================================================
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
}

function checkReviewMode(req, res, next) {
    if (REVIEW_MODE && (req.method === 'POST' || req.method === 'DELETE' || req.method === 'PUT')) {
        return res.status(403).json({
            error: 'Review mode is active - changes are not allowed',
            reviewMode: true
        });
    }
    next();
}

// ============================================================================
// Data file setup
// ============================================================================
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'constraints.json');

async function initializeDataFile() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            const developers = {};
            USERS_RAW.filter(u => !u.isAdmin).forEach(u => {
                developers[u.developer] = { email: u.email, restrictions: [] };
            });
            const defaultData = {
                month: nextMonth.getMonth() + 1,
                year: nextMonth.getFullYear(),
                last_updated: new Date().toISOString(),
                developers
            };
            await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
            console.log(`✓ Created default constraints.json for ${nextMonth.toLocaleString('default', { month: 'long' })} ${nextMonth.getFullYear()}`);
        }
    } catch (error) {
        console.error('Error initializing data file:', error);
    }
}

async function readData() {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

async function writeData(data) {
    data.last_updated = new Date().toISOString();
    const tempFile = DATA_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2));
    await fs.rename(tempFile, DATA_FILE);
}

// ============================================================================
// Auth Routes (no auth required)
// ============================================================================

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.user = {
        email: user.email,
        developer: user.developer,
        isAdmin: user.isAdmin || false
    };

    res.json({
        email: user.email,
        developer: user.developer,
        isAdmin: user.isAdmin || false
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json(req.session.user);
});

// ============================================================================
// Protected API Routes
// ============================================================================

app.use('/api', requireAuth);
app.use('/api/constraints', checkReviewMode);

// Review mode status
app.get('/api/review-mode', (req, res) => {
    res.json({
        reviewMode: REVIEW_MODE,
        message: REVIEW_MODE ? 'Review mode active - no changes allowed' : 'Edit mode active'
    });
});

// Get all developers
app.get('/api/developers', async (req, res) => {
    try {
        const data = await readData();
        const user = req.session.user;

        if (user.isAdmin) {
            // Admin sees all
            const developers = Object.keys(data.developers).map(name => ({
                name,
                email: data.developers[name].email,
                restrictionCount: data.developers[name].restrictions.length
            }));
            return res.json(developers);
        }

        // Regular user sees only themselves
        const dev = data.developers[user.developer];
        if (!dev) return res.status(404).json({ error: 'Developer not found' });

        res.json([{
            name: user.developer,
            email: dev.email,
            restrictionCount: dev.restrictions.length
        }]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read developers' });
    }
});

// Get all constraints (admin) or own constraints (user)
app.get('/api/constraints', async (req, res) => {
    try {
        const data = await readData();
        const user = req.session.user;

        if (user.isAdmin) return res.json(data);

        // Return only own developer's data
        const filtered = { ...data, developers: {} };
        if (data.developers[user.developer]) {
            filtered.developers[user.developer] = data.developers[user.developer];
        }
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read constraints' });
    }
});

// Get constraints for a specific developer
app.get('/api/constraints/:developer', async (req, res) => {
    try {
        const data = await readData();
        const developer = req.params.developer;
        const user = req.session.user;

        if (!user.isAdmin && user.developer !== developer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!data.developers[developer]) {
            return res.status(404).json({ error: 'Developer not found' });
        }

        res.json({
            developer,
            email: data.developers[developer].email,
            restrictions: data.developers[developer].restrictions
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read constraints' });
    }
});

// Add constraint
app.post('/api/constraints/:developer', async (req, res) => {
    try {
        const data = await readData();
        const developer = req.params.developer;
        const user = req.session.user;
        const { restriction } = req.body;

        if (!user.isAdmin && user.developer !== developer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!restriction) return res.status(400).json({ error: 'Restriction is required' });
        if (!data.developers[developer]) return res.status(404).json({ error: 'Developer not found' });

        if (data.developers[developer].restrictions.includes(restriction)) {
            return res.status(409).json({ error: 'Restriction already exists' });
        }

        data.developers[developer].restrictions.push(restriction);
        await writeData(data);

        res.json({ success: true, developer, restrictions: data.developers[developer].restrictions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add constraint' });
    }
});

// Delete a specific constraint by index
app.delete('/api/constraints/:developer/:index', async (req, res) => {
    try {
        const data = await readData();
        const developer = req.params.developer;
        const user = req.session.user;
        const index = parseInt(req.params.index);

        if (!user.isAdmin && user.developer !== developer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!data.developers[developer]) return res.status(404).json({ error: 'Developer not found' });
        if (index < 0 || index >= data.developers[developer].restrictions.length) {
            return res.status(400).json({ error: 'Invalid index' });
        }

        data.developers[developer].restrictions.splice(index, 1);
        await writeData(data);

        res.json({ success: true, developer, restrictions: data.developers[developer].restrictions });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete constraint' });
    }
});

// Clear all constraints for a developer
app.delete('/api/constraints/:developer', async (req, res) => {
    try {
        const data = await readData();
        const developer = req.params.developer;
        const user = req.session.user;

        if (!user.isAdmin && user.developer !== developer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!data.developers[developer]) return res.status(404).json({ error: 'Developer not found' });

        data.developers[developer].restrictions = [];
        await writeData(data);

        res.json({ success: true, developer, restrictions: [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear constraints' });
    }
});

// Get current month/year
app.get('/api/month', async (req, res) => {
    try {
        const data = await readData();
        res.json({ month: data.month, year: data.year });
    } catch (error) {
        res.status(500).json({ error: 'Failed to read month' });
    }
});

// Update month/year (admin only)
app.post('/api/month', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user.isAdmin) return res.status(403).json({ error: 'Admin only' });

        const data = await readData();
        const { month, year } = req.body;

        if (month && (month < 1 || month > 12)) {
            return res.status(400).json({ error: 'Invalid month (1-12)' });
        }

        if (month) data.month = month;
        if (year) data.year = year;

        await writeData(data);
        res.json({ success: true, month: data.month, year: data.year });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update month' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ============================================================================
// Start server
// ============================================================================
async function startServer() {
    await initializeDataFile();

    app.listen(PORT, '0.0.0.0', () => {
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        const addresses = [];
        for (const name of Object.keys(networkInterfaces)) {
            for (const net of networkInterfaces[name]) {
                if (net.family === 'IPv4' && !net.internal) addresses.push(net.address);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('🚀 On-Call Constraints Server');
        if (REVIEW_MODE) console.log('🔒 REVIEW MODE ACTIVE - No changes allowed');
        console.log('='.repeat(60));
        console.log(`📍 Local:   http://localhost:${PORT}`);
        if (addresses.length > 0) {
            addresses.forEach(addr => console.log(`📍 Network: http://${addr}:${PORT}`));
        }
        console.log(`📁 Data file: ${DATA_FILE}`);
        console.log('\n👥 Users configured:', USERS.length);
        console.log('💡 Share the Network URL with developers');
        console.log('='.repeat(60) + '\n');
    });
}

startServer();
