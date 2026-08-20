# dsh-plugins

DeepSeek Harness（DSH）第三方插件 Monorepo。

> DSH 核心设计：**Everything is a Plugin** —— 所有能力（Agent / 工具 / 模型 / UI）都以
> Cordis 插件形式挂载。本仓库按官方插件同构的形态开发、发布。

## 目录

```
packages/
  tool-npm-advisor/   # npm 包引入前审查（第一个插件）
```

## 插件列表

| 包 | 工具 | 说明 |
|----|------|------|
| `@cqpdrcuk/dsh-plugin-npm-advisor` | `npm_package_audit` / `npm_dependency_tree` | 引入新依赖前判断是否最优解：原生替代、维护健康度、README 迁移线索、依赖树 |

## 快速开始

```sh
pnpm install          # 安装 workspace + 各包依赖
pnpm typecheck        # 全仓库类型检查
```

## 开发一个新插件

1. `packages/` 下新建目录，命名 `tool-<name>`（工具类）/ `service-<name>`（服务类）
2. `package.json` 的 `peerDependencies` 声明 `@deepseek-ai/cordis` + `@deepseek-ai/dsh-tools`
3. `src/index.ts` 导出 `name` / `inject` / `apply(ctx)`，用 `ctx.tools.register(defineTool(...))` 注册工具
4. `dev/cordis.yml` 写挂载 patch（绝对路径），见 `packages/tool-npm-advisor/dev/cordis.yml`

## 调试

见各包 `dev/cordis.yml` 顶部说明。核心命令：

```sh
pnpm dsh web --patch ./dev/cordis.yml
```

## 发布到 npm（上官方线上）

```sh
# 1. 确认 scope 是你的 npm 用户名 @cqpdrcuk（已配好）
npm login
# 2. 在插件包目录发布
pnpm publish --access public
# 3. 使用方（DSH 配置）改引包名：
#    - id: npm-advisor
#      name: '@cqpdrcuk/dsh-plugin-npm-advisor'
```

发布前检查：

- [ ] `peerDependencies` 版本范围正确（`@deepseek-ai/cordis` / `@deepseek-ai/dsh-tools`）
- [ ] `files: ["src"]` 已包含全部源码（DSH 直接加载 TS，无需编译产物）
- [ ] `pnpm typecheck` 通过
- [ ] 已在本地 DSH 挂载冒烟验证过两个工具

## 技术要点

- **DSH 插件 = Cordis 插件**：`name` + `inject`（声明依赖服务）+ `apply(ctx)`（注册贡献）
- **加载方式**：`cordis.yml` entry，开发期用绝对路径，发布后用 npm 包名
- **工具 API**：`defineTool({ name, description, parameters, output, execute })`
- **事实与裁决分离**：插件给结构化事实（registry 元数据 + 映射表），LLM 做最终选型判断
