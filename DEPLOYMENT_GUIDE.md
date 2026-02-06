# ResuMate Deployment Guide

Complete step-by-step guide to deploy ResuMate to production.

## Phase 1: MongoDB Atlas Setup ✅

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" or Sign Up
3. Create account with email
4. Verify email

### Step 2: Create Cluster
1. Click "Create" on the dashboard
2. Select "Shared Clusters" (Free tier)
3. Choose cloud provider: **AWS**
4. Select region: **US East** (or closest to you)
5. Click "Create Cluster" (takes 1-3 minutes)

### Step 3: Create Database User
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. **Username**: `resumate_user`
4. **Password**: Generate secure password, copy it somewhere safe
5. Click "Add User"

### Step 4: Add IP Whitelist
1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go back to "Databases" and click "Connect"
2. Select "Connect your application"
3. Copy the connection string
4. Replace:
   - `<username>` → `resumate_user`
   - `<password>` → Your password
   - `myFirstDatabase` → `resumate`

**Example:**
```
mongodb+srv://resumate_user:your_password_here@cluster0.xxxxx.mongodb.net/resumate?retryWrites=true&w=majority
```

---

## Phase 2: Backend Deployment (Railway) ✅

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Get Started" or Sign up with GitHub
3. Connect your GitHub account

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your ResuMate repository
4. Click "Deploy"

### Step 3: Configure Environment Variables
In Railway dashboard for your backend service:

1. Go to "Variables" tab
2. Add these variables:

```
DATABASE_URL=mongodb+srv://resumate_user:your_password@cluster0.xxxxx.mongodb.net/resumate?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here_make_it_long_and_random
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-url.vercel.app
BASE_URL=https://your-backend-railway-url.up.railway.app
```

### Step 4: Set Build Command
In Railway settings:
- **Build Command**: `npm install`
- **Start Command**: `cd backend && npm install && npm run dev`

### Step 5: Get Your Backend URL
- Railway will assign a URL like: `https://resumate-backend-prod-up.railway.app`
- Save this for frontend configuration

---

## Phase 3: Frontend Deployment (Vercel) ✅

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize GitHub

### Step 2: Import Project
1. Click "New Project"
2. Select your ResuMate repository
3. Click "Import"

### Step 3: Configure Environment Variables
1. Go to "Environment Variables"
2. Add:

```
VITE_API_URL=https://your-backend-railway-url.up.railway.app/api
```

Replace with your actual Railway backend URL

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment to complete (2-5 minutes)
3. Your frontend URL will be assigned

**You should now have:**
- Frontend: `https://resumate.vercel.app`
- Backend: `https://resumate-backend.up.railway.app`

---

## Phase 4: Configure CORS & URLs

### Backend (.env)
```env
CORS_ORIGIN=https://your-frontend-vercel-url
BASE_URL=https://your-backend-railway-url
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-railway-url/api
```

---

## Phase 5: Test Deployment

### Test Backend API
Open in browser or Postman:
```
https://your-backend-url/api
```
Should see: `{ "status": "ok", "service": "resumate-node-api" }`

### Test Frontend
Visit: `https://your-frontend-url`
- Should load without errors
- Check browser console (F12) for API connection issues

### Test Key Features
1. ✅ Sign up and login
2. ✅ Upload resume
3. ✅ View resume analysis
4. ✅ See matched jobs
5. ✅ Browse jobs listing

---

## Phase 6: Troubleshooting

### "Failed to fetch" errors
- Check VITE_API_URL in frontend
- Check CORS_ORIGIN in backend
- Verify backend is running on Railway

### MongoDB Connection Failed
- Check DATABASE_URL is correct
- Verify IP whitelist includes 0.0.0.0/0
- Check username/password are correct

### Gemini API Not Working
- The system falls back to simple parsing automatically
- Add GEMINI_API_KEY if you have one
- Feature works with or without it

### Resume Upload Fails
- Check backend logs on Railway
- Verify file size is under 5MB
- Try different file format (PDF, DOC)

---

## Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Connection string copied
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Backend deployed successfully
- [ ] Vercel project created
- [ ] Frontend environment variables set
- [ ] Frontend deployed successfully
- [ ] Both URLs configured in each service
- [ ] API connectivity tested
- [ ] Resume upload tested
- [ ] Job matching tested
- [ ] User authentication tested

---

## Monitoring & Maintenance

### View Logs
- **Railway**: Click service → "Logs" tab
- **Vercel**: Click project → "Functions" tab

### Rebuild & Redeploy
- **Railway**: Push to GitHub (auto-redeploys)
- **Vercel**: Push to GitHub (auto-redeploys)

### Database Backups
- MongoDB Atlas automatically backs up daily
- Access backups in Atlas → Backups tab

---

## Support

If you encounter issues:
1. Check logs on Railway and Vercel
2. Verify all environment variables
3. Ensure MongoDB IP whitelist is correct
4. Clear browser cache and localStorage
5. Try incognito/private browsing mode

---

**Your ResuMate application is now live! 🚀**
