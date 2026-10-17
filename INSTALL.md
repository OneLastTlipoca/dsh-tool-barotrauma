# 安装说明

## 这是什么

`dsh-tool-barotrauma` 是一个 **DeepSeek Harness（DSH）插件**，为 DSH 增加 15 个 `barotrauma_*` 工具，
用来制作、校验、打包、发布潜渊症（Barotrauma）mod。

**它不能单独运行** —— 必须装进一个 DSH profile，由 DSH 宿主进程加载。

---

## 前置条件

| 项 | 要求 |
|---|---|
| DeepSeek Harness | 已安装并能正常启动（本包在 DSH 0.2.0-rc.2 上验证） |
| Node.js | >= 20.18.1（DSH 自带运行时即可） |
| pnpm | DSH 自带运行时即可 |
| 潜渊症 | 1.13.4.0 上验证；其他 1.10+ 版本大概率可用但未逐一测试 |
| LuaCsForBarotrauma | **可选**。只做纯 XML 内容（物品/角色/事件）不需要；要用 Lua/C# 脚本才需要 |

---

## 安装（推荐：一键脚本）

解压后，在解压出来的目录里打开 PowerShell：

```powershell
# 装进 desktop profile（默认）
.\install.ps1

# 装进别的 profile
.\install.ps1 -Profile web

# 先看看会改什么，不实际写盘
.\install.ps1 -DryRun
```

脚本会自动：

1. 定位 DSH profile（`%USERPROFILE%\.dsh\profiles\<profile>`）
2. **备份** `package.json` 与 `pnpm-lock.yaml`（带时间戳后缀）
3. 写入 `link:` 依赖，并在 `dsh.profile.bundles` 里加条目
4. 跑 `pnpm install` 落地

> ⚠️ 执行策略如果拦住了脚本，用
> `powershell -ExecutionPolicy Bypass -File .\install.ps1`，或先 `Unblock-File .\install.ps1`。

**装完必须重载 profile 或重启 DSH** —— 已加载的模块常驻在宿主进程里，不会自动替换。

### 生效确认

重载后，问 DSH 里的 AI 跑一次环境探测，或直接看它的工具列表里有没有 `barotrauma_detect_env`。
有就说明装好了。

---

## 安装（手动，不想跑脚本时）

1. **把整个目录放到一个固定位置**（例如 `D:\tools\dsh-tool-barotrauma`）。
   别放在临时目录里 —— profile 会以 `link:` 指向它，移动或删除会导致插件失效。

2. 编辑 `%USERPROFILE%\.dsh\profiles\desktop\package.json`：

   ```jsonc
   {
     "dsh": {
       "profile": {
         "bundles": [
           // …已有的…
           "dsh-tool-barotrauma"        // ← 加这一行
         ]
       }
     },
     "dependencies": {
       // …已有的…
       "dsh-tool-barotrauma": "link:D:/tools/dsh-tool-barotrauma"   // ← 加这一行（正斜杠）
     }
   }
   ```

3. 在 profile 目录里跑：

   ```powershell
   cd $env:USERPROFILE\.dsh\profiles\desktop
   pnpm install
   ```

4. 重载 profile 或重启 DSH。

### ⚠️ 插件目录必须能解析 `@deepseek-ai/*`

Node 解析软链时用的是**真实路径**：装成 `link:` 之后，模块解析会从**插件目录**向上逐层
找 `node_modules`，而不会去看 profile 的 `node_modules`。
所以插件目录自己必须能解析到 `@deepseek-ai/dsh-tools`，否则加载时报：

```
ERR_MODULE_NOT_FOUND: Cannot find package '@deepseek-ai/dsh-tools' imported from <插件目录>\lib\env.js
```

一键脚本会自动处理：发现插件目录里没有 `node_modules\@deepseek-ai` 时，
就把它 junction 到 profile 的 `@deepseek-ai`（会在输出里打印「已把 @deepseek-ai 链进来 → …」）。

**手动安装的话这一步不能省**：在插件目录里建一个指向 profile `@deepseek-ai` 的目录链接：

```powershell
$plugin = "D:\tools\dsh-tool-barotrauma"          # 你的插件目录
$peer   = "$env:USERPROFILE\.dsh\profiles\node_modules\@deepseek-ai"
New-Item -ItemType Directory "$plugin\node_modules" -Force
New-Item -ItemType Junction "$plugin\node_modules\@deepseek-ai" -Target $peer
```

**推论：插件目录不要移动、改名或删除** —— `link:` 记的是路径，里面的 junction 也指向本机 profile。
想换位置就重新跑一次 `install.ps1`。

---

## 卸载

```powershell
.\install.ps1 -Uninstall
```

或手动：从 `package.json` 里删掉依赖与 bundles 条目，再 `pnpm install`。
插件不会往游戏目录写任何东西，所以卸载不涉及游戏侧清理。

---

## 排障

**装完工具没出现**
- 是否重载了 profile / 重启了 DSH？这是最常见原因。
- profile 目录对吗？`-Profile` 参数要填 profile **名**（如 `desktop`），不是路径。

**`pnpm install` 报 peer dependency 警告**
- 警告通常可忽略。本插件的 peer 是 `@deepseek-ai/cordis` 与 `@deepseek-ai/dsh-tools`，
  由 DSH profile 提供，不随包安装。

**`找不到 lib\index.js`**
- 这个包不完整（缺少编译产物）。请用发布包，或在源码目录先 `pnpm install && pnpm build`。

**工具报「没找到 LocalMods 目录」**
- 在插件配置里显式设 `gameDir`，或调用 `barotrauma_detect_env` 时传 `gameDir`。
- 注意潜渊症 1.13.x 的 LocalMods **在游戏目录内**（`<gameDir>\LocalMods`），
  不是旧资料说的 `%LOCALAPPDATA%\Daedalic Entertainment GmbH\Barotrauma\LocalMods`。

**`link:` 路径失效**
- 你把插件目录移动/删除/改名了。改回 `package.json` 里的路径，或重新跑一次 `install.ps1`。

---

## 包内容

```
dsh-tool-barotrauma-0.1.0/
├── install.ps1              一键安装 / 卸载脚本
├── INSTALL.md               本文件
├── 功能说明.md               完整功能文档（15 个工具逐个说明）
├── README.md                工程说明、构建方式、设计原则
├── LICENSE                  MIT
├── package.json             包元数据（dsh.bundle.patch 指向 cordis.patch.yml）
├── cordis.patch.yml         把插件挂进 profile loader 根列表的补丁层
├── lib/                     编译产物 —— **DSH 实际加载的就是这里**
├── src/                     TypeScript 源码（便于你改）
├── tools/                   测试脚本（smoke / planning / items / e2e）
└── docs/
    └── reference.md         施工参考：基于本机真实 mod 的字段级取证（1085 行）
```

想改插件行为：改 `src/` → 重编译 `lib/` → 重载 profile。
`lib/` 是权威产物，`src/` 只是给你改的源码。
