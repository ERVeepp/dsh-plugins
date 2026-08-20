# 任务：npm 包引入审查（dsh-plugin-npm-advisor）

> 日期：2026-08-21 ｜ 关联：[requirements.md](./requirements.md) [design.md](./design.md)

## Wave 1：monorepo 骨架 + 插件包 ✅ 完成

- [x] `dsh-plugins` pnpm workspace（root package.json / pnpm-workspace.yaml / tsconfig.base / .gitignore / README）
- [x] `packages/tool-npm-advisor`：package.json（peerDeps + devDeps 锁 `dsh-tools@0.1.0-rc.8`）+ tsconfig
- [x] `pnpm allowBuilds: { esbuild: true }`（pnpm 11 构建脚本白名单坑）

## Wave 2：双工具实现 ✅ 完成

- [x] `registry.ts`：npm registry fetch + 进程内缓存 + readme 头部截取
- [x] `native.ts`：原生替代映射表 + 弃坑包表
- [x] `dependency-tree.ts`：递归依赖 → mermaid（visited 去重）
- [x] `index.ts`：注册 `npm_package_audit` / `npm_dependency_tree`
- [x] 冒烟抓 bug：依赖树 `d<=0` 提前 return 丢第一层边 → 修成 `d<0`

## Wave 3：验证 ✅ 完成

- [x] `smoke.ts`：moment 命中维护模式+README 迁移线索 / axios 命中原生替代 / 依赖树 mermaid
- [x] `load-test.ts`：Cordis 真实加载 + 两工具注册断言
- [x] `typecheck` / `smoke` / `load-test` 全过

## Wave 4：发布 ✅ 完成

- [x] 包级 README（npm 页面非空白）
- [x] `dsh.bundle` + `cordis.patch.yml`（bundle 规范）
- [x] 打 GitHub topic（`dsh-plugin` / `deepseek-harness` / `dsh` / `cordis` / `cordis-plugin`）
- [x] 1024Store 收录：fork → 目录 JSON → PR #126 → **自动合并**
- [x] `docs/发布流程.md`（整套 SOP）

## 出口校验

- [x] 逐条对照 requirements 验收标准（全过）
- [x] V1 无阻塞；V2 开放（漏洞扫描 / 自动改 package.json）另立 spec
