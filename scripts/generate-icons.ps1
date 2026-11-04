Add-Type -AssemblyName System.Drawing
$iconDirectory = Join-Path $PSScriptRoot '../public/icons'
[IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
foreach ($item in @(@('rancho-192.png',192),@('rancho-512.png',512),@('rancho-maskable-512.png',512),@('apple-touch-icon.png',180))) {
  $size = [int]$item[1]
  $bitmap = [Drawing.Bitmap]::new($size,$size)
  $graphics = [Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([Drawing.ColorTranslator]::FromHtml('#204d3c'))
  $graphics.ScaleTransform($size/100.0,$size/100.0)
  if ($item[0] -eq 'rancho-maskable-512.png') {
    $graphics.TranslateTransform(9,9)
    $graphics.ScaleTransform(0.82,0.82)
  }
  $white = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#f0f5e5'))
  $green = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#204d3c'))
  $leaf = [Drawing.SolidBrush]::new([Drawing.ColorTranslator]::FromHtml('#a7c78a'))
  $graphics.FillEllipse($white,22,36,47,28)
  $graphics.FillRectangle($white,31,38,30,25)
  foreach ($coords in @(@(59,44,68,27,80,27,87,43,83,51,68,51),@(68,31,60,26,60,34,68,37),@(80,30,88,26,88,34,81,37),@(28,58,26,78,33,78,38,58),@(55,58,57,78,64,78,63,57),@(23,40,15,37,12,44,13,59,17,64,19,56,17,45,24,47))) {
    $points = for ($i=0;$i -lt $coords.Length;$i+=2) { [Drawing.PointF]::new($coords[$i],$coords[$i+1]) }
    $graphics.FillPolygon($white,[Drawing.PointF[]]$points)
  }
  $graphics.FillEllipse($green,76,36,3.6,3.6)
  $graphics.FillEllipse($leaf,33,19,18,9)
  $bitmap.Save((Join-Path $iconDirectory $item[0]),[Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose();$bitmap.Dispose();$white.Dispose();$green.Dispose();$leaf.Dispose()
}
