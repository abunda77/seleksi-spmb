# Script deployment untuk aplikasi Seleksi SPMB (Windows PowerShell)
# Pastikan sudah setup proxy di web server sebelum menjalankan script ini

Write-Host "🚀 Starting deployment process..." -ForegroundColor Green

# 1. Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# 2. Build aplikasi
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run build

# 3. Check if build successful
if (Test-Path "dist") {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host "📁 Build files are in 'dist' folder" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor White
    Write-Host "1. Upload 'dist' folder contents to your web server" -ForegroundColor White
    Write-Host "2. Make sure proxy is configured (see DEPLOYMENT.md)" -ForegroundColor White
    Write-Host "3. Test the application in production" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Proxy endpoints that need to be configured:" -ForegroundColor Magenta
    Write-Host "   /api/* -> https://api.spmb.id/*" -ForegroundColor White
    Write-Host "   /seleksi/* -> https://bantulkab.spmb.id/seleksi/*" -ForegroundColor White
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}
