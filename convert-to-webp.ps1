# PowerShell script to convert PNG/JPG images to WebP format
# Excludes logo and og-image files
# Uses ImageMagick with lossless quality

$ErrorActionPreference = "Stop"

Set-Location web

Write-Host "🔍 Finding images to convert..." -ForegroundColor Cyan

$script:converted = 0
$script:skipped = 0

# Explicit exclusion list (only og-image)
$excludeFiles = @(
    ".\public\og-image.png"
)

# Find all PNG and JPG files
Get-ChildItem -Recurse -Include *.png,*.jpg,*.jpeg | ForEach-Object {
    $file = $_
    $relativePath = $file.FullName.Replace($PWD.Path + "\", ".\").Replace("/", "\")

    # Check if file is in exclusion list
    $isExcluded = $excludeFiles -contains $relativePath

    # Skip only og-image
    if ($isExcluded) {
        Write-Host "⏭️  Skipping: $relativePath" -ForegroundColor Yellow
        $script:skipped++
        return
    }

    # Output WebP file path
    $webpFile = Join-Path $file.DirectoryName "$($file.BaseName).webp"

    # Skip if WebP already exists
    if (Test-Path $webpFile) {
        Write-Host "✅ Already exists: $webpFile" -ForegroundColor Green
        return
    }

    Write-Host "🔄 Converting: $($file.FullName) -> $webpFile" -ForegroundColor Cyan

    # Convert with lossless quality
    # -quality 100 ensures maximum quality for WebP
    & magick $file.FullName -quality 100 $webpFile

    $script:converted++
}

Write-Host ""
Write-Host "✨ Conversion complete!" -ForegroundColor Green
Write-Host "📊 Converted: $script:converted files" -ForegroundColor Green
Write-Host "⏭️  Skipped: $script:skipped files" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Note: Original PNG/JPG files are preserved. Remove them manually after verifying WebP files." -ForegroundColor Yellow
