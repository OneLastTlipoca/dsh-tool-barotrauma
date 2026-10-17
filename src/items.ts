/**
 * dsh-tool-barotrauma — 阶段二之一：物品与状态效果
 * （`barotrauma_gen_item` / `barotrauma_gen_affliction`）。
 *
 * 模板全部照抄本机**真实文件**，关键事实：
 *   - 根元素可以是 `<Items>`，也可以是 `<override><Items>`（覆盖原版同 identifier 物品）；
 *   - **不存在 `<Magazine>` 元素**：弹匣 = `<ItemContainer>` + `<StatusEffect OnUse>` 里 `<SpawnItem>`；
 *     武器侧 = `<RequiredItems items="tag" type="Contained">` + `<StatusEffect target="Contained"><Use /></StatusEffect>`；
 *   - `name=""` 表示显示名走本地化键 `entityname.<identifier>`；
 *   - 贴图推荐 `texture="%ModDir%/Items/x.png"`（`%ModDir%` = mod 根，不是 XML 所在目录）。
 * @module dsh-tool-barotrauma/items
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import type { BarotraumaPluginConfig } from './config.js'
import {
  appendLanguageEntries,
  appendXmlBlock,
  ensureRegistered,
  findLanguageFile,
  listModXmlFiles,
  readFilelist,
} from './pack-io.js'
import {
  afflictionDescriptionKey,
  afflictionNameKey,
  CONTENT_TAGS,
  entityDescriptionKey,
  entityNameKey,
} from './xml.js'
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  BarotraumaError,
  pascalCase,
  pathExists,
  registerTool,
  requireString,
  resolveInside,
} from './util.js'

/** 支持的物品种类。 */
const ITEM_KINDS = [
  'weapon_ranged',
  'weapon_melee',
  'ammo',
  'consumable',
  'equipment',
  'material',
] as const
type ItemKind = typeof ITEM_KINDS[number]

/** 贴图规格。 */
interface SpriteSpec {
  texture: string
  sourceRect: string
  depth: string
  origin: string
}

/** `<Sprite>` 行。 */
function spriteLine(spec: SpriteSpec, tab = '  '): string {
  return `${tab}<Sprite texture="${spec.texture}" sourcerect="${spec.sourceRect}" depth="${spec.depth}" origin="${spec.origin}" />`
}

/** 解析贴图参数。 */
function spriteSpecOf(args: Record<string, unknown>, fallbackTexture: string): SpriteSpec {
  return {
    texture: asString(args.texture).trim() || fallbackTexture,
    sourceRect: asString(args.sourceRect).trim() || '0,0,64,64',
    depth: asString(args.depth).trim() || '0.55',
    origin: asString(args.origin).trim() || '0.5,0.5',
  }
}

/** `<Price>` 块。 */
function priceBlock(basePrice: number, storeMultiplier: number, minAvailable: number): string {
  if (basePrice <= 0) return ''
  const lines = [`  <Price baseprice="${basePrice}">`]
  lines.push(`    <Price storeidentifier="merchantoutpost" multiplier="${storeMultiplier}" />`)
  lines.push(`    <Price storeidentifier="merchantmilitary" multiplier="${storeMultiplier}" minavailable="${minAvailable}" />`)
  lines.push('  </Price>')
  return `${lines.join('\n')}\n`
}

/** 受伤效果（`<Attack>` 内的 `<Affliction>` 列表）。 */
function afflictionLines(specs: ReadonlyArray<{ identifier: string; strength: number }>, pad: string): string {
  return specs.map((spec) => `${pad}<Affliction identifier="${spec.identifier}" strength="${spec.strength}" />`).join('\n')
}

/** 默认伤害组合（真实标识符：gunshotwound / bleeding / stun，见 SmartPistol.xml:43-47）。 */
const DEFAULT_BULLET_AFFLICTIONS = [
  { identifier: 'gunshotwound', strength: 24 },
  { identifier: 'bleeding', strength: 16 },
  { identifier: 'stun', strength: 0.3 },
]

/** 默认近战伤害组合（参考 vanilla Attack 写法）。 */
const DEFAULT_MELEE_AFFLICTIONS = [
  { identifier: 'lacerations', strength: 10 },
  { identifier: 'bleeding', strength: 29 },
  { identifier: 'stun', strength: 5 },
]

// ── 各类物品模板 ─────────────────────────────────────────────────────────────

/**
 * 远程武器。照抄 vanilla SMG 与 SmartPistol 的混合最小集：
 * `RequiredItems type="Contained"` + `StatusEffect target="Contained"><Use />` + `ItemContainer/Containable`。
 */
function rangedWeaponXml(i: {
  identifier: string
  ammoTag: string
  roundIdentifier: string
  sprite: SpriteSpec
  bodyWidth: number
  bodyHeight: number
  density: number
  scale: string
  tags: string
  reload: string
  spread: string
  unskilledSpread: string
  barrelPos: string
  skillLevel: number
  basePrice: number
  storeMultiplier: number
  minAvailable: number
}): string {
  return `<Item name="" identifier="${i.identifier}" category="Weapon" cargocontaineridentifier="metalcrate"
      tags="${i.tags}" Scale="${i.scale}" impactsoundtag="impact_metal_light">
${spriteLine(i.sprite)}
  <Body width="${i.bodyWidth}" height="${i.bodyHeight}" density="${i.density}" />
  <Holdable slots="Any,RightHand,LeftHand" controlpose="true" aimpos="70,5" handle1="-25,-7" msg="ItemMsgPickUpSelect" />
  <RangedWeapon reload="${i.reload}" barrelpos="${i.barrelPos}" spread="${i.spread}" unskilledspread="${i.unskilledSpread}"
                combatPriority="70" drawhudwhenequipped="true" crosshairscale="0.2">
    <StatusEffect type="OnUse" target="Contained">
      <Use />
    </StatusEffect>
    <RequiredItems items="${i.ammoTag}" type="Contained" msg="ItemMsgAmmoRequired" />
    <RequiredSkill identifier="weapons" level="${i.skillLevel}" />
  </RangedWeapon>
  <ItemContainer capacity="1" maxstacksize="1" drawinventory="false" hideitems="true"
                 containedstateindicatorstyle="bullet" spawnwithid="${i.roundIdentifier}">
    <Containable items="${i.ammoTag}" />
  </ItemContainer>
${priceBlock(i.basePrice, i.storeMultiplier, i.minAvailable)}</Item>`
}

/** 弹药（弹匣）。照抄 vanilla smgmagazine（Content/input.xml:7532）。 */
function ammoXml(i: {
  identifier: string
  ammoTag: string
  roundIdentifier: string
  roundTag: string
  sprite: SpriteSpec
  scale: string
  maxStackSize: number
  shotsPerMagazine: number
  basePrice: number
  storeMultiplier: number
  minAvailable: number
}): string {
  // condition 递减：弹匣耐久 100，每发扣 100/shots
  const perShot = (100 / Math.max(1, i.shotsPerMagazine)).toFixed(3)
  return `<Item name="" identifier="${i.identifier}" category="Weapon" scale="${i.scale}"
      maxstacksize="${i.maxStackSize}" maxstacksizecharacterinventory="2"
      cargocontaineridentifier="metalcrate" linkable="true"
      tags="smallitem,${i.ammoTag},handheldammo" impactsoundtag="impact_metal_light">
${spriteLine(i.sprite)}
  <Body width="14" height="40" density="25" />
  <ItemContainer hideitems="true" capacity="1" drawinventory="false" canbeselected="false"
                 ShowConditionInContainedStateIndicator="true" SpawnWithId="${i.roundIdentifier}"
                 removecontaineditemsondeconstruct="true" containedstateindicatorstyle="bullet">
    <Containable items="${i.roundTag}" />
    <StatusEffect type="OnUse" target="This" condition="-${perShot}" disabledeltatime="true">
      <SpawnItem identifiers="${i.roundIdentifier}" spawnposition="ThisInventory" />
    </StatusEffect>
  </ItemContainer>
  <Holdable canBeCombined="true" slots="Any,RightHand,LeftHand" handle1="0,0" msg="ItemMsgPickUpSelect" />
${priceBlock(i.basePrice, i.storeMultiplier, i.minAvailable)}</Item>`
}

/** 弹丸。照抄 SmartPistolRound（LocalMods/SmartPistol/SmartPistol.xml:14）。 */
function projectileXml(i: {
  identifier: string
  roundTag: string
  sprite: SpriteSpec
  scale: string
  projectile: 'propelled' | 'simple'
  afflictions: ReadonlyArray<{ identifier: string; strength: number }>
  structuredamage: number
  itemdamage: number
  penetration: string
}): string {
  const attack = `    <Attack structuredamage="${i.structuredamage}" targetforce="10" itemdamage="${i.itemdamage}" severlimbsprobability="0.2" penetration="${i.penetration}">
${afflictionLines(i.afflictions, '      ')}
    </Attack>`
  const projectile = i.projectile === 'propelled'
    ? `  <PropelledProjectile characterusable="false" damagedoors="true" spread="20" oscillationfrequency="1.0" maxspeed="5">\n${attack}\n  </PropelledProjectile>`
    : `  <Projectile characterusable="false" damagedoors="true" launchimpulse="5" sticktoentities="false">\n${attack}\n  </Projectile>`
  return `<Item identifier="${i.identifier}" category="Weapon" scale="${i.scale}" sonarsize="2"
      tags="smallitem,${i.roundTag},handheldammo"
      damagedbyexplosions="true" explosiondamagemultiplier="0.5" damagedbyprojectiles="true">
${spriteLine(i.sprite)}
  <Body width="140" height="100" density="20" />
${projectile}
</Item>`
}

/** 近战武器。 */
function meleeWeaponXml(i: {
  identifier: string
  sprite: SpriteSpec
  scale: string
  tags: string
  afflictions: ReadonlyArray<{ identifier: string; strength: number }>
  structuredamage: number
  itemdamage: number
  targetImpulse: number
  skillLevel: number
  basePrice: number
  storeMultiplier: number
  minAvailable: number
}): string {
  return `<Item name="" identifier="${i.identifier}" category="Weapon" tags="${i.tags}" Scale="${i.scale}"
      cargocontaineridentifier="metalcrate" impactsoundtag="impact_metal_light">
${spriteLine(i.sprite)}
  <Body width="40" height="20" density="25" />
  <Holdable slots="Any,RightHand,LeftHand" controlpose="true" aimpos="40,4" handle1="-10,0" msg="ItemMsgPickUpSelect" />
  <MeleeWeapon>
    <Attack targetimpulse="${i.targetImpulse}" severlimbsprobability="1" itemdamage="${i.itemdamage}"
            structuredamage="${i.structuredamage}" structuresoundtype="StructureSlash">
${afflictionLines(i.afflictions, '      ')}
    </Attack>
    <RequiredSkill identifier="weapons" level="${i.skillLevel}" />
  </MeleeWeapon>
${priceBlock(i.basePrice, i.storeMultiplier, i.minAvailable)}</Item>`
}

/**
 * 消耗品（医用/注射）。
 * 照抄 vanilla medical.xml 的 MeleeWeapon + `StatusEffect type="OnSuccess"` + `ReduceAffliction` 结构
 * （Content/Items/Medical/medical.xml:36-54）。
 */
function consumableXml(i: {
  identifier: string
  sprite: SpriteSpec
  scale: string
  tags: string
  category: string
  skillLevel: number
  duration: string
  reduces: ReadonlyArray<{ type: string; amount: number }>
  basePrice: number
  storeMultiplier: number
  minAvailable: number
}): string {
  const success = i.reduces
    .map((r) => `      <ReduceAffliction type="${r.type}" amount="${r.amount}" />`)
    .join('\n')
  const failure = i.reduces
    .map((r) => `      <ReduceAffliction type="${r.type}" amount="${(r.amount * 0.75).toFixed(3)}" />`)
    .join('\n')
  const suitable = i.reduces
    .map((r) => `  <SuitableTreatment type="${r.type}" suitability="30" />`)
    .join('\n')
  return `<Item name="" identifier="${i.identifier}" category="${i.category}" tags="smallitem,medical"
      maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="mediccrate"
      description="" useinhealthinterface="true" scale="${i.scale}" impactsoundtag="impact_soft" RequireAimToUse="True">
  <Upgrade gameversion="0.10.0.0" scale="${i.scale}" />
  <PreferredContainer primary="medcab" secondary="medcontainer" />
${suitable}
${priceBlock(i.basePrice, i.storeMultiplier, i.minAvailable)}${spriteLine(i.sprite)}
  <Body width="25" height="40" density="10.05" />
  <MeleeWeapon canBeCombined="true" removeOnCombined="true" slots="Any,RightHand,LeftHand" aimpos="40,5" handle1="0,0"
               holdangle="10" reload="1.0" msg="ItemMsgPickUpSelect" HitOnlyCharacters="true">
    <RequiredSkill identifier="medical" level="${i.skillLevel}" />
    <StatusEffect type="OnUse" target="This" Condition="-100.0" setvalue="true" />
    <StatusEffect statuseffecttags="medical" type="OnSuccess" target="This, Limb" duration="${i.duration}">
${success}
    </StatusEffect>
    <StatusEffect statuseffecttags="medical" type="OnFailure" target="This, Limb" duration="${i.duration}">
${failure}
    </StatusEffect>
    <StatusEffect type="OnBroken" target="This">
      <Remove />
    </StatusEffect>
  </MeleeWeapon>
  <SkillRequirementHint identifier="medical" level="${i.skillLevel}" />
</Item>`
}

/**
 * 穿戴装备（护甲）。
 * 照抄 vanilla bodyarmor（Content/Items/Jobgear/Security/securityofficer_gear.xml:215-245）。
 */
function equipmentXml(i: {
  identifier: string
  sprite: SpriteSpec
  itemSprite: SpriteSpec
  iconTexture: string
  iconSourceRect: string
  scale: string
  tags: string
  bodyWidth: number
  bodyHeight: number
  slots: string
  armorValueText: string
  damages: ReadonlyArray<{ afflictions: string; multiplier: string; sound: string }>
  basePrice: number
  storeMultiplier: number
  minAvailable: number
}): string {
  const modifiers = i.damages
    .map((d) => `    <damagemodifier afflictionidentifiers="${d.afflictions}" armorsector="0.0,360.0" damagemultiplier="${d.multiplier}" damagesound="${d.sound}" deflectprojectiles="true" />`)
    .join('\n')
  return `<Item name="" identifier="${i.identifier}" category="Equipment" tags="${i.tags}" scale="${i.scale}"
      cargocontaineridentifier="metalcrate" description="" impactsoundtag="impact_soft">
  <InventoryIcon texture="${i.iconTexture}" sourcerect="${i.iconSourceRect}" origin="0.5,0.5" />
${spriteLine(i.itemSprite)}
  <Body width="${i.bodyWidth}" height="${i.bodyHeight}" density="25" />
  <Wearable slots="${i.slots}" msg="ItemMsgPickUpSelect">
${modifiers}
    <sprite name="${i.identifier} worn" texture="${i.sprite.texture}" limb="${i.armorValueText}" hidelimb="false"
            inheritscale="true" scale="0.65" inheritorigin="false" origin="0.5,0.5"
            inheritsourcerect="false" sourcerect="${i.sprite.sourceRect}" />
  </Wearable>
${priceBlock(i.basePrice, i.storeMultiplier, i.minAvailable)}</Item>`
}

/** 材料/普通物品。 */
function materialXml(i: {
  identifier: string
  sprite: SpriteSpec
  scale: string
  tags: string
  category: string
  maxStackSize: number
  basePrice: number
  storeMultiplier: number
  minAvailable: number
}): string {
  return `<Item name="" identifier="${i.identifier}" category="${i.category}" tags="${i.tags}" scale="${i.scale}"
      maxstacksize="${i.maxStackSize}" maxstacksizecharacterinventory="8"
      cargocontaineridentifier="metalcrate" impactsoundtag="impact_metal_light">
${spriteLine(i.sprite)}
  <Body width="32" height="32" density="25" />
${priceBlock(i.basePrice, i.storeMultiplier, i.minAvailable)}</Item>`
}

// ── 目标文件选择 ─────────────────────────────────────────────────────────────

/** 找到 mod 里承载物品的文件；找不到则用 filelist 里第一条 Item 记录，再退回默认路径。 */
async function resolveItemFile(modDir: string, explicit: string): Promise<string> {
  if (explicit.trim() !== '') return explicit.replace(/\\/g, '/')
  const doc = await readFilelist(modDir)
  const itemEntry = doc.entries.find((entry) => entry.tag.toLowerCase() === 'item')
  if (itemEntry !== undefined) return itemEntry.file
  const existing = await listModXmlFiles(modDir)
  const itemsLike = existing.find((file) => /items?\.xml$/i.test(file))
  if (itemsLike !== undefined) return itemsLike
  return 'Items/Items.xml'
}

// ── 工具注册 ─────────────────────────────────────────────────────────────────

/** 注册物品与状态效果工具。 */
export function registerItemTools(ctx: Context, config: BarotraumaPluginConfig): void {
  // ── barotrauma_gen_item ───────────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_item',
    description:
      '生成潜渊症物品并追加进内容包：远程武器（自动配套弹药与弹丸）、近战武器、弹药、消耗品（医疗）、' +
      '穿戴装备、材料。会自动写进 Items XML 并在 filelist.xml 登记该文件，同时把名称/描述写进本地化文件。' +
      '所有字段照抄本机真实 mod（不存在 <Magazine>，弹药按 ItemContainer + SpawnItem 建模）。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录（含 filelist.xml 的目录）。' },
      identifier: { type: 'string', required: true, description: '物品 identifier（唯一标识符，英文/数字）。' },
      kind: { type: 'string', required: true, enum: [...ITEM_KINDS], description: '物品种类。' },
      displayName: { type: 'string', description: '显示名（会写进本地化 entityname.<identifier>）。' },
      description: { type: 'string', description: '描述（写进本地化 entitydescription.<identifier>）。' },
      category: { type: 'string', description: 'category 属性，按种类有默认值。' },
      tags: { type: 'string', description: 'tags 属性（逗号分隔），按种类有默认值。' },
      basePrice: { type: 'integer', description: '商店基础价；0 表示不生成 <Price>。' },
      storeMultiplier: { type: 'number', description: '商店售价倍率，默认 1.0。' },
      minAvailable: { type: 'integer', description: '商店最小库存，默认 1。' },
      scale: { type: 'string', description: 'Scale 属性，默认 0.5。' },
      texture: { type: 'string', description: '贴图路径，例如 %ModDir%/Items/x.png。' },
      sourceRect: { type: 'string', description: 'sourcerect，默认 0,0,64,64。' },
      depth: { type: 'string', description: 'Sprite depth，默认 0.55。' },
      origin: { type: 'string', description: 'Sprite origin，默认 0.5,0.5。' },
      bodyWidth: { type: 'integer', description: 'Body width。' },
      bodyHeight: { type: 'integer', description: 'Body height。' },
      armorSlot: { type: 'string', description: 'equipment 专用：穿戴部位（<sprite limb=…>），默认 Torso；可填 Head / LeftHand / RightHand / LeftLeg / RightLeg。' },
      targetFile: { type: 'string', description: '追加到哪个 XML（相对 mod 根），默认取 filelist 里第一条 Item 记录。' },
      autoAmmo: { type: 'boolean', description: 'weapon_ranged 是否自动生成配套弹药与弹丸，默认 true。' },
      ammoTag: { type: 'string', description: '武器/弹药共用的 tags 值，例如 smartrevolverammo。' },
      roundIdentifier: { type: 'string', description: '弹丸 identifier，默认 <Identifier>Round。' },
      shotsPerMagazine: { type: 'integer', description: '每弹匣发数，默认 20。' },
      skillLevel: { type: 'integer', description: 'RequiredSkill level，武器默认 40、医疗默认 40。' },
      damage: { type: 'array', items: { type: 'string' }, description: '伤害组合，格式 ["gunshotwound:24","bleeding:16"]；不给则用该种类的默认值。' },
      reduce: { type: 'array', items: { type: 'string' }, description: '消耗品消除的 affliction，格式 ["bleeding:1.5","burn:0.75"]。' },
      projectile: { type: 'string', enum: ['propelled', 'simple'], description: '弹丸类型，默认 propelled（照抄 SmartPistolRound）。' },
      writeLocalization: { type: 'boolean', description: '是否把名称/描述写进语言文件，默认 true。' },
      dryRun: { type: 'boolean', description: '只生成不写盘，默认 false。' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          ok: { type: 'boolean', required: true },
          identifier: { type: 'string', required: true },
          kind: { type: 'string', required: true },
          modDir: { type: 'string', required: true },
          targetFile: { type: 'string', required: true },
          appendOutcome: { type: 'string', required: true },
          filelistAdded: { type: 'boolean', required: true },
          generatedIdentifiers: { type: 'array', required: true, items: { type: 'string' } },
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
          `生成物品 ${value.identifier}（${value.kind}）`,
          `目标文件：${value.targetFile}（${value.appendOutcome}）`,
          `filelist 登记：${value.filelistAdded ? '新增了记录' : '已有记录，未重复添加'}`,
          `一并生成：${value.generatedIdentifiers.join(', ')}`,
          `本地化：${value.localizationFile || '(未找到语言文件)'}　写入 ${value.localizationEntries} 条`,
          '',
          '── 生成的 XML ──',
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
      const identifier = pascalCase(requireString(args.identifier, 'identifier'))
      if (identifier === '') {
        throw new BarotraumaError('INVALID_ARGUMENT', 'identifier 必须是含 ASCII 字母/数字的字符串。')
      }
      const kind = asString(args.kind, 'material') as ItemKind
      if (!(ITEM_KINDS as readonly string[]).includes(kind)) {
        throw new BarotraumaError('INVALID_ARGUMENT', `不支持的 kind：${kind}（可用：${ITEM_KINDS.join(' / ')}）`)
      }

      const warnings: string[] = []
      const displayName = asString(args.displayName)
      const description = asString(args.description)
      const scale = asString(args.scale).trim() || '0.5'
      const basePrice = Math.max(0, Math.trunc(asNumber(args.basePrice, 100)))
      const storeMultiplier = asNumber(args.storeMultiplier, 1)
      const minAvailable = Math.max(0, Math.trunc(asNumber(args.minAvailable, 1)))
      const skillLevel = Math.max(0, Math.trunc(asNumber(args.skillLevel, 40)))
      const sprite = spriteSpecOf(args, 'Content/Items/Weapons/weapons_new.png')

      /** 解析 "identifier:strength" 形式的伤害组合。 */
      const parsePairs = (raw: unknown, fallback: ReadonlyArray<{ identifier?: string; type?: string; strength?: number; amount?: number }>): Array<{ identifier: string; strength: number }> => {
        const list = asStringArray(raw)
        if (list.length === 0) {
          return fallback.map((item) => ({
            identifier: asString(item.identifier ?? item.type),
            strength: asNumber(item.strength ?? item.amount, 0),
          }))
        }
        return list.map((entry) => {
          const [key, value] = entry.split(':')
          if (key === undefined || key.trim() === '') {
            throw new BarotraumaError('INVALID_ARGUMENT', `伤害项格式应为 "identifier:strength"，收到：${entry}`)
          }
          return { identifier: key.trim(), strength: asNumber(value, 0) }
        })
      }

      const bullets = parsePairs(args.damage, DEFAULT_BULLET_AFFLICTIONS)
      const meleeDamages = parsePairs(args.damage, DEFAULT_MELEE_AFFLICTIONS)
      const ammoTag = asString(args.ammoTag).trim() || `${identifier.toLowerCase()}ammo`
      const roundIdentifier = pascalCase(asString(args.roundIdentifier).trim()) || `${identifier}Round`
      const roundTag = `${roundIdentifier.toLowerCase()}`
      const shots = Math.max(1, Math.trunc(asNumber(args.shotsPerMagazine, 20)))

      const blocks: string[] = []
      const generated: string[] = [identifier]

      if (kind === 'weapon_ranged') {
        const autoAmmo = args.autoAmmo !== false
        const ammoIdentifier = autoAmmo ? `${identifier}Magazine` : ''
        blocks.push(rangedWeaponXml({
          identifier,
          ammoTag,
          roundIdentifier,
          sprite,
          bodyWidth: Math.max(1, Math.trunc(asNumber(args.bodyWidth, 72))),
          bodyHeight: Math.max(1, Math.trunc(asNumber(args.bodyHeight, 40))),
          density: 25,
          scale,
          tags: asString(args.tags).trim() || 'smallitem,weapon,gun,pistolitem',
          reload: '0.5',
          spread: '0.1',
          unskilledSpread: '6',
          barrelPos: '29,11',
          skillLevel,
          basePrice,
          storeMultiplier,
          minAvailable,
        }))
        if (autoAmmo) {
          blocks.push(ammoXml({
            identifier: ammoIdentifier,
            ammoTag,
            roundIdentifier,
            roundTag,
            sprite: { ...sprite, sourceRect: '146,157,21,44', depth: '0.54' },
            scale,
            maxStackSize: 8,
            shotsPerMagazine: shots,
            basePrice: Math.max(1, Math.round(basePrice * 0.2)),
            storeMultiplier,
            minAvailable,
          }))
          generated.push(ammoIdentifier)
          blocks.push(projectileXml({
            identifier: roundIdentifier,
            roundTag,
            sprite,
            scale,
            projectile: asString(args.projectile, 'propelled') === 'simple' ? 'simple' : 'propelled',
            afflictions: bullets,
            structuredamage: 10,
            itemdamage: 10,
            penetration: '0.1',
          }))
          generated.push(roundIdentifier)
        }
      } else if (kind === 'ammo') {
        blocks.push(ammoXml({
          identifier,
          ammoTag,
          roundIdentifier,
          roundTag,
          sprite,
          scale,
          maxStackSize: 8,
          shotsPerMagazine: shots,
          basePrice,
          storeMultiplier,
          minAvailable,
        }))
        blocks.push(projectileXml({
          identifier: roundIdentifier,
          roundTag,
          sprite,
          scale,
          projectile: asString(args.projectile, 'propelled') === 'simple' ? 'simple' : 'propelled',
          afflictions: bullets,
          structuredamage: 10,
          itemdamage: 10,
          penetration: '0.1',
        }))
        generated.push(roundIdentifier)
      } else if (kind === 'weapon_melee') {
        blocks.push(meleeWeaponXml({
          identifier,
          sprite,
          scale: scale || '0.6',
          tags: asString(args.tags).trim() || 'smallitem,weapon,melee',
          afflictions: meleeDamages,
          structuredamage: 1,
          itemdamage: 6,
          targetImpulse: 15,
          skillLevel,
          basePrice,
          storeMultiplier,
          minAvailable,
        }))
      } else if (kind === 'consumable') {
        const reduces = parsePairs(args.reduce, [
          { type: 'bleeding', amount: 1.5 },
          { type: 'burn', amount: 0.75 },
        ]).map((pair) => ({ type: pair.identifier, amount: pair.strength }))
        blocks.push(consumableXml({
          identifier,
          sprite,
          scale: scale || '0.5',
          tags: asString(args.tags).trim() || 'smallitem,medical',
          category: asString(args.category).trim() || 'Medical',
          skillLevel,
          duration: '20.0',
          reduces,
          basePrice,
          storeMultiplier,
          minAvailable,
        }))
      } else if (kind === 'equipment') {
        const customTexture = asString(args.texture).trim()
        // 自定义贴图时图标坐标必须落在自己的图里；
        // 960,256,64,64 只有在引用原版 InventoryIconAtlas 时才有意义。
        const iconTexture = customTexture !== '' ? customTexture : 'Content/Items/InventoryIconAtlas.png'
        const iconSourceRect = customTexture !== ''
          ? (asString(args.sourceRect).trim() || '0,0,64,64')
          : '960,256,64,64'
        const damagesRaw = asStringArray(args.damage)
        const damages = damagesRaw.length > 0
          ? damagesRaw.map((entry) => {
              const [afflictions, multiplier] = entry.split(':')
              return { afflictions: asString(afflictions, 'blunttrauma'), multiplier: asString(multiplier, '0.5'), sound: 'LimbArmor' }
            })
          : [
              { afflictions: 'blunttrauma,lacerations,gunshotwound', multiplier: '0.3', sound: 'LimbArmor' },
              { afflictions: 'bitewounds,explosiondamage', multiplier: '0.5', sound: 'LimbArmor' },
            ]
        blocks.push(equipmentXml({
          identifier,
          sprite,
          itemSprite: sprite,
          iconTexture,
          iconSourceRect,
          scale: scale || '0.35',
          tags: asString(args.tags).trim() || 'smallitem,clothing',
          bodyWidth: Math.max(1, Math.trunc(asNumber(args.bodyWidth, 85))),
          bodyHeight: Math.max(1, Math.trunc(asNumber(args.bodyHeight, 90))),
          slots: 'Any,OuterClothes',
          // 注意：<sprite> 的 limb= 是穿戴部位（Torso/Head/LeftHand…），不是护甲值
          armorValueText: asString(args.armorSlot).trim() || 'Torso',
          damages,
          basePrice,
          storeMultiplier,
          minAvailable,
        }))
      } else {
        blocks.push(materialXml({
          identifier,
          sprite,
          scale,
          tags: asString(args.tags).trim() || 'smallitem',
          category: asString(args.category).trim() || 'Misc',
          maxStackSize: 32,
          basePrice,
          storeMultiplier,
          minAvailable,
        }))
      }

      const xml = `${blocks.join('\n\n')}\n`
      const targetFile = await resolveItemFile(modDir, asString(args.targetFile))
      const dryRun = asBoolean(args.dryRun, false)

      // 贴图路径当场校验：引用错了在游戏里只表现为"没有贴图"，事后很难定位
      const textureRef = sprite.texture
      if (textureRef.startsWith('Content/')) {
        let gameDir = config.gameDir ?? ''
        if (gameDir === '') {
          const { detectEnv } = await import('./env.js')
          gameDir = (await detectEnv('', '')).gameDir
        }
        if (gameDir !== '' && !await pathExists(resolveInside(gameDir, textureRef))) {
          warnings.push(`贴图 ${textureRef} 在原版资源里不存在 —— 物品在游戏里会显示不出贴图。请在 Content/ 下挑一个真实存在的图。`)
        }
      } else if (/^%ModDir%\//i.test(textureRef)) {
        const relative = textureRef.replace(/^%ModDir%\//i, '')
        if (!await pathExists(resolveInside(modDir, relative))) {
          warnings.push(`贴图 ${textureRef} 还不在 mod 里（${relative}）—— 记得把图片放进去，否则游戏里显示不出贴图。`)
        }
      }

      // 本地化条目
      const l10nEntries: Array<{ key: string; text: string }> = []
      if (displayName.trim() !== '') l10nEntries.push({ key: entityNameKey(identifier), text: displayName })
      if (description.trim() !== '') l10nEntries.push({ key: entityDescriptionKey(identifier), text: description })

      let appendOutcome = 'dry-run'
      let filelistAdded = false
      let localizationFile = ''
      let localizationEntries = 0

      if (!dryRun) {
        const target = resolveInside(modDir, targetFile)
        appendOutcome = await appendXmlBlock(target, xml, 'Items')
        const registration = await ensureRegistered(modDir, CONTENT_TAGS.item, targetFile)
        filelistAdded = registration.added

        if (asBoolean(args.writeLocalization, true) && l10nEntries.length > 0) {
          const languageFile = await findLanguageFile(modDir)
          if (languageFile === null) {
            warnings.push('mod 里没有 <Text> 语言文件记录，名称/描述未写入本地化；请先用 barotrauma_create_mod 建骨架或手工加一个语言文件。')
          } else {
            localizationFile = languageFile
            localizationEntries = await appendLanguageEntries(languageFile, l10nEntries)
            if (localizationEntries === 0) {
              warnings.push(`${languageFile} 里这些键已存在，未覆盖（保留你已有的译文）。`)
            }
          }
        }
      } else {
        warnings.push('dryRun=true：未写盘。')
      }

      return {
        ok: true,
        identifier,
        kind,
        modDir,
        targetFile,
        appendOutcome,
        filelistAdded,
        generatedIdentifiers: generated,
        localizationFile,
        localizationEntries,
        dryRun,
        xml,
        warnings,
      }
    },
  }))

  // ── barotrauma_gen_affliction ─────────────────────────────────────────────
  registerTool(ctx, defineTool({
    name: 'barotrauma_gen_affliction',
    description:
      '生成潜渊症状态效果（affliction）并追加进内容包。字段照抄本机真实样本 ' +
      '（Neurotrauma/Xml/Afflictions.xml）：identifier/maxstrength/targets/isbuff/indicatorlimb 等，' +
      '可选 <icon> 与 <Effect> 强度区间。⚠️ 如需内嵌 <StatusEffect>（条件触发）请手工补写 —— 本工具不生成。名称/描述写进本地化 afflictionname / afflictiondescription。',
    parameters: {
      modDir: { type: 'string', required: true, description: 'mod 根目录。' },
      identifier: { type: 'string', required: true, description: 'affliction identifier。' },
      displayName: { type: 'string', description: '显示名（写进 afflictionname.<identifier>）。' },
      description: { type: 'string', description: '描述（写进 afflictiondescription.<identifier>）。' },
      maxStrength: { type: 'number', description: 'maxstrength，默认 100。' },
      targets: { type: 'string', description: 'targets，默认 human。' },
      isBuff: { type: 'boolean', description: 'isbuff，默认 false。' },
      indicatorLimb: { type: 'string', description: 'indicatorlimb，默认 Torso。' },
      showIconThreshold: { type: 'number', description: 'showiconthreshold，默认 1。' },
      showInHealthScannerThreshold: { type: 'number', description: 'showinhealthscannerthreshold，默认 1。' },
      type: { type: 'string', description: 'type 属性，真实样本用 gaze 或空串。' },
      iconColors: { type: 'string', description: 'iconcolors，格式 "r,g,b,a;r,g,b,a"。' },
      iconTexture: { type: 'string', description: 'affliction 图标图集路径；不给则输出带注释的占位说明。' },
      iconSheetIndex: { type: 'string', description: '图标在图集里的格子索引，格式 "x,y"，默认 0,0。' },
      limbSpecific: { type: 'boolean', description: 'limbspecific，默认 false。' },
      healableInMedicalClinic: { type: 'boolean', description: 'healableinmedicalclinic，默认 false。官方文档里该属性多数情况默认 true，按需开启。' },
      effects: { type: 'array', items: { type: 'string' }, description: 'Effect 区间，格式 ["0-4:10","5-200:0"]（minstrength-maxstrength:strengthchange）。⚠️ 官方要求区间**不得重叠**，所以不要写成 0-5 与 5-200 这种共端点。' },
      targetFile: { type: 'string', description: '追加到哪个 XML，默认取 filelist 里第一条 Afflictions 记录。' },
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
          targetFile: { type: 'string', required: true },
          appendOutcome: { type: 'string', required: true },
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
          `生成状态效果 ${value.identifier} → ${value.targetFile}（${value.appendOutcome}）`,
          `filelist 登记：${value.filelistAdded ? '新增记录' : '已有记录'}`,
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
      const identifier = requireString(args.identifier, 'identifier').toLowerCase().replace(/\s+/g, '')

      const warnings: string[] = []
      const effects = asStringArray(args.effects)
      const effectLines = effects.length > 0
        ? effects.map((entry) => {
            const [range, change] = entry.split(':')
            const [min, max] = asString(range).split('-')
            return `  <Effect minstrength="${asString(min, '0')}" maxstrength="${asString(max, '100')}" strengthchange="${asString(change, '0')}" />`
          }).join('\n')
        : '  <Effect minstrength="0" maxstrength="100" strengthchange="0" />'

      const iconTexture = asString(args.iconTexture).trim()
      const iconLine = iconTexture !== ''
        ? `  <icon texture="${iconTexture}" sheetindex="${asString(args.iconSheetIndex, '0,0')}" sheetelementsize="128,128" origin="0,0" />`
        : '  <!-- 未提供图标：该 affliction 在健康界面会缺图标。补一张图集后填下面这行（两种真实写法任选）：\n'
          + '       <icon texture="%ModDir%/Images/AfflictionIcons.png" sheetindex="0,0" sheetelementsize="128,128" origin="0,0" />\n'
          + '       <icon texture="%ModDir%/Images/AfflictionIcons.png" sourcerect="0,0,128,128" color="255,255,255,255" origin="0,0" /> -->'

      const xml = `<Affliction name="" identifier="${identifier}" description=""
      limbspecific="${asBoolean(args.limbSpecific, false) ? 'true' : 'false'}"
      indicatorlimb="${asString(args.indicatorLimb, 'Torso')}"
      showiconthreshold="${asNumber(args.showIconThreshold, 1)}"
      showinhealthscannerthreshold="${asNumber(args.showInHealthScannerThreshold, 1)}"
      maxstrength="${asNumber(args.maxStrength, 100)}"
      targets="${asString(args.targets, 'human')}"
      type="${asString(args.type)}"
      isbuff="${asBoolean(args.isBuff, false) ? 'true' : 'false'}"
      healableinmedicalclinic="${asBoolean(args.healableInMedicalClinic, false) ? 'true' : 'false'}"
      iconcolors="${asString(args.iconColors, '255,255,255,255;255,255,255,255')}">
${effectLines}
${iconLine}
</Affliction>
`

      // 目标文件
      let targetFile = asString(args.targetFile).trim()
      if (targetFile === '') {
        const doc = await readFilelist(modDir)
        const entry = doc.entries.find((item) => item.tag.toLowerCase() === 'afflictions')
        targetFile = entry?.file ?? 'Xml/Afflictions.xml'
        if (entry === undefined) {
          warnings.push(`filelist 里没有 <Afflictions> 记录，改为新建 ${targetFile} 并自动登记。`)
        }
      }

      const dryRun = asBoolean(args.dryRun, false)
      const l10nEntries: Array<{ key: string; text: string }> = []
      const displayName = asString(args.displayName)
      const description = asString(args.description)
      if (displayName.trim() !== '') l10nEntries.push({ key: afflictionNameKey(identifier), text: displayName })
      if (description.trim() !== '') l10nEntries.push({ key: afflictionDescriptionKey(identifier), text: description })

      let appendOutcome = 'dry-run'
      let filelistAdded = false
      let localizationFile = ''
      let localizationEntries = 0

      if (!dryRun) {
        const target = resolveInside(modDir, targetFile)
        appendOutcome = await appendXmlBlock(target, xml, 'Afflictions')
        const registration = await ensureRegistered(modDir, CONTENT_TAGS.afflictions, targetFile)
        filelistAdded = registration.added
        if (asBoolean(args.writeLocalization, true) && l10nEntries.length > 0) {
          const languageFile = await findLanguageFile(modDir)
          if (languageFile === null) {
            warnings.push('mod 里没有语言文件，名称/描述未写入本地化。')
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
        targetFile,
        appendOutcome,
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

/** 供其它模块复用：默认弹丸伤害组合。 */
export { DEFAULT_BULLET_AFFLICTIONS, DEFAULT_MELEE_AFFLICTIONS }
