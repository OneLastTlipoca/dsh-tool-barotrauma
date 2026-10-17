/**
 * dsh-tool-barotrauma — 阶段二之三：事件与随机遭遇（`barotrauma_gen_event`）。
 *
 * 照抄本机真实样本（refs/reference.md D 节）：
 *   - 根元素 `<Randomevents>`（也有 `<Override><RandomEvents>` 写法，属性名大小写不敏感）；
 *   - 一个可用随机事件需要**三件套**：`<EventSprites>`（可选）+ `<EventPrefabs>` 定义 + `<EventSet>` 挂载；
 *   - `EventPrefabs` 与 `EventSet` 必须落在同一个 `<Randomevents>` 里，
 *     所以这里用「插入到指定容器内」而不是简单追加到根元素尾部；
 *   - 文本走本地化键 `eventtext.<key>`。
 * @module dsh-tool-barotrauma/events
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { BarotraumaPluginConfig } from './config.js'
import {
  appendIntoContainer,
  appendLanguageEntries,
  appendXmlBlock,
  ensureRegistered,
  findLanguageFile,
  readFilelist,
} from './pack-io.js'
import { CONTENT_TAGS, eventTextKey } from './xml.js'
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  BarotraumaError,
  registerTool,
  requireString,
  resolveInside,
} from './util.js'

/** 注册事件生成工具。 */
export function registerEventTools(ctx: Context, _config: BarotraumaPluginConfig): void {
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_event',
    description:
      '生成潜渊症随机事件并登记进 filelist.xml。生成三件套：可选 <EventSprites> 配图、' +
      '<EventPrefabs> 里的 <ScriptedEvent>（含 TagAction / SpawnAction / ConversationAction + Option）、' +
      '以及把事件挂进地图池的 <EventSet>。文本写进本地化 eventtext.<key>。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      identifier: { type: 'string', required: true, description: '事件 identifier（英文小写，会作为本地化键前缀）。' },
      eventSetIdentifier: { type: 'string', description: 'EventSet 的 identifier，默认 <identifier>set。' },
      commonness: { type: 'integer', description: 'ScriptedEvent commonness，默认 25。' },
      introText: { type: 'string', description: '开场对话文本（写进 eventtext.<id>.intro）。' },
      optionTexts: { type: 'array', items: { type: 'string' }, description: '玩家选项文本，写进 eventtext.<id>.opt1 / opt2 …' },
      speciesName: { type: 'string', description: 'SpawnAction 生成的物种（SpeciesName），例如 crawler；不给则不生成怪。' },
      spawnCount: { type: 'integer', description: 'SpawnAction 数量，默认 1。' },
      spawnLocation: { type: 'string', description: 'SpawnAction spawnlocation，默认 Outpost。' },
      spriteTexture: { type: 'string', description: '事件配图路径；给了才会生成 <EventSprites>。' },
      spriteIdentifier: { type: 'string', description: '配图 identifier，默认 <identifier>_pic。' },
      levelType: { type: 'string', description: 'EventSet leveltype，默认 outpost。' },
      locationType: { type: 'string', description: 'EventSet locationtype，默认 outpost,city。' },
      minLevelDifficulty: { type: 'integer', description: 'EventSet minleveldifficulty，默认 0。' },
      maxLevelDifficulty: { type: 'integer', description: 'EventSet maxleveldifficulty，默认 80。' },
      oncePerOutpost: { type: 'boolean', description: 'EventSet onceperoutpost，默认 true。' },
      chooseRandom: { type: 'boolean', description: 'EventSet chooserandom，默认 false。⚠️ 官方说明 Commonness 仅在 chooserandom=true 时有效，所以 false 时不会写 commonness。' },
      ignoreCooldown: { type: 'boolean', description: 'EventSet ignorecooldown，默认 false。设为 true 会让事件无视冷却反复触发，慎用。' },
      targetFile: { type: 'string', description: '目标 XML，默认取 filelist 里第一条 RandomEvents 记录，再退回 Events/Events.xml。' },
      writeLocalization: { type: 'boolean', description: '是否写本地化，默认 true。' },
      dryRun: { type: 'boolean', description: '只生成不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          identifier: { type: 'string', required: true },
          eventSetIdentifier: { type: 'string', required: true },
          targetFile: { type: 'string', required: true },
          appendOutcome: { type: 'string', required: true },
          spriteAdded: { type: 'boolean', required: true },
          filelistAdded: { type: 'boolean', required: true },
          localizationFile: { type: 'string', required: true },
          localizationEntries: { type: 'integer', required: true },
          dryRun: { type: 'boolean', required: true },
          xml: { type: 'string', required: true },
          warnings: { type: 'array', required: true, items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: [
          `生成随机事件 ${value.identifier}（EventSet: ${value.eventSetIdentifier}）→ ${value.targetFile}（${value.appendOutcome}）`,
          `配图：${value.spriteAdded ? '已生成 <EventSprites>' : '未提供'}　filelist 登记：${value.filelistAdded ? '新增记录' : '已有记录'}`,
          `本地化：${value.localizationFile || '(未找到)'} 写入 ${value.localizationEntries} 条`,
          '',
          value.xml,
          ...value.warnings.map((warning) => `⚠️ ${warning}`),
        ].join('\n'),
      }],
    },
    timeoutMs: 60_000,
    isConcurrencySafe: () => false,
    async execute(args) {
      const modDir = asString(args.modDir).trim()
      if (modDir === '') throw new BarotraumaError('MISSING_ARGUMENT', '缺少必填参数 modDir')
      const identifier = requireString(args.identifier, 'identifier').toLowerCase().replace(/[^a-z0-9_.]/g, '')
      if (identifier === '') {
        throw new BarotraumaError('INVALID_ARGUMENT', 'identifier 必须是含 ASCII 字母/数字的字符串。')
      }

      const warnings: string[] = []
      const eventSetIdentifier = asString(args.eventSetIdentifier).trim() || `${identifier}set`
      const commonness = Math.trunc(asNumber(args.commonness, 25))
      const spriteIdentifier = asString(args.spriteIdentifier).trim() || `${identifier}_pic`
      const spriteTexture = asString(args.spriteTexture).trim()
      const introText = asString(args.introText)
      const optionTexts = asStringArray(args.optionTexts)
      const speciesName = asString(args.speciesName).trim()

      // ── 本地化条目 ──
      const l10nEntries: Array<{ key: string; text: string }> = []
      if (introText.trim() !== '') l10nEntries.push({ key: eventTextKey(`${identifier}.intro`), text: introText })
      optionTexts.forEach((text, index) => {
        l10nEntries.push({ key: eventTextKey(`${identifier}.opt${index + 1}`), text })
      })

      // ── 拼装三段 XML ──
      const spriteXml = spriteTexture !== ''
        ? `    <Sprite identifier="${spriteIdentifier}" texture="${spriteTexture}" sourcerect="0,0,256,256" origin="0.5,0.5" />`
        : ''

      const actions: string[] = ['      <TagAction criteria="player" tag="player" />']
      if (speciesName !== '') {
        const count = Math.max(1, Math.trunc(asNumber(args.spawnCount, 1)))
        actions.push(
          `      <SpawnAction speciesname="${speciesName}" spawnlocation="${asString(args.spawnLocation, 'Outpost')}"`
            + ` targettag="${identifier}spawn" amount="${count}" />`,
        )
      }
      if (introText.trim() !== '' || optionTexts.length > 0) {
        const options = optionTexts
          .map((_text, index) => `        <Option text="${eventTextKey(`${identifier}.opt${index + 1}`)}"${index === optionTexts.length - 1 ? ' endconversation="true"' : ''} />`)
          .join('\n')
        const spriteAttr = spriteTexture !== '' ? ` eventsprite="${spriteIdentifier}"` : ''
        actions.push(
          `      <ConversationAction targettag="player" text="${eventTextKey(`${identifier}.intro`)}"${spriteAttr}>`,
          options,
          '      </ConversationAction>',
        )
      }

      const scriptedEventXml = `      <ScriptedEvent identifier="${identifier}" commonness="${commonness}">
${actions.join('\n')}
      </ScriptedEvent>`

      // additive="true"：官方 ScriptedEvents 页说明 —— additive 集合被选中时，
      // 游戏**还会再抽一个非 additive 的集合**（"额外再抽一次"，**不是**替换原版事件集）。
      const chooseRandom = asBoolean(args.chooseRandom, false)
      const ignoreCooldown = asBoolean(args.ignoreCooldown, false)
      // 官方 ScriptedEvents 页：Commonness **仅在事件集配置为随机选择（chooserandom）时有效** ——
      // chooserandom=false 时还写 commonness 是自相矛盾的配置，所以不给。
      const innerCommonness = chooseRandom ? ' commonness="100"' : ''
      const eventSetXml = `  <EventSet identifier="${eventSetIdentifier}" leveltype="${asString(args.levelType, 'outpost')}"
            locationtype="${asString(args.locationType, 'outpost,city')}"
            allowatstart="true" additive="true" minleveldifficulty="${Math.trunc(asNumber(args.minLevelDifficulty, 0))}"
            maxleveldifficulty="${Math.trunc(asNumber(args.maxLevelDifficulty, 80))}"
            chooserandom="${chooseRandom ? 'true' : 'false'}" ignorecooldown="${ignoreCooldown ? 'true' : 'false'}"
            onceperoutpost="${asBoolean(args.oncePerOutpost, true) ? 'true' : 'false'}">
    <ScriptedEvent identifier="${identifier}"${innerCommonness} />
  </EventSet>`

      const xml = [
        spriteXml !== '' ? `  <EventSprites>\n${spriteXml}\n  </EventSprites>` : '',
        `  <EventPrefabs>\n${scriptedEventXml}\n  </EventPrefabs>`,
        eventSetXml,
      ].filter((part) => part !== '').join('\n')

      // ── 目标文件 ──
      let targetFile = asString(args.targetFile).trim()
      if (targetFile === '') {
        const doc = await readFilelist(modDir)
        const entry = doc.entries.find((item) => item.tag.toLowerCase() === 'randomevents')
        targetFile = entry?.file ?? 'Events/Events.xml'
        if (entry === undefined) warnings.push(`filelist 里没有 <RandomEvents> 记录，改为新建 ${targetFile} 并自动登记。`)
      }
      targetFile = targetFile.replace(/\\/g, '/')

      const dryRun = asBoolean(args.dryRun, false)
      let appendOutcome = 'dry-run'
      let filelistAdded = false
      let localizationFile = ''
      let localizationEntries = 0

      if (!dryRun) {
        const target = resolveInside(modDir, targetFile)
        // 1) 配图要放进 <EventSprites> 容器
        if (spriteXml !== '') await appendIntoContainer(target, spriteXml, 'EventSprites', 'Randomevents')
        // 2) 事件定义要放进 <EventPrefabs> 容器
        appendOutcome = await appendIntoContainer(target, scriptedEventXml, 'EventPrefabs', 'Randomevents')
        // 3) EventSet 是 <Randomevents> 的直接子元素，追加到根元素尾部
        await appendXmlBlock(target, eventSetXml, 'Randomevents')

        const registration = await ensureRegistered(modDir, CONTENT_TAGS.randomEvents, targetFile)
        filelistAdded = registration.added

        if (asBoolean(args.writeLocalization, true) && l10nEntries.length > 0) {
          const languageFile = await findLanguageFile(modDir)
          if (languageFile === null) {
            warnings.push('mod 里没有语言文件记录，事件文本未写入本地化（游戏里会显示原始键名）。')
          } else {
            localizationFile = languageFile
            localizationEntries = await appendLanguageEntries(languageFile, l10nEntries)
          }
        }
      } else {
        warnings.push('dryRun=true：未写盘。')
      }

      return {
        ok: true,
        identifier,
        eventSetIdentifier,
        targetFile,
        appendOutcome,
        spriteAdded: spriteXml !== '',
        filelistAdded,
        localizationFile,
        localizationEntries,
        dryRun,
        xml,
        warnings,
      }
    },
  }))
}
