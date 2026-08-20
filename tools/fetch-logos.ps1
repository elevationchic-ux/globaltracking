# One-off: downloads real carrier logos (Google favicon service, 128px PNG)
$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot '..\frontend\public\logos'
New-Item -ItemType Directory -Force -Path $out | Out-Null

$map = [ordered]@{
  'dhl'        = 'dhl.com'
  'ups'        = 'ups.com'
  'fedex'      = 'fedex.com'
  'usps'       = 'usps.com'
  'canadapost' = 'canadapost.ca'
  'royalmail'  = 'royalmail.com'
  'laposte'    = 'laposte.fr'
  'dpd'        = 'dpd.com'
  'postnl'     = 'postnl.nl'
  'gls'        = 'gls-group.eu'
}

foreach ($name in $map.Keys) {
  $domain = $map[$name]
  $file = Join-Path $out "$name.png"
  curl.exe -sL "https://www.google.com/s2/favicons?domain=$domain&sz=128" -o $file --max-time 20
  $size = (Get-Item $file).Length
  $head = ([System.IO.File]::ReadAllBytes($file)[0..2] | ForEach-Object { '{0:X2}' -f $_ }) -join ' '
  Write-Host "$name <- $domain : $size bytes [$head]"
}
