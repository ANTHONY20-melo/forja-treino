Add-Type -AssemblyName System.Drawing

function New-ForjaIcon {
  param([int]$s, [string]$out)

  $bmp = New-Object System.Drawing.Bitmap($s, $s)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'

  # Fundo: quadrado com gradiente #ff6b35 -> #d946ef
  $rect = New-Object System.Drawing.Rectangle(0, 0, $s, $s)
  $c1 = [System.Drawing.Color]::FromArgb(255, 255, 107, 53)
  $c2 = [System.Drawing.Color]::FromArgb(255, 217, 46, 239)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $c1, $c2, 45)
  $g.FillRectangle($brush, $rect)

  # Halter (dumbbell) branco centralizado
  $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $w = $s * 0.62
  $h = $s * 0.34
  $x = ($s - $w) / 2
  $y = ($s - $h) / 2
  # barra central
  $g.FillRectangle($white, ($x + $w * 0.22), ($y + $h * 0.40), ($w * 0.56), ($h * 0.20))
  # placas grandes (esquerda/direita)
  $g.FillRectangle($white, $x, $y, ($w * 0.14), $h)
  $g.FillRectangle($white, ($x + $w * 0.86), $y, ($w * 0.14), $h)
  # placas menores externas
  $ow = $s * 0.05
  $g.FillRectangle($white, ($x - $ow), ($y + $h * 0.15), $ow, ($h * 0.70))
  $g.FillRectangle($white, ($x + $w), ($y + $h * 0.15), $ow, ($h * 0.70))

  $g.Dispose()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "OK: $out"
}

New-ForjaIcon -s 192 -out (Join-Path $PSScriptRoot 'icon-192.png')
New-ForjaIcon -s 512 -out (Join-Path $PSScriptRoot 'icon-512.png')
