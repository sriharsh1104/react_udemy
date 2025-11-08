# Render Deployment Guide

## Step 1: Prepare Backend for Render

### 1.1 Environment Variables

Create a `.env` file in `backend/` directory (for local development):

```env
PORT=3001
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/chatapp
FRONTEND_URL=http://localhost:8081
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 1.2 MongoDB Setup - Using Render MongoDB Service

We'll use Render's MongoDB Service (Recommended):

1. In Render dashboard, click "New +" → "MongoDB"
2. Configure:
   - **Name**: `chat-app-db` (or your preferred name)
   - **Database**: `chatapp` (or your preferred name)
   - **User**: Leave default or create custom
   - **Plan**: Free tier is available
3. After creation, Render will provide:
   - **Internal Database URI** (for services in same region)
   - **External Database URI** (for external connections)
4. Copy the **Internal Database URI** - we'll use this in the web service

## Step 2: Deploy to Render

### 2.1 Create New Web Service

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder as root directory

### 2.2 Configure Build Settings

- **Name**: `chat-app-backend` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm run build` (or `npm install`)
- **Start Command**: `npm start`
- **Root Directory**: `backend`

### 2.3 Connect MongoDB Service

1. In your Web Service settings, go to "Connections" tab
2. Click "Connect" next to your MongoDB service
3. Render will automatically:
   - Add `MONGO_URI` environment variable
   - Use the Internal Database URI (faster, more secure)

### 2.4 Set Other Environment Variables

In Render dashboard, go to Environment tab and add:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `10000` | Port (Render uses 10000) |
| `MONGO_URI` | *(Auto-set by MongoDB connection)* | Automatically set when MongoDB service is connected |
| `FRONTEND_URL` | `http://localhost:8081` | Frontend URL (update after frontend deploy) |
| `EMAIL_USER` | `your-email@gmail.com` | (Optional) Email for OTP |
| `EMAIL_PASS` | `your-app-password` | (Optional) Email password |

**Important Notes**:
- `MONGO_URI` is automatically set when you connect MongoDB service - don't set it manually
- Render automatically provides `RENDER_EXTERNAL_URL` - you don't need to set it
- Make sure MongoDB service and Web Service are in the same region for best performance

### 2.5 Deploy

Click "Create Web Service" and wait for deployment.

After deployment, you'll get a URL like: `https://your-backend.onrender.com`

**Deployment Order**:
1. First create MongoDB service
2. Then create Web Service
3. Connect MongoDB to Web Service in Connections tab
4. Deploy

## Step 3: Update Frontend Configuration

### 3.1 Update Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```env
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

Replace `your-backend.onrender.com` with your actual Render backend URL.

### 3.2 Update Backend CORS

In Render dashboard, update `FRONTEND_URL` environment variable with your frontend URL.

## Step 4: Test Deployment

1. Check backend health: `https://your-backend.onrender.com/api/health`
2. Test API endpoints
3. Test Socket.io connection

## Important Notes

- **Free Tier**: Render free tier spins down after 15 minutes of inactivity. First request may be slow.
- **MongoDB Service**: 
  - Free tier available (512 MB storage)
  - Automatically connected via Internal URI (faster)
  - Data persists even when web service restarts
  - Same region = better performance
- **Environment Variables**: Always set sensitive data in Render dashboard, never commit to git.
- **CORS**: Make sure `FRONTEND_URL` matches your frontend URL exactly.
- **Build Command**: Uses `npm run build` which runs `npm install` (defined in package.json)

## Troubleshooting

### Backend not starting
- Check logs in Render dashboard
- Verify all environment variables are set
- Check MongoDB connection

### CORS errors
- Verify `FRONTEND_URL` is set correctly
- Check that frontend URL matches exactly (including http/https)

### Socket.io not working
- Verify `REACT_APP_SOCKET_URL` is set in frontend
- Check that Socket.io is configured for HTTPS

