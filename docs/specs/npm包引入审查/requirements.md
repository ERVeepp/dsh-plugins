# 需求：npm 包引入审查（dsh-plugin-npm-advisor）

> 状态：已完成（V1） | 日期：2026-08-21
> 来源：用户想法 → DSH 插件 monorepo 首发
> 已澄清，无 ⏸ 门禁（回顾式补写，实现已完成并上线）

## 功能描述

- **要解决什么问题**：DSH Agent 引入新 npm 依赖时凭记忆选型，可能选了已弃坑/非最优的包，或没意识到原生 API 已够用。
- **给谁用**：用 DSH 的开发者；agent 在「该不该装这个包」时调用。
- **核心价值**：引入前给「事实」——原生替代、维护健康度、README 迁移线索、依赖膨胀——由模型做最终裁决，减少拍脑袋装包。
- **本期不做**：包安全漏洞扫描（V2）、自动改 `package.json`、价格查询（选型价格由模型 `web_search` 自己查，插件不硬编码）。

## 用户故事（EARS 格式）

### 子域 1：引入前审查

WHEN 用户考虑引入新的 npm 包
THE SYSTEM SHALL 提供模型可调工具 `npm_package_audit`

WHEN 调用 `npm_package_audit` 且包存在
THE SYSTEM SHALL 拉取 npm registry 元数据：`deprecated` / 最后发布时间 / maintainers / 直接依赖数量 / README 头部 1500 字符

WHEN 候选包命中内置「原生替代」映射表
THE SYSTEM SHALL 直接标注原生替代方案（如 axios → 原生 fetch）

WHEN 候选包命中内置「弃坑/维护停滞」表
THE SYSTEM SHALL 标注维护状态并提示看 README 迁移声明

### 子域 2：依赖树可视化

WHEN 调用 `npm_dependency_tree`
THE SYSTEM SHALL 递归拉取 dependencies（默认深度 2）输出 mermaid 依赖图

WHEN 依赖出现环或重复
THE SYSTEM SHALL 用 visited 集合去重防死循环

### 子域 3：事实与裁决分离

THE SYSTEM SHALL 只输出结构化事实，不替模型下结论

WHEN 模型拿到 audit 结果
THE SYSTEM SHALL 由模型结合 README 迁移线索 + 自身知识做最终选型

## 验收标准

- [x] `pnpm typecheck` 通过（`@deepseek-ai/dsh-tools@0.1.0-rc.8` 真类型）
- [x] `pnpm smoke` 三用例通过：moment 命中维护模式 + README 迁移线索；axios 命中原生替代；依赖树输出 mermaid
- [x] `pnpm load-test`：Cordis 真实加载，`npm_package_audit` / `npm_dependency_tree` 注册成功
- [x] 插件声明 `dsh.bundle`，`cordis.patch.yml` 按包名引用
- [x] 1024Store 收录 PR #126 已 MERGED

## 约束

- 插件是 Cordis 插件：`name` / `inject=['tools']` / `apply(ctx)` + `ctx.tools.register(defineTool(...))`
- `@deepseek-ai/*` 放 peerDependencies（宿主提供）；devDependencies 锁版本（`latest` tag 是坑，须锁 `0.1.0-rc.8`）
- scope 用实际 npm 用户名 `@cqpdrcuk`

## 澄清记录

| 问题 | 结论 |
|------|------|
| 插件是什么形态 | DSH 工具插件（模型可调），不是 CLI |
| 判断「是否最优解」谁来做 | 插件给事实（registry 元数据 + 映射表），模型裁决（README 迁移声明 + 知识） |
| 需要价格吗 | 不需要——价格动态，由模型 `web_search` 查 |
