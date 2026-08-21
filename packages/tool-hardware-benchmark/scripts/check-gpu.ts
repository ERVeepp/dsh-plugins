/**
 * 真机验证：跑 collectHardware 看 GPU 选取（独显优先）是否正确
 * 运行：pnpm --dir packages/tool-hardware-benchmark exec tsx scripts/check-gpu.ts
 */
import { collectHardware } from '../src/system'

async function main() {
  const hw = await collectHardware()
  console.log('cpu:', hw.cpuModel)
  console.log('mem:', `${hw.totalMemGB}GB ${hw.memType ?? ''}`.trim())
  console.log('gpuModel (选中的):', hw.gpuModel)
  console.log('gpuVramGB:', hw.gpuVramGB)
  console.log('gpuList (全部):', JSON.stringify(hw.gpuList))
  console.log('disk:', hw.diskType, `${Math.round(hw.diskTotalGB / 1024)}TB`)
  console.log('network:', hw.networkType, hw.networkSpeedMbps, '| download:', hw.downloadMbps, 'Mbps')
  console.log('battery:', hw.batteryPercent)
}

main().catch((e) => { console.error(e); process.exit(1) })
