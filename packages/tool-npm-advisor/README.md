# @cqpdrcuk/dsh-plugin-npm-advisor

DeepSeek Harness（DSH）插件：**npm 包引入前审查**。

引入新依赖前，让 DSH Agent 判断候选包是否是最优解——原生替代、维护健康度、README 迁移线索、依赖树可视化。事实由插件给（npm registry 元数据 + 高置信映射表），最终选型由模型结合 README 迁移声明裁决。

## 安装与挂载

`cordis.yml` 加入一行（DSH 从 npm 解析）：

```yaml
- id: npm-advisor
  name: '@cqpdrcuk/dsh-plugin-npm-advisor'
```

## 工具

| 工具 | 说明 |
|------|------|
| `npm_package_audit` | 审查候选包：`deprecated` / 最后发布时间 / maintainers / 直接依赖数 / README 头部（迁移线索）/ 原生替代命中 / 弃坑包命中 |
| `npm_dependency_tree` | 递归拉取依赖，输出 mermaid 依赖图（评估依赖膨胀） |

## 原生替代示例（映射表内置）

`axios` → 原生 fetch（Node 18+）｜`moment` → dayjs/date-fns/Temporal｜`uuid` → `crypto.randomUUID()`｜`dotenv` → `process.loadEnvFile()`｜`minimist` → `util.parseArgs()` 等。

## 示例

让 DSH Agent 执行：

```
npm_package_audit("moment")
```

返回 JSON 会包含：`deadPackage: "进入维护模式（官方 README 推荐 dayjs / date-fns / Luxon）"` + README 头部原文，供模型给出替换建议。

## License

MIT
