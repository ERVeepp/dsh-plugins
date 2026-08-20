/**
 * Cordis 加载测试：验证插件作为 Cordis 插件能被正确加载并注册工具。
 *
 * 不依赖 DSH 宿主 / LLM key —— 用 @deepseek-ai/cordis 的真实 Context：
 *  1. provide 一个 mock 'tools' 服务
 *  2. ctx.plugin() 挂载插件（走真实的 inject/apply 机制）
 *  3. 断言 apply 被调用、两个工具都注册成功
 *
 * 运行：pnpm load-test
 */
import { Context } from '@deepseek-ai/cordis'
import * as plugin from '../src/index'

async function main() {
  const ctx = new Context()
  const registered: string[] = []

  // mock DSH 的 tools 服务（Cordis inject 机制：provide 后才挂载插件）
  ctx.provide('tools', {
    register: (def: any) => {
      registered.push(def.name)
      return () => undefined
    },
  })

  await ctx.plugin(plugin as any)
  console.log('[OK] 插件 apply 已执行，name =', plugin.name)
  console.log('[OK] 注册的工具 =', registered.join(', '))

  const expect = ['npm_package_audit', 'npm_dependency_tree']
  const missing = expect.filter((n) => !registered.includes(n))
  if (missing.length) {
    console.error('[FAIL] 缺少工具:', missing.join(', '))
    process.exit(1)
  }
  console.log('[PASS] 两个工具均注册成功，Cordis 加载链路正常')
}

main().catch((err) => { console.error('[LOAD FAIL]', err); process.exit(1) })
