/**
 * 冒烟验证：不经过 DSH 宿主，直接调用插件的核心逻辑。
 *
 * 运行：pnpm smoke
 *   （root 依赖 tsx；等价于在 DSH 里调用 npm_package_audit / npm_dependency_tree）
 */
import { findDeadPackage, findNativeAlternative } from '../src/native'
import { fetchPackage } from '../src/registry'
import { renderDependencyTree } from '../src/dependency-tree'

/** 模拟 npm_package_audit 的 execute */
async function audit(name: string) {
  const meta = await fetchPackage(name)
  return { ...meta, nativeAlternative: findNativeAlternative(meta.name), deadPackage: findDeadPackage(meta.name) }
}

async function main() {
  console.log('── 工具1：npm_package_audit（moment）──────────────────')
  console.log(JSON.stringify(await audit('moment'), null, 2))

  console.log('\n── 工具1：npm_package_audit（axios，应命中原生替代）──')
  const axios = await audit('axios')
  console.log('nativeAlternative =', axios.nativeAlternative)

  console.log('\n── 工具2：npm_dependency_tree（axios, depth=1）────────')
  console.log(await renderDependencyTree('axios', 1))
}

main().catch((err) => { console.error('[SMOKE FAIL]', err); process.exit(1) })
