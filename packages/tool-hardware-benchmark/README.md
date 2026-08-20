# @cqpdrcuk/dsh-plugin-hardware-benchmark

DeepSeek Harness（DSH）插件：**读取本机硬件并打分**——工程开发 / 游戏性能两个维度 + 网络附加分 + DIY 升级建议。

## 安装与挂载

`cordis.yml` 加入一行（DSH 从 npm/git 解析）：

```yaml
- id: hardware-benchmark
  name: '@cqpdrcuk/dsh-plugin-hardware-benchmark'
```

## 工具

| 工具 | 说明 |
|------|------|
| `hardware_benchmark` | 读取 CPU / 内存（含代数）/ 磁盘 / GPU / 网卡 / 电池 → 双维评分 + 升级清单 |

返回 JSON：`hardware`（硬件画像）+ `dev` / `game` / `network`（分数、等级、理由）+ `overall` + `upgrades`（按性价比排序的升级建议）。

## 评分维度

| 维度 | 组成 |
|------|------|
| 工程开发 | CPU 多核（40）+ 内存（30）+ 磁盘 NVMe/SSD/HDD（30） |
| 游戏性能 | GPU 档位+显存（60）+ CPU 单核（25）+ 内存（15） |
| 网络（附加） | Cloudflare 实测下载，失败回退网卡估算 |

## 升级建议（DIY 口吻）

按短板生成，每条含 `recommendation`（推荐规格）+ `searchHint`（查价搜索词）+ `costBand`（成本档）：

- 内存：DDR4 平台明确「升不了 DDR5，加容量优先；整机换代再上 DDR5 6000」
- 显卡：提示先看电源瓦数与机箱长度；笔记本外接显卡坞性价比低
- 磁盘：换 NVMe SSD 是「花钱最少、体感提升最猛」
- 排序：优先级优先，同优先级便宜的排前

**价格**：插件不硬编码（会过时），DSH 模型按 `searchHint` 调 `web_search` 实时查参考价。

## 示例

让 DSH Agent 执行：

```
hardware_benchmark
```

输出会包含如：`dev.score=38(C)`、`upgrades: [内存(DDR4 加容量优先, low), 磁盘(换 NVMe, low), 显卡(加装 RTX 4060, high)...]`，模型再按 searchHint 查价汇总成升级清单。

## 技术

- 采集：`systeminformation`（跨平台纯 JS）+ Cloudflare 官方测速端点（实测网速，失败静默回退）
- 评分/升级建议为纯函数，可 mock 验证（`scripts/smoke.ts`）
- License: MIT
