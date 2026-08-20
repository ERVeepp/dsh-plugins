/**
 * Cordis 加载测试：验证硬件评测插件能被 Cordis 真实加载并注册工具。
 * 运行：pnpm load-test:hardware
 */
import { Context } from '@deepseek-ai/cordis'
import * as plugin from '../src/index'

async function main() {
  const ctx = new Context()
  const registered: string[] = []
  ctx.provide('tools', {
    register: (def: any) => { registered.push(def.name); return () => undefined },
  })

  await ctx.plugin(plugin as any)
  console.log('[OK] 插件 apply 已执行，name =', plugin.name)
  console.log('[OK] 注册的工具 =', registered.join(', '))

  if (!registered.includes('hardware_benchmark')) {
    console.error('[FAIL] 缺少 hardware_benchmark 工具')
    process.exit(1)
  }
  console.log('[PASS] hardware_benchmark 注册成功，Cordis 加载链路正常')
}

main().catch((err) => { console.error('[LOAD FAIL]', err); process.exit(1) })
