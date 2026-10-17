# ItemComponents 第 1 批（30 页）参考手册

来源：<https://regalis11.github.io/BaroModDoc/ItemComponents/>  
抓取方式：逐页 HTTP GET（`web_fetch` + PowerShell 下载核对），全部返回 **HTTP 200**。  
机器可读版本见 `itemcomponents-part1.json`（同目录）。

| 统计 | 值 |
| --- | --- |
| 抓取页面数 | 30 / 30 |
| 抓取失败 | 0 |
| 属性条目总数 | 192 |
| 无属性表的页面 | GreaterComponent、Ladder |

> **重要说明：** 本批 30 个页面全部**没有**“用途”说明段落——页面结构统一为 `标题 + Attributes 表 + Example`，
> 因此 JSON 中 `purpose` 一律为空字符串，不编造。页面也**没有**独立的“子元素”章节，
> 本文件的 children 取自页面 Example 里该组件元素内部实际出现的标签。

## 页面索引

| # | 元素 | 属性数 | 子元素 |
| --- | --- | --- | --- |
| 1 | [ItemComponent](#itemcomponent) | 23 | HUDOverlayAnimated |
| 2 | [AdderComponent](#addercomponent) | 3 | — |
| 3 | [DivideComponent](#dividecomponent) | 3 | — |
| 4 | [MultiplyComponent](#multiplycomponent) | 3 | — |
| 5 | [SubtractComponent](#subtractcomponent) | 3 | — |
| 6 | [AndComponent](#andcomponent) | 4 | — |
| 7 | [OrComponent](#orcomponent) | 4 | — |
| 8 | [XorComponent](#xorcomponent) | 4 | — |
| 9 | [ButtonTerminal](#buttonterminal) | 2 | GuiFrame、TerminalButton |
| 10 | [CircuitBox](#circuitbox) | 1 | Requireditem、GuiFrame、WireSprite、ConnectionSprite、WireConnectorSprite、ConnectionScrewSprite |
| 11 | [ColorComponent](#colorcomponent) | 1 | — |
| 12 | [ConnectionPanel](#connectionpanel) | 1 | GuiFrame、RequiredItem、input、StatusEffect、Conditional |
| 13 | [DemultiplexerComponent](#demultiplexercomponent) | 3 | — |
| 14 | [MultiplexerComponent](#multiplexercomponent) | 3 | — |
| 15 | [Controller](#controller) | 14 | — |
| 16 | [CustomInterface](#custominterface) | 4 | GuiFrame、TickBox、IntegerInput、StatusEffect、sound |
| 17 | [DelayComponent](#delaycomponent) | 3 | — |
| 18 | [DockingPort](#dockingport) | 6 | StatusEffect、sound、Explosion |
| 19 | [EntitySpawnerComponent](#entityspawnercomponent) | 19 | — |
| 20 | [EqualsComponent](#equalscomponent) | 4 | — |
| 21 | [GreaterComponent](#greatercomponent) | 0 | — |
| 22 | [ExponentiationComponent](#exponentiationcomponent) | 1 | — |
| 23 | [FunctionComponent](#functioncomponent) | 1 | — |
| 24 | [GeneticMaterial](#geneticmaterial) | 12 | — |
| 25 | [Growable](#growable) | 21 | ProducedItem、VineSprites、LeafSprite、FlowerSprite、VineSprite |
| 26 | [ItemContainer](#itemcontainer) | 36 | GuiFrame、Containable |
| 27 | [ItemLabel](#itemlabel) | 7 | Upgrade |
| 28 | [Ladder](#ladder) | 0 | BackgroundSprite |
| 29 | [LevelResource](#levelresource) | 3 | Commonness、RequiredItem |
| 30 | [MemoryComponent](#memorycomponent) | 3 | — |

---

## ItemComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ItemComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：23

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `InheritParentIsActive` | bool | true | If this is a child component of another component, should this component inherit the IsActive state of the parent? |
| `PickingTime` | float | 0 | How long it takes to pick up the item (in seconds). |
| `PickingMsg` | string | ”” | What to display on the progress bar when this item is being picked. |
| `IsActiveConditionalComparison` | PropertyConditional.LogicalOperatorType | And |  |
| `CanBePicked` | bool | false | Can the item be picked up (or interacted with, if the pick action does something else than picking up the item). |
| `DrawHudWhenEquipped` | bool | false | Should the interface of the item (if it has one) be drawn when the item is equipped. |
| `LockGuiFramePosition` | bool | false |  |
| `GuiFrameOffset` | Point | “0,0” |  |
| `CanBeSelected` | bool | false | Can the item be selected by interacting with it. |
| `CanBeCombined` | bool | false | Can the item be combined with other items of the same type. |
| `RemoveOnCombined` | bool | false | Should the item be removed if combining it with an other item causes the condition of this item to drop to 0. |
| `CharacterUsable` | bool | false | Can the “Use” action of the item be triggered by characters or just other items/StatusEffects. |
| `AllowInGameEditing` | bool | true | Can the properties of the component be edited in-game (only applicable if the component has in-game editable properties). |
| `DeleteOnUse` | bool | false | Should the item be deleted when it’s used. |
| `Msg` | string | ”” | A text displayed next to the item when it’s highlighted (generally instructs how to interact with the item, e.g. “[Mouse1] Pick up”). |
| `CombatPriority` | float | 0 | How useful the item is in combat? Used by AI to decide which item it should use as a weapon. For the sake of clarity, use a value between 0 and 100 (not forced). Note that there’s also a generic BotPr |
| `ManuallySelectedSound` | int | 0 |  |
| `UpdateWhenBroken` | bool | false | If true, the component will retain its normal functionality when the item reaches 0 condition. |
| `AllowUIOverlap` | bool | false |  |
| `CloseByClickingOutsideGUIFrame` | bool | true |  |
| `LinkUIToComponent` | string | ”” |  |
| `HudPriority` | int | 0 |  |
| `HudLayer` | int | 0 |  |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<HUDOverlayAnimated>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="surveillancecamera" variantof="camera" category="Electrical" Tags="smallitem,camera" focusonselected="true" offsetonselected="500" cargocontaineridentifier="metalcrate" Scale="0.5">
  <ItemComponent>
    <HUDOverlayAnimated texture="Content/UI/CameraOverlay.png" sourcerect="0,0,2048,1536" origin="0.5,0.5" alpha="1.0" animspeed="20" columns="2" rows="2" />
  </ItemComponent>
</Item>
```

---

## AdderComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/AdderComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `ClampMax` | float | 999999 | The output of the item is restricted below this value. |
| `ClampMin` | float | -999999.0 | The output of the item is restricted above this value. |
| `TimeFrame` | float | 0 | The item must have received signals to both inputs within this timeframe to output the result. If set to 0, the inputs must be received at the same time. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <AdderComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="addercomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#a1d681">
  <AdderComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
  [...]
[... 已截断]
```

---

## DivideComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/DivideComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `ClampMax` | float | 999999 | The output of the item is restricted below this value. |
| `ClampMin` | float | -999999.0 | The output of the item is restricted above this value. |
| `TimeFrame` | float | 0 | The item must have received signals to both inputs within this timeframe to output the result. If set to 0, the inputs must be received at the same time. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <DivideComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="dividecomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#8bafd7">
  <DivideComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
  [..
[... 已截断]
```

---

## MultiplyComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/MultiplyComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `ClampMax` | float | 999999 | The output of the item is restricted below this value. |
| `ClampMin` | float | -999999.0 | The output of the item is restricted above this value. |
| `TimeFrame` | float | 0 | The item must have received signals to both inputs within this timeframe to output the result. If set to 0, the inputs must be received at the same time. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <MultiplyComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="multiplycomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#8bafd7">
  <MultiplyComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
 
[... 已截断]
```

---

## SubtractComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/SubtractComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `ClampMax` | float | 999999 | The output of the item is restricted below this value. |
| `ClampMin` | float | -999999.0 | The output of the item is restricted above this value. |
| `TimeFrame` | float | 0 | The item must have received signals to both inputs within this timeframe to output the result. If set to 0, the inputs must be received at the same time. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <SubtractComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="subtractcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#a0dbc8">
  <SubtractComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
 
[... 已截断]
```

---

## AndComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/AndComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：4

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `TimeFrame` | float | 0 | The item sends the output if both inputs have received a non-zero signal within the timeframe. If set to 0, the inputs must receive a signal at the same time. |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | “1” | The signal sent when the condition is met. |
| `FalseOutput` | string | “0” | The signal sent when the condition is met (if empty, no signal is sent). |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <AndComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="andcomponent" category="Electrical" Tags="smallitem,logic, circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#6c7dd5">
  <AndComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <input name="set_output" displayname="connection.setoutput" />
    <output name="signal_out" displayname="connec
[... 已截断]
```

---

## OrComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/OrComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：4

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `TimeFrame` | float | 0 | The item sends the output if both inputs have received a non-zero signal within the timeframe. If set to 0, the inputs must receive a signal at the same time. |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | “1” | The signal sent when the condition is met. |
| `FalseOutput` | string | “0” | The signal sent when the condition is met (if empty, no signal is sent). |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <OrComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="orcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#d1b788">
  <OrComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <input name="set_output" displayname="connection.setoutput" />
    <output name="signal_out" displayname="connectio
[... 已截断]
```

---

## XorComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/XorComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：4

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `TimeFrame` | float | 0 | The item sends the output if both inputs have received a non-zero signal within the timeframe. If set to 0, the inputs must receive a signal at the same time. |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | “1” | The signal sent when the condition is met. |
| `FalseOutput` | string | “0” | The signal sent when the condition is met (if empty, no signal is sent). |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <XorComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="xorcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="true" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#c3a27a">
  <XorComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <input name="set_output" displayname="connection.setoutput" />
    <output name="signal_out" disp
[... 已截断]
```

---

## ButtonTerminal

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ButtonTerminal.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：2

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Signals` | string[] | - | Signals sent when the corresponding buttons are pressed. |
| `ActivatingItems` | string | ”” | Identifiers or tags of items that, when contained, allow the terminal buttons to be used. Multiple ones should be separated by commas. |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<GuiFrame>`、`<TerminalButton>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="alienterminal_new" nameidentifier="alienterminal" category="Alien" subcategory="devices" Tags="smallitem,logic" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" health="100">
  <ButtonTerminal activatingitems="smallalienartifact" canbeselected="true" msg="ItemMsgInteractSelect">
    <GuiFrame relativesize="0.25,0.2" style="ItemUI" anchor="Center" />
    <TerminalButton style="alienbuttonblue" Signal="1" />
    <TerminalButton style="alienbuttonred" Signal="1" />
  </ButtonTerminal>
  <ItemContainer capacity="1" maxstacksize="1" canbeselected="true" hideitems="true" slotsperrow="1" uilabel="" allowuioverlap="true">
    <Containable items="smallitem" />
  </ItemContainer>
  <ConnectionPanel selectkey="Action" canbeselected="true" hudpriority="10" locked="True" allowingameediting="False">
    <GuiFrame relativesize="0
[... 已截断]
```

---

## CircuitBox

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/CircuitBox.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：1

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Locked` | bool | false | Locked circuit boxes can only be viewed and not interacted with. |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<Requireditem>`、`<GuiFrame>`、`<WireSprite>`、`<ConnectionSprite>`、`<WireConnectorSprite>`、`<ConnectionScrewSprite>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="circuitbox" category="Electrical" Tags="smallitem" maxstacksize="1" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" disablecommandmenuwhenselected="true" grabwhenselected="true">
  <CircuitBox selectkey="Select" canbeselected="true" msg="ItemMsgInteractSelect" allowuioverlap="true">
    <Requireditem items="idcard" type="Picked" msg="itemmsgunauthorizedaccess" ignoreineditor="true" />
    <GuiFrame relativesize="0.7,0.8" style="ItemUI" anchor="Center" />
    <WireSprite texture="Content/Items/Electricity/wire.png" sourcerect="0,0,16,12" origin="0.5,0.5" />
    <ConnectionSprite texture="Content/UI/UIAtlasDevices.png" sourcerect="1,1,56,55" origin="0.5,0.5" />
    <WireConnectorSprite texture="Content/UI/UIAtlasDevices.png" sourcerect="69,3,45,85" origin="0.5,0.27" />
    <ConnectionScrewSprite texture="Content/UI/UIAtlasDevices.png" sourcerect="88,92,
[... 已截断]
```

---

## ColorComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ColorComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：1

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `UseHSV` | bool | false | When enabled makes the component translate the signal from HSV into RGB where red is the hue between 0 and 360, green is the saturation between 0 and 1 and blue is the value between 0 and 1. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <ColorComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="colorcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#b3b3b4">
  <ColorComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_r" displayname="connection.signalr" />
    <input name="signal_g" displayname="connection.signalg" />
    <input name="signal_b" displayname="connection.signalb" />
    <input name="signal_a" displayname="connection.signal
[... 已截断]
```

---

## ConnectionPanel

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ConnectionPanel.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：1

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Locked` | bool | false | Locked connection panels cannot be rewired in-game. |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<GuiFrame>`、`<RequiredItem>`、`<input>`、`<StatusEffect>`、`<Conditional>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="detonator" health="30" category="Equipment,Weapon" Tags="smallitem,detonator" DamagedByContainedItemExplosions="true" explosiondamagemultiplier="0.3" Scale="0.5" cargocontaineridentifier="explosivecrate" impactsoundtag="impact_metal_light" isshootable="true">
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="activate" displayname="connection.activate">
      <StatusEffect type="OnUse" target="This" IsOn="true" charge="3.402823466E+38" setvalue="true">
        <Conditional IsOn="false" />
      </StatusEffect>
    </input>
  </ConnectionPanel>
  <Holdable selectkey="Action" pickkey="Use" slots="Any,RightHand,LeftHand" msg="Ite
[... 已截断]
```

---

## DemultiplexerComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/DemultiplexerComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `SelectedConnection` | int | 0 | The index of the selected connection. |
| `WrapAround` | bool | true | Should the selected connection go back to the first one when moving past the last one? |
| `SkipEmptyConnections` | bool | true | Should empty connections (connections with no wires in them) be skipped over when moving the selection? |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <DemultiplexerComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="demultiplexercomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" signalcomponentcolor="130,157,92,255" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true">
  <DemultiplexerComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <input name="set_output" displayname="connection.setoutput" />
    <input name="move_output" displayname="connection.moveoutput" />
    <output name="signal_out0" displayn
[... 已截断]
```

---

## MultiplexerComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/MultiplexerComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `SelectedConnection` | int | 0 | The index of the selected connection. |
| `WrapAround` | bool | true | Should the selected connection go back to the first one when moving past the last one? |
| `SkipEmptyConnections` | bool | true | Should empty connections (connections with no wires in them) be skipped over when moving the selection? |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <MultiplexerComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="multiplexercomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" signalcomponentcolor="228,76,67,255" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true">
  <MultiplexerComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in0" displayname="connection.signalinx~[num]=0" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <input name="sig
[... 已截断]
```

---

## Controller

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/Controller.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：14

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `IsToggle` | bool | false | When enabled, the item will continuously send out a signal and interacting with it will flip the signal (making the item behave like a switch). When disabled, the item will simply send out a signal wh |
| `Output` | string | “1” | The signal sent when the controller is being activated or is toggled on. If empty, no signal is sent. |
| `FalseOutput` | string | “0” | The signal sent when the controller is toggled off. If empty, no signal is sent. Only valid if IsToggle is true. |
| `State` | bool | false | Whether the item is toggled on/off. Only valid if IsToggle is set to true. |
| `HideHUD` | bool | true | Should the HUD (inventory, health bar, etc) be hidden when this item is selected. |
| `UsableIn` | UseEnvironment | Both | Can the item be selected in air, underwater or both. |
| `DrawUserBehind` | bool | false | Should the character using the item be drawn behind the item. |
| `AllowSelectingWhenSelectedByOther` | bool | true | Can another character select this controller when another character has already selected it? |
| `AllowSelectingWhenSelectedByBot` | bool | true | Can another character select this controller when a bot has already selected it? |
| `NonInteractableWhenFlippedX` | bool | false |  |
| `NonInteractableWhenFlippedY` | bool | false |  |
| `RequirePower` | bool | false | Does the Controller require power to function (= to send signals and move the camera focus to a connected item)? |
| `IsSecondaryItem` | bool | false | If true, other items can be used simultaneously. |
| `ForceUserToStayAttached` | bool | false | If enabled, the user sticks to the position of this item even if the item moves. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <Controller> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="surveillancecenter" tags="command" scale="0.5" category="Machine,Electrical" type="Controller" GrabWhenSelected="true" disableitemusagewhenselected="true" damagedbyexplosions="true" explosiondamagemultiplier="0.2" isshootable="true" requireaimtouse="false" requireaimtosecondaryuse="false">
  <Controller allowingameediting="false" direction="None" RequirePower="true" canbeselected="true" allowuioverlap="true" AllowSelectingWhenSelectedByBot="true" AllowSelectingWhenSelectedByOther="false" msg="ItemMsgInteractSelect" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10" allowuioverlap="true">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredSkill identifier="electrical" level="40" />
    <StatusEffect type="OnFailure" target="Character" 
[... 已截断]
```

---

## CustomInterface

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/CustomInterface.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：4

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Labels` | string | ”” | The texts displayed on the buttons/tickboxes, separated by commas. |
| `Signals` | string | ”” | The signals sent when the buttons are pressed or the tickboxes checked, separated by commas. |
| `ElementStates` | string | ”” |  |
| `ShowInsufficientPowerWarning` | bool | false |  |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<GuiFrame>`、`<TickBox>`、`<IntegerInput>`、`<StatusEffect>`、`<sound>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="op_clownjukebox" width="149" height="258" scale="0.5" category="Decorative" subcategory="clownassets">
  <CustomInterface canbeselected="true" ElementStates="true,1,50">
    <GuiFrame relativesize="0.2,0.15" anchor="CenterLeft" pivot="BottomLeft" relativeoffset="0.006,-0.05" style="ItemUI" />
    <TickBox text="speaker.on" targetitemcomponent="Powered" propertyname="IsActive" ContinuousSignal="false" GetValueInterval="1" />
    <IntegerInput text="speaker.trackselection" propertyname="ManuallySelectedSound" targetitemcomponent="Powered" min="0" max="3">
      <StatusEffect type="OnUse" targettype="This">
        <sound file="Content/Sounds/ClubMusic_transitionScratch.ogg" range="1000.0" />
      </StatusEffect>
    </IntegerInput>
    <IntegerInput text="speaker.volume" propertyname="PowerConsumption" targetitemcomponent="Powered" min="0" max="100" step="10" />
  </Cust
[... 已截断]
```

---

## DelayComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/DelayComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Delay` | float | 1 | How long the item delays the signals (in seconds). |
| `ResetWhenSignalReceived` | bool | false | Should the component discard previously received signals when a new one is received. |
| `ResetWhenDifferentSignalReceived` | bool | false | Should the component discard previously received signals when the incoming signal changes. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <DelayComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="delaycomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#5e76a2">
  <DelayComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem items="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <output name="signal_out" displayname="connection.signalout" />
    <input name="set_delay" displayname="connection.setdelay" />
  </ConnectionPanel>
  [...]
</Item>
```

---

## DockingPort

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/DockingPort.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：6

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `DistanceTolerance` | Vector2 | “32.0,32.0” | How close the docking port has to be to another port to dock. |
| `DockedDistance` | float | 32 | How close together the docking ports are forced when docked. |
| `IsHorizontal` | bool | true | Is the port horizontal. |
| `MainDockingPort` | bool | false | If set to true, this docking port is used when spawning the submarine docked to an outpost (if possible). |
| `ApplyEffectsOnDocking` | bool | true | Should the OnUse StatusEffects trigger when docking (on vanilla docking ports these effects emit particles and play a sound).) |
| `ForceDockingDirection` | DirectionType | None | Which direction the port is allowed to dock in. For example, “Top” would mean the port can dock to another port above it. Normally there’s no need to touch this setting, but if you notice the docking  |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<StatusEffect>`、`<sound>`、`<Explosion>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="dockingport" tags="dock" category="misc" subcategory="doorsandhatches" linkable="true" indestructible="true" scale="0.5" requirecursorinsidetrigger="true" requirebodyinsidetrigger="false">
  <DockingPort IsHorizontal="true" DistanceTolerance="200,64" DockedDistance="172">
    <StatusEffect type="OnSecondaryUse" target="This">
      <sound file="Content/Items/Door/DockingPort2.ogg" type="OnSecondaryUse" range="15000.0" />
    </StatusEffect>
    <StatusEffect type="OnUse" target="This">
      <Explosion range="5000.0" camerashake="5" stun="0" force="0.0" flames="false" shockwave="false" sparks="true" underwaterbubble="false" />
      <sound file="Content/Items/Door/DockingPort1.ogg" type="OnUse" range="15000.0" />
    </StatusEffect>
    <StatusEffect type="OnBroken" target="This">
      <sound file="Content/Items/Door/DoorBreak2.ogg" range="3000" />
    </StatusEffect>

[... 已截断]
```

---

## EntitySpawnerComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/EntitySpawnerComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：19

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `ItemIdentifier` | string? | ”” | Identifier of the item to spawn, does nothing if SpeciesName is set. Separate by comma to have multiple items spawn at random. |
| `SpeciesName` | string? | ”” | Species name of the creature to spawn, takes priority if ItemIdentifier is set. Separate by comma to have multiple creatures spawn at random. |
| `OnlySpawnWhenCrewInRange` | bool | true | Only spawn if crew members are within certain area |
| `CrewAreaShape` | AreaShape | Rectangle | Shape of the area where crew members need to stay |
| `CrewAreaBounds` | Vector2 | “500,500” | Size of the rectangle where crew members need to stay. Does nothing if CrewAreaShape is set to Circle |
| `CrewAreaRadius` | float | 500 | Radius of the circle to spawn stuff in. Does nothing if CrewAreaShape is set to Rectangle |
| `CrewAreaOffset` | Vector2 | “0,0” | Offset of the crew area from the center of the item |
| `SpawnAreaShape` | AreaShape | Rectangle | Shape of the area where enemies or items are spawned |
| `SpawnAreaBounds` | Vector2 | “500,500” | Size of the rectangle where items or creatures will be spawned. Does nothing if SpawnAreaShape is set to Circle |
| `SpawnAreaRadius` | float | 500 | Radius of the circle where items or creatures will be spawned. Does nothing if SpawnAreaShape is set to Rectangle |
| `SpawnAreaOffset` | Vector2 | “0,0” | Offset of the spawn area from the center of the item |
| `SpawnTimerRange` | Vector2 | “10,40” | Time range between spawn attempts in seconds. Set both to a negative value to disable automatic spawning. |
| `SpawnAmountRange` | Vector2 | “1,3” | Minumum and maximum amount of items or creatures to spawn in one attempt |
| `MaximumAmount` | int | 8 | Total maximum amount of items or creatures that can be spawned. 0 = unrestricted. |
| `MaximumAmountInArea` | int | 8 | Amount of items or creatures in the spawn area that will prevent further items or creatures from being spawned. 0 = unrestricted. |
| `MaximumAmountRangePadding` | float | 500 | Inflate the circle of rectangle by this value to extend the area that counts towards the maximum amount of items or enemies to be spawned |
| `CanSpawn` | bool | true |  |
| `PreloadCharacter` | bool | false |  |
| `AffectedByPvPSpawnMonstersSetting` | bool | false | Should the “spawn monsters” setting affect this item in the PvP mode? |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <EntitySpawnerComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item nameidentifier="ruinvent" identifier="ruinvent" width="128" height="192" texturescale="0.5,0.5" scale="0.5" category="Alien" subcategory="devices">
  <EntitySpawnerComponent />
  [...]
</Item>
```

---

## EqualsComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/EqualsComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：4

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxOutputLength` | int | 200 | The maximum length of the output strings. Warning: Large values can lead to large memory usage or networking issues. |
| `Output` | string | “1” | The signal sent when the condition is met. |
| `FalseOutput` | string | “0” | The signal sent when the condition is met (if empty, no signal is sent). |
| `TimeFrame` | float | 0 | The maximum amount of time between the received signals. If set to 0, the signals must be received at the same time. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <EqualsComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="equalscomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#694341">
  <EqualsComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <output name="signal_out" displayname="connection.signalout" />
    <input name="set_outpu
[... 已截断]
```

---

## GreaterComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/GreaterComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：0

### 属性表

**该页无属性表**（组件不定义自有属性，仅继承下列父组件的属性）。

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

该页无属性表；继承属性：EqualsComponent、ItemComponent；示例中 <GreaterComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="greatercomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#a1d681">
  <GreaterComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in1" displayname="connection.signalinx~[num]=1" />
    <input name="signal_in2" displayname="connection.signalinx~[num]=2" />
    <output name="signal_out" displayname="connection.signalout" />
    <input name="set_out
[... 已截断]
```

---

## ExponentiationComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ExponentiationComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：1

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Exponent` | float | 1 | The exponent of the operation. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <ExponentiationComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="powcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="false" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#9b7eff">
  <ExponentiationComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <input name="set_exponent" displayname="connection.setexponent" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
  [...]
</Item
[... 已截断]
```

---

## FunctionComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/FunctionComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：1

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Function` | FunctionType | Round | Which kind of function to run the input through. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <FunctionComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="ceilcomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#983f3c">
  <FunctionComponent canbeselected="true" function="Ceil" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <RequiredItem identifier="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
  [...]
</Item>
```

---

## GeneticMaterial

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/GeneticMaterial.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：12

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Effect` | string | ”” |  |
| `TaintedEffect` | Identifier | “geneticmaterialdebuff” | Either the identifier or the type for the tainted effect prefab |
| `Tainted` | bool | false |  |
| `SetTaintedOnDeath` | bool | false |  |
| `CanBeUntainted` | bool | false |  |
| `SelectedTaintedEffect` | Identifier | ”” |  |
| `ConditionIncreaseOnCombineMin` | float | 0 |  |
| `ConditionIncreaseOnCombineMax` | float | 0 |  |
| `ConditionIncreaseOnLowQualityCombine` | float | 3 | When refining, min value for condition increase bonus based on the quality of the worse gene. |
| `ConditionIncreaseOnHighQualityCombine` | float | 25 | When refining, max value for condition increase bonus based on the quality of the worse gene. |
| `TooltipValueMin` | float | 0 |  |
| `TooltipValueMax` | float | 0 |  |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <GeneticMaterial> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="geneticmaterialmoloch" variantof="geneticmaterialcrawler" nameidentifier="geneticmaterial">
  <GeneticMaterial nameidentifier="character.moloch" effect="damageresistance" tooltipvaluemin="10" tooltipvaluemax="25" />
  [...]
</Item>
```

---

## Growable

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/Growable.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：21

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `GrowthSpeed` | float | 1 | How fast the plant grows. Value of 1 means a vine attempts to grow every 10 seconds while 2 and 0.5 mean every 5 and 20 seconds respectively. |
| `MaxWater` | float | 100 | How much water the plant can hold. Affects how long the plant can survive without water. |
| `ExtraWaterUsedPerSecondWhileFlooded` | float | 1 | How much extra water the plant uses per second while it is submerged in a flooded hull. |
| `WaterUsedPerSecond` | float | 1 | How much water the plant consumes passively per second. |
| `SeedSpawnChance` | float | 0.01 | Percentage chance of a seed item being produced on growth ticks (every 10 seconds without a multiplier). 0.01 means 1% chance. Not used in vanilla plants. |
| `ProductSpawnChance` | float | 0.01 | How often a product item is produced on growth ticks (every 10 seconds without a multiplier). 0.01 means 1% chance. |
| `MutationProbability` | float | 0.5 | Completely unused property that was added on the first design pass but due to the first pass being too complex was never used and now it is used by mods so it cannot be removed. |
| `FlowerTint` | Color | “1.0,1.0,1.0,1.0” | Color of the flowers. |
| `FlowerQuantity` | int | 3 | Number of flowers drawn. |
| `BaseFlowerScale` | float | 0.25 | Size of the flower sprites. |
| `BaseLeafScale` | float | 0.5 | Size of the leaf sprites. |
| `LeafTint` | Color | “1.0,1.0,1.0,1.0” | Color of the leaves. |
| `LeafProbability` | float | 0.33 | Chance of a leaf appearing behind a branch. |
| `VineTint` | Color | “1.0,1.0,1.0,1.0” | Color of the vines. |
| `MaximumVines` | int | 32 | Maximum number of vine tiles the plant can grow. |
| `VineScale` | float | 0.25 | Size of the vine sprites. |
| `DeadTint` | Color | “0.26,0.27,0.29,1.0” | Tint of a dead plant. |
| `GrowthWeights` | Vector4 | “1,1,1,1” | Probability for the plant to grow in a direction. |
| `FireVulnerability` | float | 0 | How much water is lost due to fires every 10 seconds. |
| `LinearProductAndSeedMultiplierBeforeFullyGrown` | Vector2 | “0.0, 0.0” | Modifier to the percentage of product and seed items produced before the plant is fully grown based on how many vines have been grown. 0 would mean no products or seeds are produced while 0.5 would me |
| `Health` | float | 100 |  |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<ProducedItem>`、`<VineSprites>`、`<LeafSprite>`、`<FlowerSprite>`、`<VineSprite>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="saltvineseed" category="Misc" Tags="smallitem,seed,plantitem" maxstacksize="8" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_soft" spritecolor="215,245,77,255">
  <Growable growthspeed="0.076" pickingtime="3" maximumvines="18" maxhealth="375" hardiness="0.162" floodtolerance="0.2" seedrate="0" productrate="0.0056" flowerquantity="8" baseflowerscale="0.40" vinescale="0.25" vinetint="135,187,61,255" flowertint="240,180,17,255">
    <ProducedItem identifier="saltbulb" probability="1.0" />
    <VineSprites vineatlas="Content/Items/Gardening/branches.png" decayatlas="Content/Items/Gardening/branches_overlay.png">
      <LeafSprite texture="Content/Items/Gardening/GrowablePlants_Temp.png" sourcerect="0,512,256,256" />
      <LeafSprite texture="Content/Items/Gardening/GrowablePlants_Temp.png" sourcerect="256,512,256,256" />
      <FlowerSprite textu
[... 已截断]
```

---

## ItemContainer

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ItemContainer.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：36

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Capacity` | int | 5 | How many items can be contained inside this item. |
| `MaxStackSize` | int | 64 | How many items can be stacked in one slot. Does not increase the maximum stack size of the items themselves, e.g. a stack of bullets could have a maximum size of 8 but the number of bullets in a speci |
| `HideItems` | bool | true | Should the items contained inside this item be hidden. If set to false, you should use the ItemPos and ItemInterval properties to determine where the items get rendered. |
| `ItemPos` | Vector2 | “0.0,0.0” | The position where the contained items get drawn at (offset from the upper left corner of the sprite in pixels). |
| `ItemInterval` | Vector2 | “0.0,0.0” | The interval at which the contained items are spaced apart from each other (in pixels). |
| `ItemsPerRow` | int | 100 | How many items are placed in a row before starting a new row. |
| `ItemsUseInventoryPlacement` | bool | false | Should items be drawn based on their position within the inventory? |
| `DrawInventory` | bool | true | Should the inventory of this item be visible when the item is selected. Note that this does not prevent dragging and dropping items to the item. |
| `AllowDragAndDrop` | bool | true | Allow dragging and dropping items to deposit items into this inventory. |
| `AllowSwappingContainedItems` | bool | true |  |
| `ShowSortButton` | bool | true | Should a button that allows sorting the items alphabetically be shown in the container’s UI panel? |
| `ShowMergeButton` | bool | true | Should a button that merges items into stacks be shown in the container’s UI panel? |
| `QuickUseMovesItemsInside` | bool | true | When this item is equipped, and you ‘quick use’ (double click / equip button) another equippable item, should the game attempt to move that item inside this one? |
| `AutoInteractWithContained` | bool | false | If set to true, interacting with this item will make the character interact with the contained item(s), automatically picking them up if they can be picked up. |
| `AutoInteractWithContainedTags` | string | ”” | Interacting with this container will autointeract with contained items that have one of these tags. Only valid if AutoInteractWithContained is set to true. |
| `AllowAccess` | bool | true | Is the container accessible in general. |
| `AccessOnlyWhenBroken` | bool | false | Is the container only accessible when it’s broken. Doesn’t apply to editors. |
| `AllowAccessWhenDropped` | bool | true | Is the container accessible when dropped. |
| `SlotsPerRow` | int | 5 | How many inventory slots the inventory has per row. |
| `ContainableRestrictions` | string | ”” | Define items (by identifiers or tags) that bots should place inside this container. If empty, no restrictions are applied. |
| `AutoFill` | bool | true | Should this container be automatically filled with items? |
| `ItemRotation` | float | 0 | The rotation in which the contained sprites are drawn (in degrees). |
| `SpawnWithId` | string | ”” | Specify an item for the container to spawn with. |
| `SpawnWithIdWhenBroken` | bool | false | Should the items configured using SpawnWithId spawn if this item is broken. |
| `AutoInject` | bool | false | Should the items be injected into the user. |
| `AutoInjectThreshold` | float | 0.5 | The health threshold that the user must reach in order to activate the autoinjection. |
| `RemoveContainedItemsOnDeconstruct` | bool | false |  |
| `ContainedSpriteDepth` | float | -1.0 | Depth at which the contained sprites are drawn. If not set, the original depth of the item sprites is used. |
| `UILabel` | string | - | An optional text displayed above the item’s inventory. |
| `ContainedStateIndicatorStyle` | string | - |  |
| `ContainedStateIndicatorSlot` | int | -1 | Can be used to make the contained state indicator display the condition of the item in a specific slot even when the container’s capacity is more than 1. |
| `ShowContainedStateIndicator` | bool | true | Should an indicator displaying the state of the contained items be displayed on this item’s inventory slot. If this item can only contain one item, the indicator will display the condition of the cont |
| `ShowConditionInContainedStateIndicator` | bool | false | If enabled, the condition of this item is displayed in the indicator that would normally show the state of the contained items. May be useful for items such as ammo boxes and magazines that spawn proj |
| `ShowTotalStackCapacityInContainedStateIndicator` | bool | false | If true, the contained state indicator calculates how full the item is based on the total amount of items that can be stacked inside it, as opposed to how many of the inventory slots are occupied. Not |
| `KeepOpenWhenEquipped` | bool | false | Should the inventory of this item be kept open when the item is equipped by a character. |
| `MovableFrame` | bool | false | Can the inventory of this item be moved around on the screen by the player. |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<GuiFrame>`、`<Containable>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="alienitemcontainermedium" category="Alien" subcategory="containers" tags="aliencontainer" linkable="true" pickdistance="150" scale="0.5">
  <ItemContainer capacity="8" canbeselected="true" hideitems="true" msg="ItemMsgInteractSelect" slotsperrow="4">
    <GuiFrame relativesize="0.2,0.22" anchor="Center" style="ItemUI" />
    <Containable items="smallitem,mediumitem,alienartifact" />
  </ItemContainer>
  [...]
</Item>
```

---

## ItemLabel

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/ItemLabel.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：7

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `Padding` | Vector4 | “0,0,0,0” | The amount of padding around the text in pixels (left,top,right,bottom). |
| `Text` | string | ”” | The text displayed in the label. |
| `IgnoreLocalization` | bool | false | Whether or not to skip localization and always display the raw value. |
| `TextColor` | Color | “0,0,0,255” | The color of the text displayed on the label (R,G,B,A). |
| `TextScale` | float | 1 | The scale of the text displayed on the label. |
| `Scrollable` | bool | false | Should the text scroll horizontally across the item if it’s too long to be displayed all at once. |
| `ScrollSpeed` | float | 20 | How fast the text scrolls across the item (only valid if Scrollable is set to true). |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<Upgrade>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="textdisplay" category="Electrical" scale="0.5" Tags="mediumitem,logic" impactsoundtag="impact_metal_light" cargocontaineridentifier="metalcrate" isshootable="true" AllowRotatingInEditor="false">
  <ItemLabel scrollable="true" padding="10,5,10,12" textcolor="1,1,1,1">
    <Upgrade gameversion="0.12.0.0" padding="10,5,10,12" />
  </ItemLabel>
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="set_text" displayname="connection.set_text" fallbackdisplayname="connection.setoutput" />
    <input name="set_color" displayname="connection.setcolor" />
    <input name="set_text_color" displayname="connection.settextcolor" />
  </Connect
[... 已截断]
```

---

## Ladder

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/Ladder.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：0

### 属性表

**该页无属性表**（组件不定义自有属性，仅继承下列父组件的属性）。

### 子元素

页面 Example 中该组件元素内部出现的标签：`<BackgroundSprite>`

### 备注

该页无属性表；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="ladderwrecked" nameidentifier="ladder" variantof="ladder" category="Wrecked" condition="0">
  <Ladder>
    <BackgroundSprite texture="Content/Items/Shipwrecks/MiscWrecked.png" sourcerect="955,1600,26,240" />
  </Ladder>
  [...]
</Item>
```

---

## LevelResource

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/LevelResource.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `DeattachDuration` | float | 1 | How long it takes to deattach the item from the level walls (in seconds). |
| `DeattachTimer` | float | 0 | How far along the item is to being deattached. When the timer goes above DeattachDuration, the item is deattached. |
| `RandomOffsetFromWall` | float | 1 | How much the position of the item can vary from the wall the item spawns on. |

### 子元素

页面 Example 中该组件元素内部出现的标签：`<Commonness>`、`<RequiredItem>`

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="paralyxis" category="Material" maxstacksize="32" maxstacksizecharacterinventory="8" Tags="smallitem,ore" scale="0.5" cargocontaineridentifier="metalcrate" canbepicked="true">
  <LevelResource deattachduration="4" randomoffsetfromwall="20">
    <Commonness commonness="0" cavecommonness="0" abysscommonness="0" />
    <Commonness commonness="0.1" cavecommonness="0" abysscommonness="25" leveltype="europanridge" />
    <Commonness commonness="0.2" cavecommonness="0.1" abysscommonness="50" leveltype="theaphoticplateau" />
    <Commonness commonness="0.25" cavecommonness="0.1" abysscommonness="5" leveltype="thegreatsea" />
    <Commonness commonness="0.2" cavecommonness="0.1" abysscommonness="5" leveltype="hydrothermalwastes" />
    <RequiredItem items="cuttingequipment" type="Equipped" />
  </LevelResource>
  <Holdable canBeCombined="true" removeOnCombined="true" slots="Any,R
[... 已截断]
```

---

## MemoryComponent

- **URL**：<https://regalis11.github.io/BaroModDoc/ItemComponents/MemoryComponent.html>
- **HTTP 状态**：200
- **用途**：页面未提供说明段落
- **属性数**：3

### 属性表

| Attribute | Type | Default value | Description |
| --- | --- | --- | --- |
| `MaxValueLength` | int | 200 | The maximum length of the stored value. Warning: Large values can lead to large memory usage or networking issues. |
| `Value` | string | ”” | The currently stored signal the item outputs. |
| `Writeable` | bool | true | Can the value stored in the memory component be changed via signals. |

### 子元素

页面 Example 中该组件元素内部出现的标签：无（示例中该标签为自闭合，或示例未出现该元素）

### 备注

表头 4 列：Attribute | Type | Default value | Description；继承属性：ItemComponent；示例中 <MemoryComponent> 为自闭合标签，页面未展示其子元素；该页无用途说明段落（页面结构为 标题 + Attributes 表 + Example）

### 示例（典型用法，摘自页面 Example）

```xml
<Item identifier="memorycomponent" category="Electrical" Tags="smallitem,logic,circuitboxcomponent" maxstacksize="32" maxstacksizecharacterinventory="8" linkable="true" cargocontaineridentifier="metalcrate" scale="0.5" impactsoundtag="impact_metal_light" isshootable="true" GrabWhenSelected="true" signalcomponentcolor="#a66c6b">
  <MemoryComponent canbeselected="true" />
  <ConnectionPanel selectkey="Action" canbeselected="true" msg="ItemMsgRewireScrewdriver" hudpriority="10">
    <GuiFrame relativesize="0.2,0.32" minsize="400,350" maxsize="480,420" anchor="Center" style="ConnectionPanel" />
    <requireditem items="screwdriver" type="Equipped" />
    <input name="signal_in" displayname="connection.signalin" />
    <input name="lock_state" aliases="signal_store" displayname="connection.lockstate" />
    <output name="signal_out" displayname="connection.signalout" />
  </ConnectionPanel>
 
[... 已截断]
```

---

## 失败页面汇总

**无。** 本批 30 个页面全部抓取成功，HTTP 200，均含 Example，其中 28 页含非空属性表。

## 跨组件共性观察

- **属性名风格：100% PascalCase。** 共 192 行属性、163 个互不相同的属性名，其中首字母大写的 163 个、首字母小写的 **0** 个 ——
  文档表格里不存在 `canBeCombined` / `aimpos` 这类小写开头的写法；但页面 Example 的 XML 里属性普遍写成**全小写**
  （如 `canbeselected`、`focusonselected`），说明游戏解析属性名不区分大小写，而文档表格统一按 C# 属性名 PascalCase 展示。
- **类型列：存在，且 28 张非空属性表全部带独立的 `Type` 列**（表头固定 4 列：`Attribute | Type | Default value | Description`）。
  常见类型：`bool`、`float`、`int`、`string`、`Vector2`、`Point`、`Color`、`Identifier`、`AreaShape`、`FunctionType`、
  `UseEnvironment`，以及枚举型如 `PropertyConditional.LogicalOperatorType`。
- **跨组件重复出现的属性名**（说明它们定义在共享基类或被多个同类组件复用）：
  - `TimeFrame` —— 出现在 8 个组件中
  - `Output` —— 出现在 5 个组件中
  - `FalseOutput` —— 出现在 5 个组件中
  - `ClampMax` —— 出现在 4 个组件中
  - `ClampMin` —— 出现在 4 个组件中
  - `MaxOutputLength` —— 出现在 4 个组件中
  - `Signals` —— 出现在 2 个组件中
  - `Locked` —— 出现在 2 个组件中
  - `SelectedConnection` —— 出现在 2 个组件中
  - `WrapAround` —— 出现在 2 个组件中
  - `SkipEmptyConnections` —— 出现在 2 个组件中
- **逐层继承是常态**：29 / 30 个页面带有 `This component also supports the attributes defined in: <父组件>` 一行；
  `GreaterComponent` 继承 `EqualsComponent` + `ItemComponent`，其余绝大多数只继承 `ItemComponent`。
  仅 `ItemComponent` 作为基类没有该行，而 `GreaterComponent` 与 `Ladder` 的**自有属性表为空**，完全靠继承。
- **逻辑电路类高度同构**：Adder / Divide / Multiply / Subtract / And / Or / Xor / Equals / Greater / Exponentiation /
  Delay / Memory / Demultiplexer / Multiplexer 的属性集都极小（1–4 条），核心就是 `ClampMax` / `ClampMin` / `TimeFrame`，
  且信号类组件普遍有 `Output` / `FalseOutput` 这对属性。
- **属性表最大的页面**：ItemContainer（36）、ItemComponent（23）、Growable（21）、EntitySpawnerComponent（19）、Controller（14）。
- **无属性表的页面**：`GreaterComponent`、`Ladder` —— 页面只列出继承关系，没有任何自有属性行。
