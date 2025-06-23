# URL cua cac service
$categoriesUrl = "http://localhost:3009/api/categories"
$postsUrl = "http://localhost:3002/api/posts"

# Function to display categories recursively
function Show-Categories {
    param (
        [Parameter(Mandatory=$true)]
        [array]$Categories,
        [int]$Level = 0
    )
    
    $indent = '  ' * $Level
    
    foreach ($category in $Categories) {
        Write-Host "${indent}- $($category.name) (ID: $($category.id))" -ForegroundColor Green
        
        # Display category properties
        Write-Host "${indent}  Slug: $($category.slug)" -ForegroundColor DarkGray
        Write-Host "${indent}  Description: $($category.description)" -ForegroundColor DarkGray
        
        # Recursively show children
        if ($category.children -and $category.children.Count -gt 0) {
            Write-Host "${indent}  Subcategories:" -ForegroundColor Cyan
            Show-Categories -Categories $category.children -Level ($Level + 2)
        }
    }
}

# Function to make API requests with detailed error handling
function Invoke-ApiRequest {
    param (
        [string]$Url,
        [string]$Method = 'GET',
        $Body = $null
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ErrorAction = 'Stop'
            Headers = @{
                'Content-Type' = 'application/json'
            }
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }
        
        $response = Invoke-RestMethod @params
        
        # Log raw response for debugging
        Write-Host "  [DEBUG] Response from $Url" -ForegroundColor DarkGray
        $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor DarkGray
        
        return $response
    } catch {
        Write-Host "  [ERROR] API Request Failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  Response: $($_.ErrorDetails.Message)" -ForegroundColor DarkGray
        }
        throw $_
    }
}

# 1. Kiem tra ket noi den Categories Service
try {
    Write-Host "1. Kiem tra ket noi den Categories Service..." -ForegroundColor Cyan
    $response = Invoke-ApiRequest -Url $categoriesUrl
    
    if (-not $response.success) {
        throw "API tra ve trang thai that bai: $($response.message)"
    }
    
    $categories = $response.data
    $count = $categories.Count
    
    Write-Host "  [OK] Ket noi thanh cong, tim thay $count danh muc chinh" -ForegroundColor Green
    
    # Hien thi danh sach categories
    Show-Categories -Categories $categories
    
} catch {
    Write-Host "  [ERROR] Khong the lay danh sach categories: $_" -ForegroundColor Red
    Write-Host "  $($_.ScriptStackTrace)" -ForegroundColor DarkGray
}

# 2. Kiem tra ket noi den Posts Service
try {
    Write-Host "`n2. Kiem tra ket noi den Posts Service..." -ForegroundColor Cyan
    $response = Invoke-ApiRequest -Url $postsUrl
    
    if (-not $response.success) {
        throw "API tra ve trang thai that bai: $($response.message)"
    }
    
    $posts = $response.data.items
    $pagination = $response.data.pagination
    $totalPosts = $pagination.total
    
    Write-Host "  [OK] Ket noi thanh cong, tim thay $totalPosts bai viet (trang $($pagination.currentPage)/$($pagination.totalPages))" -ForegroundColor Green
    
    # Hien thi 5 bai viet dau tien
    Write-Host "`n  Danh sach bai viet (hien thi 5/$($posts.Count)):" -ForegroundColor Cyan
    $posts | Select-Object -First 5 | ForEach-Object {
        Write-Host "`n  - $($_.title)" -ForegroundColor Yellow
        Write-Host "    ID: $($_.id)" -ForegroundColor DarkGray
        Write-Host "    Slug: $($_.slug)" -ForegroundColor DarkGray
        Write-Host "    Trang thai: $($_.status)" -ForegroundColor DarkGray
        Write-Host "    Ngay tao: $($_.created_at)" -ForegroundColor DarkGray
        
        # Hien thi tags neu co
        if ($_.tags -and $_.tags.Count -gt 0) {
            $tags = $_.tags -join ", "
            Write-Host "    Tags: $tags" -ForegroundColor DarkCyan
        }
    }
    
    if ($totalPosts -gt 5) {
        Write-Host "`n  ... va $(($totalPosts - 5)) bai viet khac" -ForegroundColor DarkGray
    }
    
} catch {
    Write-Host "  [ERROR] Khong the lay danh sach bai viet: $_" -ForegroundColor Red
    Write-Host "  $($_.ScriptStackTrace)" -ForegroundColor DarkGray
}

Write-Host "`nKiem tra hoan tat!" -ForegroundColor Green
