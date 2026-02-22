# Network Troubleshooting Guide

When you get `ERR_CONNECTION_FAILED` trying to access the server from other devices.

---

## 🚀 Quick Fix (Most Common)

### The Issue: macOS Firewall

macOS Firewall blocks incoming connections by default.

### The Solution:

1. **Open System Preferences**
2. Go to **Security & Privacy** → **Firewall**
3. Click 🔒 **lock icon** (enter password)
4. Click **"Firewall Options..."**
5. Click **"+"** button
6. Find and select your **Node.js** binary:
   ```bash
   # Find node location first:
   which node
   # Common paths:
   # /usr/local/bin/node
   # /opt/homebrew/bin/node (Apple Silicon)
   # ~/.nvm/versions/node/vXX.X.X/bin/node (if using nvm)
   ```
7. Select **"Allow incoming connections"**
8. Click **OK** and **lock** again

### Restart Server

```bash
# Stop server (Ctrl+C)
# Start again
cd constraints-app
npm start
```

**You should now see:**
```
🚀 On-Call Constraints Server
📍 Local:   http://localhost:3000
📍 Network: http://192.168.68.123:3000  ← Share this!
```

---

## 🔍 Detailed Troubleshooting

### Step 1: Verify Server is Running

**Check terminal output:**
```
🚀 On-Call Constraints Server
📍 Local:   http://localhost:3000
📍 Network: http://192.168.68.123:3000
```

If not showing, start it:
```bash
cd constraints-app
npm start
```

---

### Step 2: Test Locally (Same Machine)

On your **Mac** where server is running:

```bash
# Test with localhost
curl http://localhost:3000/health

# Should return:
{"status":"ok"}
```

**If this fails:**
- Server isn't running properly
- Port 3000 might be in use
- Check for errors in terminal

**Fix:**
```bash
# Check what's using port 3000
lsof -i :3000

# Kill if needed
kill -9 [PID]

# Restart server
npm start
```

---

### Step 3: Test with Local IP (Same Machine)

```bash
# Get your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Test with your IP
curl http://192.168.68.123:3000/health

# Should return:
{"status":"ok"}
```

**If localhost works but IP doesn't:**
- Server might not be listening on all interfaces
- I've fixed this in the code (listens on 0.0.0.0 now)

---

### Step 4: Test from Another Device

From another computer/phone on **same WiFi network**:

**Browser:**
```
http://192.168.68.123:3000
```

**Or using curl (if available):**
```bash
curl http://192.168.68.123:3000/health
```

**If this fails:**
→ **Firewall is blocking** (see Quick Fix above)

---

## 🔥 Firewall Solutions

### Option 1: Allow Node.js (Recommended)

See "Quick Fix" section above.

### Option 2: Add Specific Port Rule

```bash
# Add firewall rule for port 3000
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

### Option 3: Temporarily Disable (TESTING ONLY!)

```bash
# Check current state
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Disable (NOT for production!)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off

# Test from other device

# IMPORTANT: Re-enable after testing!
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

---

## 🌐 Network Issues

### Check Network Connectivity

**Same WiFi?**
```bash
# On Mac (server)
ipconfig getifaddr en0  # Ethernet
ipconfig getifaddr en1  # WiFi

# On other device, ping Mac
ping 192.168.68.123
```

**If ping fails:**
- Devices not on same network
- Network isolation (guest network?)
- Router blocking inter-device communication

### Router Settings

Some routers have **"Client Isolation"** or **"AP Isolation"** enabled:
- Prevents devices from talking to each other
- Common on guest networks
- Check router settings

### VPN Issues

If using VPN on either device:
- Disable VPN temporarily
- VPNs can block local network access

---

## 🛠️ Advanced Diagnostics

### Check Server Binding

```bash
# See what the server is listening on
lsof -i :3000

# Should show:
node    12345 user   10u  IPv4 0x... 0t0  TCP *:3000 (LISTEN)
#                                          ^^^^ means all interfaces
```

### Check macOS Firewall Status

```bash
# View firewall state
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# List allowed apps
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps

# Check if node is allowed
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps | grep -i node
```

### Network Interface Details

```bash
# Show all network interfaces
ifconfig

# Show IP addresses only
ifconfig | grep "inet " | grep -v 127.0.0.1

# Show routing
netstat -rn
```

### Test Specific Port

```bash
# On Mac (server), use netcat to test
nc -l 3000

# From other device
telnet 192.168.68.123 3000
# Or
nc -zv 192.168.68.123 3000
```

---

## 📱 Testing from Phone/Tablet

### On Same WiFi

1. Connect phone to **same WiFi network**
2. Open browser (Safari/Chrome)
3. Go to: `http://192.168.68.123:3000`

**If still can't connect:**
- Phone on guest network?
- Router has client isolation?
- Firewall still blocking?

### Get Phone's IP

To verify same network:

**iPhone:**
Settings → WiFi → (i) icon → IP Address

**Android:**
Settings → WiFi → Connected network → Advanced

**Should be same subnet:**
```
Mac:   192.168.68.123
Phone: 192.168.68.XXX  ← Same first 3 numbers
```

---

## ✅ Verification Checklist

After making changes, verify:

### On Server Machine (Mac)

- [ ] Server shows Network URL
- [ ] `curl http://localhost:3000/health` works
- [ ] `curl http://192.168.68.123:3000/health` works
- [ ] Node allowed in Firewall

### From Other Device

- [ ] Connected to same WiFi
- [ ] Can ping server IP: `ping 192.168.68.123`
- [ ] Browser shows web app at `http://192.168.68.123:3000`
- [ ] Can submit constraints

---

## 🎯 Common Scenarios & Solutions

### Scenario 1: "Connection Refused"

**Symptom:** `curl: (7) Failed to connect to 192.168.68.123 port 3000: Connection refused`

**Cause:** Server not running or not listening on that port

**Fix:**
```bash
# Check if server running
lsof -i :3000

# If nothing, start server
cd constraints-app && npm start
```

---

### Scenario 2: "No Route to Host"

**Symptom:** `curl: (7) Failed to connect to 192.168.68.123 port 3000: No route to host`

**Cause:** Firewall blocking OR wrong IP

**Fix:**
1. Verify IP: `ipconfig getifaddr en0`
2. Allow node in Firewall (see Quick Fix)
3. Restart server

---

### Scenario 3: "Timeout"

**Symptom:** Browser spins forever, then times out

**Cause:** Firewall OR network isolation

**Fix:**
1. Check firewall settings
2. Verify same network
3. Check router for client isolation

---

### Scenario 4: Works Locally, Not Remotely

**Symptom:**
- ✅ `http://localhost:3000` works
- ❌ `http://192.168.68.123:3000` doesn't work from other device

**Cause:** Firewall blocking external connections

**Fix:**
→ Follow "Quick Fix" section above to allow Node in Firewall

---

### Scenario 5: Worked Yesterday, Not Today

**Possible Causes:**
- IP address changed (DHCP)
- Firewall settings reset
- macOS update reset settings
- Server not started

**Fix:**
```bash
# Check current IP
ipconfig getifaddr en0

# Restart server
cd constraints-app && npm start

# Share new URL if IP changed
```

---

## 🔒 Security Notes

### During Collection Period (2-3 days)

- ✅ Allow Node in Firewall
- ✅ Server accessible on local network only
- ✅ Stop server after collection period

### After Collection Period

```bash
# Stop server
Ctrl+C

# Optional: Remove Node from Firewall allow list
# (can re-add next month)
```

### For Extra Security

1. **Use specific IP range** in router
2. **Enable firewall** with specific rules
3. **Change default port** (edit PORT in server.js)
4. **Monitor access logs** in terminal

---

## 📊 Decision Tree

```
Can't connect from other device?
    │
    ├─ Server running?
    │   ├─ No  → Start server: npm start
    │   └─ Yes → Continue
    │
    ├─ Works on http://localhost:3000?
    │   ├─ No  → Server issue, check terminal errors
    │   └─ Yes → Continue
    │
    ├─ Works on http://YOUR_IP:3000 from Mac?
    │   ├─ No  → Server not on all interfaces (fixed in new code)
    │   └─ Yes → Continue
    │
    ├─ Can ping Mac from other device?
    │   ├─ No  → Network issue (different networks?)
    │   └─ Yes → Continue
    │
    └─ Must be Firewall!
        → Follow "Quick Fix" section
        → Allow Node in macOS Firewall
```

---

## 🆘 Still Not Working?

Run this diagnostic script:

```bash
#!/bin/bash

echo "=== Network Diagnostics ==="
echo ""

echo "1. Server Status:"
lsof -i :3000 2>/dev/null || echo "Server not running!"

echo ""
echo "2. IP Addresses:"
ifconfig | grep "inet " | grep -v 127.0.0.1

echo ""
echo "3. Firewall Status:"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

echo ""
echo "4. Node in Firewall:"
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --listapps | grep -i node || echo "Node not in firewall rules"

echo ""
echo "5. Test Local:"
curl -s http://localhost:3000/health && echo " ✓" || echo " ✗"

echo ""
echo "6. Test with IP:"
IP=$(ipconfig getifaddr en0)
curl -s http://$IP:3000/health && echo " ✓" || echo " ✗"
```

Save as `diagnose.sh`, run with:
```bash
chmod +x diagnose.sh
./diagnose.sh
```

Share output if asking for help.

---

## 💡 Pro Tips

1. **Reserve IP** in router (DHCP reservation) so IP doesn't change
2. **Bookmark** the URL on team's devices for easy access
3. **Test setup** before opening to team
4. **Keep terminal open** to see access logs
5. **Document** your IP for next month

---

## 📞 Quick Help Commands

```bash
# What's my IP?
ipconfig getifaddr en0

# Is server running?
lsof -i :3000

# Test from Mac
curl http://localhost:3000/health

# Where is Node?
which node

# Is firewall on?
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Restart server
cd constraints-app && npm start
```

---

**Most Common Fix:** Allow Node.js in macOS Firewall (see "Quick Fix" at top) 🔥
