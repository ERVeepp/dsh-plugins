# 设计：npm 包引入审查（dsh-plugin-npm-advisor）

> 状态：已完成（V1） | 日期：2026-08-21 | 关联：[requirements](./requirements.md) [tasks](./tasks.md)

## 架构决策

### ADR-1：DSH 工具插件形态

- 插件 = Cordis 插件（`name`/`inject=['tools']`/`apply(ctx)`），注册两个 `defineTool`
- 好处：随 DSH 插件生态安装，模型 Function Calling 直接可调；无独立 UI/CLI 负担

### ADR-2：事实与裁决分离

- 插件职责止步于「结构化事实」；最终选型由 DSH 模型裁决
- 理由：选型判断依赖模型知识 + 实时信息，插件硬编码结论会过时

### ADR-3：npm registry 元数据 + README 头部是核心数据源

- registry 的 `readme` 字段头部是「弃坑/迁移声明」的高密度区（moment/request 都在顶部写推荐替代）
- 把 README 前 1500 字符喂给模型 = 让模型能识别「原作者换代、该选新包」

### ADR-4：原生替代映射表硬编码（高置信）

- 只放高置信、Node 内置已覆盖的场景（fetch/randomUUID/loadEnvFile/parseArgs...），避免误判

## 数据流

```
模型: npm_package_audit("moment")
  → registry.ts fetchPackage()      # npm registry 元数据 + readme 头部（进程内缓存）
  → native.ts 命中原生替代?          # 直接标注
  → native.ts 命中弃坑表?            # 标注维护状态
  → 返回 JSON（模型结合 README 迁移声明裁决）

模型: npm_dependency_tree("axios", 2)
  → registry.ts fetchDependencies() # 递归 dependencies
  → dependency-tree.ts renderDependencyTree()  # visited 去重 → mermaid
```

## 代码位置

```
packages/tool-npm-advisor/
├── src/index.ts            # 插件入口：注册 2 个工具
├── src/registry.ts         # npm registry 客户端（fetch + Map 缓存）
├── src/native.ts           # 原生替代映射表 + 弃坑包表
├── src/dependency-tree.ts  # 依赖树渲染（独立模块，可测）
├── scripts/smoke.ts        # 逻辑冒烟（不依赖 DSH）
├── scripts/load-test.ts    # Cordis 加载 + 工具注册验证
├── cordis.patch.yml        # bundle patch（按包名引用）
└── dev/cordis.yml          # 开发期挂载（绝对路径）
```

## 兼容性/依赖

- peerDependencies：`@deepseek-ai/cordis >=4.0.1`、`@deepseek-ai/dsh-tools >=0.1.0-rc.0`
- devDependencies 锁 `dsh-tools@0.1.0-rc.8`（`next` tag；`latest` 是老版本依赖未发布包，装不上）
