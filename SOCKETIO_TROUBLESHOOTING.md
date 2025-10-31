# Socket.io 404 Error - Troubleshooting Guide

## Issue
Socket.io connection getting 404 error: `https://react-udemy-r43h.onrender.com/socket.io/?EIO=4&transport=polling`

## Diagnosis
The backend server itself is returning 404, which means:
1. ❌ Backend is not running on Render
2. ❌ Backend might have crashed
3. ❌ Wrong URL or service not deployed

## Steps to Fix

### 1. Check Backend Deployment Status

**Test if backend is running:**
```bash
curl https://react-udemy-r43h.onrender.com/api/health
```

**Expected response:**
```json
{"status":"ok","message":"Backend server is running"}
```

**If you get 404:**
- Backend service is NOT running or not deployed correctly

### 2. Check Render Dashboard

1. Go to https://dashboard.render.com
2. Check your backend service status
3. Look at **Logs** tab:
   - Any errors?
   - Is `npm start` command running?
   - Do you see: `🚀 Backend server running on http://localhost:PORT`?

### 3. Verify Render Settings

**Critical Settings:**

✅ **Root Directory**: `backend` (NOT project root!)
✅ **Build Command**: Empty or `echo "No build needed"`
✅ **Start Command**: `npm start`
✅ **Environment**: Node (18.x or 20.x)

### 4. Check Backend Logs on Render

Common issues in logs:
- `Error: Cannot find module 'socket.io'` → Dependencies not installed
- `Port already in use` → Port configuration issue
- `EADDRINUSE` → Port conflict

### 5. Manual Test

**Test Socket.io endpoint:**
```bash
curl https://react-udemy-r43h.onrender.com/socket-test
```

Should return:
```json
{
  "message": "Socket.io server is configured",
  "socketio": "ready",
  "connectedUsers": 0
}
```

## Quick Fixes

### Fix 1: Re-deploy Backend
1. Render Dashboard → Your Service → Manual Deploy → Clear build cache & Deploy

### Fix 2: Check Dependencies
Make sure `backend/package.json` has:
```json
"dependencies": {
  "socket.io": "^4.8.1"
}
```

### Fix 3: Verify server.js is using HTTP Server
Backend must use `server.listen()` NOT `app.listen()`:
```javascript
const server = http.createServer(app)
const io = new Server(server, {...})
server.listen(PORT, ...) // ✅ Correct
```

## Testing Locally First

Before deploying, test locally:

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Test Socket.io:**
   ```bash
   curl http://localhost:3001/socket-test
   ```

3. **Test frontend:**
   - Change `BACKEND_URL` to `http://localhost:3001` temporarily
   - Test if Socket.io connects locally

## If Backend is Down

If backend is completely down:

1. Check Render service status (might be sleeping)
2. Render free tier services sleep after 15 minutes of inactivity
3. First request might take 30-60 seconds to wake up
4. Consider upgrading to paid tier for always-on service

## Alternative: Use Environment Variable for Local Dev

For local development, create `.env.local`:
```env
VITE_BACKEND_URL=http://localhost:3001
```

For production, it will automatically use the default URL.

