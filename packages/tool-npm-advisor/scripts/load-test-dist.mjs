/**
 * 本地验证 dist 产物（模拟 DSH 从 node_modules 加载 dist 的场景）
 * 运行：node packages/tool-npm-advisor/scripts/load-test-dist.mjs （monorepo 根）
 */
import { Context } from '@deepseek-ai/cordis'
import * as advisor from '../dist/index.mjs'
import * as hw from '../../tool-hardware-benchmark/dist/index.mjs'

for (const [label, plugin] of [['npm-advisor', advisor], ['hardware-benchmark', hw]]) {
  const ctx = new Context()
  const registered = []
  ctx.provide('tools', {
    register: (def) => { registered.push(def.name); return () => undefined },
  })
  await ctx.plugin(plugin)
  console.log(`[OK] ${label} → name=${plugin.name} inject=${JSON.stringify(plugin.inject)} tools=${registered.join(', ')}`)
  if (registered.length === 0) process.exitCode = 1
  await ctx.fiber?.dispose?.()
}
console.log('[PASS] dist 产物加载 + 工具注册全部通过（不再有 TS stripping 错误）')
