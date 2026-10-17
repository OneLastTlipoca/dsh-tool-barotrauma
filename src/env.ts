/**
 * dsh-tool-barotrauma — 环境探测（`barotrauma_detect_env`）。
 *
 * 潜渊症 1.13.x 的环境事实（本机实测，2026）：
 *   - 游戏目录      ：<SteamLibrary>\steamapps\common\Barotrauma
 *   - LocalMods     ：**在游戏目录内**（`<gameDir>\LocalMods`），旧文档说的
 *                     `%LOCALAPPDATA%\Daedalic Entertainment GmbH\Barotrauma\LocalMods` 已不再使用
 *   - 版本号        ：`changelog.txt` 首行形如 `v1.13.4.0 (Summer Update 2026 Hotfix 1)`
 *   - LuaCs         ：`<gameDir>\Data\Mods\LuaCsForBarotrauma`（随内容包安装）
 *
 * 本模块只做**只读探测**，不修改任何游戏文件。
 * @module dsh-tool-barotrauma/env
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { basename, join, resolve } from 'node:path'
import type { BarotraumaPluginConfig } from './config.js'
import {
  asString,
  listDirs,
  listFiles,
  pathExists,
  readTextSafe,
  registerTool,
} from './util.js'

const execFileAsync = promisify(execFile)

/** Steam 注册表里的安装位置（按优先级）。 */
const STEAM_REGISTRY_KEYS: ReadonlyArray<readonly [string, string]> = [
  ['HKCU\\Software\\Valve\\Steam', 'SteamPath'],
  ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'],
  ['HKLM\\SOFTWARE\\Valve\\Steam', 'InstallPath'],
]

/** 探测不到 Steam 时的兜底候选根目录。 */
const FALLBACK_STEAM_ROOTS: readonly string[] = [
  'C:\\Program Files (x86)\\Steam',
  'C:\\Program Files\\Steam',
  'D:\\Steam',
  'E:\\Steam',
  'F:\\Steam',
]

/** Steam 上 Barotrauma 的 appid。 */
const BAROTRAUMA_APP_ID = '602960'

/** 递归统计 xml 文件数时的上限，避免在超大 mod 上卡住。 */
const XML_WALK_LIMIT = 4000

// ── 注册表 / Steam 库发现 ────────────────────────────────────────────────────

/** 从注册表读 Steam 安装路径；读不到返回空数组。 */
async function steamRootsFromRegistry(): Promise<string[]> {
  const found: string[] = []
  for (const [key, valueName] of STEAM_REGISTRY_KEYS) {
    try {
      const { stdout } = await execFileAsync('reg', ['query', key, '/v', valueName], {
        timeout: 8000,
        windowsHide: true,
      })
      const match = /REG_SZ\s+(.+)/.exec(stdout)
      const path = match?.[1]?.trim()
      if (path !== undefined && path !== '') found.push(path.replace(/\//g, '\\'))
    } catch {
      /* 该键不存在或 reg 不可用，继续试下一个 */
    }
  }
  return found
}

/** 解析 libraryfolders.vdf，取出所有库根目录。 */
async function librariesFromSteamRoot(steamRoot: string): Promise<string[]> {
  const candidates = [
    join(steamRoot, 'steamapps', 'libraryfolders.vdf'),
    join(steamRoot, 'config', 'libraryfolders.vdf'),
  ]
  const libraries: string[] = []
  for (const vdf of candidates) {
    const text = await readTextSafe(vdf)
    if (text === '') continue
    const matches = text.matchAll(/"path"\s+"([^"]+)"/g)
    for (const match of matches) {
      const raw = match[1]
      if (raw === undefined) continue
      libraries.push(resolve(raw.replace(/\\\\/g, '\\')))
    }
    if (libraries.length > 0) break
  }
  return libraries
}

/**
 * 大小写不敏感的有序去重表。
 * Windows 路径大小写不敏感，注册表返回 `d:\steam` 而兜底候选写 `D:\Steam`，
 * 不去重就会把同一个库登记两次。
 */
function makeCaseInsensitiveSet(): { add: (path: string) => void; values: () => string[] } {
  const seen = new Map<string, string>()
  return {
    add(path: string) {
      const key = path.toLowerCase()
      if (!seen.has(key)) seen.set(key, path)
    },
    values() {
      return [...seen.values()]
    },
  }
}

/** 汇总所有 Steam 根目录与库根目录（大小写不敏感去重）。 */
async function discoverSteamRoots(explicit: string[]): Promise<{ roots: string[]; libraries: string[] }> {
  const roots = makeCaseInsensitiveSet()
  // 探测优先级：显式 → 注册表 → 兜底候选（先到先得，决定展示时用哪种大小写）
  for (const root of explicit) roots.add(root)
  for (const root of await steamRootsFromRegistry()) roots.add(root)
  for (const root of FALLBACK_STEAM_ROOTS) {
    if (await pathExists(root)) roots.add(root)
  }

  const rootList = roots.values()
  const libraries = makeCaseInsensitiveSet()
  for (const root of rootList) {
    if (await pathExists(root)) libraries.add(root)
    for (const library of await librariesFromSteamRoot(root)) libraries.add(library)
  }
  return { roots: rootList, libraries: libraries.values() }
}

// ── 游戏目录 / 版本 / LuaCs ──────────────────────────────────────────────────

/** 从 changelog.txt 首行解析版本号。 */
async function versionFromChangelog(gameDir: string): Promise<string> {
  const text = await readTextSafe(join(gameDir, 'changelog.txt'))
  const match = /^\s*v(\d+\.\d+\.\d+(?:\.\d+)?)/m.exec(text)
  return match?.[1] ?? ''
}

/** 从 appmanifest_<appid>.acf 读 buildid。 */
async function buildIdFromLibrary(library: string): Promise<string> {
  const text = await readTextSafe(join(library, 'steamapps', `appmanifest_${BAROTRAUMA_APP_ID}.acf`))
  const match = /"buildid"\s+"(\d+)"/.exec(text)
  return match?.[1] ?? ''
}

/** 判断某个 mod 目录是否像 LuaCs 内容包。 */
function looksLikeLuaCs(name: string): boolean {
  return /luacs/i.test(name)
}

/** 递归统计 xml 文件数（带上限）。 */
async function countXmlFiles(dir: string, remaining: { left: number }, depth = 0): Promise<number> {
  if (depth > 6 || remaining.left <= 0) return 0
  let total = 0
  const files = await listFiles(dir)
  for (const file of files) {
    remaining.left -= 1
    if (remaining.left <= 0) return total
    if (file.toLowerCase().endsWith('.xml')) total += 1
  }
  for (const sub of await listDirs(dir)) {
    total += await countXmlFiles(sub, remaining, depth + 1)
  }
  return total
}

/** 描述一个已安装的本地 mod。 */
interface InstalledMod {
  name: string
  path: string
  hasFilelist: boolean
  hasLua: boolean
  hasCSharp: boolean
  hasModConfig: boolean
  hasPreview: boolean
  xmlFileCount: number
}

/** 扫描 LocalMods 下的所有 mod 目录。 */
async function scanInstalledMods(localModsDir: string): Promise<InstalledMod[]> {
  const dirs = await listDirs(localModsDir)
  const mods: InstalledMod[] = []
  for (const dir of dirs) {
    mods.push({
      name: basename(dir),
      path: dir,
      hasFilelist: await pathExists(join(dir, 'filelist.xml')),
      hasLua: await pathExists(join(dir, 'Lua')),
      hasCSharp: await pathExists(join(dir, 'CSharp')),
      hasModConfig: await pathExists(join(dir, 'ModConfig.xml')),
      hasPreview: await pathExists(join(dir, 'preview.png')),
      xmlFileCount: await countXmlFiles(dir, { left: XML_WALK_LIMIT }),
    })
  }
  return mods.sort((a, b) => a.name.localeCompare(b.name))
}

/** 探测结果（工具 canonical 值）。 */
interface DetectEnvResult {
  ok: boolean
  gameDir: string
  gameVersion: string
  gameVersionSource: string
  buildId: string
  steamRoots: string[]
  libraryRoots: string[]
  localModsDir: string
  localModsSource: string
  luaCsInstalled: boolean
  luaCsPaths: string[]
  harmonyPresent: boolean
  installedMods: InstalledMod[]
  issues: string[]
}

/** 执行一次完整探测。 */
async function detectEnv(explicitGameDir: string, explicitLocalMods: string): Promise<DetectEnvResult> {
  const issues: string[] = []
  const steam = await discoverSteamRoots([])

  const gameDirCandidates: string[] = []
  if (explicitGameDir !== '') gameDirCandidates.push(resolve(explicitGameDir))
  const fromEnv = process.env['BAROTRAUMA_DIR']
  if (fromEnv !== undefined && fromEnv.trim() !== '') gameDirCandidates.push(resolve(fromEnv.trim()))
  for (const library of steam.libraries) {
    gameDirCandidates.push(join(library, 'steamapps', 'common', 'Barotrauma'))
  }

  let gameDir = ''
  for (const candidate of gameDirCandidates) {
    if (await pathExists(join(candidate, 'Barotrauma.exe'))) {
      gameDir = candidate
      break
    }
  }
  if (gameDir === '' && gameDirCandidates.length > 0) {
    issues.push(
      `在 ${gameDirCandidates.length} 个候选路径里没找到 Barotrauma.exe；` +
        `请用 gameDir 参数或在插件配置里显式指定游戏目录。`,
    )
  }

  // 版本号
  let gameVersion = ''
  let gameVersionSource = ''
  if (gameDir !== '') {
    gameVersion = await versionFromChangelog(gameDir)
    if (gameVersion !== '') gameVersionSource = join(gameDir, 'changelog.txt')
  }
  let buildId = ''
  for (const library of steam.libraries) {
    buildId = await buildIdFromLibrary(library)
    if (buildId !== '') break
  }

  // LocalMods：先看游戏目录内，再回退旧位置
  let localModsDir = ''
  let localModsSource = ''
  const localModsCandidates: Array<[string, string]> = []
  if (explicitLocalMods !== '') localModsCandidates.push([resolve(explicitLocalMods), '显式参数'])
  if (gameDir !== '') localModsCandidates.push([join(gameDir, 'LocalMods'), '游戏目录内（1.13.x 正确位置）'])
  const appData = process.env['LOCALAPPDATA']
  if (appData !== undefined && appData !== '') {
    localModsCandidates.push([
      join(appData, 'Daedalic Entertainment GmbH', 'Barotrauma', 'LocalMods'),
      'AppData 旧位置',
    ])
  }
  for (const [candidate, source] of localModsCandidates) {
    if (await pathExists(candidate)) {
      localModsDir = candidate
      localModsSource = source
      break
    }
  }
  if (localModsDir === '') {
    issues.push('没找到 LocalMods 目录；生成 mod 前需要先确认游戏目录，或手动指定 localModsDir。')
  }

  // LuaCs
  const luaCsPaths: string[] = []
  if (gameDir !== '') {
    for (const candidate of [
      join(gameDir, 'Data', 'Mods', 'LuaCsForBarotrauma'),
      join(gameDir, 'LuaCsForBarotrauma'),
      join(gameDir, 'Mods', 'LuaCsForBarotrauma'),
    ]) {
      if (await pathExists(candidate)) luaCsPaths.push(candidate)
    }
  }
  if (localModsDir !== '') {
    for (const dir of await listDirs(localModsDir)) {
      if (looksLikeLuaCs(basename(dir))) luaCsPaths.push(dir)
    }
  }
  const harmonyPresent = gameDir !== '' ? await pathExists(join(gameDir, '0Harmony.dll')) : false
  const luaCsInstalled = luaCsPaths.length > 0

  const installedMods = localModsDir !== '' ? await scanInstalledMods(localModsDir) : []

  return {
    ok: gameDir !== '' && localModsDir !== '',
    gameDir,
    gameVersion,
    gameVersionSource,
    buildId,
    steamRoots: steam.roots,
    libraryRoots: steam.libraries,
    localModsDir,
    localModsSource,
    luaCsInstalled,
    luaCsPaths,
    harmonyPresent,
    installedMods,
    issues,
  }
}

// ── 工具注册 ─────────────────────────────────────────────────────────────────

/** 注册环境探测工具。 */
export function registerEnvTools(ctx: Context, config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_detect_env',
    description:
      '探测本机潜渊症（Barotrauma）环境：游戏安装目录、版本号、Steam 库分布、LocalMods 位置、' +
      'LuaCsForBarotrauma 是否安装、以及 LocalMods 下已装 mod 的清单（是否含 Lua/CSharp/ModConfig/filelist/预览图）。' +
      '只读，不修改任何游戏文件。做任何潜渊症 mod 工作前先调这个，确认版本与路径。',
    parameters: {
      gameDir: { type: 'string', description: '可选：直接指定游戏目录（含 Barotrauma.exe），跳过自动探测。' },
      localModsDir: { type: 'string', description: '可选：直接指定 LocalMods 目录。' },
      includeMods: { type: 'boolean', description: '是否扫描已装 mod 清单，默认 true。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          gameDir: { type: 'string', required: true },
          gameVersion: { type: 'string', required: true },
          gameVersionSource: { type: 'string', required: true },
          buildId: { type: 'string', required: true },
          steamRoots: { type: 'array', required: true, items: { type: 'string' } },
          libraryRoots: { type: 'array', required: true, items: { type: 'string' } },
          localModsDir: { type: 'string', required: true },
          localModsSource: { type: 'string', required: true },
          luaCsInstalled: { type: 'boolean', required: true },
          luaCsPaths: { type: 'array', required: true, items: { type: 'string' } },
          harmonyPresent: { type: 'boolean', required: true },
          installedMods: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string', required: true },
                path: { type: 'string', required: true },
                hasFilelist: { type: 'boolean', required: true },
                hasLua: { type: 'boolean', required: true },
                hasCSharp: { type: 'boolean', required: true },
                hasModConfig: { type: 'boolean', required: true },
                hasPreview: { type: 'boolean', required: true },
                xmlFileCount: { type: 'integer', required: true },
              },
            },
          },
          issues: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => {
        const lines = [
          `潜渊症环境：${value.ok ? '✅ 就绪' : '⚠️ 不完整'}`,
          `游戏目录：${value.gameDir || '(未找到)'}`,
          `版本：${value.gameVersion || '(未知)'}${value.gameVersionSource ? `  ← ${value.gameVersionSource}` : ''}`,
          `buildid：${value.buildId || '(未知)'}`,
          `LocalMods：${value.localModsDir || '(未找到)'}  [${value.localModsSource || '未确定'}]`,
          `LuaCs：${value.luaCsInstalled ? `已装 (${value.luaCsPaths.join(' | ')})` : '未检测到'}`,
          `Harmony(0Harmony.dll)：${value.harmonyPresent ? '在' : '不在'}`,
          `Steam 库：${value.libraryRoots.join(' | ') || '(无)'}`,
          `已装本地 mod：${value.installedMods.length} 个`,
        ]
        if (value.installedMods.length > 0) {
          const tagged = value.installedMods
            .filter((mod) => mod.hasLua || mod.hasCSharp || mod.hasModConfig)
            .slice(0, 12)
            .map((mod) => `${mod.name}(${[mod.hasLua ? 'Lua' : '', mod.hasCSharp ? 'C#' : '', mod.hasModConfig ? 'ModConfig' : ''].filter(Boolean).join('+')})`)
          if (tagged.length > 0) lines.push(`带脚本的：${tagged.join('、')}`)
        }
        if (value.issues.length > 0) lines.push('注意：', ...value.issues.map((issue) => `  - ${issue}`))
        return [{ type: 'text', text: lines.join('\n') }]
      },
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => true,
    async execute(args) {
      const gameDir = asString(args.gameDir).trim() !== ''
        ? asString(args.gameDir).trim()
        : (config.gameDir ?? '')
      const localModsDir = asString(args.localModsDir).trim() !== ''
        ? asString(args.localModsDir).trim()
        : (config.localModsDir ?? '')
      const result = await detectEnv(gameDir, localModsDir)
      if (args.includeMods === false) result.installedMods = []
      return result
    },
  }))
}

/** 供其它模块复用的探测入口（不经过工具层）。 */
export { detectEnv, type DetectEnvResult, type InstalledMod }
