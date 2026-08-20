/**
 * 依赖树渲染（独立模块，便于单测 / 冒烟验证）
 */
import { fetchDependencies } from './registry'

const edge = (from: string, to: string) =>
  `  ${from.replace(/\W/g, '_')} --> ${to.replace(/\W/g, '_')}`

export async function renderDependencyTree(pkg: string, depth = 2): Promise<string> {
  const seen = new Set<string>()
  const lines: string[] = ['graph TD']

  const walk = async (name: string, d: number, from?: string) => {
    if (seen.has(name) || d < 0) return
    seen.add(name)
    if (from) lines.push(edge(from, name))
    try {
      const deps = await fetchDependencies(name)
      for (const dep of deps) await walk(dep, d - 1, name)
    } catch {
      lines.push(edge(name, 'unknown'))
    }
  }

  await walk(pkg, depth)
  return '```mermaid\n' + lines.join('\n') + '\n```'
}
