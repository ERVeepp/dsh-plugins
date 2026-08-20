# 设计：硬件数据检测与实时监控（hardware-monitor）

> 状态：规划中 | 日期：2026-08-21 | 关联：[requirements](./requirements.md) [tasks](./tasks.md)

## 架构决策

### ADR-1：双形态（数据工具 + Client 面板）

- **数据工具 `hardware_monitor`**：Host 端采样窗口（默认 10s / interval 1s），返回时间序列 + 汇总 JSON，模型可读
- **Client 面板**：React 组件注册到 `tool.call.toolview` 槽位，`hardware_monitor` 调用后展示实时指标
- 复用 `tool-hardware-benchmark` 的 `systeminformation` 采集底座，新增 sampler 服务

### ADR-2：Host 采样服务（sampler.ts）

- 基于 systeminformation 定时采样（`setInterval` 1s），环形缓冲保留最近 60 秒
- 采集项：CPU（load / temperature / per-core load）、GPU（temp / load / vram / core clock）、内存、磁盘 IO、网络实时速率、进程 Top N
- 每核"频率"跨平台不可靠 → 用每核负载（等价 Afterburner 每核使用率）
- 通过 `harness.handle('hardware:snapshot', ...)` 暴露给 Client，Client **轮询**（避免长连接/推送复杂度）

### ADR-3：Client 面板轻量化

- React 组件，指标分组卡片（CPU / GPU / 内存 / 磁盘 / 网络 / 进程）
- 趋势图用内联 SVG sparkline（不引入重图表库，与 DSH 已有依赖一致）
- 生命周期：面板挂载 → 启动轮询（1s）→ 卸载停止；轮询失败静默降级显示最后快照

### ADR-4：数据工具复用 sampler

- `hardware_monitor` 走同一 sampler：启动采样窗口（seconds×interval 次）→ 收集序列 → 算汇总
- 避免数据工具与面板各自实现一套采集逻辑

## 数据流

```
Client 面板打开
  → 轮询 harness.handle('hardware:snapshot')（1s）
  → Host sampler 返回最新快照 + 环形缓冲历史
  → React 渲染数字卡片 + sparkline 趋势

模型: hardware_monitor(seconds=10)
  → Host 采样 10 秒 → 时间序列 + 汇总 JSON
```

## 代码位置（规划）

放在 `tool-hardware-benchmark` 包内（共享采集底座，同一插件包双 half）：

```
packages/tool-hardware-benchmark/
├── src/sampler.ts          # Host 采样服务（环形缓冲 + RPC handle）
├── src/monitor.ts          # hardware_monitor 工具（采样窗口 → 序列+汇总）
├── client/
│   ├── index.ts            # Client 插件入口：slots 注册 tool.call.toolview
│   └── MonitorPanel.tsx    # 指标卡片 + SVG sparkline
└── cordis.patch.yml        # bundle patch 声明 host + client 两侧
```

## 兼容性/依赖

- dependencies：`systeminformation ^5.27`（复用）
- Client 侧：React（DSH 自带，不新增依赖）
- Host-Client：`harness.handle` / `remote`（DSH Client 插件机制）
