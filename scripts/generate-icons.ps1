Add-Type -AssemblyName System.Drawing
$iconDirectory = Join-Path $PSScriptRoot '../public/icons'
[IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
$sourcePath = Join-Path $iconDirectory 'rancho-emblem.png'
$source = [Drawing.Bitmap]::FromFile($sourcePath)
try {
  $items = @(
    @{ Name='rancho-192.png'; Size=192; Background='#ffffff'; Scale=0.92 },
    @{ Name='rancho-512.png'; Size=512; Background='#ffffff'; Scale=0.92 },
    @{ Name='rancho-maskable-512.png'; Size=512; Background='#204d3c'; Scale=0.70 },
    @{ Name='apple-touch-icon.png'; Size=180; Background='#ffffff'; Scale=0.92 },
    @{ Name='rancho-favicon.png'; Size=64; Background='#ffffff'; Scale=0.92 }
  )
  foreach ($item in $items) {
    $size=[int]$item.Size
    $bitmap=[Drawing.Bitmap]::new($size,$size,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics=[Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([Drawing.ColorTranslator]::FromHtml($item.Background))
    $draw=[int]($size*[double]$item.Scale);$offset=[int](($size-$draw)/2)
    $graphics.DrawImage($source,$offset,$offset,$draw,$draw)
    $target=Join-Path $iconDirectory $item.Name
    $bitmap.Save($target,[Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose();$bitmap.Dispose()
  }
} finally { $source.Dispose() }
