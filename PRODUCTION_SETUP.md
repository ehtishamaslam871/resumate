# ResuMate - Production URLs & Configuration

## 🌐 After Deployment (Fill in your actual URLs)

### Frontend
```
Production URL: https://your-app.vercel.app
Development URL: http://localhost:5173
```

### Backend
```
Production URL: https://your-backend.up.railway.app
Development URL: http://localhost:5000
API Base: https://your-backend.up.railway.app/api
```

### Database
```
MongoDB Atlas URL: mongodb+srv://resumate_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/resumate
```

---

## 🔑 Credentials Template

### MongoDB Atlas
```
Username: resumate_user
Password: [Generate strong password in MongoDB]
Database: resumate
Cluster: cluster0 (or your cluster name)
```

### Gemini API (Optional)
```
API Key: [Get from Google AI Studio if needed]
Model: gemini-pro (with fallback)
```

### JWT Secret
```
JWT_SECRET: [Generate random string, min 32 chars]
Example: aB3$kL9@mN2^xY8&pQ4!wR6#vS1%tU5*zX
```

---

## 🚀 Environment Variables Checklist

### Backend (Railway)
- [ ] MONGODB_URI = Full connection string from MongoDB Atlas
- [ ] JWT_SECRET = Random secure string
- [ ] GEMINI_API_KEY = (Optional) from Google AI Studio
- [ ] NODE_ENV = production
- [ ] PORT = 5000
- [ ] CORS_ORIGIN = Your Vercel frontend URL
- [ ] BASE_URL = Your Railway backend URL

### Frontend (Vercel)
- [ ] VITE_API_URL = Your Railway backend URL with /api

---

## 📋 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/profile
```

### Resume
```
POST /api/resume/upload
GET /api/resume/:id
GET /api/resume
DELETE /api/resume/:id
PUT /api/resume/:id
```

### Job Matching
```
GET /api/matching/resume/:resumeId
```

### Jobs
```
GET /api/jobs
GET /api/jobs/:id
POST /api/jobs (recruiter only)
PUT /api/jobs/:id (recruiter only)
DELETE /api/jobs/:id (recruiter only)
```

### Applications
```
POST /api/applications
GET /api/applications
GET /api/applications/:id
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All code is committed to GitHub
- [ ] No sensitive credentials in code
- [ ] .env file is in .gitignore
- [ ] Dependencies are installed
- [ ] Local testing is successful

### MongoDB Atlas
- [ ] Account created and verified
- [ ] Free tier cluster deployed
- [ ] Database user created
- [ ] IP whitelist includes 0.0.0.0/0
- [ ] Connection string copied

### Railway
- [ ] Account created with GitHub
- [ ] Repository authorized
- [ ] Environment variables added
- [ ] Build command configured
- [ ] Deployment completed
- [ ] Backend URL noted

### Vercel
- [ ] Account created with GitHub
- [ ] Repository imported
- [ ] VITE_API_URL environment variable set
- [ ] Deployment completed
- [ ] Frontend URL noted

### Configuration
- [ ] Backend CORS_ORIGIN updated to Vercel URL
- [ ] Backend BASE_URL updated to Railway URL
- [ ] Frontend VITE_API_URL points to Railway
- [ ] Both services redeployed with new URLs

### Testing
- [ ] Frontend loads without errors
- [ ] API connectivity works (check console)
- [ ] User can login/signup
- [ ] Resume upload works
- [ ] Resume analysis displays correctly
- [ ] Matched jobs appear
- [ ] No console errors

---

## 🔍 Post-Deployment Verification

### Test Login Flow
1. Visit frontend URL
2. Click "Auth" or signup button
3. Create test account
4. Login with credentials
5. Should redirect to upload page

### Test Resume Upload
1. Go to Upload page
2. Select PDF resume
3. Click upload
4. Wait for analysis
5. Should see score and details

### Test Job Matching
1. Scroll down on Analysis page
2. Should see "Matched Jobs" section
3. Jobs should have match percentages
4. Click "View Details" on a job

### Test Backend API
Use Postman or browser:
```
GET https://your-backend.up.railway.app/api
Response: { "status": "ok", "service": "resumate-node-api" }
```

---

## 🛠️ Monitoring & Maintenance

### View Logs
- **Railway**: Dashboard → Select backend service → Logs tab
- **Vercel**: Dashboard → Select project → Functions tab

### Monitor Performance
- **Railway**: Deployment section shows build status
- **Vercel**: Analytics section shows page performance

### Database Health
- **MongoDB**: Atlas dashboard → Monitoring section

### Auto-Redeploy on Code Push
- Both Railway and Vercel watch GitHub
- Push to main branch triggers auto-deployment
- Check deployment status in their dashboards

---

## 📧 Error Handling

### If Frontend Returns Error
1. Check browser console (F12)
2. Check VITE_API_URL is correct
3. Verify backend is running
4. Check network tab for failed requests

### If Backend Returns Error
1. View logs on Railway
2. Check all environment variables are set
3. Verify MongoDB connection string
4. Check database user password

### If Job Matching Returns Empty
1. Ensure resume has 3+ skills detected
2. Verify Job collection isn't empty
3. Check matching score threshold (30%)
4. Review backend logs for errors

---

## 🎓 Learning Resources

### Deployment
- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com

### API Testing
- Postman: https://www.postman.com
- Insomnia: https://insomnia.rest

### Debugging
- VS Code Remote Debugging
- Chrome DevTools
- Railway Log Streaming

---

## 💾 Backup & Recovery

### Database Backups
MongoDB Atlas automatically backs up daily. To restore:
1. Atlas Dashboard → Backups
2. Select backup date
3. Click "Restore"

### Code Backups
Your code is safe in GitHub. To restore:
1. All changes are committed
2. Can rollback any deployment
3. GitHub Actions available

---

## 🚀 Performance Tips

1. **Frontend**
   - Enable Vercel analytics
   - Monitor Lighthouse scores
   - Optimize images

2. **Backend**
   - Monitor Railway logs
   - Set up error tracking
   - Use database indexes

3. **Database**
   - MongoDB Atlas monitoring
   - Set up alerts
   - Regular backups

---

## 📞 Getting Help

1. **Check Deployment Guide**: DEPLOYMENT_GUIDE.md
2. **Review Logs**: Railway & Vercel dashboards
3. **Test API**: Use Postman with your URLs
4. **Browser Console**: F12 to see frontend errors
5. **GitHub Issues**: Document problems for future reference

---

## 🎉 You're Live!

Once all checks pass, your ResuMate app is ready for users! 

**Share your production URLs:**
- 🌐 Frontend: `https://your-app.vercel.app`
- 🔌 Backend: `https://your-backend.railway.app`
- 📊 Database: MongoDB Atlas (private)

---

**Good luck! 🚀**
