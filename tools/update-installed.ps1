<#
.SYNOPSIS
  把当前目录的插件重新打包并装进指定 DSH profile（真实目录形态）。

.DESCRIPTION
  比 link: 方式更干净的安装形态：
    - 用 pnpm pack 打成 tarball，放到 <profile>\vendor\
    - 依赖声明为 file:vendor\<name>-<version>.tgz
    - 该 profile 的 pnpm-workspace.yaml 里是 nodeLinker: hoisted，
      所以 pnpm 会把包**解压成真实目录**放进 <profile>\node_modules\<name>
  好处：
    - 不产生软链 → Node 不会因「解析真实路径」而找不到 @deepseek-ai/*
    - 插件源码目录**不再被 profile 引用**，可以随便移动/删除
  代价：源码改动不会自动生效，必须重新跑本脚本。

.PARAMETER Profile
  profile 名，默认 desktop。

.PARAMETER ProfilePath
  直接指定 profile 目录，优先于 -Profile。

.EXAMPLE
  # 在插件源码目录里（已 tsc 编译出 lib/）
  .\update-installed.ps1
#>
[CmdletBinding()]
param(
  [string]$Profile = 'desktop',
  [string]$ProfilePath
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "    $Message" -ForegroundColor Green }
function Write-Err2([string]$Message) { Write-Host "    $Message" -ForegroundColor Red }

if (-not $ProfilePath) { $ProfilePath = Join-Path $env:USERPROFILE ".dsh\profiles\$Profile" }
if (-not (Test-Path (Join-Path $ProfilePath 'package.json'))) {
  Write-Err2 "profile 目录不存在或不是 DSH profile：$ProfilePath"
  exit 1
}

$PluginDir = $PSScriptRoot
# 脚本可能放在 tools\ 子目录里（发布包就是这种布局），所以向上找含 package.json 的那一层
for ($i = 0; $i -lt 3; $i++) {
  if (Test-Path (Join-Path $PluginDir 'package.json')) { break }
  $parent = Split-Path $PluginDir -Parent
  if (-not $parent -or $parent -eq $PluginDir) { break }
  $PluginDir = $parent
}
Write-Step "插件目录：$PluginDir"
Write-Step "目标 profile：$ProfilePath"

# 校验编译产物
if (-not (Test-Path (Join-Path $PluginDir 'lib\index.js'))) {
  Write-Err2 '找不到 lib\index.js —— 先编译（tsc -p tsconfig.json）再跑本脚本。'
  exit 1
}

$pkg = Get-Content (Join-Path $PluginDir 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$name = $pkg.name
$version = $pkg.version
Write-Ok "包：$name@$version"

# 定位 node / pnpm
$runtimes = Join-Path $env:USERPROFILE '.dsh\dsh-runtimes\dsh-primary-runtime\dependencies'
$nodeExe = Join-Path $runtimes 'node\bin\node.exe'
if (-not (Test-Path $nodeExe)) {
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $cmd) { Write-Err2 '找不到 node。'; exit 1 }
  $nodeExe = $cmd.Source
}
$pnpmScript = Join-Path $runtimes 'pnpm\bin\pnpm.mjs'
if (-not (Test-Path $pnpmScript)) {
  $cmd = Get-Command pnpm -ErrorAction SilentlyContinue
  if (-not $cmd) { Write-Err2 '找不到 pnpm。'; exit 1 }
  $pnpmScript = $cmd.Source
}
Write-Ok "node：$nodeExe"
Write-Ok "pnpm：$pnpmScript"

# 打 tarball 到 profile 的 vendor/ —— tarball 必须留在 profile 内，
# 因为 package.json 里记的是相对 profile 的 file: 路径
$vendor = Join-Path $ProfilePath 'vendor'
New-Item -ItemType Directory -Path $vendor -Force | Out-Null
Write-Step 'pnpm pack'
Push-Location $PluginDir
try {
  if ($pnpmScript -like '*.mjs' -or $pnpmScript -like '*.cjs') { & $nodeExe $pnpmScript pack --pack-destination $vendor }
  else { & $pnpmScript pack --pack-destination $vendor }
  $packExit = $LASTEXITCODE
} finally { Pop-Location }
if ($packExit -ne 0) { Write-Err2 "pnpm pack 失败（exit $packExit）"; exit $packExit }

$tgzName = "$name-$version.tgz"
if (-not (Test-Path (Join-Path $vendor $tgzName))) { Write-Err2 "没生成 $vendor\$tgzName"; exit 1 }
Write-Ok "tarball：vendor\$tgzName"

# 备份 + 安装
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item (Join-Path $ProfilePath 'package.json') (Join-Path $ProfilePath "package.json.bak-$stamp") -Force
Write-Ok "已备份：package.json.bak-$stamp"

Write-Step 'pnpm add（更新依赖声明并落地）'
Push-Location $ProfilePath
try {
  $spec = "file:vendor/$tgzName"
  if ($pnpmScript -like '*.mjs' -or $pnpmScript -like '*.cjs') { & $nodeExe $pnpmScript add $spec }
  else { & $pnpmScript add $spec }
  $addExit = $LASTEXITCODE
} finally { Pop-Location }
if ($addExit -ne 0) { Write-Err2 "pnpm add 失败（exit $addExit）"; exit $addExit }

# 结果确认
$installed = Join-Path $ProfilePath "node_modules\$name"
Write-Step '结果确认'
if (-not (Test-Path $installed)) { Write-Err2 "没看到 $installed"; exit 1 }
$item = Get-Item $installed -Force
if ($item.LinkType) { Write-Ok "注意：落地形态是 $($item.LinkType)（期望真实目录）" }
else { Write-Ok "落地为真实目录：$installed" }
$installedVersion = (Get-Content (Join-Path $installed 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json).version
Write-Ok "已安装版本：$installedVersion"

# bundles 条目
$profilePkg = Get-Content (Join-Path $ProfilePath 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if ($profilePkg.dsh.profile.bundles -contains $name) { Write-Ok 'bundles 里有该条目' }
else { Write-Err2 "bundles 里**没有** $name —— 加载器不会加载它，请手工加到 dsh.profile.bundles" }

Write-Host ''
Write-Host '完成。重载 profile 或重启 DeepSeek Harness 后生效。' -ForegroundColor Green
