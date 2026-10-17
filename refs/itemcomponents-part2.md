# ItemComponents 第 2 批（30 个页面）参考

- 来源：<https://regalis11.github.io/BaroModDoc/ItemComponents/>
- 抓取方式：逐页 HTTP GET 官方文档页，本批 30 个页面全部返回 HTTP 200，无失败页面。
- 结构：每个组件页统一为 `<h1>组件名</h1>` + `Attributes` 表（列：Attribute / Type / Default value / Description）+ `also supports` 继承行 + `Example` 代码块，**没有**独立的“用途说明”段落，也**没有**独立的子元素（sub-element）小节。
- 因此本文件：`purpose` 一律为空（页面确实没有该内容，未做推测）；`children` 只收录**页面 XML 示例中该组件元素的直接子元素**，原样保留大小写；属性名一律逐字照抄页面表格。

## 目录

- [ModuloComponent](#modulocomponent) — 属性 1 条，示例直接子元素 0 个
- [MotionSensor](#motionsensor) — 属性 13 条，示例直接子元素 0 个
- [NameTag](#nametag) — 属性 1 条，示例直接子元素 0 个
- [NotComponent](#notcomponent) — 属性 1 条，示例直接子元素 0 个
- [OscillatorComponent](#oscillatorcomponent) — 属性 2 条，示例直接子元素 0 个
- [OutpostTerminal](#outpostterminal) — 属性 0 条，示例直接子元素 0 个
- [OxygenDetector](#oxygendetector) — 属性 0 条，示例直接子元素 0 个
- [Pickable](#pickable) — 属性 0 条，示例直接子元素 1 个
- [Door](#door) — 属性 12 条，示例直接子元素 7 个
- [Holdable](#holdable) — 属性 26 条，示例直接子元素 0 个
- [MeleeWeapon](#meleeweapon) — 属性 7 条，示例直接子元素 1 个
- [Throwable](#throwable) — 属性 1 条，示例直接子元素 0 个
- [IdCard](#idcard) — 属性 15 条，示例直接子元素 0 个
- [Planter](#planter) — 属性 2 条，示例直接子元素 3 个
- [Wearable](#wearable) — 属性 1 条，示例直接子元素 1 个
- [Powered](#powered) — 属性 6 条，示例直接子元素 1 个
- [Deconstructor](#deconstructor) — 属性 6 条，示例直接子元素 4 个
- [ElectricalDischarger](#electricaldischarger) — 属性 7 条，示例直接子元素 2 个
- [Engine](#engine) — 属性 3 条，示例直接子元素 4 个
- [Fabricator](#fabricator) — 属性 8 条，示例直接子元素 4 个
- [LightComponent](#lightcomponent) — 属性 14 条，示例直接子元素 2 个
- [MiniMap](#minimap) — 属性 7 条，示例直接子元素 3 个
- [OxygenGenerator](#oxygengenerator) — 属性 1 条，示例直接子元素 3 个
- [PowerContainer](#powercontainer) — 属性 13 条，示例直接子元素 2 个
- [PowerTransfer](#powertransfer) — 属性 4 条，示例直接子元素 0 个
- [PowerDistributor](#powerdistributor) — 属性 0 条，示例直接子元素 2 个
- [RelayComponent](#relaycomponent) — 属性 2 条，示例直接子元素 1 个
- [Pump](#pump) — 属性 5 条，示例直接子元素 5 个
- [Reactor](#reactor) — 属性 17 条，示例直接子元素 13 个
- [Sonar](#sonar) — 属性 7 条，示例直接子元素 13 个

## ModuloComponent

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/ModuloComponent.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（1 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `Modulus` | float | 1 | The modulus of the operation. Must be non-zero. |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent

- 示例（截断）：

```xml
<Item identifier="modulocomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#1745b7">
  <ModuloComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem identifier="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <input name="set_modulus" displayname="connection.setmodulus" />
    <output name="sign
```

## MotionSensor

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/MotionSensor.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（13 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `MotionDetected` | bool | false | Has the item currently detected movement. Intended to be used by StatusEffect conditionals (setting this value in XML has no effect). |
| `Target` | TargetType | Any | Which kind of targets can trigger the sensor? |
| `TargetCharacters` | string | "" | Does the sensor react only to certain characters (species names, groups or tags)? Doesn't have an effect, if the Target Type is incorrect. |
| `IgnoreDead` | bool | false | Should the sensor ignore the bodies of dead characters? |
| `RangeX` | float | 0 | Horizontal detection range. |
| `RangeY` | float | 0 | Vertical movement detection range. |
| `DetectOffset` | Vector2 | "0,0" | The position to detect the movement at relative to the item. For example, 0,100 would detect movement 100 units above the item. |
| `UpdateInterval` | float | 0.1 | How often the sensor checks if there's something moving near it. Higher values are better for performance. |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | "1" | The signal the item outputs when it has detected movement. |
| `FalseOutput` | string | "0" | The signal the item outputs when it has not detected movement. |
| `MinimumVelocity` | float | 0 | How fast the objects within the detector's range have to be moving (in m/s). |
| `DetectOwnMotion` | bool | true | Should the sensor trigger when the item itself moves. |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent

- 示例（截断）：

```xml
<Item identifier="alienmotionsensor" category="Alien" subcategory="devices" Tags="alien,alienmotionsensor" scale="0.5" damagedbyexplosions="true" damagedbymeleeweapons="true" damagedbyprojectiles="true" damagedbyrepairtools="true" health="100">
  <MotionSensor range="75" output="0" onlyhumans="true" ignoredead="true" />
  <ConnectionPanel canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10" locked="True" allowingameediting="False">
    <RequiredItem items="screwdriver" type="Equipped" />
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <output name="state_out" displayname="connection.stateout" fallbackdisplayname="connection.signalout" />
    <input name="toggle" displayname="connection.togglestate" />

```

## NameTag

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/NameTag.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（1 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `WrittenName` | string | "" | Name written on the tag. |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent

- 示例（截断）：

```xml
<Item identifier="petnametag" category="Equipment" Tags="smallitem" cargocontaineridentifier="metalcrate">
  <NameTag />
  [...]
</Item>
```

## NotComponent

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/NotComponent.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（1 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `ContinuousOutput` | bool | false | When enabled, the component continuously outputs "1" when it's not receiving a signal. |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent

- 示例（截断）：

```xml
<Item identifier="notcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#ad7a79">
  <NotComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
  [...]
</Ite
```

## OscillatorComponent

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/OscillatorComponent.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（2 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `OutputType` | WaveType | Pulse | What kind of a signal the item outputs. Pulse: periodically sends out a signal of 1. Sawtooth: sends out a periodic wave that increases linearly from 0 to 1. Sine: sends out a sine wave oscillating be... |
| `Frequency` | float | 1 | How fast the signal oscillates, or how fast the pulses are sent (in Hz). |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent

- 示例（截断）：

```xml
<Item identifier="oscillator" category="Electrical" Tags="smallitem,signal,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#987c6c">
  <OscillatorComponent canbeselected="true" outputtype="Pulse" frequency="1" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="set_frequency" displayname="connection.setfrequency" />
    <input name="set_outputtype" displayname="connectio
```

## OutpostTerminal

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/OutpostTerminal.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表：无（该页只有 `also supports` 继承行）

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent；该页无属性表

- 示例（截断）：

```xml
<Item identifier="outpostterminal" category="Machine" Tags="smallitem" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true">
  <OutpostTerminal canbeselected="true" msg="ItemMsgInteractSelect" AllowInGameEditing="false" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem identifier="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
  [...]
</Item>
```

## OxygenDetector

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/OxygenDetector.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表：无（该页只有 `also supports` 继承行）

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：ItemComponent；该页无属性表

- 示例（截断）：

```xml
<Item identifier="oxygendetector" category="Electrical" Tags="smallitem,sensor" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true">
  <OxygenDetector canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <output name="signal_out" displayname="connection.signalout" />
    <output name="low_oxygen" displayname="connection.low_oxygen" />
  </ConnectionPanel>
  [...]
</Item>
```

## Pickable

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Pickable.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表：无（该页只有 `also supports` 继承行）

- 子元素（取自示例）：`StatusEffect`
- 备注：无用途说明句；继承（also supports）：ItemComponent；该页无属性表

- 示例（截断）：

```xml
<Item nameidentifier="defensebotspawner" identifier="placeabledefensebotspawner" descriptionidentifier="" category="Machine">
  <Pickable slots="Any">
    <StatusEffect type="Always" targettype="This">
      <RemoveItem />
      <SpawnCharacter speciesname="Defensebot" totalmaxcount="2" inheritteam="true" />
    </StatusEffect>
  </Pickable>
  [...]
</Item>
```

## Door

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Door.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（12 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `IsStuck` | bool | false |  |
| `Stuck` | float | 0 | How badly stuck the door is (in percentages). If the percentage reaches 100, the door needs to be cut open to make it usable again. |
| `OpeningSpeed` | float | 3 | How quickly the door opens. |
| `ClosingSpeed` | float | 3 | How quickly the door closes. |
| `ToggleCoolDown` | float | 1 | The door cannot be opened/closed during this time after it has been opened/closed by another character. |
| `Window` | Rectangle | "0.0,0.0,0.0,0.0" | Position and size of the window on the door. The upper left corner is 0,0. Set the width and height to 0 if you don't want the door to have a window. |
| `IsOpen` | bool | false | Is the door currently open. |
| `HasIntegratedButtons` | bool | false | If the door has integrated buttons, it can be opened by interacting with it directly (instead of using buttons wired to it). |
| `ToggleWhenClicked` | bool | true | If the door has integrated buttons, should clicking on it perform the default action of opening the door? Can be used in conjunction with the "activate_out" output to pass a signal to a circuit withou... |
| `Impassable` | bool | false | Characters and items cannot pass through impassable doors. Useful for things such as ducts that should only let water and air through. |
| `UseBetweenOutpostModules` | bool | true |  |
| `BotsShouldKeepOpen` | bool | false | If true, bots won't try to close this door behind them. |

- 子元素（取自示例）：`Upgrade`, `RequiredItem`, `Sprite`, `WeldedSprite`, `BrokenSprite`, `sound`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="door" tags="door,weldable" category="misc" subcategory="doorsandhatches" scale="0.5" health="100" damagedbyrepairtools="true" damagedbymonsters="true" damagedbyexplosions="true" damagedbyprojectiles="true" damagedbymeleeweapons="true" ShowNameInHealthBar="false" explosiondamagemultiplier="0.1" allowrotatingineditor="false" allowedlinks="structure,item" ondamagedthreshold="2" linkable="true">
  <Door canbeselected="true" canbepicked="true" pickkey="Action" msg="ItemMsgForceOpenCrowbar" PickingTime="7.5" shadowscale="0.7,1">
    <Upgrade gameversion="0.22.0.0" PickingTime="7.5" />
    <RequiredItem items="crowbar" type="Equipped" />
    <Sprite texture="door.png" sourcerect="158,0,42,416" depth="0.05" origin="0.5,0.0" />
    <WeldedSprite texture="door.png" sourcerect="203,
```

## Holdable

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Holdable.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（26 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `CanPush` | bool | true | Is the item currently able to push characters around? True by default. Only valid if blocksplayers is set to true. |
| `Attached` | bool | false | Is the item currently attached to a wall (only valid if Attachable is set to true). |
| `Aimable` | bool | true | Can the item be pointed to a specific direction or do the characters always hold it in a static pose. |
| `CameraAimOffset` | float | 0 | Camera offset to apply when aiming this item. Only valid if Aimable is set to true. |
| `ControlPose` | bool | false | Should the character adjust its pose when aiming with the item. Most noticeable underwater, where the character will rotate its entire body to face the direction the item is aimed at. |
| `UseHandRotationForHoldAngle` | bool | false | Use the hand rotation instead of torso rotation for the item hold angle. Enable this if you want the item just to follow with the arm when not aiming instead of forcing the arm to a hold pose. |
| `Attachable` | bool | false | Can the item be attached to walls. |
| `Reattachable` | bool | true | Can the item be reattached to walls after it has been deattached (only valid if Attachable is set to true). |
| `LimitedAttachable` | bool | false | Can the item only be attached in limited amount? Uses permanent stat values to check for legibility. |
| `AttachesToFloor` | bool | false | When enabled, the item can only be attached to a position where it touches the floor. |
| `AllowAttachInsideDoors` | bool | true | Can the item be attached inside doors? |
| `DisallowAttachingOverTags` | string | "" |  |
| `AttachedByDefault` | bool | false | Should the item be attached to a wall by default when it's placed in the submarine editor. |
| `HoldPos` | Vector2 | "0.0,0.0" | The position the character holds the item at (in pixels, as an offset from the character's shoulder). For example, a value of 10,-100 would make the character hold the item 100 pixels below the should... |
| `AimPos` | Vector2 | "0.0,0.0" | The position the character holds the item at when aiming (in pixels, as an offset from the character's shoulder). Works similarly as HoldPos, except that the position is rotated according to the direc... |
| `HoldAngle` | float | 0 |  |
| `AimAngle` | float | 0 |  |
| `SwingAmount` | Vector2 | "0.0,0.0" |  |
| `SwingSpeed` | float | 0 |  |
| `SwingWhenHolding` | bool | false |  |
| `SwingWhenAiming` | bool | false |  |
| `SwingWhenUsing` | bool | false |  |
| `DisableHeadRotation` | bool | false |  |
| `DisableWhenRangedWeaponEquipped` | bool | false | If true, this item can't be used if the character is also holding a ranged weapon. |
| `SpriteDepthWhenDropped` | float | 0.55 | Sprite depth that's used when the item is NOT attached to a wall. |
| `MsgWhenDropped` | string | "" | A text displayed next to the item when it's been dropped on the floor (not attached to a wall). |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="smallplanter" category="Misc" Tags="planter,mediumitem,dontsellitems" scale="0.5" isshootable="true">
  <Holdable selectkey="Select" pickkey="Use" slots="Any,RightHand,LeftHand" msg="ItemMsgDetach" MsgWhenDropped="ItemMsgPickupSelect" PickingTime="5.0" aimpos="85,-10" handle1="0,0" attachable="true" aimable="true" AttachesToFloor="true" DisallowAttachingOverTags="container,planter" />
  <ItemContainer capacity="1" maxstacksize="1" hideitems="true" drawinventory="false" uilabel="" allowuioverlap="true" allowdraganddrop="false" showcontainedstateindicator="false">
    <Containable items="seed" />
  </ItemContainer>
  <LightComponent range="10.0" lightcolor="255,255,255,0" IsOn="true" castshadows="false" allowingameediting="false">
    <sprite texture="Content/Items/Gardenin
```

## MeleeWeapon

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/MeleeWeapon.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（7 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `Range` | float | 0 | An estimation of how close the item has to be to the target for it to hit. Used by AI characters to determine when they're close enough to hit a target. |
| `Reload` | float | 0.5 | How long the user has to wait before they can hit with the weapon again (in seconds). |
| `AllowHitMultiple` | bool | false | Can the weapon hit multiple targets per swing. |
| `HitOnlyCharacters` | bool | false | Disable to make the weapon ignore all hit effects when it collides with walls, doors, or other items. |
| `Swing` | bool | true |  |
| `SwingPos` | Vector2 | "2.0, 0.0" |  |
| `SwingForce` | Vector2 | "3.0, -1.0" |  |

- 子元素（取自示例）：`Attack`
- 备注：无用途说明句；继承（also supports）：Holdable、Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="spinelingspikeloot" category="Weapon" tags="smallitem" cargocontaineridentifier="metalcrate" impactsoundtag="impact_metal_light" scale="0.5" allowasextracargo="true" RequireAimToUse="True" nameidentifier="spinelingspike" translationidentifier="spinelingspike">
  <MeleeWeapon slots="Any,RightHand,LeftHand" aimpos="30,5" handle1="-20,0" holdangle="65" reload="1.0" range="50" combatpriority="10" msg="ItemMsgPickUpSelect">
    <Attack targetimpulse="2" severlimbsprobability="0.1" itemdamage="2" structuredamage="2" structuresoundtype="StructureSlash">
      <Affliction identifier="lacerations" strength="5" />
      <Affliction identifier="bleeding" strength="10" />
      <Affliction identifier="stun" strength="0.2" />
      <StatusEffect type="OnUse" target="UseTarget">
      
```

## Throwable

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Throwable.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（1 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `ThrowForce` | float | 1 | The impulse applied to the physics body of the item when thrown. Higher values make the item be thrown faster. |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：Holdable、Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="rituallantern" category="Equipment" maxstacksize="12" cargocontaineridentifier="metalcrate" Scale="0.5" tags="smallitem,light,huskcult" impactsoundtag="impact_soft" isshootable="true">
  <Throwable slots="Any,RightHand,LeftHand" holdpos="70,-70" handle1="-5,10" holdangle="0" throwforce="3.5" aimpos="30,-30" msg="ItemMsgPickUpSelect" />
  <LightComponent LightColor="219,100,239,80" Flicker="0.2" pulsefrequency="0.2" pulseamount="0.5" range="600" IsOn="false">
    <StatusEffect type="OnUse" targettype="This" IsOn="true" />
    <StatusEffect type="OnActive" targettype="This" Condition="-0.25" />
    <StatusEffect type="OnActive" targettype="This">
      <Conditional PhysicsBodyActive="eq true" />
      <ParticleEmitter particle="flare" particlespersecond="15" scalemin="0.1" 
```

## IdCard

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/IdCard.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（15 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `TeamID` | CharacterTeamType | None |  |
| `SubmarineSpecificID` | int | 0 |  |
| `OwnerTags` | string | "" |  |
| `Description` | string | "" |  |
| `OwnerName` | string | "" |  |
| `OwnerNameLocalized` | string | "" |  |
| `OwnerJobId` | Identifier | "" |  |
| `OwnerHairIndex` | int | -1 |  |
| `OwnerBeardIndex` | int | -1 |  |
| `OwnerMoustacheIndex` | int | -1 |  |
| `OwnerFaceAttachmentIndex` | int | -1 |  |
| `OwnerHairColor` | Color | "#ffffff" |  |
| `OwnerFacialHairColor` | Color | "#ffffff" |  |
| `OwnerSkinColor` | Color | "#ffffff" |  |
| `OwnerSheetIndex` | Vector2 | "0,0" |  |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="idcard" category="Equipment" Tags="smallitem,identitycard" cargocontaineridentifier="metalcrate">
  <IdCard slots="Card,Any" msg="ItemMsgPickUpSelect" />
  [...]
</Item>
```

## Planter

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Planter.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（2 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `Fertilizer` | float | 0 | How much fertilizer the planter has. |
| `FertilizerCapacity` | float | 100 | How much fertilizer can the planter hold. |

- 子元素（取自示例）：`PlantSlot`, `SuitableFertilizer`, `SuitableSeed`
- 备注：无用途说明句；继承（also supports）：Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="smallplanter" category="Misc" Tags="planter,mediumitem,dontsellitems" scale="0.5" isshootable="true">
  <Planter selectkey="Select" canbepicked="true" pickingtime="5.0" msg="ItemMsgPlantSeed">
    <PlantSlot slot="0" offset="0,32" size="0.25" />
    <SuitableFertilizer items="fertilizer" />
    <SuitableSeed items="seed" />
  </Planter>
  <Holdable selectkey="Select" pickkey="Use" slots="Any,RightHand,LeftHand" msg="ItemMsgDetach" MsgWhenDropped="ItemMsgPickupSelect" PickingTime="5.0" aimpos="85,-10" handle1="0,0" attachable="true" aimable="true" AttachesToFloor="true" DisallowAttachingOverTags="container,planter" />
  <ItemContainer capacity="1" maxstacksize="1" hideitems="true" drawinventory="false" uilabel="" allowuioverlap="true" allowdraganddrop="false" showcontained
```

## Wearable

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Wearable.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（1 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `AllowUseWhenWorn` | bool | false | Can the item be used (assuming it has components that are usable in some way) when worn. |

- 子元素（取自示例）：`sprite`
- 备注：无用途说明句；继承（also supports）：Pickable、ItemComponent

- 示例（截断）：

```xml
<Item identifier="toolbelt" category="Equipment" tags="mediumitem,mobilecontainer,tool" showcontentsintooltip="true" Scale="0.5" fireproof="true" impactsoundtag="impact_soft">
  <Wearable slots="Bag" msg="ItemMsgEquipSelect" canbeselected="false" canbepicked="true" pickkey="Select">
    <sprite name="ToolBelt" texture="Content/Items/Tools/tools.png" sourcerect="256,102,112,54" limb="Torso" inherittexturescale="true" origin="0.5,-0.2" />
  </Wearable>
  <Holdable slots="RightHand+LeftHand" holdpos="0,-70" handle1="-5,0" handle2="10,-20" holdangle="0" msg="ItemMsgPickUpUse" canbeselected="false" canbepicked="true" pickkey="Use" allowswappingwhenpicked="false" />
  [...]
</Item>
```

## Powered

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Powered.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（6 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `MinVoltage` | float | 0.5 | The minimum voltage required for the device to function. The voltage is calculated as power / powerconsumption, meaning that a device with a power consumption of 1000 kW would need at least 500 kW of... |
| `PowerConsumption` | float | 0 | How much power the device draws (or attempts to draw) from the electrical grid when active. |
| `IsActive` | bool | false | Is the device currently active. Inactive devices don't consume power. |
| `CurrPowerConsumption` | float | 0 | The current power consumption of the device. Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended). |
| `Voltage` | float | 0 | The current voltage of the item (calculated as power consumption / available power). Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended). |
| `VulnerableToEMP` | bool | true | Can the item be damaged by electomagnetic pulses. |

- 子元素（取自示例）：`GuiFrame`
- 备注：无用途说明句；继承（also supports）：ItemComponent

- 示例（截断）：

```xml
<Item identifier="divingsuitlocker" category="Diving" tags="container,divingsuitcontainer,divingsuitcontainerwindow" pickdistance="50" scale="0.5">
  <Powered powerconsumption="10" currpowerconsumption="10" isactive="true">
    <GuiFrame relativesize="0.18,0.15" minsize="350,160" maxsize="420,192" anchor="Center" relativeoffset="0,-0.1" style="ItemUI" msg="ItemMsgInteractSelect" />
  </Powered>
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredSkill identifier="electrical" level="25" />
    <StatusEffect type="OnFailure" target="Character" targetlimbs="LeftHand,RightHand" AllowWhenBroken="true">
      <So
```

## Deconstructor

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Deconstructor.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（6 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `DeconstructItemsSimultaneously` | bool | false |  |
| `DeconstructionSpeed` | float | 1 |  |
| `ActivateButtonText` | string | "DeconstructorDeconstruct" |  |
| `InfoText` | string | "" |  |
| `InfoAreaWidth` | float | 0 |  |
| `ShowOutput` | bool | true |  |

- 子元素（取自示例）：`GuiFrame`, `sound`, `poweronsound`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="deconstructor" tags="deconstructor,donttakeitems,dontsellitems" category="Machine" linkable="true" allowedlinks="fabricator,medicalfabricator,locker" scale="0.5" damagedbyexplosions="true" explosiondamagemultiplier="0.2">
  <Deconstructor canbeselected="true" powerconsumption="500.0" msg="ItemMsgInteractSelect">
    <GuiFrame relativesize="0.25,0.37" minsize="320,266" style="ItemUI" anchor="Center" />
    <sound file="Content/Items/Fabricators/Deconstructor.ogg" type="OnActive" range="1000.0" volumeproperty="RelativeVoltage" loop="true" />
    <poweronsound file="Content/Items/PowerOnLight3.ogg" range="600" loop="false" />
    <StatusEffect type="InWater" target="This" condition="-0.5" />
  </Deconstructor>
  <ConnectionPanel selectkey="Action" canbeselected="true" hudpri
```

## ElectricalDischarger

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/ElectricalDischarger.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（7 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `Range` | float | 500 | How far the discharge can travel from the item. |
| `RangeMultiplierInWalls` | float | 25 | How much further can the discharge be carried when moving across walls. |
| `RaycastRange` | float | 0 |  |
| `Duration` | float | 0.25 | The duration of an individual discharge (in seconds). |
| `Reload` | float | 0.25 |  |
| `OutdoorsOnly` | bool | false | If set to true, the discharge cannot travel inside the submarine nor shock anyone inside. |
| `IgnoreUser` | bool | false |  |

- 子元素（取自示例）：`Attack`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="dischargecoil" tags="dischargecoil" category="Machine,Weapon" subcategory="subweapons" Scale="0.5">
  <ElectricalDischarger duration="0.25" outdoorsonly="true" powerconsumption="10000">
    <Attack targetimpulse="50">
      <Affliction identifier="stun" strength="8" />
      <Affliction identifier="electricshock" strength="80" />
      <Affliction identifier="burn" strength="10" />
    </Attack>
    <StatusEffect type="OnUse" target="This">
      <sound file="Content/Items/Weapons/WEAPONS_electricalDischarge1.ogg" range="20000" selectionmode="random" />
      <sound file="Content/Items/Weapons/WEAPONS_electricalDischarge2.ogg" range="20000" />
      <ParticleEmitter particle="risingbubbles" anglemin="0" anglemax="360" particleamount="50" velocitymin="50" velocitymax="100"
```

## Engine

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Engine.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（3 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `MaxForce` | float | 500 | The amount of force exerted on the submarine when the engine is operating at full power. |
| `PropellerPos` | Vector2 | "0.0,0.0" | The position of the propeller as an offset from the item's center (in pixels). Determines where the particles spawn and the position that causes characters to take damage from the engine if the Propel... |
| `DisablePropellerDamage` | bool | false |  |

- 子元素（取自示例）：`Upgrade`, `GuiFrame`, `sound`, `propellerdamage`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="shuttleengine" tags="engine" category="Machine" Scale="0.5" damagedbyexplosions="true" explosiondamagemultiplier="0.2" GrabWhenSelected="true">
  <Engine minvoltage="0.5" powerconsumption="500.0" maxforce="300" canbeselected="true" propellerpos="-200,0" msg="ItemMsgInteractSelect">
    <Upgrade gameversion="0.11.0.9" propellerpos="-200,0" />
    <GuiFrame relativesize="0.2,0.18" minsize="450,200" anchor="Center" style="ItemUI" />
    <sound file="Content/Items/Engine/Engine.ogg" type="OnActive" range="3000.0" volumeproperty="CurrentVolume" loop="true" />
    <sound file="Content/Items/Engine/EngineBroken.ogg" type="Always" range="6000.0" volumeproperty="CurrentBrokenVolume" loop="true" />
    <propellerdamage damagerange="30" targetforce="500" severlimbsprobability="1.0">
```

## Fabricator

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Fabricator.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（8 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `FabricationSpeed` | float | 1 |  |
| `SkillRequirementMultiplier` | float | 1 |  |
| `AmountToFabricate` | int | 1 |  |
| `CreateButtonText` | string | "FabricatorCreate" |  |
| `FabricationLimitReachedText` | string | "vendingmachine.outofstock" |  |
| `ShowSortByDropdown` | bool | true |  |
| `ShowAvailableOnlyTickBox` | bool | true |  |
| `ShowCategoryButtons` | bool | true |  |

- 子元素（取自示例）：`GuiFrame`, `sound`, `poweronsound`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="medicalfabricator" tags="medicalfabricator,donttakeitems,dontsellitems" category="Machine" linkable="true" allowedlinks="deconstructor,medcabinet,locker,toxcontainer" scale="0.5" damagedbyexplosions="true" explosiondamagemultiplier="0.2">
  <Fabricator canbeselected="true" powerconsumption="500.0" msg="ItemMsgInteractSelect">
    <GuiFrame relativesize="0.4,0.6" style="ItemUI" anchor="Center" />
    <sound file="Content/Items/Fabricators/Fabricator.ogg" type="OnActive" range="1000.0" volumeproperty="RelativeVoltage" loop="true" />
    <poweronsound file="Content/Items/PowerOnLight2.ogg" range="600" loop="false" />
    <StatusEffect type="InWater" target="This" condition="-0.5" />
  </Fabricator>
  <ConnectionPanel selectkey="Action" canbeselected="true" hudpriority="10" m
```

## LightComponent

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/LightComponent.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（14 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `Range` | float | 100 | The range of the emitted light. Higher values are more performance-intensive. |
| `CastShadows` | bool | true | Should structures cast shadows when light from this light source hits them. Disabling shadows increases the performance of the game, and is recommended for lights with a short range. Lights that are s... |
| `DrawBehindSubs` | bool | false | Lights drawn behind submarines don't cast any shadows and are much faster to draw than shadow-casting lights. It's recommended to enable this on decorative lights outside the submarine's hull. |
| `IsOn` | bool | false | Is the light currently on. |
| `Flicker` | float | 0 | How heavily the light flickers. 0 = no flickering, 1 = the light will alternate between completely dark and full brightness. |
| `FlickerSpeed` | float | 1 | How fast the light flickers. |
| `PulseFrequency` | float | 0 | How rapidly the light pulsates (in Hz). 0 = no blinking. |
| `PulseAmount` | float | 0 | How much light pulsates (in Hz). 0 = not at all, 1 = alternates between full brightness and off. |
| `BlinkFrequency` | float | 0 | How rapidly the light blinks on and off (in Hz). 0 = no blinking. |
| `LightColor` | Color | "255,255,255,255" | The color of the emitted light (R,G,B,A). |
| `IgnoreContinuousToggle` | bool | false | If enabled, the component will ignore continuous signals received in the toggle input (i.e. a continuous signal will only toggle it once). |
| `AlphaBlend` | bool | true | Should the light sprite be drawn on the item using alpha blending, in addition to being rendered in the light map? Can be used to make the light sprite stand out more. |
| `LightOffset` | Vector2 | "0,0" | Offset of the light from the position of the item (in pixels). |
| `LightSpriteScale` | float | 1 | The scale of the light sprite. |

- 子元素（取自示例）：`LightTexture`, `sprite`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="lightcomponent" category="Electrical" Tags="smallitem,lightcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true">
  <LightComponent canbeselected="true" color="255,0.0,0.0,127" alphablend="true" castshadows="false">
    <LightTexture texture="Content/Lights/pointlight_bounce.png" origin="0.5,0.5" />
    <sprite texture="Content/Items/Electricity/signalcomp.png" sourcerect="228,3,23,24" origin="0.38,0.5" />
  </LightComponent>
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="Connecti
```

## MiniMap

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/MiniMap.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（7 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `RequireWaterDetectors` | bool | false | Does the machine require inputs from water detectors in order to show the water levels inside rooms. |
| `RequireOxygenDetectors` | bool | true | Does the machine require inputs from oxygen detectors in order to show the oxygen levels inside rooms. |
| `ShowHullIntegrity` | bool | true | Should damaged walls be displayed by the machine. |
| `EnableHullStatus` | bool | true | Enable hull status mode. |
| `EnableElectricalView` | bool | true | Enable electrical view mode. |
| `EnableItemFinder` | bool | true | Enable item finder mode. |
| `IsUsableOutsidePlayerSub` | bool | false | If this item is portable, should it be usable outside the player submarine? |

- 子元素（取自示例）：`GuiFrame`, `AlternativeLayout`, `poweronsound`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="statusmonitor" tags="command,statusmonitor" aliases="MiniMap" category="Machine,Electrical" linkable="true" scale="0.5" allowedlinks="navterminal" damagedbyexplosions="true" explosiondamagemultiplier="0.2" GrabWhenSelected="true">
  <MiniMap MinVoltage="0.5" PowerConsumption="100" canbeselected="true" msg="ItemMsgInteractSelect" allowuioverlap="true">
    <GuiFrame relativesize="0.5,0.5" anchor="Center" style="ItemUI" />
    <AlternativeLayout relativesize="0.2725,0.3" anchor="CenterLeft" pivot="BottomLeft" relativeoffset="0.05,-0.001" />
    <poweronsound file="Content/Items/PowerOnLight3.ogg" range="1000" loop="false" />
  </MiniMap>
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.
```

## OxygenGenerator

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/OxygenGenerator.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（1 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `GeneratedAmount` | float | 400 | How much oxygen the machine generates when operating at full power. |

- 子元素（取自示例）：`poweronsound`, `sound`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item nameidentifier="oxygenerator" identifier="outpostoxygenerator" tags="oxygengenerator" category="Machine" linkable="true" allowedlinks="vent" damagedbyexplosions="true" scale="0.5" explosiondamagemultiplier="0.2">
  <OxygenGenerator powerconsumption="1000.0" minvoltage="0.5" generatedamount="5000" canbeselected="true" msg="ItemMsgInteractSelect">
    <poweronsound file="Content/Items/PowerOnLight2.ogg" range="1500" loop="false" />
    <sound file="Content/Items/OxygenGenerator/OxygenGenerator.ogg" type="OnActive" range="1000.0" volumeproperty="CurrFlow" volume="0.001" loop="true" />
    <StatusEffect type="OnFire" target="This" Condition="-0.5" />
    <StatusEffect type="OnActive" targettype="Contained" targets="oxygentank" Condition="2.0" />
    <StatusEffect type="OnBroken" targetty
```

## PowerContainer

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/PowerContainer.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（13 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `IndicatorPosition` | Vector2 | "0,0" | The position of the progress bar indicating the charge of the item. In pixels as an offset from the upper left corner of the sprite. |
| `IndicatorSize` | Vector2 | "0,0" | The size of the progress bar indicating the charge of the item (in pixels). |
| `IsHorizontal` | bool | false | Should the progress bar indicating the charge of the item fill up horizontally or vertically. |
| `MaxOutPut` | float | 10 | Maximum output of the device when fully charged (kW). |
| `Capacity` | float | 10 | The maximum capacity of the device (kW * min). For example, a value of 1000 means the device can output 100 kilowatts of power for 10 minutes, or 1000 kilowatts for 1 minute. |
| `Charge` | float | 0 | The current charge of the device. |
| `MaxRechargeSpeed` | float | 10 | How fast the device can be recharged. For example, a recharge speed of 100 kW and a capacity of 1000 kW*min would mean it takes 10 minutes to fully charge the device. |
| `RechargeSpeed` | float | 0 | The current recharge speed of the device. |
| `ExponentialRechargeSpeed` | bool | false | If true, the recharge speed (and power consumption) of the device goes up exponentially as the recharge rate is increased. |
| `Efficiency` | float | 0.95 | The amount of power you can get out of a item relative to the amount of power that's put into it. |
| `FlipIndicator` | bool | false | Should the progress bar indicating the charge be flipped to fill from the other side. |
| `RechargeWarningIndicatorLow` | float | 0 |  |
| `RechargeWarningIndicatorHigh` | float | 0 |  |

- 子元素（取自示例）：`GuiFrame`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="shuttlebattery" tags="battery,batterycellrecharger" category="Electrical,Machine" Scale="0.5" damagedbyexplosions="false" GrabWhenSelected="true">
  <PowerContainer capacity="2000.0" maxrechargespeed="500.0" maxoutput="1000.0" canbeselected="true" indicatorposition="21,12" indicatorsize="54,35" ishorizontal="true" msg="ItemMsgInteractSelect">
    <GuiFrame relativesize="0.25,0.23" minsize="350,200" anchor="Center" style="ItemUI" />
    <!--minsize="350,250" maxsize="420,300"-->
    <StatusEffect type="OnActive" targettype="Contained" targets="loadable" Condition="2.0" comparison="and">
      <!-- the statuseffect targets the contained item (a battery cell that's being charged), but the conditional targets the container (this battery) -->
      <Conditional ChargePercentag
```

## PowerTransfer

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/PowerTransfer.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（4 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `CanBeOverloaded` | bool | true | Can the item be damaged if too much power is supplied to the power grid. |
| `OverloadVoltage` | float | 2 | How much power has to be supplied to the grid relative to the load before item starts taking damage. E.g. a value of 2 means that the grid has to be receiving twice as much power as the devices in the... |
| `FireProbability` | float | 0.15 | The probability for a fire to start when the item breaks. |
| `Overload` | bool | false | Is the item currently overloaded. Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended). |

- 子元素（取自示例）：无
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="dockingport" tags="dock" category="misc" subcategory="doorsandhatches" linkable="true" indestructible="true" scale="0.5" requirecursorinsidetrigger="true" requirebodyinsidetrigger="false">
  <PowerTransfer CanBeOverloaded="false" FireProbability="0.0" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem identifier="screwdriver" type="Equipped" />
    <input name="toggle" displayname="connection.togglestate" />
    <input name="set_state" displayname="connection.setstate" />
    <output name="power" displayname="connection.power" maxwires="6" maxplayerconnectablewires="5" />
    <out
```

## PowerDistributor

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/PowerDistributor.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表：无（该页只有 `also supports` 继承行）

- 子元素（取自示例）：`GuiFrame`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：PowerTransfer、Powered、ItemComponent；该页无属性表

- 示例（截断）：

```xml
<Item identifier="powerdistributor" tags="junctionbox" category="Electrical,Machine" scale="0.5" linkable="true" allowedlinks="reactor" damagedbyexplosions="true" explosiondamagemultiplier="0.2" GrabWhenSelected="true">
  <PowerDistributor canbeselected="true" vulnerabletoemp="true" canbeoverloaded="true" msg="ItemMsgInteractSelect">
    <GuiFrame relativesize="0.2,0.5" minsize="450,250" anchor="Center" style="ItemUI" />
    <StatusEffect type="InWater" target="This" condition="-0.25">
      <Conditional voltage="gt 0.1" />
    </StatusEffect>
  </PowerDistributor>
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.5" minsize="600,700" anchor="Center" style="ConnectionPanel" />
    <RequiredSkill ide
```

## RelayComponent

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/RelayComponent.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（2 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `MaxPower` | float | 1000 | The maximum amount of power that can pass through the item. |
| `IsOn` | bool | true | Can the relay currently pass power and signals through it. |

- 子元素（取自示例）：`GuiFrame`
- 备注：无用途说明句；继承（also supports）：PowerTransfer、Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="relaycomponent" category="Electrical" Tags="smallitem,signal,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#694341">
  <RelayComponent canbeselected="true" vulnerabletoemp="false" canbeoverloaded="false">
    <GuiFrame relativesize="0.2,0.14" minsize="450,160" anchor="Center" style="ItemUI" />
  </RelayComponent>
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />

```

## Pump

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Pump.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（5 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `FlowPercentage` | float | 0 | How fast the item is currently pumping water (-100 = full speed out, 100 = full speed in). Intended to be used by StatusEffect conditionals (setting this value in XML has no effect). |
| `MaxFlow` | float | 80 | How fast the item pumps water in/out when operating at 100%. |
| `Disabled` | bool | false | If true, the pump is unable to pump water. |
| `IsOn` | bool | true |  |
| `CanCauseLethalPressure` | bool | false |  |

- 子元素（取自示例）：`GuiFrame`, `sound`, `PumpInEmitter`, `PumpOutEmitter`, `StatusEffect`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="smallpump" tags="pump" linkable="true" category="Machine" scale="0.5" damagedbyexplosions="true" explosiondamagemultiplier="0.2" allowrotatingineditor="true" GrabWhenSelected="true">
  <Pump canbeselected="true" maxflow="100" PowerConsumption="60.0" MinVoltage="0.3" IsOn="true" msg="ItemMsgInteractSelect">
    <GuiFrame relativesize="0.25,0.2" minsize="420,220" anchor="Center" style="ItemUI" />
    <sound file="Content/Items/Pump/Pump.ogg" type="OnActive" range="500.0" volumeproperty="CurrFlow" volume="0.005" loop="true" />
    <sound file="Content/Items/Pump/PumpBroken.ogg" type="Always" range="500.0" volumeproperty="CurrentBrokenVolume" volume="0.004" loop="true" />
    <PumpInEmitter particle="bubbles" particlespersecond="5" position="7,-51" anglemin="180" anglemax="18
```

## Reactor

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Reactor.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（17 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `PowerOn` | bool | false |  |
| `LastUserWasPlayer` | bool | false |  |
| `MaxPowerOutput` | float | 10000 | How much power (kW) the reactor generates when operating at full capacity. |
| `MeltdownDelay` | float | 120 | How long the temperature has to stay critical until a meltdown occurs. |
| `FireDelay` | float | 30 | How long the temperature has to stay critical until the reactor catches fire. |
| `Temperature` | float | 0 | Current temperature of the reactor (0% - 100%). Indended to be used by StatusEffect conditionals. |
| `FissionRate` | float | 0 | Current fission rate of the reactor (0% - 100%). Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended). |
| `TurbineOutput` | float | 0 | Current turbine output of the reactor (0% - 100%). Intended to be used by StatusEffect conditionals (setting the value from XML is not recommended). |
| `FuelConsumptionRate` | float | 0.2 | How fast the condition of the contained fuel rods deteriorates per second. |
| `TemperatureCritical` | bool | false | Is the temperature currently critical. Intended to be used by StatusEffect conditionals (setting the value from XML has no effect). |
| `AutoTemp` | bool | false | Is the automatic temperature control currently on. Indended to be used by StatusEffect conditionals (setting the value from XML is not recommended). |
| `AvailableFuel` | float | 0 |  |
| `Load` | float | 0 |  |
| `TargetFissionRate` | float | 0 |  |
| `TargetTurbineOutput` | float | 0 |  |
| `CorrectTurbineOutput` | float | 0 |  |
| `ExplosionDamagesOtherSubs` | bool | true |  |

- 子元素（取自示例）：`StatusEffect`, `GuiFrame`, `GraphLine`, `FissionRateMeter`, `TurbineOutputMeter`, `MeterPointer`, `SectorSprite`, `TempMeterFrame`, `TempMeterBar`, `TempRangeIndicator`, `RequiredSkill`, `RequiredItem`, `sound`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item nameidentifier="reactor1" identifier="outpostreactor" tags="reactor" type="Reactor" linkable="true" category="Machine" damagedbyexplosions="true" scale="0.5" explosiondamagemultiplier="0.2">
  <Reactor canbeselected="true" firedelay="20" meltdowndelay="120" maxpoweroutput="20000" fuelconsumptionrate="0.2" vulnerabletoemp="false" msg="ItemMsgInteractSelect">
    <StatusEffect type="InWater" target="This" condition="-0.5">
      <Conditional condition="gt 10" />
    </StatusEffect>
    <GuiFrame relativesize="0.5,0.45" minsize="700,350" maxsize="2688,1166" anchor="Center" relativeoffset="0.1,0" style="ItemUI" />
    <GraphLine texture="Content/Items/Reactor/graphLine.png">
      <Sprite name="ReactorGraphLine" texture="Content/Items/Reactor/graphLine.png" sourcerect="0,0,32,32" />
    
```

## Sonar

- URL：<https://regalis11.github.io/BaroModDoc/ItemComponents/Sonar.html>
- HTTP 状态：200
- 用途：*（页面未提供用途说明句）*
- 属性表（7 条，照抄自页面 Attribute/Type/Default value/Description 表）：

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `Range` | float | Same as DefaultSonarRange | The maximum range of the sonar. |
| `DetectSubmarineWalls` | bool | false | Should the sonar display the walls of the submarine it is inside. |
| `UseTransducers` | bool | false | Does the sonar have to be connected to external transducers to work. |
| `CenterOnTransducers` | bool | false | Should the sonar view be centered on the transducers or the submarine's center of mass. Only has an effect if UseTransducers is enabled. |
| `HasMineralScanner` | bool | false | Does the sonar have mineral scanning mode. |
| `UseMineralScanner` | bool | true |  |
| `RightLayout` | bool | false |  |

- 子元素（取自示例）：`GuiFrame`, `sound`, `StatusEffect`, `PingCircle`, `DirectionalPingCircle`, `ScreenOverlay`, `ScreenBackground`, `DirectionalPingBackground`, `DirectionalPingButton`, `Blip`, `LineSprite`, `icon`, `LightComponent`
- 备注：无用途说明句；继承（also supports）：Powered、ItemComponent

- 示例（截断）：

```xml
<Item identifier="sonarmonitor" tags="command,sonarmonitor" linkable="true" allowedlinks="statusmonitor" scale="0.5" category="Machine,Electrical" damagedbyexplosions="true" explosiondamagemultiplier="0.2" GrabWhenSelected="true">
  <Sonar canbeselected="true" powerconsumption="100" displaybordersize="-0.1" allowuioverlap="true" hudlayer="-1" rightlayout="true">
    <GuiFrame relativesize="0.6,0.60" anchor="Center" style="OuterGlow" color="0,0,0,0.8" relativeoffset="0.12,-0.05" />
    <sound file="Content/Items/Command/SonarPing.ogg" type="OnUse" range="1000.0" />
    <sound file="Content/Items/Command/SonarPing2.ogg" type="OnUse" range="1000.0" />
    <StatusEffect type="OnUse" target="This">
      <sound file="Content/Items/Command/SonarPingFar.ogg" type="OnUse" range="6000.0" volume="0.
```

## 抓取结果汇总

| 组件 | HTTP | 属性数 | 子元素数 | 备注 |
| --- | --- | --- | --- | --- |
| ModuloComponent | 200 | 1 | 0 | 无用途说明句；继承（also supports）：ItemComponent |
| MotionSensor | 200 | 13 | 0 | 无用途说明句；继承（also supports）：ItemComponent |
| NameTag | 200 | 1 | 0 | 无用途说明句；继承（also supports）：ItemComponent |
| NotComponent | 200 | 1 | 0 | 无用途说明句；继承（also supports）：ItemComponent |
| OscillatorComponent | 200 | 2 | 0 | 无用途说明句；继承（also supports）：ItemComponent |
| OutpostTerminal | 200 | 0 | 0 | 无用途说明句；继承（also supports）：ItemComponent；该页无属性表 |
| OxygenDetector | 200 | 0 | 0 | 无用途说明句；继承（also supports）：ItemComponent；该页无属性表 |
| Pickable | 200 | 0 | 1 | 无用途说明句；继承（also supports）：ItemComponent；该页无属性表 |
| Door | 200 | 12 | 7 | 无用途说明句；继承（also supports）：Pickable、ItemComponent |
| Holdable | 200 | 26 | 0 | 无用途说明句；继承（also supports）：Pickable、ItemComponent |
| MeleeWeapon | 200 | 7 | 1 | 无用途说明句；继承（also supports）：Holdable、Pickable、ItemComponent |
| Throwable | 200 | 1 | 0 | 无用途说明句；继承（also supports）：Holdable、Pickable、ItemComponent |
| IdCard | 200 | 15 | 0 | 无用途说明句；继承（also supports）：Pickable、ItemComponent |
| Planter | 200 | 2 | 3 | 无用途说明句；继承（also supports）：Pickable、ItemComponent |
| Wearable | 200 | 1 | 1 | 无用途说明句；继承（also supports）：Pickable、ItemComponent |
| Powered | 200 | 6 | 1 | 无用途说明句；继承（also supports）：ItemComponent |
| Deconstructor | 200 | 6 | 4 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| ElectricalDischarger | 200 | 7 | 2 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| Engine | 200 | 3 | 4 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| Fabricator | 200 | 8 | 4 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| LightComponent | 200 | 14 | 2 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| MiniMap | 200 | 7 | 3 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| OxygenGenerator | 200 | 1 | 3 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| PowerContainer | 200 | 13 | 2 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| PowerTransfer | 200 | 4 | 0 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| PowerDistributor | 200 | 0 | 2 | 无用途说明句；继承（also supports）：PowerTransfer、Powered、ItemComponent；该页无属性表 |
| RelayComponent | 200 | 2 | 1 | 无用途说明句；继承（also supports）：PowerTransfer、Powered、ItemComponent |
| Pump | 200 | 5 | 5 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| Reactor | 200 | 17 | 13 | 无用途说明句；继承（also supports）：Powered、ItemComponent |
| Sonar | 200 | 7 | 13 | 无用途说明句；继承（also supports）：Powered、ItemComponent |

失败页面：无（30/30 返回 HTTP 200）。
