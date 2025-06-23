# Test thêm bài viết mới qua API Gateway
$uri = "http://localhost:3000/api/posts"

# Cấu hình encoding cho console
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# Dữ liệu bài viết mới
$postBody = @{
    title = "Tiêu đề bài viết mới " + (Get-Date -Format "HHmmss")
    content = "Nội dung bài viết mới với các ký tự tiếng Việt có dấu. Đây là nội dung chi tiết của bài viết."
    image_url = "https://example.com/image.jpg"
    tags = @("test", "api", "demo")
    author_id = 1
    category_id = 1
    status = "published"
} | ConvertTo-Json -Depth 10 -Compress

# Chuyển đổi sang byte array UTF-8
$postBytes = [System.Text.Encoding]::UTF8.GetBytes($postBody)
$postData = [System.Text.Encoding]::UTF8.GetString($postBytes)

# Gửi request
Write-Host "Sending POST request to $uri"
Write-Host "Request body: $postData"

try {
    $headers = @{
        "Content-Type" = "application/json; charset=utf-8"
    }
    
    $response = Invoke-RestMethod -Uri $uri -Method Post -Body $postData -Headers $headers -ContentType "application/json; charset=utf-8" -Verbose
    
    Write-Host "Response:" -ForegroundColor Green
    $response | Format-List | Out-String
    
    # In ra ID của bài viết vừa tạo
    if ($response.success -and $response.data -and $response.data.id) {
        $postId = $response.data.id
        Write-Host "Bài viết đã được tạo thành công với ID: $postId" -ForegroundColor Green
        
        # Lấy thông tin chi tiết bài viết vừa tạo
        Write-Host "`nLấy thông tin chi tiết bài viết..."
        $getUri = "http://localhost:3000/api/posts/$postId"
        $postDetail = Invoke-RestMethod -Uri $getUri -Method Get
        
        Write-Host "`nThông tin chi tiết bài viết:" -ForegroundColor Cyan
        $postDetail.data | Format-List | Out-String
    }
} catch {
    Write-Host "Lỗi khi gọi API:" -ForegroundColor Red
    Write-Host "Status code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Message: $($_.ErrorDetails.Message)" -ForegroundColor Red
    
    # In ra thông tin lỗi chi tiết nếu có
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}
