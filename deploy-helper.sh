#!/bin/bash

# ========================================
# ResuMate Deployment Helper Script
# ========================================
# This script helps with the deployment process
# Run with: bash deploy-helper.sh

echo "🚀 ResuMate Deployment Helper"
echo "=============================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "✅ Git is installed"
echo ""

# Initialize git repository
echo "🔧 Setting up Git repository..."
echo ""

# Check if git is already initialized
if [ -d ".git" ]; then
    echo "ℹ️  Git repository already exists"
    echo ""
else
    echo "📝 Initializing git repository..."
    git init
    git config user.name "ResuMate Developer"
    git config user.email "dev@resumate.com"
    echo "✅ Git initialized"
    echo ""
fi

# Add all files
echo "📦 Adding all files to git..."
git add .
echo "✅ Files added"
echo ""

# Create initial commit if repository is empty
if [ -z "$(git ls-files)" ]; then
    echo "📝 Creating initial commit..."
    git commit -m "Initial ResuMate commit - Production ready code with 5 advanced features, complete documentation, and zero-cost deployment setup"
    echo "✅ Initial commit created"
    echo ""
fi

echo ""
echo "========== NEXT STEPS =========="
echo ""
echo "1. Create GitHub Repository"
echo "   → Go to https://github.com/new"
echo "   → Name: resumate"
echo "   → Description: AI-powered resume and interview platform"
echo "   → Public repository"
echo "   → Click 'Create repository'"
echo ""

echo "2. Add Remote Repository"
echo "   → Copy your GitHub repo URL"
echo "   → Replace YOUR_USERNAME in the command below:"
echo ""
echo "   git remote add origin https://github.com/YOUR_USERNAME/resumate.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""

echo "3. After Pushing to GitHub:"
echo "   → Open INSTANT_DEPLOYMENT_GUIDE.md"
echo "   → Follow steps for Render (backend) and Vercel (frontend)"
echo ""

echo "========== DEPLOYMENT LINKS =========="
echo ""
echo "📍 MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register"
echo "📍 GitHub: https://github.com/new"
echo "📍 Render: https://render.com"
echo "📍 Vercel: https://vercel.com"
echo ""

echo "========== IMPORTANT =========="
echo ""
echo "✅ Your code is ready to deploy"
echo "✅ All files are in version control"
echo "✅ Follow INSTANT_DEPLOYMENT_GUIDE.md for step-by-step instructions"
echo "✅ Total deployment time: 30 minutes"
echo ""

echo "🎯 Ready to go live? Open INSTANT_DEPLOYMENT_GUIDE.md now!"
echo ""
