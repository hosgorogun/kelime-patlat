Add-Type -AssemblyName System.Drawing
$filePath = (Get-Item 'assets/apple-logo.png').FullName
$bmp = New-Object System.Drawing.Bitmap($filePath)

$minX = $bmp.Width
$maxX = 0
$minY = $bmp.Height
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.A -gt 10) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1

$cropped = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($cropped)
$rectSrc = New-Object System.Drawing.Rectangle($minX, $minY, $w, $h)
$rectDst = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$g.DrawImage($bmp, $rectDst, $rectSrc, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()
$bmp.Dispose()

# En-boy oranını koruyarak 512x512 yapıyoruz
$finalBmp = New-Object System.Drawing.Bitmap(512, 512, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($finalBmp)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$targetRect = New-Object System.Drawing.Rectangle(0, 0, 512, 512)
$g2.DrawImage($cropped, $targetRect)
$g2.Dispose()
$cropped.Dispose()

$finalBmp.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Dispose()

Write-Host "TRIM_AND_FIT_SUCCESS"
