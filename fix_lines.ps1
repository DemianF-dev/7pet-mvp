
$filePath = "backend/src/controllers/managementController.ts"
$content = Get-Content $filePath -Raw
$joined = 'const endDate = end ? new Date(start as string) : new Date();        const [invoices, orders] = await Promise.all(['
# Actually I need the exact string from view_file:
# 293:         const endDate = end ? new Date(end as string) : new Date();        const [invoices, orders] = await Promise.all([

$target = 'const endDate = end \? new Date\(end as string\) : new Date\(\);        const \[invoices, orders\] = await Promise\.all\(\['
$replacement = "const endDate = end ? new Date(end as string) : new Date();`r`n        const [invoices, orders] = await Promise.all(["

$newContent = $content -replace $target, $replacement
Set-Content $filePath $newContent -NoNewline
Write-Host "Fix completed"
