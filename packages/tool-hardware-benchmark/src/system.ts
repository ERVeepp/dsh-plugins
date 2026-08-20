/**
 * 硬件采集（systeminformation，纯 Node 库，跨平台）
 * 每项都 try/catch 容错：某项拿不到给默认值，不让整个工具失败
 */
import si from 'systeminformation'
import type { HardwareProfile } from './benchmark'

export async function collectHardware(): Promise<HardwareProfile> {
  // 并行采集各维度，互相独立
  const [cpu, mem, disks, graphics, os, memLayout, nets, battery] = await Promise.all([
    safe(() => si.cpu()),
    safe(() => si.mem()),
    safe(() => si.diskLayout()),
    safe(() => si.graphics()),
    safe(() => si.osInfo()),
    safe(() => si.memLayout()),
    safe(() => si.networkInterfaces()),
    safe(() => si.battery()),
  ])

  const gpu = graphics?.controllers?.[0]
  const disk = disks?.[0]
  const net = nets?.find((n) => n.operstate === 'up') ?? nets?.[0]

  // 实测网速（Cloudflare 官方测速端点，拿不到就给 null 让评分走网卡估算）
  const [downloadMbps, uploadMbps] = await Promise.all([measureDownload(), measureUpload()])

  return {
    os: [os?.platform, os?.distro, os?.release].filter(Boolean).join(' ') || 'unknown',
    cpuModel: cpu?.brand?.trim() || 'unknown',
    cpuCores: cpu?.physicalCores || cpu?.cores || 0,
    cpuThreads: cpu?.cores || 0,
    cpuSpeedGHz: cpu?.speed ? Number(cpu.speed) / 1000 : 0, // systeminformation speed 单位 MHz
    totalMemGB: Math.round((mem?.total ?? 0) / 1024 ** 3),
    memType: memLayout?.[0]?.type ?? null,
    diskType: (disk?.type as HardwareProfile['diskType']) ?? 'unknown',
    diskTotalGB: Math.round((disk?.size ?? 0) / 1024 ** 3),
    gpuModel: gpu?.model?.trim() || null,
    gpuVramGB: Math.round((gpu?.vram ?? 0) / 1024),
    networkType: (net?.type as HardwareProfile['networkType']) ?? 'unknown',
    networkSpeedMbps: typeof net?.speed === 'number' ? net.speed : null,
    downloadMbps,
    uploadMbps,
    batteryPercent: typeof battery?.percent === 'number' ? Math.round(battery.percent) : null,
  }
}

/* ── 网速实测（Cloudflare speedtest 端点，失败静默返回 null） ── */

const CF_DOWN = 'https://speed.cloudflare.com/__down?bytes=5000000' // 5MB
const CF_UP = 'https://speed.cloudflare.com/__up'
const UP_BYTES = 2_000_000 // 2MB

async function measureDownload(): Promise<number | null> {
  try {
    const start = Date.now()
    const res = await fetch(CF_DOWN, { signal: AbortSignal.timeout(15_000) })
    const bytes = (await res.arrayBuffer()).byteLength
    const secs = (Date.now() - start) / 1000
    return secs > 0 ? Math.round((bytes * 8) / 1e6 / secs) : null
  } catch {
    return null
  }
}

async function measureUpload(): Promise<number | null> {
  try {
    const start = Date.now()
    await fetch(CF_UP, { method: 'POST', body: new Uint8Array(UP_BYTES), signal: AbortSignal.timeout(15_000) })
    const secs = (Date.now() - start) / 1000
    return secs > 0 ? Math.round((UP_BYTES * 8) / 1e6 / secs) : null
  } catch {
    return null
  }
}

/** 单采集项容错：失败返回 undefined，不向上抛 */
async function safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn()
  } catch {
    return undefined
  }
}
