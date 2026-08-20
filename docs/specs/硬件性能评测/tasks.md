# 任务：硬件性能评测（dsh-plugin-hardware-benchmark）

> 日期：2026-08-21 ｜ 关联：[requirements.md](./requirements.md) [design.md](./design.md)

## Wave 1：插件包骨架 ✅ 完成

- [x] `packages/tool-hardware-benchmark`：package.json（依赖 systeminformation + dsh.bundle）+ tsconfig
- [x] `cordis.patch.yml`（bundle patch，按包名 `@cqpdrcuk/dsh-plugin-hardware-benchmark` 引用）

## Wave 2：硬件采集 system.ts ✅ 完成

- [x] systeminformation 并行采集：cpu / mem / memLayout / diskLayout / graphics / osInfo / networkInterfaces / battery
- [x] `safe()` 逐项容错：失败给默认值，不中断
- [x] Cloudflare 实测下载（5MB）/ 上传（2MB），失败返回 null

## Wave 3：评分核心 benchmark.ts ✅ 完成

- [x] HardwareProfile 接口（含 memType / network / battery）
- [x] dev 分（CPU 多核 40 + 内存 30 + 磁盘 30）+ game 分（GPU 60 + CPU 单核 25 + 内存 15）+ 等级
- [x] network 分（实测优先，否则网卡估算）
- [x] GPU 型号档位表（旗舰→集显）+ 显存加成

## Wave 4：升级建议（DIY 化）✅ 完成

- [x] 内存 DDR4→DDR5 判断（DDR4 平台"加容量优先，整机换代再上 DDR5"）
- [x] 磁盘/内存/显卡/CPU/网络/电池升级项：recommendation + searchHint + costBand
- [x] 兼容性提示（电源瓦数 / 机箱长度 / 笔记本 / 主板平台）
- [x] 排序：优先级优先 + 同优先级便宜在前

## Wave 5：插件入口 + 验证 ✅ 完成

- [x] `src/index.ts`：注册 `hardware_benchmark` 工具（描述说明价格用 web_search 查）
- [x] `scripts/smoke.ts`：mock 三档硬件（强开发机/游戏机/入门机）验证评分与升级建议——全 OK
- [x] `scripts/load-test.ts`：Cordis 加载 + `hardware_benchmark` 注册
- [x] root package.json 加 `smoke:hardware` / `load-test:hardware`
- [x] `pnpm typecheck`（两包）/ `smoke:hardware` / `load-test:hardware` 全过
- [x] 包级 README + dev/cordis.yml
- [x] 修 3 个类型错误（闭包收窄 / JsonValue 返回 / CPU 频率字段 MHz→GHz）

## Wave 6：发布 ✅ 完成

- [x] 打 GitHub topic（仓库已有）
- [x] 1024Store 收录：目录 JSON → PR #127 → **自动合并**
- [x] `npm publish --access public` → `@cqpdrcuk/dsh-plugin-hardware-benchmark@0.1.0`

## 出口校验

- [ ] 逐条对照 requirements 验收标准（采集容错 / 评分可测 / 升级建议含 DDR4→DDR5 + 性价比 + searchHint / 网络实测回退）
- [ ] V2 开放问题（跑分软件集成 / 多硬件枚举）另立 spec
