# 潜渊症官方 Modding 文档 · ItemComponents 第 3 批

- 来源：https://regalis11.github.io/BaroModDoc/ItemComponents/
- 批次：3
- 抓取页面数：25（成功 25 / 失败 0）

> 说明：属性名一律照抄文档原表（大小写保持原样）。表中 `Default value` 一并保留。
> 文档页没有出现的内容不补写；无属性表的页面在备注里注明。

## 汇总

| # | 元素 | 属性数 | 子元素 | HTTP |
| --- | --- | --- | --- | --- |
| 1 | `SonarTransducer` | 0 | — | 200 |
| 2 | `Steering` | 6 | `GuiFrame`, `StatusEffect`, `MaintainPosIndicator`, `MaintainPosOriginIndicator`, `SteeringIndicator`, `poweronsound` | 200 |
| 3 | `Turret` | 50 | `LightComponent` | 200 |
| 4 | `Projectile` | 27 | `Attack`, `StatusEffect` | 200 |
| 5 | `Propulsion` | 3 | — | 200 |
| 6 | `Quality` | 1 | `QualityStat` | 200 |
| 7 | `RangedWeapon` | 16 | `Crosshair`, `CrosshairPointer`, `Sound`, `ParticleEmitter`, `StatusEffect`, `RequiredItems` | 200 |
| 8 | `Sprayer` | 2 | `Crosshair`, `CrosshairPointer`, `ParticleEmitter`, `RequiredItems`, `sound`, `StatusEffect`, `PaintColors` | 200 |
| 9 | `RegExFindComponent` | 7 | — | 200 |
| 10 | `RemoteController` | 3 | — | 200 |
| 11 | `Repairable` | 15 | `GuiFrame`, `RequiredSkill`, `RequiredItem`, `ParticleEmitter` | 200 |
| 12 | `RepairTool` | 22 | `ParticleEmitter`, `StatusEffect`, `sound` | 200 |
| 13 | `Rope` | 20 | `Sprite`, `SnapSound`, `ReelSound`, `StatusEffect` | 200 |
| 14 | `Scanner` | 4 | `StatusEffect` | 200 |
| 15 | `SignalCheckComponent` | 4 | — | 200 |
| 16 | `SmokeDetector` | 3 | — | 200 |
| 17 | `StatusHUD` | 7 | — | 200 |
| 18 | `ConcatComponent` | 3 | — | 200 |
| 19 | `Terminal` | 8 | `GuiFrame` | 200 |
| 20 | `TriggerComponent` | 16 | `StatusEffect`, `Upgrade`, `Attack`, `Conditional` | 200 |
| 21 | `TrigonometricFunctionComponent` | 2 | — | 200 |
| 22 | `Vent` | 0 | `sound` | 200 |
| 23 | `WaterDetector` | 3 | — | 200 |
| 24 | `WifiComponent` | 7 | — | 200 |
| 25 | `Wire` | 6 | — | 200 |

合计属性条目：235

---

## 1. `SonarTransducer`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/SonarTransducer.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

（该页无属性表）

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

该页无属性表，只有 'This component supports the attributes defined in: Powered, ItemComponent' 的继承说明；示例中 <SonarTransducer> 为自闭合标签，属例子元素实为兄弟节点 <ConnectionPanel>，不计入 children。页面无用途说明句。

---

## 2. `Steering`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Steering.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `AutoPilot` | bool | false | Is autopilot currently on or not? |
| `NeutralBallastLevel` | float | 0.5 | How full the ballast tanks should be when the submarine is not being steered upwards/downwards. Can be used to compensate if the ballast tanks are too large/small relative to the size of the submarine. |
| `DockingAssistThreshold` | float | 1000 | How close the docking port has to be to another docking port for the docking mode to become active. |
| `LevelStartSelected` | bool | false |  |
| `LevelEndSelected` | bool | false |  |
| `MaintainPos` | bool | false |  |

### 子元素

`GuiFrame`, `StatusEffect`, `MaintainPosIndicator`, `MaintainPosOriginIndicator`, `SteeringIndicator`, `poweronsound`

### 备注

表头为 4 列：Attribute | Type | Default value | Description。示例里 <Steering> 直接子元素含 GuiFrame / StatusEffect / 若干 Indicator / poweronsound。该页无用途说明句；继承 Powered、ItemComponent。

---

## 3. `Turret`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Turret.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `BarrelPos` | Vector2 | "0,0" | The position of the barrel relative to the upper left corner of the base sprite (in pixels). |
| `FiringOffset` | Vector2 | "0,0" | The projectile launching location relative to transformed barrel position (in pixels). |
| `AlternatingFiringOffset` | bool | false | If enabled, the firing offset will alternate from left to right (i.e. flipping the x-component of the offset each shot.) |
| `LaunchImpulse` | float | 0 | The impulse applied to the physics body of the projectile (the higher the impulse, the faster the projectiles are launched). |
| `DamageMultiplier` | float | 1 | Multiplies the damage the turret deals by this amount. |
| `ProjectileCount` | int | 1 | How many projectiles the weapon launches when fired once. |
| `LaunchWithoutProjectile` | bool | false | Can the turret be fired without projectiles (causing it just to execute the OnUse effects and the firing animation without actually firing anything). |
| `Spread` | float | 0 | Random spread applied to the firing angle of the projectiles (in degrees). |
| `FiringRotationSpeedModifier` | float | 1 | How fast the turret can rotate while firing (for charged weapons). |
| `SingleChargedShot` | bool | false | Whether the turret should always charge-up fully to shoot. |
| `BaseRotation` | float | 0 | The angle of the turret's base in degrees. |
| `AIRange` | float | 3500 | How close to a target the turret has to be for an AI character to fire it. |
| `MaxAngleOffset` | float | 10 | How much off the turret can be from the target for the AI to shoot. In degrees. |
| `AICurrentTargetPriorityMultiplier` | float | 1.1 | How much does the AI prefer currently selected targets over new targets closer to the turret. |
| `MaxActiveProjectiles` | int | -1 | The turret won't fire additional projectiles if the number of previously fired, still active projectiles reaches this limit. If set to -1, there is no limit to the number of projectiles. |
| `MaxChargeTime` | float | 0 | The time required for a charge-type turret to charge up before able to fire. |
| `Reload` | float | 5 | The period of time the user has to wait between shots. |
| `ShotsPerBurst` | int | 1 | How many projectiles needs to be shot before we add an extra break? Think of the double coilgun. |
| `DelayBetweenBursts` | float | 0 | An extra delay between the bursts. Added to the reload. |
| `RetractionDurationMultiplier` | float | 1 | Modifies the duration of retraction of the barrell after recoil to get back to the original position after shooting. Reload time affects this too. |
| `RecoilTime` | float | 0.1 | How quickly the recoil moves the barrel after launching. |
| `RetractionDelay` | float | 0 | How long the barrell stays in place after the recoil and before retracting back to the original position. |
| `RotationLimits` | Vector2 | "0.0,0.0" | The range at which the barrel can rotate. |
| `SpringStiffnessLowSkill` | float | 5 | How much torque is applied to rotate the barrel when the item is used by a character with insufficient skills to operate it. Higher values make the barrel rotate faster. |
| `SpringStiffnessHighSkill` | float | 2 | How much torque is applied to rotate the barrel when the item is used by a character with sufficient skills to operate it. Higher values make the barrel rotate faster. |
| `SpringDampingLowSkill` | float | 50 | How much torque is applied to resist the movement of the barrel when the item is used by a character with insufficient skills to operate it. Higher values make the aiming more "snappy", stopping the barrel from swinging around the direction it's being aimed at. |
| `SpringDampingHighSkill` | float | 10 | How much torque is applied to resist the movement of the barrel when the item is used by a character with sufficient skills to operate it. Higher values make the aiming more "snappy", stopping the barrel from swinging around the direction it's being aimed at. |
| `RotationSpeedLowSkill` | float | 1 | Maximum angular velocity of the barrel when used by a character with insufficient skills to operate it. |
| `RotationSpeedHighSkill` | float | 5 | Maximum angular velocity of the barrel when used by a character with sufficient skills to operate it. |
| `HudTint` | Color | "0,0,0,0" | Optional screen tint color when the item is being operated (R,G,B,A). |
| `AutoOperate` | bool | false | Should the turret operate automatically using AI targeting? Comes with some optional random movement that can be adjusted below. |
| `AllowAutoOperateWithWiring` | bool | false | Can the Auto Operate functionality be enabled using signals to the turret? |
| `RandomAimAmount` | float | 0 | [Auto Operate] How much the turret should adjust the aim off the target randomly instead of tracking the target perfectly? In Degrees. |
| `RandomAimMinTime` | float | 0 | [Auto Operate] How often the turret should adjust the aim randomly instead of tracking the target perfectly? Minimum wait time, in seconds. |
| `RandomAimMaxTime` | float | 0 | [Auto Operate] How often the turret should adjust the aim randomly instead of tracking the target perfectly? Maximum wait time, in seconds. |
| `RandomMovement` | bool | false | [Auto Operate] Should the turret move randomly while idle? |
| `AimDelay` | bool | false | [Auto Operate] Should the turret have a delay while targeting targets or always aim prefectly? |
| `TargetCharacters` | bool | true | [Auto Operate] Should the turret target characters in general? |
| `TargetMonsters` | bool | true | [Auto Operate] Should the turret target all monsters? |
| `TargetHumans` | bool | true | [Auto Operate] Should the turret target all humans (or creatures in the same group, like pets)? |
| `TargetSubmarines` | bool | true | [Auto Operate] Should the turret target other submarines? |
| `TargetItems` | bool | true | [Auto Operate] Should the turret target items? |
| `FriendlyTag` | Identifier | "" | [Auto Operate] Group or SpeciesName that the AI ignores when the turret is operated automatically. |
| `FriendlyTeamType` | TeamType | "OwnSub" | [Auto Operate] Team that the turret considers friendly. |
| `ShowChargeIndicator` | bool | false | Should the charge of the connected batteries/supercapacitors be shown at the top of the screen when operating the item. |
| `ShowProjectileIndicator` | bool | false | Should the available ammunition be shown at the top of the screen when operating the item. |
| `RecoilDistance` | float | 0 | How far the barrel "recoils back" when the turret is fired (in pixels). |
| `SpinningBarrelDistance` | float | 0 | The distance in which the spinning barrels rotate. Only used if spinning barrels are created. |
| `HideBarrelWhenBroken` | bool | false |  |
| `ChargeSoundWindupPitchSlide` | Vector2 | "0.5, 1.5" | Pitch slides from X to Y over the charge time |

### 子元素

`LightComponent`

### 备注

全批最大属性表（50 项）。属性名 PascalCase 为主，示例里 XML 上写的是小写（如 barrelpos / projectilecount），文档表用 PascalCase —— 两者都能被游戏解析。

---

## 4. `Projectile`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Projectile.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `LaunchImpulse` | float | 10 | The impulse applied to the physics body of the item when it's launched. Higher values make the projectile faster. |
| `ImpulseSpread` | float | 0 | The random percentage modifier used to add variance to the launch impulse. |
| `LaunchRotation` | float | 0 | The rotation of the item relative to the rotation of the weapon when launched (in degrees). |
| `DoesStick` | bool | false | When set to true, the item can stick to any target it hits. |
| `StickToCharacters` | bool | false | Can the projectile stick to characters. |
| `StickToStructures` | bool | false | Can the projectile stick to walls. |
| `StickToItems` | bool | false | Can the projectile stick to items. |
| `StickToDoors` | bool | false | Can the projectile stick to doors. Caution: may cause issues. |
| `StickToDeflective` | bool | false | Can the item stick even to deflective targets. |
| `StickToLightTargets` | bool | false |  |
| `GoThroughLightTargets` | bool | false |  |
| `LightTargetMassThreshold` | float | -1 | Minimum mass of targets to stick to when StickToLightTargets is disabled. Defaults to half of the projectile's mass. |
| `Hitscan` | bool | false | Hitscan projectiles cast a ray forwards and immediately hit whatever the ray hits. It is recommended to use hitscans for very fast-moving projectiles such as bullets, because using extremely fast launch velocities may cause physics glitches. |
| `HitScanCount` | int | 1 | How many hitscans should be done when the projectile is launched. Multiple hitscans can be used to simulate weapons that fire multiple projectiles at the same time without having to actually use multiple projectile items, for example shotguns. |
| `MaxTargetsToHit` | int | 1 | How many targets the projectile can hit before it stops. |
| `RemoveOnHit` | bool | false | Should the item be deleted when it hits something. |
| `Spread` | float | 0 | Random spread applied to the launch angle of the projectile (in degrees). |
| `StaticSpread` | bool | false | Override random spread with static spread; projectiles are launched with an equal amount of angle between them. Only applies when firing multiple projectiles. |
| `FriendlyFire` | bool | true |  |
| `DeactivationTime` | float | 0 |  |
| `StickDuration` | float | 0 |  |
| `MaxJointTranslation` | float | -1 |  |
| `JointBreakPoint` | float | 1000 |  |
| `Prismatic` | bool | true |  |
| `IgnoreProjectilesWhileActive` | bool | false | Enable only if you want to make the projectile ignore collisions with other projectiles when it's shot. Doesn't have any effect, if the item is not set to be damaged by projectiles. |
| `DamageDoors` | bool | false |  |
| `DamageUser` | bool | false | Can the projectile hit the user? Should generally be disabled, unless the projectile is for example something like shrapnel launched by a projectile impact. |

### 子元素

`Attack`, `StatusEffect`

### 备注

示例中 <Attack> 内还有 <Affliction>。部分属性无描述（文档表里留空）。

---

## 5. `Propulsion`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Propulsion.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `UsableIn` | UseEnvironment | Both | Can the item be used in air, underwater or both. |
| `Force` | float | 0 | The force to apply to the user's body. |
| `ApplyToHands` | bool | true | If the item is held in RightHand or LeftHand, apply extra force there |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中 <Propulsion> 为自闭合标签。

---

## 6. `Quality`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Quality.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `QualityLevel` | int | 0 |  |

### 子元素

`QualityStat`

### 备注

示例中 <QualityStat> 带 stattype / value 属性。

---

## 7. `RangedWeapon`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/RangedWeapon.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `BarrelPos` | string | "0.0,0.0" | The position of the barrel as an offset from the item's center (in pixels). Determines where the projectiles spawn. |
| `Reload` | float | 1 | How long the user has to wait before they can fire the weapon again (in seconds). |
| `ReloadSkillRequirement` | float | 0 | Weapons skill requirement to reload at normal speed. |
| `ReloadNoSkill` | float | 1 | Reload time at 0 skill level. Reload time scales with skill level up to the Weapons skill requirement. |
| `HoldTrigger` | bool | false | Tells the AI to hold the trigger down when it uses this weapon |
| `ProjectileCount` | int | 1 | How many projectiles the weapon launches when fired once. |
| `Spread` | float | 0 | Random spread applied to the firing angle of the projectiles when used by a character with sufficient skills to use the weapon (in degrees). |
| `UnskilledSpread` | float | 0 | Random spread applied to the firing angle of the projectiles when used by a character with insufficient skills to use the weapon (in degrees). |
| `LaunchImpulse` | float | 0 | The impulse applied to the physics body of the projectile (the higher the impulse, the faster the projectiles are launched). Sum of weapon + projectile. |
| `Penetration` | float | 0 | Percentage of damage mitigation ignored when hitting armored body parts (deflecting limbs). Sum of weapon + projectile. |
| `WeaponDamageModifier` | float | 1 | Weapon's damage modifier |
| `MaxChargeTime` | float | 0 | The time required for a charge-type turret to charge up before able to fire. |
| `DualWieldReloadTimePenaltyMultiplier` | float | 1 | Penalty multiplier to reload time when dual-wielding. |
| `DualWieldAccuracyPenalty` | float | 0 | Additive penalty to accuracy (spread angle) when dual-wielding. |
| `ChargeSoundWindupPitchSlide` | Vector2 | "0.5, 1.5" | Pitch slides from X to Y over the charge time |
| `CrossHairScale` | float | 1 | The scale of the crosshair sprite (if there is one). |

### 子元素

`Crosshair`, `CrosshairPointer`, `Sound`, `ParticleEmitter`, `StatusEffect`, `RequiredItems`

### 备注

示例中 <RangedWeapon> 还使用了未列在表内的属性：combatPriority、drawhudwhenequipped、suitableprojectiles（表里没有，说明文档表不完整）。

---

## 8. `Sprayer`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Sprayer.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Range` | float | 0 | The distance at which the item can spray walls. |
| `SprayStrength` | float | 1 | How fast the item changes the color of the walls. |

### 子元素

`Crosshair`, `CrosshairPointer`, `ParticleEmitter`, `RequiredItems`, `sound`, `StatusEffect`, `PaintColors`

### 备注

<PaintColors> 内还有 <PaintColor>。继承 RangedWeapon、ItemComponent 的属性。

---

## 9. `RegExFindComponent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/RegExFindComponent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxOutputLength` | int | 200 | The maximum length of the output string. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | "1" | The signal this item outputs when the received signal matches the regular expression. |
| `UseCaptureGroup` | bool | false | Should the component output a value of a capture group instead of a constant signal. |
| `OutputEmptyCaptureGroup` | bool | false | Should the component output the value of a capture group even if it's empty? |
| `FalseOutput` | string | "0" | The signal this item outputs when the received signal does not match the regular expression. |
| `ContinuousOutput` | bool | true | Should the component keep sending the output even after it stops receiving a signal, or only send an output when it receives a signal. |
| `Expression` | string | "" | The regular expression used to check the incoming signals. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

<RegExFindComponent> 在示例中为自闭合标签。

---

## 10. `RemoteController`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/RemoteController.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Target` | Identifier | "" | Tag or identifier of the item that should be controlled. |
| `OnlyInOwnSub` | bool | false |  |
| `Range` | float | 10000 |  |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 11. `Repairable`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Repairable.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `DeteriorationSpeed` | float | 0 | How fast the condition of the item deteriorates per second. |
| `MinDeteriorationDelay` | float | 0 | Minimum initial delay before the item starts to deteriorate. |
| `MaxDeteriorationDelay` | float | 0 | Maximum initial delay before the item starts to deteriorate. |
| `MinDeteriorationCondition` | float | 50 | The item won't deteriorate spontaneously if the condition is below this value. For example, if set to 10, the condition will spontaneously drop to 10 and then stop dropping (unless the item is damaged further by external factors). Percentages of max condition. |
| `MinSabotageCondition` | float | 0 | How low a traitor must get the item's condition for it to start breaking down. |
| `SabotageDeteriorationDuration` | float | 60 | How long will the item spontaneously deteriorate after being sabotaged. |
| `RepairThreshold` | float | 80 | The condition of the item has to be below this for it to become repairable. Percentages of max condition. |
| `MaxStressDeteriorationMultiplier` | float | 1 | How much faster the device can deteriorate when under stress (e.g. when operating at full speed/power). |
| `StressDeteriorationThreshold` | float | 0.5 | At what speed/power must the device be operating at to be considered "under stress". |
| `StressDeteriorationIncreaseSpeed` | float | 0.1 | How fast the deterioration speed increases when under stress. |
| `StressDeteriorationDecreaseSpeed` | float | 0.1 | How fast the deterioration speed decreases when not under stress. |
| `FixDurationLowSkill` | float | 100 | The amount of time it takes to fix the item with insufficient skill levels. |
| `FixDurationHighSkill` | float | 10 | The amount of time it takes to fix the item with sufficient skill levels. |
| `SkillRequirementMultiplier` | float | 1 |  |
| `Description` | string | "" | An optional description of the needed repairs displayed in the repair interface. |

### 子元素

`GuiFrame`, `RequiredSkill`, `RequiredItem`, `ParticleEmitter`

### 备注

—

---

## 12. `RepairTool`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/RepairTool.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `UsableIn` | UseEnvironment | "Both" | Can the item be used in air, water or both. |
| `Range` | float | 0 | The distance at which the item can repair targets. |
| `Spread` | float | 0 | Random spread applied to the firing angle when used by a character with sufficient skills to use the tool (in degrees). |
| `UnskilledSpread` | float | 0 | Random spread applied to the firing angle when used by a character with insufficient skills to use the tool (in degrees). |
| `StructureFixAmount` | float | 0 | How many units of damage the item removes from structures per second. |
| `FireDamage` | float | 0 | How much damage is applied to ballast flora. |
| `LevelWallFixAmount` | float | 0 | How many units of damage the item removes from destructible level walls per second. |
| `ExtinguishAmount` | float | 0 | How much the item decreases the size of fires per second. |
| `WaterAmount` | float | 0 | How much water the item provides to planters per second. |
| `BarrelPos` | Vector2 | "0.0,0.0" | The position of the barrel as an offset from the item's center (in pixels). |
| `RepairThroughWalls` | bool | false | Can the item repair things through walls. |
| `RepairMultiple` | bool | false | Can the item repair multiple things at once, or will it only affect the first thing the ray from the barrel hits. |
| `RepairMultipleWalls` | bool | true | Can the item repair multiple walls at once? Only relevant if RepairMultiple is true. |
| `RepairThroughHoles` | bool | false | Can the item repair things through holes in walls. |
| `MaxOverlappingWallDist` | float | 100 | How far two walls need to not be considered overlapping and to stop the ray. |
| `DeattachSpeed` | float | 1 | How fast the tool detaches level resources (e.g. minerals). Acts as a multiplier on the speed: with a value of 2, detaching an item whose DeattachDuration is set to 30 seconds would take 15 seconds. |
| `HitItems` | bool | true | Can the item hit doors. |
| `HitBrokenDoors` | bool | false | Can the item hit broken doors. |
| `IgnoreCharacters` | bool | false | Should the tool ignore characters? Enabled e.g. for fire extinguisher. |
| `FireProbability` | float | 0 | The probability of starting a fire somewhere along the ray fired from the barrel (for example, 0.1 = 10% chance to start a fire during a second of use). |
| `TargetForce` | float | 0 | Force applied to the entity the ray hits. |
| `BarrelRotation` | float | 0 | Rotation of the barrel in degrees. |

### 子元素

`ParticleEmitter`, `StatusEffect`, `sound`

### 备注

同一物品上可以挂多个 <RepairTool>（示例就是两个，一个灭火、一个灭火苗 affliction）。

---

## 13. `Rope`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Rope.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `SnapAnimDuration` | float | 1 |  |
| `ProjectilePullForce` | float | 0 | How much force is applied to pull the projectile the rope is attached to. |
| `TargetPullForce` | float | 0 | How much force is applied to pull the target the rope is attached to. |
| `SourcePullForce` | float | 0 | How much force is applied to pull the source the rope is attached to. |
| `MaxLength` | float | 1000 | How far the source item can be from the projectile until the rope breaks. |
| `MinPullDistance` | float | 200 | At which distance the user stops pulling the target? |
| `MaxAngle` | float | 360 | The maximum angle from the source to the target until the rope breaks. |
| `SnapOnCollision` | bool | true | Should the rope snap when it collides with a structure/submarine (if not, it will just go through it). |
| `SnapWhenNotAimed` | bool | true | Should the rope snap when the character drops the aim? |
| `SnapWhenWeaponFiredAgain` | bool | true | Should the rope snap when the weapon it was fired from is fired again? I.e. can there be multiple ropes coming from the weapon at the same time? |
| `BarrelLengthMultiplier` | float | 0.9 | Multiplier for the length of the barrel when determining where the rope should start from. |
| `TargetMinMass` | float | 30 | How much mass is required for the target to pull the source towards it. Static and kinematic targets are always treated heavy enough. |
| `LerpForces` | bool | false |  |
| `IncreaseForceForEscapingTargets` | bool | true | Should the force be dynamically adjusted to make it more difficult for targets to escape the pull? |
| `SpriteWidth` | int | 5 |  |
| `SpriteColor` | Color | "255,255,255,255" |  |
| `Tile` | bool | false |  |
| `Origin` | Vector2 | "0.5,0.5" |  |
| `BreakFromMiddle` | bool | true |  |
| `ReelSoundPitchSlide` | Vector2 | "1.0, 1.0" | When reeling in, the pitch slides from X to Y, depending on the length of the rope. |

### 子元素

`Sprite`, `SnapSound`, `ReelSound`, `StatusEffect`

### 备注

—

---

## 14. `Scanner`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Scanner.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `ScanDuration` | float | 1 | How long it takes for the scan to be completed. |
| `ScanTimer` | float | 0 | How far along the scan is. When the timer goes above ScanDuration, the scan is completed. |
| `ScanRadius` | float | 1 | How far the scanner can be from the target for the scan to be successful. |
| `AlwaysDisplayProgressBar` | bool | true | Should the progress bar always be displayed when the item has been attached. |

### 子元素

`StatusEffect`

### 备注

—

---

## 15. `SignalCheckComponent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/SignalCheckComponent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | "1" | The signal this item outputs when the received signal matches the target signal. |
| `FalseOutput` | string | "0" | The signal this item outputs when the received signal does not match the target signal. |
| `TargetSignal` | string | "" | The value to compare the received signals against. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 16. `SmokeDetector`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/SmokeDetector.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | "1" | The signal the item outputs when it has detected a fire. |
| `FalseOutput` | string | "0" | The signal the item outputs when it has not detected a fire. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例用了表里没有的属性 FireSizeThreshold（文档表不完整）。

---

## 17. `StatusHUD`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/StatusHUD.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Range` | float | 500 | How close to a target the user must be to see their health data (in pixels). |
| `FadeOutRange` | float | 50 | The range within which the health info texts fades out. |
| `ThermalGoggles` | bool | false |  |
| `DebugWiring` | bool | false |  |
| `ShowDeadCharacters` | bool | true |  |
| `ShowTexts` | bool | true |  |
| `OverlayColor` | Color | "72,119,72,120" |  |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 18. `ConcatComponent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/ConcatComponent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxOutputLength` | int | 256 | The maximum length of the output string. Warning: Large values can lead to large memory usage or networking load. |
| `Separator` | string | "" |  |
| `TimeFrame` | float | 0 | The item must have received signals to both inputs within this timeframe to output the result. If set to 0, the inputs must be received at the same time. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 19. `Terminal`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Terminal.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `WelcomeMessage` | string | "" | Message to be displayed on the terminal display when it is first opened. |
| `UseMonospaceFont` | bool | false | The terminal will use a monospace font if this box is ticked. |
| `AutoHideScrollbar` | bool | false |  |
| `WelcomeMessageDisplayed` | bool | false |  |
| `TextColor` | Color | "50,205,50,255" | Color of the terminal text. |
| `LineStartSymbol` | string | "> " |  |
| `Readonly` | bool | false |  |
| `AutoScrollToBottom` | bool | true |  |

### 子元素

`GuiFrame`

### 备注

—

---

## 20. `TriggerComponent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/TriggerComponent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Force` | float | 0 | The maximum amount of force applied to the triggering entitites. |
| `DirectionalForce` | Vector2 | "0,0" | The maximum amount of directional force applied to the triggering entitites. |
| `RelativeDirectionalForce` | bool | false | If true, DirectionalForce is relative to the angle between the target and the item, Similar to Force. If false, it always pushes in the same direction, with respect to the item's rotation. |
| `VerticalForce` | bool | true | If false, no vertical force will be applied. |
| `HorizontalForce` | bool | true | If false, no horizontal force will be applied. |
| `DistanceBasedForce` | bool | false | Determines if the force gets higher the closer the triggerer is to the center of the trigger. |
| `ForceFluctuation` | bool | false | Determines if the force fluctuates over time or if it stays constant. |
| `ForceFluctuationStrength` | float | 1 | How much the fluctuation affects the force. 1 is the maximum fluctuation, 0 is no fluctuation. |
| `ForceFluctuationFrequency` | float | 1 | How fast (cycles per second) the force fluctuates. |
| `ForceFluctuationInterval` | float | 0.01 | How often (in seconds) the force fluctuation is calculated. |
| `Radius` | float | 0 |  |
| `Width` | float | 0 |  |
| `Height` | float | 0 |  |
| `BodyOffset` | Vector2 | "0,0" |  |
| `ApplyEffectsToCharactersInsideSub` | bool | false |  |
| `MoveOutsideSub` | bool | false |  |

### 子元素

`StatusEffect`, `Upgrade`, `Attack`, `Conditional`

### 备注

示例用了表里没有的属性 triggeredby、onlyhumans（分别是 TriggerComponent 与 Attack 上的）。一个物品上可叠多个 TriggerComponent（示例叠了三个，形成分层重力场）。

---

## 21. `TrigonometricFunctionComponent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/TrigonometricFunctionComponent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Function` | FunctionType | Sin | Which kind of function to run the input through. |
| `UseRadians` | bool | false | If set to true, the trigonometric function uses radians instead of degrees. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签；Function 允许值未在页面列出（示例用 function="Cos"）。

---

## 22. `Vent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Vent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

（该页无属性表）

### 子元素

`sound`

### 备注

该页无属性表，只有 'This component supports the attributes defined in: ItemComponent' 的继承说明；示例中 <Vent> 内只有一个 <sound>。

---

## 23. `WaterDetector`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/WaterDetector.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | "1" | The signal the item sends out when it's underwater. |
| `FalseOutput` | string | "0" | The signal the item sends out when it's not underwater. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 24. `WifiComponent`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/WifiComponent.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `TeamID` | CharacterTeamType | None | WiFi components can only communicate with components that have the same Team ID. |
| `Range` | float | 20000 | How close the recipient has to be to receive a signal from this WiFi component. |
| `Channel` | int | 0 | WiFi components can only communicate with components that use the same channel. |
| `AllowCrossTeamCommunication` | bool | false | Can the component communicate with wifi components in another team's submarine (e.g. enemy sub in Combat missions, respawn shuttle). Needs to be enabled on both the component transmitting the signal and the component receiving it. |
| `LinkToChat` | bool | false | If enabled, any signals received from another chat-linked wifi component are displayed as chat messages in the chatbox of the player holding the item. |
| `MinChatMessageInterval` | float | 1 | How many seconds have to pass between signals for a message to be displayed in the chatbox. Setting this to a very low value is not recommended, because it may cause an excessive amount of chat messages to be created if there are chat-linked wifi components that transmit a continuous signal. |
| `DiscardDuplicateChatMessages` | bool | false | If set to true, the component will only create chat messages when the received signal changes. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 25. `Wire`

- URL：https://regalis11.github.io/BaroModDoc/ItemComponents/Wire.html
- HTTP 状态：200
- 用途：（页面无用途说明句）

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Width` | float | 0.3 |  |
| `MaxLength` | float | 5000 | The maximum distance the wire can extend (in pixels). |
| `HiddenInGame` | bool | false | If enabled, the wire will not be visible in connection panels outside the submarine editor. |
| `NoAutoLock` | bool | false | If enabled, this wire will be ignored by the "Lock all default wires" setting. |
| `UseSpriteDepth` | bool | false | If enabled, this wire will use the sprite depth instead of a constant depth. |
| `DropOnConnect` | bool | true | If disabled, the wire will not be dropped when connecting. Used in circuit box to store the wires inside the box. |

### 子元素

（示例中该组件为自闭合标签，无子元素）

### 备注

示例中为自闭合标签。

---

## 抓取失败的页面

无。全部 25 页均返回 HTTP 200。
