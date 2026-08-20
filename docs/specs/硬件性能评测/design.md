# 设计：硬件性能评测（dsh-plugin-hardware-benchmark）

> 状态：进行中 | 日期：2026-08-21 | 关联：[requirements](./requirements.md) [tasks](./tasks.md)

## 架构决策

### ADR-1：采集与评分分离（可测性）

- `system.ts` 负责采集（systeminformation + 网速实测），`benchmark.ts` 是**纯函数评分**（输入 HardwareProfile → 输出分数/等级/升级建议）
- 好处：mock 任意硬件 profile 就能验证评分逻辑，不依赖真机/DSH；评分规则独立演进

### ADR-2：采集容错（safe() 包装）

- 每项采集用 `safe()` try/catch，失败返回 `undefined` → 默认值
- 理由：硬件/权限/虚拟机环境千差万别，一项失败不能拖垮整个工具；拿不到 GPU 按集显/未知给分

### ADR-3：systeminformation 做采集底座

- 跨平台纯 JS、API 齐全（cpu/mem/memLayout/diskLayout/graphics/networkInterfaces/battery）
- 代价：新增依赖；接受（比手写各平台命令稳得多）

### ADR-4：网速实测用 Cloudflare 官方测速端点

- 下载：`speed.cloudflare.com/__down?bytes=5MB` 计时算 Mbps；上传：POST 2MB 到 `__up`
- 失败（断网/超时 15s）→ `downloadMbps: null` → 评分回退网卡估算；不阻塞主流程

### ADR-5：价格不硬编码，searchHint 交给模型

- 硬件价格动态变化 + 地区差异大，插件硬编码会过时
- 每条升级建议带 `recommendation`（推荐规格）+ `searchHint`（搜索词），DSH 模型用 `web_search` 实时查价填入

### ADR-6：升级建议 DIY 化

- 兼容性提示：DDR4 平台升不了 DDR5、显卡看电源瓦数/机箱长度、笔记本外接显卡坞性价比低
- 性价比导向：`costBand`（low/medium/high），排序 = 优先级优先 + 同优先级便宜在前
- 措辞像会装机的人（"换 NVMe SSD 是花钱最少体感提升最猛"）

## 数据流

```
模型: hardware_benchmark
  → system.ts collectHardware()
       ├─ systeminformation 并行采集（cpu/mem/memLayout/disk/diskLayout/graphics/osInfo/networkInterfaces/battery）
       └─ Cloudflare 实测 download/upload（失败→null）
  → benchmark.ts benchmark(profile)
       ├─ dev 分：CPU多核40 + 内存30 + 磁盘30
       ├─ game 分：GPU60 + CPU单核25 + 内存15
       ├─ network 分：实测优先，否则网卡估算
       └─ buildUpgrades()：按短板生成升级建议（recommendation/searchHint/costBand）
  → 返回 { hardware, dev, game, network, overall, upgrades }
模型: 按 upgrades[].searchHint 调 web_search 查价，给用户带价格的升级清单
```

## 评分权重（benchmark.ts）

| 维度 | 分量 | 权重 |
|------|------|------|
| dev | CPU 线程数 | 40 |
| dev | 内存容量 | 30 |
| dev | 磁盘类型（NVMe/SSD/HDD） | 30 |
| game | GPU 型号档位 + 显存加成 | 60 |
| game | CPU 单核频率 | 25 |
| game | 内存容量 | 15 |
| network | 实测下载（或网卡估算） | 100（附加维度） |

## 代码位置

```
packages/tool-hardware-benchmark/
├── src/index.ts            # 插件入口：注册 hardware_benchmark（待写）
├── src/benchmark.ts        # 纯函数评分 + 升级建议生成（已写）
├── src/system.ts           # systeminformation 采集 + Cloudflare 测速（已写）
├── scripts/smoke.ts        # mock 硬件 profile 验证评分（待写）
├── scripts/load-test.ts    # Cordis 加载验证（待写）
├── cordis.patch.yml        # bundle patch（已写）
├── dev/cordis.yml          # 开发期挂载（待写）
└── README.md               # 包级 README（待写）
```

## 兼容性/依赖

- dependencies：`systeminformation ^5.27`（纯 JS，无原生编译；装不上时补 pnpm allowBuilds）
- peerDependencies / devDependencies 同 npm-advisor（cordis + dsh-tools 锁版）
