# 🆘 QUICK TROUBLESHOOTING GUIDE

## 🔴 PROBLEMS & SOLUTIONS

### Problem 1: Can't Deploy to GitHub

**Error**: "fatal: not a git repository"

**Solution**:
```bash
# Run from your ResuMate folder
cd c:\Users\DAR\Desktop\ResuMate_Final\ResuMate

# Initialize git
git init
git config user.name "Your Name"
git config user.email "your@email.com"

# Add all files
git add .

# Create first commit
git commit -m "Initial ResuMate commit"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/resumate.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

### Problem 2: MongoDB Connection Failed

**Error**: "MongooseError: Cannot connect to MongoDB"

**Likely Cause**: Database URL not set correctly

**Solution**:
1. Go to MongoDB Atlas: https://www.mongodb.com/cloud/atlas
2. Login to your account
3. Click "Connect" on your cluster
4. Select "Drivers"
5. Copy connection string
6. Replace in backend/.env:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resumate?retryWrites=true&w=majority
   ```
7. Replace `username` and `password` with your actual values
8. Make sure you add your IP address to whitelist

---

### Problem 3: Render Deployment Failed

**Error**: "Build failed" or "Deployment failed"

**Solution 1: Check Environment Variables**
```
Go to Render Dashboard
→ Your Service
→ Settings
→ Environment
→ Verify all variables are correct:

MONGODB_URI=[your connection string]
NODE_ENV=production
PORT=10000
JWT_SECRET=[your secret]
```

**Solution 2: Check Logs**
```
Go to Render Dashboard
→ Your Service
→ Logs
→ Look for error messages
→ Fix and redeploy
```

**Solution 3: Restart Service**
```
Go to Render Dashboard
→ Your Service
→ Manual
→ Redeploy latest
```

---

### Problem 4: Vercel Deployment Failed

**Error**: "Build failed" or "Deployment error"

**Solution 1: Fix Environment Variables**
```
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/Fix:
   VITE_API_BASE_URL=https://resumate-backend.onrender.com/api
```

**Solution 2: Check Build Logs**
```
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments
4. Click on failed deployment
5. Check Build logs for errors
```

**Solution 3: Clear Cache and Redeploy**
```
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Git
4. Click "Redeploy"
```

---

### Problem 5: Website Shows 404 Error

**Error**: Page shows "404 Not Found" or blank page

**Likely Cause**: Frontend built incorrectly or API URL wrong

**Solution 1: Check API URL**
```
Open browser console (F12)
Look for errors
Check if API URL is correct:
https://resumate-backend.onrender.com/api

If backend is still sleeping, wait 1-2 minutes and try again
```

**Solution 2: Check if Backend is Running**
```
Go to: https://resumate-backend.onrender.com/api/health
Should see: {"status":"ok"} or similar response

If error, backend isn't running
→ Go to Render dashboard and check logs
```

---

### Problem 6: Login Not Working

**Error**: "Invalid credentials" or "User not found"

**Likely Cause**: Database issue or wrong URL

**Solution**:
```
1. Check if registered successfully
2. Verify email is correct
3. Check if backend is running:
   https://resumate-backend.onrender.com/api/auth/test

4. If backend error, check Render logs
5. If database error, check MongoDB connection string
6. Try registering again with different email
7. Clear browser cache (Ctrl+Shift+Del)
8. Try in incognito window
```

---

### Problem 7: Can't Upload Resume

**Error**: "File upload failed" or "Storage error"

**Likely Cause**: Cloud storage not configured

**Solution 1: If using local storage**
```
Upload should work automatically
Check if uploads/ folder exists in backend
If not, create it: mkdir backend/uploads
```

**Solution 2: If using S3 or Google Cloud**
```
Edit backend/.env:
- Add AWS_ACCESS_KEY_ID
- Add AWS_SECRET_ACCESS_KEY
- Add AWS_BUCKET_NAME

Or:

- Add GOOGLE_PROJECT_ID
- Add GOOGLE_PRIVATE_KEY
- Add GOOGLE_BUCKET_NAME

Then redeploy on Render
```

---

### Problem 8: Slow Website Loading

**Error**: Website takes >3 seconds to load

**Likely Cause**: Free tier services warming up

**Solution**:
```
First 2-3 requests are slow (free tier wakes up)
After that, it's fast

If still slow:
1. Check browser network tab (F12)
2. Identify slow request
3. Check Render dashboard logs
4. Check MongoDB performance
5. Upgrade to paid plan if needed
```

---

### Problem 9: Emails Not Being Sent

**Error**: "Email service error" or emails don't arrive

**Likely Cause**: Email service not configured

**Solution**:
```
Email service is optional
If you want to enable:

1. Add to backend/.env:
   EMAIL_SERVICE=gmail
   EMAIL_USER=your@gmail.com
   EMAIL_PASSWORD=app_password_here

2. Or use SendGrid:
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your_key_here

3. Restart backend on Render
```

---

### Problem 10: Can't Access Admin Dashboard

**Error**: "Access Denied" or "Admin panel not available"

**Solution**:
```
1. Register/login as regular user
2. Go to MongoDB Atlas
3. In "resumate" database
4. Find "users" collection
5. Find your user document
6. Change "role" field from "seeker" to "admin"
7. Logout and login again
8. Admin dashboard should now be accessible
```

---

## 🟡 COMMON ISSUES DURING DEPLOYMENT

### Issue 1: GitHub Says "Remote already exists"

**Error**: "fatal: remote origin already exists"

**Solution**:
```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/resumate.git

# Push
git push -u origin main
```

---

### Issue 2: Render Service Won't Start

**Error**: "Service failed to start" after 30 seconds

**Solution**:
1. Go to Render dashboard
2. Check service logs
3. Look for specific error message
4. Common causes:
   - Wrong MONGODB_URI
   - Missing JWT_SECRET
   - Port already in use (shouldn't happen on Render)
5. Fix .env variables
6. Redeploy

---

### Issue 3: Vercel Build Times Out

**Error**: "Build timed out after 45 minutes"

**Solution**:
```
This is rare on free tier
If happens:
1. Go to Vercel dashboard
2. Settings → Functions
3. Increase memory if needed
4. Or check for infinite loops in code

More likely: GitHub sync issue
→ Manually redeploy from Vercel dashboard
```

---

### Issue 4: MongoDB Connection Drops

**Error**: Intermittent "MongoDB connection lost" errors

**Solution**:
```
1. Go to MongoDB Atlas
2. Click your cluster
3. Network Access
4. Check IP whitelist includes 0.0.0.0/0
5. If not, add it

Also check:
- Connection string is correct
- Database user password is correct (no special characters)
- User has access to database
```

---

### Issue 5: Cannot Find Environment Variables

**Error**: "undefined" values or missing config

**Solution**:
1. Check you set environment variables in:
   - Render dashboard → Settings → Environment
   - Vercel dashboard → Settings → Environment Variables
2. Case-sensitive! Use exact names
3. No quotes around values
4. After setting, REDEPLOY (don't just restart)

---

## 🟢 VERIFICATION CHECKLIST

### If stuck, verify each:

- [ ] GitHub repo created: https://github.com/YOUR_USERNAME/resumate
- [ ] MongoDB account created: https://www.mongodb.com/cloud/atlas
- [ ] MongoDB cluster created and running
- [ ] MongoDB user created with username/password
- [ ] MongoDB IP whitelist includes 0.0.0.0/0
- [ ] MongoDB connection string copied correctly
- [ ] Render account created: https://render.com
- [ ] Render service created and connected to GitHub
- [ ] Render environment variables set correctly
- [ ] Vercel account created: https://vercel.com
- [ ] Vercel project created and connected to GitHub
- [ ] Vercel environment variables set correctly
- [ ] Backend URL in Vercel: https://resumate-backend.onrender.com/api

---

## 🔍 DEBUG MODE

### To enable detailed logging:

**Backend (.env)**:
```
DEBUG=true
LOG_LEVEL=debug
NODE_ENV=development
```

**Then check:**
- Render logs
- MongoDB Atlas logs
- Network requests (F12)

---

## 📞 IF STILL STUCK

1. **Check Render Logs**:
   - Go to Render dashboard
   - Select your service
   - Scroll to "Logs" section
   - Look for error message
   - Search error on Google

2. **Check Vercel Logs**:
   - Go to Vercel dashboard
   - Select project
   - Click "Deployments"
   - Click failed deployment
   - Check build and deployment logs

3. **Check MongoDB Logs**:
   - Go to MongoDB Atlas
   - Click your cluster
   - "Logs" tab
   - Look for connection errors

4. **Test Endpoints Manually**:
   - Use Postman: https://www.postman.com/downloads/
   - Or use browser:
     ```
     https://resumate-backend.onrender.com/api/health
     Should return: {"status":"ok"}
     ```

5. **Clear Everything and Start Over**:
   - If completely stuck
   - Follow INSTANT_DEPLOYMENT_GUIDE.md from scratch
   - Delete Render service and recreate
   - Delete Vercel project and recreate
   - Create new MongoDB cluster

---

## ⚡ QUICK FIXES

### Website Won't Load?
```
1. Wait 2-3 minutes (free tier waking up)
2. Refresh browser (Ctrl+F5)
3. Clear cache (Ctrl+Shift+Del)
4. Try incognito window
```

### Login Not Working?
```
1. Verify email exists
2. Check password is correct
3. Try registering new account
4. Check backend is running:
   https://resumate-backend.onrender.com/api/health
```

### Jobs Won't Show?
```
1. Check backend is running
2. Check MongoDB connection string
3. Try searching without filters
4. Check browser console for errors (F12)
```

### Can't Upload Resume?
```
1. Check file size (<10MB)
2. Check file format (.pdf, .doc, .docx)
3. Check backend is running
4. Check cloud storage credentials (if configured)
```

---

## 📱 BROWSER DEBUGGING

### Open Developer Tools
- **Windows**: Press F12
- **Mac**: Press Cmd+Option+I

### Check for Errors
1. Click "Console" tab
2. Look for red error messages
3. Screenshot the error
4. Copy error message
5. Search error on Google

### Check Network Requests
1. Click "Network" tab
2. Perform action
3. Look for failed requests (red color)
4. Click failed request
5. Check Response tab for error message

### Check Backend Connection
1. Look for requests to:
   ```
   https://resumate-backend.onrender.com/api/...
   ```
2. If 404 or timeout → backend isn't running
3. If 500 → backend error
4. If success (200) → request worked

---

## 🎯 MOST COMMON SOLUTIONS

1. **Website slow?** → Wait 2-3 min, free tier wakes up
2. **Login fails?** → Check backend running at https://resumate-backend.onrender.com/api/health
3. **Jobs won't load?** → Check MongoDB connection string in .env
4. **Upload fails?** → Check file size and format
5. **Deployment fails?** → Check environment variables set correctly
6. **Build times out?** → Redeploy from dashboard
7. **Can't push to GitHub?** → Remove and re-add remote
8. **404 errors?** → Frontend can't find backend, check API URL

---

## ✅ IF EVERYTHING WORKS

Congratulations! Your deployment is successful!

Next steps:
1. Test all features
2. Prepare demo script
3. Share link with supervisor
4. Get A+ grade 🎉

---

**Still stuck?** Open INSTANT_DEPLOYMENT_GUIDE.md and follow step-by-step

**Need help?** Check the specific error in this guide

**Ready to try again?** Delete services and restart from Step 1

**Good luck!** 🚀
