#!/usr/bin/env pwsh
Write-Host "Updating CPU image DB paths to generated product thumbs..."
$productsPath = Join-Path -Path (Get-Location) -ChildPath "frontend/public/products"
if (-not (Test-Path $productsPath)) { Write-Error "Products folder not found: $productsPath"; exit 2 }

Get-ChildItem -Directory $productsPath | ForEach-Object {
    $slug = $_.Name
    $thumb = Get-ChildItem -Path $_.FullName -Filter '*-thumb.webp' -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -ne $thumb) {
        Write-Host "Updating DB for slug:" $slug "->" $thumb.Name
        $sql = "UPDATE images SET path = '/products/$slug/$($thumb.Name)' WHERE product_id = (SELECT id FROM products WHERE slug = '$slug') AND path LIKE '/images/unsortedProducts/cpus/%';"
        & docker compose exec -T db psql -U homestead -d homestead -c $sql
    } else {
        Write-Host "No thumb found for $slug - skipping"
    }
}

Write-Host 'Done.'
