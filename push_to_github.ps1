# Git Initialization and Push Script for https://github.com/Ankush-learning/cc-lab-eval-1

Write-Host "🚀 Initializing Git repository..." -ForegroundColor Cyan
Set-Location -Path "d:\microservice-lab"

git init
git branch -M main

Write-Host "🔗 Adding remote repository..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin https://github.com/Ankush-learning/cc-lab-eval-1.git

Write-Host "📦 Staging files..." -ForegroundColor Cyan
git add .

Write-Host "💾 Creating commit..." -ForegroundColor Cyan
git commit -m "Complete CC Lab Evaluation 1: 3 Containerized Microservices, Docker Compose, Workload Benchmarks & Presentation"

Write-Host "⬆️ Pushing to GitHub (main branch)..." -ForegroundColor Cyan
git push -u origin main --force

Write-Host "✅ Successfully pushed to https://github.com/Ankush-learning/cc-lab-eval-1" -ForegroundColor Green
