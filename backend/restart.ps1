# Dừng tất cả các tiến trình Node.js
Write-Host "🛑 Đang dừng tất cả services..." -ForegroundColor Yellow
Get-Process | Where-Object { $_.ProcessName -eq 'node' } | Stop-Process -Force

# Chạy lại tất cả services
Write-Host "🚀 Đang khởi động lại services..." -ForegroundColor Green
$env:NODE_ENV="production"
node clean-ports.js
npm start
