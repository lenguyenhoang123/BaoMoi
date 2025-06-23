# URL của Auth Service (giả định là chạy trên port 3003)
$authUrl = "http://localhost:3003/api/auth"

# Thông tin đăng nhập
$loginData = @{
    username = "admin"  # Thay bằng username thực tế
    password = "123456"  # Thay bằng mật khẩu thực tế
} | ConvertTo-Json

try {
    # 1. Đăng nhập để lấy token
    Write-Host "1. Đăng nhập để lấy token..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$authUrl/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $response.access_token
    
    if (-not $token) {
        throw "Không thấy token trong phản hồi đăng nhập"
    }
    
    Write-Host "  ✔ Đăng nhập thành công" -ForegroundColor Green
    
    # Tạo headers với token xác thực
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # 2. Lấy danh sách categories để kiểm tra kết nối
    Write-Host "`n2. Kiểm tra kết nối đến Categories Service..." -ForegroundColor Cyan
    $categories = Invoke-RestMethod -Uri "http://localhost:3009/api/categories" -Method Get -Headers $headers
    Write-Host "  ✔ Kết nối thành công, tổng số categories: $($categories.length)" -ForegroundColor Green
    
    # 3. Thử tạo category mới
    Write-Host "`n3. Thử tạo category mới..." -ForegroundColor Cyan
    $categoryData = @{
        name = "Công nghệ Test " + (Get-Date -Format "HHmmss")
        description = "Chuyên mục về công nghệ test"
        is_active = $true
    } | ConvertTo-Json
    
    $newCategory = Invoke-RestMethod -Uri "http://localhost:3009/api/categories" -Method Post -Body $categoryData -Headers $headers -ContentType "application/json"
    Write-Host "  ✔ Đã tạo category thành công với ID: $($newCategory.id)" -ForegroundColor Green
    
    # 4. Kiểm tra kết nối đến Posts Service
    Write-Host "`n4. Kiểm tra kết nối đến Posts Service..." -ForegroundColor Cyan
    $posts = Invoke-RestMethod -Uri "http://localhost:3002/api/posts" -Method Get -Headers $headers
    Write-Host "  ✔ Kết nối thành công, tổng số bài viết: $($posts.total || 0)" -ForegroundColor Green
    
    # 5. Thử tạo bài viết mới
    Write-Host "`n5. Thử tạo bài viết mới..." -ForegroundColor Cyan
    $postData = @{
        title = "Bài viết test " + (Get-Date -Format "HH:mm:ss")
        content = "Đây là nội dung bài viết test..."
        status = "draft"
        category_id = $newCategory.id
        tags = @("test", "integration")
    } | ConvertTo-Json
    
    $newPost = Invoke-RestMethod -Uri "http://localhost:3002/api/posts" -Method Post -Body $postData -Headers $headers -ContentType "application/json"
    Write-Host "  ✔ Đã tạo bài viết thành công với ID: $($newPost.id)" -ForegroundColor Green
    
    # 6. Hiển thị thông tin bài viết vừa tạo
    $postDetail = Invoke-RestMethod -Uri "http://localhost:3002/api/posts/$($newPost.id)" -Method Get -Headers $headers
    
    Write-Host "`nThông tin bài viết vừa tạo:" -ForegroundColor Yellow
    $postDetail | Format-List id, title, status, @{Name="category"; Expression={$_.category.name}}
    
    Write-Host "`nKiểm tra thành công!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Có lỗi xảy ra:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Hiển thị chi tiết lỗi nếu có
    if($_.ErrorDetails.Message) {
        Write-Host "Chi tiết lỗi:" -ForegroundColor Red
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorDetails) {
            $errorDetails | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Red
        } else {
            $_.ErrorDetails.Message | Write-Host -ForegroundColor Red
        }
    }
}
