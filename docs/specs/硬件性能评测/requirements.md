# 需求：硬件性能评测（dsh-plugin-hardware-benchmark）

> 状态：进行中（Wave 1-4 完成，Wave 5 编码中） | 日期：2026-08-21
> 来源：用户想法 → DSH 插件 monorepo 第二个插件
> 已澄清：升级建议 + 网上查价、所有可查硬件、网速实测、DIY 爱好者口吻

## 功能描述

- **要解决什么问题**：让 DSH Agent 能读本机硬件并给出「工程开发 / 游戏性能」双维度评分，以及**懂行（DIY 玩家口吻）的升级建议**。
- **给谁用**：用 DSH 的开发者/玩家，问"我这台电脑值不值得升级 / 怎么升级"。
- **核心价值**：一次调用给全——硬件画像 + 双维评分 + 按性价比排序的升级清单（含推荐规格、兼容性提示、实时查价搜索词）。
- **本期不做**：跑分软件集成（Cinebench/3DMark 实测跑分，V2）、外设深度评测、多语言界面、整机购买建议（V2）。

## 用户故事（EARS 格式）

### 子域 1：硬件采集

WHEN 调用 `hardware_benchmark`
THE SYSTEM SHALL 读取 CPU（型号/物理核/线程/频率）、内存（容量/内存代数）、磁盘（类型/容量）、GPU（型号/显存）、网卡（类型/标称速率）、电池健康度

WHEN 采集某一项失败
THE SYSTEM SHALL 用默认值容错，不中断整个工具（如检测不到 GPU 给空，按集显/未知处理）

### 子域 2：双维度评分

THE SYSTEM SHALL 按两个维度打分（0-100 + 等级 S/A/B/C/D）：
- 工程开发：CPU 多核（40）+ 内存（30）+ 磁盘（30）
- 游戏性能：GPU（60）+ CPU 单核（25）+ 内存（15）

THE SYSTEM SHALL 为每个维度输出分数、等级、逐项理由

### 子域 3：网络实测

WHEN 联网可用
THE SYSTEM SHALL 用测速端点实测下载/上传 Mbps，并给网络分（附加维度）

IF 实测失败
THEN THE SYSTEM SHALL 按网卡信息（有线/无线 + 标称速率）估算分数，不报错

### 子域 4：升级建议（DIY 口吻）

THE SYSTEM SHALL 按短板生成升级建议，每条含：推荐规格（具体型号/代数）+ `searchHint` 搜索词 + 成本档（low/medium/high）

THE SYSTEM SHALL 提示兼容性：DDR4 主板升不了 DDR5、加显卡看电源瓦数与机箱长度、笔记本外接显卡性价比低

WHEN 存在 DDR4 内存
THE SYSTEM SHALL 在内存升级建议中说明「DDR4 平台优先加容量，整机换代再上 DDR5」

THE SYSTEM SHALL 按「优先级优先、同优先级便宜的排前」排序升级清单

WHEN 用户要参考价
THE SYSTEM SHALL 由 DSH 模型按 `searchHint` 调 `web_search` 实时查询填入（插件不硬编码价格）

## 验收标准

- [ ] 采集容错：断网 / 无独显 / 无电池场景不崩溃
- [ ] 评分可测：mock 硬件 profile（强开发机/游戏机/入门机）输出分数与等级合理
- [ ] 升级建议含：DDR4→DDR5 判断、性价比排序（costBand）、每条带 recommendation + searchHint
- [ ] 网络：Cloudflare 实测，失败回退网卡估算
- [ ] `pnpm typecheck` / `smoke` / `load-test` 通过
- [ ] 插件声明 `dsh.bundle`，1024Store 收录（复用发布流程 SOP）

## 约束

- 采集用 `systeminformation`（纯 JS 跨平台，无原生编译）；网速用 Cloudflare 官方测速端点
- 评分与升级建议为纯函数（`benchmark.ts`），便于 mock 验证，不依赖真机/DSH
- 插件是 Cordis 工具插件，同 npm-advisor 约束（peerDeps、bundle patch、scope `@cqpdrcuk`）

## 澄清记录

| 问题 | 结论 |
|------|------|
| 除 CPU/内存/GPU 还要查什么 | 所有可查硬件：磁盘、网卡、电池健康度、实测网速 |
| 升级价格怎么给 | 不硬编码（会过时）；插件给 `searchHint`，模型 `web_search` 实时查 |
| 网速是评分还是附加 | 附加「网络」维度（不进开发/游戏主分），失败按网卡估算 |
| 建议口吻 | DIY 爱好者：点兼容性、算性价比、按性价比排序 |
| 内存升级要不要说 DDR4→DDR5 | 要——DDR4 平台明确"升不了 DDR5，加容量优先" |

## 开放问题

- V2：接跑分软件（Cinebench/3DMark）给实测分 vs 本启发式分
- V2：多内存条 / 多 GPU / 多磁盘的完整枚举（当前取主件）
