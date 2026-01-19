#!/bin/bash
# ResuMate - Setup for GitHub (Run this in your project root)

echo "🚀 ResuMate GitHub Setup"
echo "========================"

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📝 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit - ResuMate University Project

This is a complete university project featuring:
- AI-powered resume and interview platform
- User authentication and role-based access
- Job search with advanced filters
- Application management
- Resume upload and storage
- Real-time notifications
- Admin dashboard
- Professional deployment on free tier

Features:
- MongoDB for data storage
- Node.js/Express backend API (40+ endpoints)
- React frontend with Vite
- Email notifications
- Cloud storage integration
- WebSocket real-time updates
- Security: JWT, bcrypt, CORS, helmet

Deployment:
- Frontend: Vercel (Free)
- Backend: Render (Free)
- Database: MongoDB Atlas (Free)
- Cost: \$0/month forever"

echo ""
echo "✅ Git repository ready!"
echo ""
echo "📖 Next steps:"
echo "1. Create repository on GitHub.com"
echo "2. Go to https://github.com/new"
echo "3. Name it 'resumate'"
echo "4. Run the commands GitHub shows you:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/resumate.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "Done! Your code is now on GitHub 🎉"
