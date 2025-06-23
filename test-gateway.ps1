# Test API Gateway
$uri = "http://localhost:3000/api/posts"
$body = @{
    title = "Bài viết test từ script"
    content = "Đây là nội dung test từ script"
    author = "Test Script"
    tags = @("test", "script")
} | ConvertTo-Json -Depth 10

try {
    Write-Host "Gửi yêu cầu đến: $uri"
    Write-Host "Nội dung gửi đi:"
    $body
    
    $response = Invoke-WebRequest -Uri $uri -Method Post -Body $body -ContentType "application/json" -UseBasicParsing
    
    Write-Host "`nPhản hồi nhận được:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "`nLỗi khi gửi yêu cầu:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails) { 
        Write-Host "Chi tiết lỗi:"
        $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10
    }
}
