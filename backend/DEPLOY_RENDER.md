# Render Deployment Guide

## Backend Deployment on Render

### Important Settings in Render Dashboard:

1. **Build Command**: 
   ```
   echo "No build needed"
   ```
   OR leave it **EMPTY** (Render will skip build)

2. **Start Command**:
   ```
   npm start
   ```

3. **Root Directory** (IMPORTANT):
   ```
   backend
   ```
   Ya phir Render dashboard mein "Root Directory" field mein `backend` dalo

4. **Environment**:
   - Runtime: `Node`
   - Node Version: `18.x` ya `20.x`

5. **Environment Variables**:
   - `NODE_ENV` = `production`
   - `PORT` = Render automatically sets this, but you can set manually: `10000`
   - `STRIPE_SECRET_KEY` = (agar Stripe use kar rahe ho)

### Steps:

1. Render dashboard mein New Web Service select karo
2. GitHub repository connect karo
3. **Root Directory** set karo: `backend` ⚠️ IMPORTANT!
4. **Build Command** ko EMPTY rakho ya `echo "No build needed"`
5. **Start Command**: `npm start`
6. **Environment**: Node
7. Deploy karo!

### Alternative: Using render.yaml

Agar `render.yaml` file use kar rahe ho (backend folder mein already create kiya hai):

1. Render dashboard mein "Infrastructure as Code" section mein `render.yaml` file path dalo: `backend/render.yaml`
2. Render automatically settings load kar lega

### Common Issues:

**❌ Error: "Publish directory npm run build does not exist!"**
- **Solution**: Build Command ko EMPTY rakho ya `echo "No build needed"` dalo
- Root Directory `backend` set karo (project root nahi!)

**❌ Port already in use**
- Solution: `server.js` already `process.env.PORT` use karta hai, Render automatically PORT set kar dega

**❌ Dependencies not found**
- Solution: Root Directory `backend` honi chahiye, jahan `package.json` hai

### Testing After Deploy:

Backend URL check karo:
```
https://your-backend-name.onrender.com/api/health
```

Should return:
```json
{"status":"ok","message":"Backend server is running"}
```

### Socket.io for Global Chat:

Socket.io bhi same server pe chalega. Frontend ko backend URL update karni hogi:
- Development: `http://localhost:3001`
- Production: `https://your-backend-name.onrender.com`

Frontend `GlobalChat.jsx` mein socket connection update karo:
```javascript
socketRef.current = io('https://your-backend-name.onrender.com')
```

