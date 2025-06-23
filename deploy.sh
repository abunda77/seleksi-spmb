#!/bin/bash

# Script deployment untuk aplikasi Seleksi SPMB
# Pastikan sudah setup proxy di web server sebelum menjalankan script ini

echo "🚀 Starting deployment process..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Build aplikasi
echo "🔨 Building application..."
npm run build

# 3. Check if build successful
if [ -d "dist" ]; then
    echo "✅ Build successful!"
    echo "📁 Build files are in 'dist' folder"
    echo ""
    echo "📋 Next steps:"
    echo "1. Upload 'dist' folder contents to your web server"
    echo "2. Make sure proxy is configured (see DEPLOYMENT.md)"
    echo "3. Test the application in production"
    echo ""
    echo "🔗 Proxy endpoints that need to be configured:"
    echo "   /api/* -> https://api.spmb.id/*"
    echo "   /seleksi/* -> https://bantulkab.spmb.id/seleksi/*"
else
    echo "❌ Build failed!"
    exit 1
fi
