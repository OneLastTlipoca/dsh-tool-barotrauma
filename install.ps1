#Requires -Version 5.1
<#
.SYNOPSIS
  把 dsh-tool-barotrauma 安装 / 卸载到指定的 DSH profile。

.DESCRIPTION
  做三件事（每步都会先备份）：
    1. 备份 profile 的 package.json 与 pnpm-lock.yaml
    2. 在 package.json 里加/删 link 依赖，并在 dsh.profile.bundles 里加/删条目
    3. 跑 pnpm install 落地

  注意：脚本**不会重启 DSH**。安装完需要重载 profile 或重启 DSH 才生效
  （已加载的模块常驻在宿主进程里，不会自动替换）。

.PARAMETER Profile
  profile 名，默认 desktop。等价于 -ProfilePath "$env:USERPROFILE\.dsh\profiles\<Profile>"。

.PARAMETER ProfilePath
  直接指定 profile 目录，优先于 -Profile。

.PARAMETER Uninstall
  卸载：移除依赖与 bundle 条目。

.PARAMETER DryRun
  只打印会做的改动，不写盘、不跑 pnpm。

.EXAMPLE
  .\install.ps1
  .\install.ps1 -Profile web
  .\install.ps1 -DryRun
  .\install.ps1 -Uninstall
#>
[CmdletBinding()]
param(
  [string]$Profile = 'desktop',
  [string]$ProfilePath,
  [switch]$Uninstall,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$PackageName = 'dsh-tool-barotrauma'
$PluginDir = $PSScriptRoot

function Write-Step([string]$Message) { Write-Host "==> $Message" -ForegroundColor Cyan }
function Write-Ok([string]$Message) { Write-Host "    $Message" -ForegroundColor Green }
function Write-Warn2([string]$Message) { Write-Host "    $Message" -ForegroundColor Yellow }
function Write-Err2([string]$Message) { Write-Host "    $Message" -ForegroundColor Red }

# ── 定位 profile ─────────────────────────────────────────────────────────────
if (-not $ProfilePath) {
  $ProfilePath = Join-Path $env:USERPROFILE ".dsh\profiles\$Profile"
}
if (-not (Test-Path $ProfilePath)) {
  Write-Err2 "profile 目录不存在：$ProfilePath"
  Write-Err2 "可用 profile 列表："
  Get-ChildItem (Join-Path $env:USERPROFILE '.dsh\profiles') -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Write-Err2 "  - $($_.Name)" }
  exit 1
}
$packageJsonPath = Join-Path $ProfilePath 'package.json'
if (-not (Test-Path $packageJsonPath)) {
  Write-Err2 "找不到 $packageJsonPath"
  exit 1
}

Write-Step "目标 profile：$ProfilePath"
Write-Step "插件目录：$PluginDir"

# ── 校验插件本体 ─────────────────────────────────────────────────────────────
$entryPoint = Join-Path $PluginDir 'lib\index.js'
if (-not (Test-Path $entryPoint)) {
  Write-Err2 "找不到 $entryPoint"
  Write-Err2 "这个包不完整（缺少编译产物 lib/）。请使用发布包，或先在源码目录执行 tsc 编译。"
  exit 1
}
Write-Ok "入口文件存在：lib\index.js"

# ── 确保插件目录能解析 @deepseek-ai ─────────────────────────────────────────
# 关键：Node 解析软链时用的是**真实路径**。装成 link: 之后，模块解析会从插件目录
# （而不是 profile 的 node_modules）向上逐层找依赖，所以插件目录自己必须能解析到
# @deepseek-ai/*，否则加载时报 ERR_MODULE_NOT_FOUND: '@deepseek-ai/dsh-tools'。
$peerScope = Join-Path $PluginDir 'node_modules\@deepseek-ai'
if (Test-Path $peerScope) {
  Write-Ok "依赖目录已就绪：node_modules\@deepseek-ai"
} else {
  $peerCandidates = @(
    (Join-Path $ProfilePath 'node_modules\@deepseek-ai'),
    (Join-Path (Split-Path $ProfilePath -Parent) 'node_modules\@deepseek-ai')
  )
  $peerSource = $null
  foreach ($candidate in $peerCandidates) {
    if (Test-Path $candidate) { $peerSource = $candidate; break }
  }
  if ($peerSource) {
    New-Item -ItemType Directory -Path (Join-Path $PluginDir 'node_modules') -Force | Out-Null
    New-Item -ItemType Junction -Path $peerScope -Target $peerSource | Out-Null
    Write-Ok "已把 @deepseek-ai 链进来 → $peerSource"
  } else {
    Write-Warn2 '没找到 @deepseek-ai（DSH 核心包）。插件加载可能失败，请确认 DSH 安装完整。'
  }
}

# ── 定位 node / pnpm ─────────────────────────────────────────────────────────
$runtimes = Join-Path $env:USERPROFILE '.dsh\dsh-runtimes\dsh-primary-runtime\dependencies'
$nodeCandidates = @(
  (Join-Path $runtimes 'node\bin\node.exe'),
  'node'
)
$pnpmCandidates = @(
  (Join-Path $runtimes 'pnpm\bin\pnpm.mjs'),
  (Join-Path $runtimes 'node\node_modules\pnpm\bin\pnpm.cjs')
)

$nodeExe = $null
foreach ($candidate in $nodeCandidates) {
  if ($candidate -eq 'node') {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { $nodeExe = $cmd.Source; break }
  } elseif (Test-Path $candidate) { $nodeExe = $candidate; break }
}
if (-not $nodeExe) { Write-Err2 '找不到 node。请安装 Node.js >= 20.18.1，或确认 DSH 运行时完整。'; exit 1 }

$pnpmScript = $null
foreach ($candidate in $pnpmCandidates) {
  if (Test-Path $candidate) { $pnpmScript = $candidate; break }
}
if (-not $pnpmScript) {
  $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue
  if ($pnpmCmd) { $pnpmScript = $pnpmCmd.Source }
}
if (-not $pnpmScript) { Write-Err2 '找不到 pnpm。请安装 pnpm，或确认 DSH 运行时完整。'; exit 1 }

Write-Ok "node：$nodeExe"
Write-Ok "pnpm：$pnpmScript"

# ── 读 package.json ─────────────────────────────────────────────────────────
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
$raw = [System.IO.File]::ReadAllText($packageJsonPath, $utf8NoBom)
$pkg = $raw | ConvertFrom-Json

# link 路径统一用正斜杠，pnpm 在 Windows 上也认
$linkTarget = 'link:' + ($PluginDir -replace '\\', '/')

$bundles = New-Object System.Collections.Generic.List[string]
foreach ($item in @($pkg.dsh.profile.bundles)) { if ($item) { $bundles.Add([string]$item) } }

$deps = [ordered]@{}
if ($pkg.dependencies) {
  foreach ($property in $pkg.dependencies.PSObject.Properties) { $deps[$property.Name] = $property.Value }
}

if ($Uninstall) {
  Write-Step '模式：卸载'
  if ($deps.Contains($PackageName)) { $deps.Remove($PackageName); Write-Ok "移除依赖 $PackageName" }
  else { Write-Warn2 "依赖里本来就没有 $PackageName" }
  if ($bundles.Contains($PackageName)) { $bundles.Remove($PackageName); Write-Ok "移除 bundles 条目" }
  else { Write-Warn2 'bundles 里本来就没有这个条目' }
} else {
  Write-Step '模式：安装'
  $deps[$PackageName] = $linkTarget
  Write-Ok "依赖 $PackageName = $linkTarget"
  if (-not $bundles.Contains($PackageName)) {
    $bundles.Add($PackageName)
    Write-Ok 'bundles 追加该条目'
  } else {
    Write-Warn2 'bundles 里已存在该条目，保持不变'
  }
}

# ── 重建 package.json（保持字段顺序）────────────────────────────────────────
$ordered = [ordered]@{}
foreach ($property in $pkg.PSObject.Properties) {
  switch ($property.Name) {
    'dsh' { $ordered['dsh'] = [ordered]@{ profile = [ordered]@{ bundles = $bundles.ToArray() } } }
    'dependencies' { $ordered['dependencies'] = $deps }
    default { $ordered[$property.Name] = $property.Value }
  }
}
if (-not $ordered.Contains('dsh')) {
  $ordered['dsh'] = [ordered]@{ profile = [ordered]@{ bundles = $bundles.ToArray() } }
}
if (-not $ordered.Contains('dependencies')) { $ordered['dependencies'] = $deps }

$newJson = $ordered | ConvertTo-Json -Depth 12

if ($DryRun) {
  Write-Step 'DryRun：以下是将要写入的 package.json（不写盘、不跑 pnpm）'
  Write-Host $newJson
  exit 0
}

# ── 备份 + 写入 ─────────────────────────────────────────────────────────────
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$packageBackup = "$packageJsonPath.bak-$stamp"
Copy-Item $packageJsonPath $packageBackup -Force
Write-Step "已备份：$(Split-Path $packageBackup -Leaf)"

$lockPath = Join-Path $ProfilePath 'pnpm-lock.yaml'
if (Test-Path $lockPath) {
  Copy-Item $lockPath "$lockPath.bak-$stamp" -Force
  Write-Ok "已备份：pnpm-lock.yaml.bak-$stamp"
}

[System.IO.File]::WriteAllText($packageJsonPath, $newJson, $utf8NoBom)
Write-Ok 'package.json 已更新'

# ── pnpm install ────────────────────────────────────────────────────────────
Write-Step '运行 pnpm install'
Push-Location $ProfilePath
try {
  if ($pnpmScript -like '*.mjs' -or $pnpmScript -like '*.cjs') {
    & $nodeExe $pnpmScript install
  } else {
    & $pnpmScript install
  }
  $pnpmExit = $LASTEXITCODE
} finally {
  Pop-Location
}

if ($pnpmExit -ne 0) {
  Write-Err2 "pnpm install 失败（exit $pnpmExit）。package.json 已备份在：$packageBackup"
  Write-Err2 '回滚方式：把备份覆盖回 package.json，然后重新 pnpm install。'
  exit $pnpmExit
}
Write-Ok 'pnpm install 完成'

# ── 结果确认 ────────────────────────────────────────────────────────────────
$linkPath = Join-Path $ProfilePath "node_modules\$PackageName"
Write-Step '结果确认'

if ($Uninstall) {
  # pnpm **不会**清理不是它自己建立的链接（实测：卸载后 link 会残留），所以这里主动清掉。
  if (Test-Path $linkPath) {
    $linkItem = Get-Item $linkPath -Force
    if ($linkItem.LinkType -eq 'SymbolicLink' -or $linkItem.LinkType -eq 'Junction') {
      & cmd.exe /c "rmdir `"$linkPath`""
      if (Test-Path $linkPath) { Write-Warn2 "残留链接没删掉，请手工处理：$linkPath" }
      else { Write-Ok "已清理残留链接：$linkPath" }
    } else {
      Write-Warn2 "$linkPath 不是链接而是真实目录，未动它 —— 请自行确认后再删。"
    }
  } else {
    Write-Ok '链接已移除，无残留。'
  }
  Write-Host ''
  Write-Host '卸载完成。' -ForegroundColor Green
  Write-Host '重载 profile 或重启 DeepSeek Harness 后，barotrauma_* 工具会消失。'
  Write-Host "重新安装：.\install.ps1"
  Write-Host "回滚：Copy-Item '$packageBackup' '$packageJsonPath' -Force"
  exit 0
}

if (Test-Path $linkPath) { Write-Ok "软链已建立：$linkPath" }
else { Write-Warn2 "没看到 $linkPath —— 如果 pnpm 报错请检查上面的输出" }

Write-Host ''
Write-Host '安装完成。' -ForegroundColor Green
Write-Host '下一步（必须做，否则插件不会生效）：重载 profile 或重启 DeepSeek Harness。'
Write-Host '生效后可用的工具（15 个）：'
Write-Host '  barotrauma_detect_env / plan / create_mod'
Write-Host '  barotrauma_gen_item / gen_affliction / gen_character / gen_event'
Write-Host '  barotrauma_gen_lua / gen_csharp'
Write-Host '  barotrauma_scan_l10n / translate'
Write-Host '  barotrauma_validate / gen_icon / pack / publish'
Write-Host ''
Write-Host "卸载：.\install.ps1 -Uninstall"
Write-Host "回滚：Copy-Item '$packageBackup' '$packageJsonPath' -Force; cd '$ProfilePath'; pnpm install"
