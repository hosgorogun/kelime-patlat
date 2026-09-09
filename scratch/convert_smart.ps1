Add-Type -AssemblyName System.Drawing
$filePath = (Get-Item 'C:/Users/ogo77/.gemini/antigravity/brain/f6e6dc6a-c903-4794-ac4b-6c62545ad181/.user_uploaded/media_1788969694398.jpg').FullName
$outPath = (Get-Item 'assets').FullName + '\apple-logo.png'

$src = New-Object System.Drawing.Bitmap($filePath)
$bmp = New-Object System.Drawing.Bitmap($src.Width, $src.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($y = 0; $y -lt $src.Height; $y++) {
    for ($x = 0; $x -lt $src.Width; $x++) {
        $pixel = $src.GetPixel($x, $y)
        # Siyah elma pikselleri (R,G,B hepsi 100'ün altındaysa amblemdir)
        if ($pixel.R -lt 120 -and $pixel.G -lt 120 -and $pixel.B -lt 120) {
            # Amblemi BEYAZ ve tam Opak yapıyoruz
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        } else {
            # Arka plandaki tüm açık renkleri TAM ŞEFFAF yapıyoruz
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$src.Dispose()
$bmp.Dispose()
Write-Host "SMART_TRANSPARENT_SUCCESS"
