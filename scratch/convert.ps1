Add-Type -AssemblyName System.Drawing
$filePath = (Get-Item 'assets/apple-logo.jpg').FullName
$outPath = (Get-Item 'assets').FullName + '\apple-logo.png'
$bmp = New-Object System.Drawing.Bitmap($filePath)
$bmp.MakeTransparent([System.Drawing.Color]::White)
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "SUCCESS_CONVERT"
