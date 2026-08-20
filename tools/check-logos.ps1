$dir = Join-Path $PSScriptRoot '..\frontend\public\logos'
Get-ChildItem $dir | ForEach-Object {
  $b = [System.IO.File]::ReadAllBytes($_.FullName)
  $hex = ($b[0..7] | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
  $kind = 'unknown'
  if ($hex -like '89 50 4E 47*') { $kind = 'PNG' }
  elseif ($hex -like 'FF D8 FF*') { $kind = 'JPEG' }
  elseif ($hex -like '00 00 01 00*') { $kind = 'ICO' }
  elseif ($hex -like '3C 73 76 67*' -or $hex -like '3C 3F 78 6D*') { $kind = 'SVG' }
  elseif ($hex -like '47 49 46*') { $kind = 'GIF' }
  Write-Host "$($_.Name)  $kind  $hex"
}
