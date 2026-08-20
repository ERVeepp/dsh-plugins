/**
 * npm-advisor —— DSH 插件入口
 *
 * 引入新 npm 包前调用：判断候选包是否是最优解。
 * 事实由插件给（registry 元数据 + 原生替代映射表），裁决交给模型
 * （模型结合 readme 头部的迁移声明 + 自身知识做最终选型）。
 */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { findDeadPackage, findNativeAlternative } from './native'
import { fetchDependencies, fetchPackage } from './registry'

export const name = 'npm-advisor'
export const inject = ['tools']

const TREE_EDGE = (from: string, to: string) =>
  `  ${from.replace(/\W/g, '_')} --> ${to.replace(/\W/g, '_')}`

export function apply(ctx: Context) {
  // ── 工具 1：引入前审查 ────────────────────────────────────────────
  ctx.tools.register(defineTool({
    name: 'npm_package_audit',
    description:
      '审查候选 npm 包是否是最优解：原生替代、维护健康度、README 迁移线索、'
      + '直接依赖规模。在引入新依赖前调用；返回 JSON 供你结合包 README 的迁移声明做最终裁决。',
    parameters: {
      packageName: { type: 'string', required: true, description: '待引入的 npm 包名（可含 @scope/）' },
    },
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute(args) {
      const meta = await fetchPackage(args.packageName)
      return {
        ...meta,
        nativeAlternative: findNativeAlternative(meta.name),
        deadPackage: findDeadPackage(meta.name),
      }
    },
  }))

  // ── 工具 2：依赖树可视化 ──────────────────────────────────────────
  ctx.tools.register(defineTool({
    name: 'npm_dependency_tree',
    description: '递归拉取依赖并输出 mermaid 依赖图，用于评估引入后的依赖膨胀。',
    parameters: {
      packageName: { type: 'string', required: true },
      depth: { type: 'number', description: '递归深度，默认 2' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const seen = new Set<string>()
      const lines: string[] = ['graph TD']
      const walk = async (name: string, depth: number, from?: string) => {
        if (seen.has(name) || depth <= 0) return
        seen.add(name)
        if (from) lines.push(TREE_EDGE(from, name))
        try {
          const deps = await fetchDependencies(name)
          for (const dep of deps) await walk(dep, depth - 1, name)
        } catch {
          lines.push(TREE_EDGE(name, 'unknown'))
        }
      }
      await walk(args.packageName, args.depth ?? 2)
      return '```mermaid\n' + lines.join('\n') + '\n```'
    },
  }))
}
