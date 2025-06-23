# URL của Categories Service
$categoriesUrl = "http://localhost:3009/api/categories"

# URL của Posts Service
$postsUrl = "http://localhost:3002/api/posts"

# 1. Tạo một category mới
Write-Host "1. Tạo một category mới..." -ForegroundColor Cyan
$categoryData = @{
    name = "Công nghệ"
    slug = "cong-nghe"
    description = "Chuyên mục về công nghệ"
    is_active = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $categoriesUrl -Method Post -Body $categoryData -ContentType "application/json"
    $categoryId = $response.id
    Write-Host "  ✔ Đã tạo category thành công với ID: $categoryId" -ForegroundColor Green
    
    # 2. Tạo một bài viết mới với category vừa tạo
    Write-Host "`n2. Tạo một bài viết mới với category $categoryId..." -ForegroundColor Cyan
    $postData = @{
        title = "Bài viết test về công nghệ mới nhất"
        content = "Đây là nội dung bài viết test về công nghệ..."
        status = "published"
        category_id = $categoryId
        tags = @("công nghệ", "test")
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri $postsUrl -Method Post -Body $postData -ContentType "application/json"
    $postId = $response.id
    Write-Host "  ✔ Đã tạo bài viết thành công với ID: $postId" -ForegroundColor Green
    
    # 3. Lấy thông tin chi tiết bài viết để kiểm tra
    Write-Host "`n3. Lấy thông tin chi tiết bài viết..." -ForegroundColor Cyan
    $postDetail = Invoke-RestMethod -Uri "$postsUrl/$postId" -Method Get
    
    # Hiển thị thông tin category trong bài viết
    Write-Host "`nThông tin bài viết:" -ForegroundColor Yellow
    $postDetail | Format-List id, title, status, @{Name="category"; Expression={$_.category.name}}
    
    Write-Host "`nKiểm tra thành công!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Có lỗi xảy ra:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Hiển thị chi tiết lỗi nếu có
    if($_.ErrorDetails.Message) {
        Write-Host "Chi tiết lỗi:" -ForegroundColor Red
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Red
    }
}
