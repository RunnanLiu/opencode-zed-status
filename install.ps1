#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$pluginDir = Join-Path $HOME ".config\opencode\plugins"
New-Item -ItemType Directory -Force -Path $pluginDir | Out-Null

$base = "https://raw.githubusercontent.com/RunnanLiu/opencode-zed-status/main"
$files = "zed-bell.js", "zed-title.js"

foreach ($f in $files) {
    $dest = Join-Path $pluginDir $f
    Invoke-WebRequest -Uri "$base/$f" -OutFile $dest
    if ((Get-Item $dest).Length -eq 0) { throw "下载失败: $f" }
    Write-Host "已安装 $f"
}

Write-Host "已安装到 $pluginDir,重启 opencode 生效。"