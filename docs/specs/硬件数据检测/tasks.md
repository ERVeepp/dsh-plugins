# 任务：硬件数据检测与实时监控（hardware-monitor）

> 日期：2026-08-21 ｜ 关联：[requirements.md](./requirements.md) [design.md](./design.md)

## Wave 1：Host 采样服务 + 数据工具（进行中）

- [ ] `src/sampler.ts`：systeminformation 定时采样（CPU 负载/温度/每核负载、GPU 温度/负载/显存/频率、内存、磁盘 IO、网络实时、进程 TopN）+ 环形缓冲（60s）
- [ ] `src/monitor.ts`：`hardware_monitor` 工具——采样窗口 → 时间序列 + 汇总（最高/最低/平均）
- [ ] 容错：单指标失败记 null，不中断
- [ ] `scripts/smoke:monitor`：mock 采样源验证序列 / 汇总 / 容错
- [ ] `harness.handle('hardware:snapshot')` RPC 暴露

## Wave 2：Client 实时面板

- [ ] `client/index.ts`：slots 注册 `tool.call.toolview`（hardware_monitor 调用后展示）
- [ ] `MonitorPanel.tsx`：指标分组卡片 + SVG sparkline 趋势
- [ ] 轮询 Host snapshot（1s）刷新 + 生命周期清理（卸载停轮询）
- [ ] 端到端面板验证（需 DSH 运行时，用户）

## Wave 3：发布

- [ ] `cordis.patch.yml` 含 client half 声明（`dsh.client`）
- [ ] 1024Store 收录更新 / npm 发版（照《发布流程.md》SOP）

## 出口校验

- [ ] 逐条对照 requirements 验收标准（采样/序列+汇总/工具/Client 面板/RPC/容错）
- [ ] V2 开放问题（告警推送 / 历史持久化 / 多 GPU 枚举）另立 spec
