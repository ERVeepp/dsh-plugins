/**
 * 冒烟验证：mock 三档硬件 profile 验证评分与升级建议（不依赖真机/DSH/网络）。
 *
 * 运行：pnpm smoke:hardware
 */
import { benchmark, type HardwareProfile } from '../src/benchmark'

const devRig: HardwareProfile = {
  os: 'Windows 11', cpuModel: 'Intel Core i9-14900K', cpuCores: 24, cpuThreads: 32, cpuSpeedGHz: 6.0,
  totalMemGB: 64, memType: 'DDR5', diskType: 'NVMe', diskTotalGB: 2048,
  gpuModel: 'NVIDIA GeForce RTX 4090', gpuVramGB: 24,
  networkType: 'ethernet', networkSpeedMbps: 2500, downloadMbps: 980, uploadMbps: 500, batteryPercent: null,
}

const gameRig: HardwareProfile = {
  os: 'Windows 11', cpuModel: 'AMD Ryzen 7 7700', cpuCores: 8, cpuThreads: 16, cpuSpeedGHz: 5.3,
  totalMemGB: 32, memType: 'DDR5', diskType: 'NVMe', diskTotalGB: 1024,
  gpuModel: 'NVIDIA GeForce RTX 4070', gpuVramGB: 12,
  networkType: 'wireless', networkSpeedMbps: 2400, downloadMbps: 320, uploadMbps: 80, batteryPercent: null,
}

const entryLaptop: HardwareProfile = {
  os: 'Windows 11', cpuModel: 'Intel Core i5-8250U', cpuCores: 4, cpuThreads: 4, cpuSpeedGHz: 2.4,
  totalMemGB: 8, memType: 'DDR4', diskType: 'HDD', diskTotalGB: 512,
  gpuModel: 'Intel UHD Graphics 620', gpuVramGB: 0,
  networkType: 'wireless', networkSpeedMbps: 150, downloadMbps: 18, uploadMbps: 5, batteryPercent: 55,
}

function check(name: string, cond: boolean, detail: string) {
  console.log(`${cond ? '[OK]' : '[FAIL]'} ${name}：${detail}`)
  if (!cond) process.exitCode = 1
}

function main() {
  const d = benchmark(devRig)
  const g = benchmark(gameRig)
  const e = benchmark(entryLaptop)

  console.log('── 强开发机（i9-14900K + 64GB + RTX 4090）──')
  console.log(`dev=${d.dev.score}(${d.dev.grade}) game=${d.game.score}(${d.game.grade}) network=${d.network.score}(${d.network.grade}) overall=${d.overall}`)
  check('强开发机 dev ≥ 85', d.dev.score >= 85, `实际 ${d.dev.score}`)
  check('强开发机 game ≥ 85', d.game.score >= 85, `实际 ${d.game.score}`)
  check('强开发机无高优先升级', d.upgrades.every(u => u.priority !== 'high'), `实际 ${d.upgrades.map(u => u.priority).join(',')}`)

  console.log('\n── 游戏机（R7-7700 + 32GB + RTX 4070）──')
  console.log(`dev=${g.dev.score}(${g.dev.grade}) game=${g.game.score}(${g.game.grade}) network=${g.network.score}(${g.network.grade}) overall=${g.overall}`)
  check('游戏机 game ≥ 70', g.game.score >= 70, `实际 ${g.game.score}`)
  check('游戏机网络实测分 ≥ 70', g.network.score >= 70, `实际 ${g.network.score}`)

  console.log('\n── 入门本（i5-8250U + 8GB DDR4 + HDD + 集显 + 电池老化）──')
  console.log(`dev=${e.dev.score}(${e.dev.grade}) game=${e.game.score}(${e.game.grade}) network=${e.network.score}(${e.network.grade}) overall=${e.overall}`)
  check('入门本 dev < 50', e.dev.score < 50, `实际 ${e.dev.score}`)
  check('入门本无独显 → 升级含显卡', e.upgrades.some(u => u.part === '显卡'), '缺失显卡升级项')
  check('入门本 DDR4 + 8GB → 升级含内存且提示 DDR4', e.upgrades.some(u => u.part === '内存' && u.suggestion.includes('DDR4')), '缺失 DDR4 内存升级项')
  check('入门本 HDD → 升级含磁盘', e.upgrades.some(u => u.part === '磁盘'), '缺失磁盘升级项')
  check('入门本电池老化 → 升级含电池', e.upgrades.some(u => u.part === '电池'), '缺失电池升级项')
  check('升级项按性价比排序（高优先的 costBand 应含 low）', e.upgrades.find(u => u.priority === 'high')?.costBand === 'low', '高优先项应便宜优先')
  check('升级项均带 searchHint', e.upgrades.every(u => u.searchHint.length > 0), '缺失 searchHint')

  console.log('\n── 入门本升级清单示例 ──')
  for (const u of e.upgrades) {
    console.log(`[${u.priority}/${u.costBand}] ${u.part}: ${u.suggestion} → ${u.recommendation} (search: ${u.searchHint})`)
  }
}

main()
