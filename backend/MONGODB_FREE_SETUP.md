# Free MongoDB Setup for Render

## 🆓 Free MongoDB Options

### Option 1: MongoDB Atlas (Recommended) ⭐
**Free Tier**: 512 MB storage, Shared cluster
**Best for**: Production use, reliable, easy setup

### Option 2: Render MongoDB Service
**Free Tier**: 512 MB storage
**Best for**: Same platform as backend, easy connection

### Option 3: Railway MongoDB
**Free Tier**: 512 MB storage
**Best for**: Alternative option

---

## 📋 MongoDB Atlas Setup (Recommended)

### Step 1: Create Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up with Google/GitHub or email
3. Free tier automatically selected

### Step 2: Create Cluster
1. After login, click "Build a Database"
2. Select **FREE (M0) Shared** plan
3. Choose **Cloud Provider**: AWS (recommended)
4. Choose **Region**: Select closest to your Render region
   - For US: `us-east-1` or `us-west-1`
   - For Europe: `eu-west-1`
5. Click "Create"

### Step 3: Create Database User
1. **Username**: `chatapp` (or your choice)
2. **Password**: Generate strong password (save it!)
3. Click "Create Database User"

### Step 4: Network Access
1. Click "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
   - Or add Render's IP ranges
4. Click "Confirm"

### Step 5: Get Connection String
1. Click "Connect" button on cluster
2. Select "Connect your application"
3. Choose "Node.js" and version "5.5 or later"
4. Copy the connection string
   - Format: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

### Step 6: Update Connection String
Replace in connection string:
- `<username>` → Your database username (e.g., `chatapp`)
- `<password>` → Your database password
- Add database name: `?retryWrites=true&w=majority` → `?retryWrites=true&w=majority&appName=chat-app`

**Final format**:
```
mongodb+srv://chatapp:yourpassword@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority&appName=chat-app
```

### Step 7: Set in Render
1. Go to Render dashboard → Your Web Service
2. Go to "Environment" tab
3. Add/Update `MONGO_URI`:
   ```
   mongodb+srv://chatapp:yourpassword@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority&appName=chat-app
   ```
4. Save and redeploy

---

## 📋 Render MongoDB Service Setup (Alternative)

### Step 1: Create MongoDB Service
1. Render dashboard → "New +" → "MongoDB"
2. Configure:
   - **Name**: `chat-app-db`
   - **Database**: `chatapp`
   - **Plan**: Free
3. Click "Create"

### Step 2: Connect to Web Service
1. Go to your Web Service
2. Click "Connections" tab
3. Click "Connect" next to MongoDB service
4. Render automatically sets `MONGO_URI`

**Note**: `MONGO_URI` automatically set hoga, manually set mat karein!

---

## 🔍 Verification

After setting up, check logs:

```bash
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
📊 Database: chatapp
```

If you see connection error, check:
- Username/password correct hai
- Network access allow hai
- Connection string format correct hai

---

## 💡 Comparison

| Feature | MongoDB Atlas | Render MongoDB |
|---------|--------------|----------------|
| Free Storage | 512 MB | 512 MB |
| Setup Time | 5-10 min | 2-3 min |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Global Regions | Yes | Limited |
| Best For | Production | Quick setup |

---

## 🎯 Recommendation

**Use MongoDB Atlas** if:
- Production use hai
- Global users hain
- More features chahiye

**Use Render MongoDB** if:
- Quick setup chahiye
- Same platform use kar rahe ho
- Simple setup chahiye

---

## 🐛 Troubleshooting

### Connection Refused
- Check MongoDB service is running
- Verify connection string format
- Check network access settings

### Authentication Failed
- Verify username/password
- Check special characters in password (URL encode if needed)
- Verify database user exists

### Timeout Errors
- Check region matches Render region
- Verify network access allows Render IPs
- Try "Allow from anywhere" for testing

