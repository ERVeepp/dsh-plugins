# 需求：硬件数据检测与实时监控（hardware-monitor）

> 状态：规划中（2026-08-21 立项） | 日期：2026-08-21
> 来源：hardware-benchmark 升级需求，拆为独立 spec（与「性能评测/打分」功能域分离）
> 已澄清（见澄清记录），无 ⏸ 门禁

## 功能描述

- **要解决什么问题**：现有 `hardware_benchmark` 只做一次性打分，无法看实时性能指标（负载/温度/频率/IO 等）。
- **给谁用**：DSH 用户想实时看本机负载/温度/速率——游戏、压测、开发构建时监控。
- **核心价值**：像 MSI Afterburner 一样持续展示各项硬件指标（数字卡片 + 趋势图），同时保留数据工具给模型读。
- **本期不做**：后台长驻桌面 OSD 覆盖层（DSH 无此能力）、告警阈值推送（V2）、历史持久化（V2）。

## 用户故事（EARS 格式）

### 子域 1：采样

WHEN 触发硬件数据检测
THE SYSTEM SHALL 按采样窗口（默认 10 秒、interval 1 秒）采集以下指标：
- CPU：负载 / 温度 / 每核负载
- GPU：温度 / 负载 / 显存占用 / 核心频率
- 内存：使用率 / 已用 / 总量
- 磁盘：IO 读写速率 / 占用
- 网络：实时下载 / 上传速率
- 进程：CPU / 内存占用 Top N

WHEN 某一项采集失败
THE SYSTEM SHALL 该指标记为 null 并继续，不中断整体采样

### 子域 2：数据工具（模型可读）

WHEN 采样窗口完成
THE SYSTEM SHALL 返回每项指标的时间序列 + 汇总（最高 / 最低 / 平均），供模型/用户读趋势

### 子域 3：实时面板（DSH Client UI）

WHEN 用户触发监控面板
THE SYSTEM SHALL 通过 DSH Client 插件在界面渲染实时指标（数字卡片 + 近 N 秒趋势 sparkline）

WHEN 面板打开期间
THE SYSTEM SHALL 定时（1s）从 Host 拉取最新采样并刷新展示

WHEN 面板关闭或卸载
THE SYSTEM SHALL 停止轮询并清理资源

## 验收标准

- [ ] Host 采样服务：窗口采样 + 时间序列 + 汇总，可 smoke 验证（mock 采样源）
- [ ] `hardware_monitor` 工具注册，返回结构化序列（模型可读）
- [ ] Client 面板：实时数字 + 趋势图渲染（注册到 `tool.call.toolview` 槽位）
- [ ] Host-Client RPC 打通，面板随采样刷新
- [ ] 容错：某项指标 null 时面板降级显示
- [ ] `pnpm typecheck` / smoke 通过；端到端面板需 DSH 运行时验证（用户）

## 约束

- 复用 `tool-hardware-benchmark` 包的 `systeminformation` 采集底座（V1 已验证）
- DSH 插件双 half：Host（Node 采样）+ Client（浏览器 React 面板）
- 数据工具与面板共用 sampler，避免双份采集逻辑

## 澄清记录

| 问题 | 结论 |
|------|------|
| 展示形态 | **带网页实时面板（DSH Client UI 插件）** + 数据工具双形态 |
| 采样方式 | 采样窗口 N 秒 + 趋势/汇总 |
| 指标范围 | 全量：CPU / GPU / 内存+磁盘 IO / 网络 / 进程 Top N |
| 每核"频率"是否必须 | 跨平台拿不到每核实时频率，用**每核负载**替代（等价于 Afterburner 的每核使用率） |
| 趋势图用什么 | 内联 SVG sparkline，不引入重图表库 |

## 开放问题

- V2：告警阈值推送（超温/高占用提醒）
- V2：历史持久化 + 回放
- V2：多 GPU / 多磁盘枚举展示
