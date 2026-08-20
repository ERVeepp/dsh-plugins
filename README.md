# dsh-plugins

DeepSeek Harness（DSH）第三方插件 Monorepo。

> DSH 核心设计：**Everything is a Plugin** —— 所有能力（Agent / 工具 / 模型 / UI）都以
> Cordis 插件形式挂载。本仓库按官方插件同构的形态开发、发布。

## 目录

```
packages/
  tool-npm-advisor/        # npm 包引入前审查（已收录 1024Store）
  tool-hardware-benchmark/ # 硬件性能评测：开发/游戏双维打分 + 网络实测 + DIY 升级建议
docs/
  发布流程.md              # 发布 SOP（开发→topic→1024Store→npm）
  specs/                   # 各插件 Spec-Kit Lite 三件套（requirements / design / tasks）
```

## 插件列表

| 包 | 工具 | 说明 | 状态 |
|----|------|------|:---:|
| `@cqpdrcuk/dsh-plugin-npm-advisor` | `npm_package_audit` / `npm_dependency_tree` | 引入新依赖前判断是否最优解：原生替代、维护健康度、README 迁移线索、依赖树 | ✅ 已收录 1024Store（PR #126） |
| `@cqpdrcuk/dsh-plugin-hardware-benchmark` | `hardware_benchmark` | 读取本机硬件，工程开发 / 游戏性能双维打分 + 网络实测 + DIY 升级建议（推荐规格 + 实时查价搜索词） | 🔄 开发完成待发布 |

## 快速开始

```sh
pnpm install            # 安装 workspace + 各包依赖
pnpm typecheck          # 全仓库类型检查
pnpm smoke              # npm-advisor 逻辑冒烟
pnpm smoke:hardware     # 硬件评测 mock 冒烟（三档硬件）
pnpm load-test          # Cordis 加载 + 工具注册（npm-advisor）
pnpm load-test:hardware # Cordis 加载 + 工具注册（hardware-benchmark）
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

## 发布（上官方线上）

完整流程见 [docs/发布流程.md](docs/发布流程.md)：开发验证 → GitHub topic → 1024Store 收录（PR 自动合并）→ npm publish。

| 插件 | topic | 1024Store | npm |
|------|:---:|:---:|:---:|
| npm-advisor | ✅ | ✅ PR #126 | 待发 |
| hardware-benchmark | ✅ | 待收录 | 待发 |

npm 发布（可选但推荐，1024Store 会标 VERIFIED）：

```sh
npm login            # 账号 cqpdrcuk
cd packages/<子包>
npm publish --dry-run # 检查打包内容
npm publish --access public
```

发布前检查：

- [ ] `peerDependencies` 版本范围正确（`@deepseek-ai/cordis` / `@deepseek-ai/dsh-tools`）
- [ ] `files` 已包含源码 + `cordis.patch.yml`（bundle 规范）
- [ ] 包目录有自己的 `README.md`
- [ ] `pnpm typecheck` / `smoke` / `load-test` 通过
- [ ] 声明了 `dsh.bundle` 并提交 `cordis.patch.yml`

## 技术要点

- **DSH 插件 = Cordis 插件**：`name` + `inject`（声明依赖服务）+ `apply(ctx)`（注册贡献）
- **加载方式**：`cordis.yml` entry，开发期用绝对路径，发布后用 npm 包名
- **工具 API**：`defineTool({ name, description, parameters, output, execute })`
- **事实与裁决分离**：插件给结构化事实（registry 元数据 + 映射表），LLM 做最终选型判断
